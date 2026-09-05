-- A timed room's clock running out while the reader is looking at the screen
-- should record ended_reason = 'completed' -- they stayed to the end of the
-- session they signed up for, which is the whole point of tracking the reason.
--
-- But end_reading_session deliberately refuses 'completed' from a client: it is
-- a verdict about whether the room actually finished, not something the caller
-- should be able to assert. Rather than relaxing that, derive it. The room's
-- scheduled end is a fact the database already has, so close_reading_session
-- can simply override the caller's reason when the room has ended. The client
-- keeps sending 'left' and never needs to know.
--
-- This also fixes the on-screen/off-screen split: a reader watching the timer
-- hit zero and a reader whose app was closed now produce identical rows,
-- because both go through the same derivation.

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
  v_reason   text := p_reason;
  v_member_book uuid;
  v_room_book   uuid;
  v_vibe     text;
  v_name     text;
begin
  select * into v_row
  from reading_sessions
  where id = p_session_id and ended_at is null;

  if not found then
    return null;
  end if;

  select r.started_at + make_interval(mins => r.duration_minutes)
    into v_room_end
  from rooms r
  where r.id = v_row.room_id and r.duration_minutes is not null;

  -- The room finished, so however the caller described it, this session ran to
  -- the end of a scheduled sitting.
  if v_room_end is not null and now() >= v_room_end then
    v_reason := 'completed';
  end if;

  v_cap := coalesce(v_room_end, 'infinity'::timestamptz);

  -- MAX_SESSION and the orphan grace apply only where no client was present to
  -- end the session honestly; capping a deliberate close would rob a reader who
  -- genuinely sat for hours.
  if v_reason = 'orphaned' then
    v_cap := least(
      v_cap,
      coalesce(v_row.last_seen_at, v_row.created_at) + interval '30 minutes',
      v_row.created_at + interval '2 hours'
    );
  end if;

  select rm.book_id into v_member_book
  from room_members rm
  where rm.room_id = v_row.room_id and rm.user_id = v_row.user_id;

  select r.vibe, r.name, r.book_id
    into v_vibe, v_name, v_room_book
  from rooms r
  where r.id = v_row.room_id;

  update reading_sessions s
  set ended_at = now(),
      ended_reason = v_reason,
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

revoke execute on function public.close_reading_session(uuid, text) from public, anon, authenticated;
