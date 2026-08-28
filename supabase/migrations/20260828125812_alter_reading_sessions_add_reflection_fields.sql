-- Post-session reflection fields: what the reader thought, what page they
-- reached, and a calm mood check-in.
--
-- NOTE: `ended_at` is added here on the assumption that the existing
-- `end_reading_session` RPC (defined server-side, not version-controlled in
-- this repo) sets it when a session ends. This was NOT verified against the
-- live function body (no DB credentials available in this environment) --
-- before applying, inspect it with:
--   select prosrc from pg_proc where proname = 'end_reading_session';
-- and adjust the column name/type here if it turns out to differ.
alter table public.reading_sessions
  add column if not exists thoughts text,
  add column if not exists page_reached int,
  add column if not exists mood text,
  add column if not exists ended_at timestamptz;
