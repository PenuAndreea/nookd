-- The "close-stale-reading-sessions" pg_cron job lives only in the dashboard,
-- so it is invisible to review and has drifted from the code it shadows. Its
-- current body:
--
--   update reading_sessions
--   set completed = true, ended_at = last_seen_at,
--       duration_minutes = ceil(extract(epoch from (last_seen_at - created_at)) / 60)
--   where completed = false and last_seen_at < now() - interval '2 minutes';
--
-- Three problems. It writes `completed`, which no longer exists, so it breaks
-- outright. It knows nothing about the book / room snapshot, so any session it
-- closes loses that data permanently. And its two-minute window is punishing
-- under the new model: the heartbeat stops when the phone locks, so putting the
-- phone down next to a paper book for two minutes ended your session -- which
-- is precisely the behaviour we are fixing.
--
-- Replace it with a function that delegates to close_reading_session, and bring
-- the schedule into version control so the two can never disagree again.
--
-- Note what is deliberately NOT swept here: a session that has merely run past
-- MAX_SESSION while still heartbeating. That reader is present and reading, and
-- cutting them off at two hours while their timer keeps running on screen would
-- be a bug, not a safeguard. MAX_SESSION is a cap applied to orphans, not a
-- trigger for closing live sessions.

create or replace function public.close_stale_reading_sessions()
returns int
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_id     uuid;
  v_reason text;
  v_closed int := 0;
begin
  for v_id, v_reason in
    select s.id,
           case
             when r.duration_minutes is not null
              and now() >= r.started_at + make_interval(mins => r.duration_minutes)
               then 'completed'
             else 'orphaned'
           end
    from reading_sessions s
    left join rooms r on r.id = s.room_id
    where s.ended_at is null
      and (
        -- The room's clock ran out. The session ended on schedule, however
        -- long ago the heartbeat stopped.
        (r.duration_minutes is not null
          and now() >= r.started_at + make_interval(mins => r.duration_minutes))
        -- Or the heartbeat has been dead long enough that the app is gone.
        -- Waiting a full grace window also leaves the recovery banner time to
        -- reclaim the session before the reaper takes it.
        or coalesce(s.last_seen_at, s.created_at) <= now() - interval '30 minutes'
      )
    order by s.created_at
    limit 500
  loop
    perform close_reading_session(v_id, v_reason);
    v_closed := v_closed + 1;
  end loop;

  return v_closed;
end;
$function$;

-- Runs as the cron job owner, never as a client.
revoke execute on function public.close_stale_reading_sessions() from public, anon, authenticated;

select cron.unschedule('close-stale-reading-sessions')
where exists (select 1 from cron.job where jobname = 'close-stale-reading-sessions');

-- Every minute: because duration is derived from the cap rather than from when
-- the sweep happens, the schedule only controls how promptly rows are tidied,
-- not any recorded number.
select cron.schedule(
  'close-stale-reading-sessions',
  '* * * * *',
  $$select public.close_stale_reading_sessions()$$
);
