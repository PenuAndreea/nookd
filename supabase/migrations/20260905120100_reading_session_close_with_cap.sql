-- Being in a room now means the room screen is open: leaving the screen ends
-- the session, and within that, app state is irrelevant -- a locked phone next
-- to a paper book is reading and it counts. That makes the close time the
-- honest duration on every path where a client was present to record it.
--
-- Two things follow.
--
-- First, duration_minutes must NOT be capped on a client-initiated close.
-- now() is the truth there, and clamping it would rob a reader who genuinely
-- sat for three hours. Capping only applies when nothing was present to end the
-- session honestly -- i.e. the app was killed -- so MAX_SESSION (2 hours) and
-- the orphan grace (30 minutes) are scoped to ended_reason = 'orphaned' alone.
-- A timed room's scheduled end caps everything, always: you cannot read past a
-- room that has finished.
--
-- Second, the orphan grace is deliberately generous. The heartbeat stops both
-- when the app is killed AND when the phone locks, and those are
-- indistinguishable server-side, so closing exactly at last_seen_at would rob a
-- reader who locked their phone and then force-quit. ended_reason labels those
-- rows so the fuzz stays auditable instead of hidden.
--
-- Closing is factored into close_reading_session() so the three callers -- the
-- user leaving, a room's clock running out, and the reaper -- cannot drift
-- apart: they cap and snapshot identically, at the same moment.
--
-- The snapshot is taken at CLOSE, not at start, which is what makes it free:
-- in every close path the room_members row still exists (leaveRoom and
-- forceLeaveRoom both end the session *before* deleting membership), so the
-- database can read book_id itself. No RPC signature change is needed for the
-- book, and the "picked a book after joining" path needs no new client code.

create or replace function public.close_reading_session(
  p_session_id uuid,
  p_reason text
)
returns reading_sessions
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_row      reading_sessions;
  v_result   reading_sessions;
  v_room_end timestamptz;
  v_cap      timestamptz;
  v_member_book uuid;
  v_room_book   uuid;
  v_vibe     text;
  v_name     text;
begin
  select * into v_row
  from reading_sessions
  where id = p_session_id and ended_at is null;

  -- Already closed (the reaper may have won the race). Not an error: leaving a
  -- room must not fail because of that.
  if not found then
    return null;
  end if;

  select r.started_at + make_interval(mins => r.duration_minutes)
    into v_room_end
  from rooms r
  where r.id = v_row.room_id and r.duration_minutes is not null;

  v_cap := coalesce(v_room_end, 'infinity'::timestamptz);

  if p_reason = 'orphaned' then
    v_cap := least(
      v_cap,
      coalesce(v_row.last_seen_at, v_row.created_at) + interval '30 minutes',
      v_row.created_at + interval '2 hours'
    );
  end if;

  -- What the reader picked in the reading picker, falling back to the book the
  -- room itself is pinned to (book-club rooms join with no per-member book).
  -- Deliberately stops there: it never guesses from what they happen to be
  -- currently_reading, so only an explicitly chosen book is ever recorded.
  select rm.book_id into v_member_book
  from room_members rm
  where rm.room_id = v_row.room_id and rm.user_id = v_row.user_id;

  select r.vibe, r.name, r.book_id
    into v_vibe, v_name, v_room_book
  from rooms r
  where r.id = v_row.room_id;

  -- round(), not ceil(): a few seconds' bounce into a room should land on 0 so
  -- the aggregators can drop it, and ceil() would systematically overstate
  -- every session by up to a minute.
  update reading_sessions s
  set ended_at = now(),
      ended_reason = p_reason,
      duration_minutes = greatest(
        round(extract(epoch from (least(now(), v_cap) - s.created_at)) / 60)::int,
        0
      ),
      book_id   = coalesce(s.book_id, v_member_book, v_room_book),
      room_vibe = coalesce(s.room_vibe, v_vibe),
      room_name = coalesce(s.room_name, v_name)
  where s.id = p_session_id and s.ended_at is null
  returning * into v_result;

  return v_result;
end;
$function$;

-- Gains p_reason so that switching rooms (rooms.forceLeaveRoom) is
-- distinguishable from simply leaving. The one-argument form is dropped rather
-- than overloaded: two candidates of different arity make PostgREST ambiguous.
-- Existing callers keep working through the default.
drop function if exists public.end_reading_session(uuid);

create or replace function public.end_reading_session(
  p_session_id uuid,
  p_reason text default 'left'
)
returns reading_sessions
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  -- 'completed' and 'orphaned' are server-side verdicts about time the client
  -- was not present for; a client may only say how *it* ended the session.
  if p_reason not in ('left', 'switched') then
    raise exception 'invalid end reason: %', p_reason using errcode = '22023';
  end if;

  if not exists (
    select 1 from reading_sessions
    where id = p_session_id and user_id = v_user_id and ended_at is null
  ) then
    return null;
  end if;

  return close_reading_session(p_session_id, p_reason);
end;
$function$;

-- Recreated only because the insert named `completed`, which no longer exists.
-- The reuse-the-open-session behaviour is unchanged and still correct: an open
-- session stays valid exactly as long as the membership does, and the reaper
-- now guarantees a forgotten one is closed rather than inherited tomorrow.
create or replace function public.start_reading_session(p_room_id uuid, p_user_id uuid)
returns reading_sessions
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_session reading_sessions;
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  if p_user_id is distinct from v_user_id then
    raise exception 'cannot start a reading session for another user' using errcode = '42501';
  end if;

  select * into v_session
  from reading_sessions
  where room_id = p_room_id
    and user_id = v_user_id
    and ended_at is null
  order by created_at desc
  limit 1;

  if found then
    update reading_sessions
    set last_seen_at = now()
    where id = v_session.id
    returning * into v_session;

    return v_session;
  end if;

  insert into reading_sessions (room_id, user_id, created_at, last_seen_at)
  values (p_room_id, v_user_id, now(), now())
  returning * into v_session;

  return v_session;
end;
$function$;

-- close_reading_session performs no ownership check of its own -- it is an
-- internal helper for the functions above and the reaper, never a client entry
-- point. Callers are responsible for scoping to auth.uid().
revoke execute on function public.close_reading_session(uuid, text) from public, anon, authenticated;

revoke execute on function public.start_reading_session(uuid, uuid) from public, anon;
revoke execute on function public.end_reading_session(uuid, text) from public, anon;

grant execute on function public.start_reading_session(uuid, uuid) to authenticated;
grant execute on function public.end_reading_session(uuid, text) to authenticated;
