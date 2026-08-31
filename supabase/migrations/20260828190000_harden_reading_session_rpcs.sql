-- The three reading-session RPCs are SECURITY DEFINER, so they bypass RLS
-- completely, and EXECUTE was granted to PUBLIC and anon. On top of that,
-- start_reading_session trusted a caller-supplied p_user_id.
--
-- Together that meant anyone holding the publishable key -- which ships inside
-- the app, and without needing an account at all -- could create, heartbeat
-- and close reading sessions belonging to any user in any room. That is
-- precisely what the reading_sessions RLS policies exist to prevent; the
-- functions were a way around them.
--
-- Fix: derive the user from auth.uid() instead of trusting the argument, scope
-- every write to the caller's own rows, pin search_path (a mutable search_path
-- in a SECURITY DEFINER function is its own escalation vector), and drop anon
-- from the EXECUTE grants.
--
-- The pg_cron reaper ("close-stale-reading-sessions") runs raw SQL as postgres
-- and does not call these functions, so it is unaffected.

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

  -- Reuse the open session rather than stacking up duplicates
  -- (see 20260828180000_start_reading_session_reuse_open.sql).
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

  insert into reading_sessions (room_id, user_id, completed, created_at, last_seen_at)
  values (p_room_id, v_user_id, false, now(), now())
  returning * into v_session;

  return v_session;
end;
$function$;

-- Deliberately does not raise when nothing matches: the cron reaper may have
-- already closed the session, and leaving a room must not fail because of that
-- race. Ownership is enforced by the where clause instead.
create or replace function public.end_reading_session(p_session_id uuid)
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

  update reading_sessions
  set completed = true,
      ended_at = now(),
      duration_minutes = ceil(extract(epoch from (now() - created_at)) / 60)
  where id = p_session_id
    and user_id = v_user_id
  returning * into v_session;

  return v_session;
end;
$function$;

create or replace function public.heartbeat_reading_session(p_session_id uuid)
returns void
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

  update reading_sessions
  set last_seen_at = now()
  where id = p_session_id
    and user_id = v_user_id
    and completed = false;
end;
$function$;

revoke execute on function public.start_reading_session(uuid, uuid) from public, anon;
revoke execute on function public.end_reading_session(uuid) from public, anon;
revoke execute on function public.heartbeat_reading_session(uuid) from public, anon;

grant execute on function public.start_reading_session(uuid, uuid) to authenticated;
grant execute on function public.end_reading_session(uuid) to authenticated;
grant execute on function public.heartbeat_reading_session(uuid) to authenticated;

-- Two identical always-true SELECT policies on room_members; policies are
-- OR'd, so the duplicate only adds confusion when auditing.
drop policy if exists "Users can view room_members" on public.room_members;
