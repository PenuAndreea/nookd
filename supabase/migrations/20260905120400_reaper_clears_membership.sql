-- room_members rows leak. Membership is only ever deleted by an explicit Leave
-- (useRoomPresence.leaveRoom / rooms.forceLeaveRoom), so every room a reader
-- backed out of left a row behind -- 16 of them for the only real user on this
-- project, going back three months, including rooms that expired long ago.
--
-- That matters more now than it did: `currentRoom` is derived from
-- room_members, so a leaked row makes the app believe someone is still in a
-- room they left, and the timer on the room screen reads room_members.joined_at
-- while the recorded session reads its own created_at -- the two drift apart
-- without limit. (Observed live: a screen timer reading 137 minutes against a
-- session that had genuinely run for 62 seconds.)
--
-- Closing a session and remaining a member of the room are contradictory
-- states. The reaper now clears both together, so the tables cannot disagree.
-- The user-initiated paths already delete membership themselves, and do it
-- *after* ending the session so the book snapshot still sees it -- the same
-- ordering is preserved here.

create or replace function public.close_stale_reading_sessions()
returns int
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_id      uuid;
  v_reason  text;
  v_room_id uuid;
  v_user_id uuid;
  v_closed  int := 0;
begin
  for v_id, v_reason, v_room_id, v_user_id in
    select s.id,
           case
             when r.duration_minutes is not null
              and now() >= r.started_at + make_interval(mins => r.duration_minutes)
               then 'completed'
             else 'orphaned'
           end,
           s.room_id,
           s.user_id
    from reading_sessions s
    left join rooms r on r.id = s.room_id
    where s.ended_at is null
      and (
        (r.duration_minutes is not null
          and now() >= r.started_at + make_interval(mins => r.duration_minutes))
        or coalesce(s.last_seen_at, s.created_at) <= now() - interval '30 minutes'
      )
    order by s.created_at
    limit 500
  loop
    perform close_reading_session(v_id, v_reason);

    -- Strictly after the close, which reads room_members.book_id.
    delete from room_members
    where room_id = v_room_id and user_id = v_user_id;

    v_closed := v_closed + 1;
  end loop;

  return v_closed;
end;
$function$;

revoke execute on function public.close_stale_reading_sessions() from public, anon, authenticated;
