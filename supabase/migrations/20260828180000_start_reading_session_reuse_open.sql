-- start_reading_session inserted a new row on every call. Re-entering a room
-- you are already a member of re-establishes presence, which calls this
-- function again, so each visit left an extra never-ended session behind.
-- Those duplicates then broke leaving a room (PGRST116: 2 rows where 1 was
-- expected) and inflate any per-session reading stats.
--
-- Reuse the open session for a (room, user) instead of inserting another.

create or replace function public.start_reading_session(p_room_id uuid, p_user_id uuid)
returns reading_sessions
language plpgsql
security definer
as $function$
declare
  v_session reading_sessions;
begin
  select * into v_session
  from reading_sessions
  where room_id = p_room_id
    and user_id = p_user_id
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
  values (p_room_id, p_user_id, false, now(), now())
  returning * into v_session;

  return v_session;
end;
$function$;

-- Close the duplicates the old behaviour already created, keeping the most
-- recent open session for each (room, user). Mirrors end_reading_session.
with ranked as (
  select id,
         row_number() over (
           partition by room_id, user_id
           order by created_at desc
         ) as rn
  from reading_sessions
  where ended_at is null
)
update reading_sessions s
set completed = true,
    ended_at = now(),
    duration_minutes = ceil(extract(epoch from (now() - s.created_at)) / 60)
from ranked
where ranked.id = s.id
  and ranked.rn > 1;
