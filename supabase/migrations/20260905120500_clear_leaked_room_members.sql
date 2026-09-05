-- One-off cleanup of the membership rows that leaked before
-- 20260905120400_reaper_clears_membership.sql. Until then, a room_members row
-- was only ever removed by an explicit Leave, so backing out of a room screen
-- left one behind -- 15 of them here, the oldest from June, every one in a room
-- that has long since expired.
--
-- Scoped to memberships with no open reading session, which is the definition
-- of "not actually in the room". Anyone genuinely sitting in a room right now
-- has an open session and is untouched.

delete from public.room_members rm
where not exists (
  select 1 from public.reading_sessions s
  where s.room_id = rm.room_id
    and s.user_id = rm.user_id
    and s.ended_at is null
);
