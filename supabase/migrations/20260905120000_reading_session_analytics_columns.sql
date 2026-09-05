-- reading_sessions is about to become the source table for per-user reading
-- analytics (the "You" tab). As stored today it cannot support that:
--
-- 1. The session's book is only ever recorded on room_members.book_id, and that
--    row is DELETEd on leave (useRoomPresence.leaveRoom, rooms.forceLeaveRoom) --
--    so the session -> book link is destroyed at exactly the moment the session
--    becomes historical. Snapshot it onto the session instead. books rows are
--    shared get-or-create reference data and are never deleted, so a real FK is
--    safe and title/author/cover stay joinable rather than duplicated.
--
-- 2. room_vibe / room_name are denormalized on purpose. Rooms expire out of the
--    list and deleting them is planned, so joining back to rooms for a label is
--    not durable. vibe is a closed set and is the useful grouping key; name is a
--    free-text display string a host can rename, kept only so a room that is
--    gone still has something to show. Group by room_id/room_vibe, label with
--    room_name -- never join on it.
--
-- 3. `completed` is set to true unconditionally by end_reading_session, so it
--    carries no information at all. Rather than silently redefine a column two
--    call sites already write, drop it: `ended_at is not null` already means
--    "closed", and ended_reason records *how* it closed, which is what the flag
--    was pretending to say.
--
-- 4. Reflections (mood/thoughts/page_reached) are only ever saved if the user
--    presses Leave AND submits within the same screen mount -- the session id
--    lives in component state (use-room-presence.ts) and is lost on unmount.
--    reflection_prompted_at makes "this session still owes a reflection" a
--    queryable fact instead, so the prompt survives an unmount and a cold start.

alter table public.reading_sessions
  add column if not exists book_id uuid references public.books(id),
  add column if not exists room_vibe text,
  add column if not exists room_name text,
  add column if not exists ended_reason text,
  add column if not exists reflection_prompted_at timestamptz;

-- 'left' and 'switched' are client-initiated; 'completed' (the room's clock ran
-- out) and 'orphaned' (the app died) are only ever set server-side.
alter table public.reading_sessions
  drop constraint if exists reading_sessions_ended_reason_check;

alter table public.reading_sessions
  add constraint reading_sessions_ended_reason_check
  check (ended_reason is null
         or ended_reason in ('left', 'switched', 'completed', 'orphaned'));

-- heartbeat_reading_session guards on `completed = false`; move it onto
-- ended_at before the column goes away, or the drop below fails.
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
    and ended_at is null;
end;
$function$;

alter table public.reading_sessions drop column if exists completed;

-- Every stats query is "my sessions, newest first, since <date>".
create index if not exists reading_sessions_user_created_idx
  on public.reading_sessions (user_id, created_at desc);

-- Partial index for the pending-reflection lookup: a hot path on every open of
-- the You tab that matches a tiny fraction of rows.
create index if not exists reading_sessions_awaiting_reflection_idx
  on public.reading_sessions (user_id, ended_at desc)
  where ended_at is not null and reflection_prompted_at is null;
