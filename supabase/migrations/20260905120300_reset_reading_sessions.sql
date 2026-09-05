-- Destructive and irreversible, deliberately isolated in its own migration.
--
-- Every existing row predates the analytics model: duration_minutes was derived
-- from whenever the old reaper happened to notice rather than from the reading
-- itself, and none carry a book, room or ended_reason snapshot. There is no
-- correct backfill available -- the information needed to reconstruct them was
-- never recorded. Keeping them would make every chart wrong on the day the
-- "You" tab ships, with no way to tell a real row from a fabricated one.
--
-- These are test rows from development, cleared by explicit decision.

delete from public.reading_sessions;
