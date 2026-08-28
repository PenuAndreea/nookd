-- reading_sessions has RLS enabled but had zero policies. Inserts/ends/
-- heartbeats go through SECURITY DEFINER RPCs (start_reading_session,
-- end_reading_session, heartbeat_reading_session) so those bypass RLS fine,
-- but the reflection sheet's direct client-side update (updateReadingSession
-- in src/api/nookd.ts, saving mood/thoughts/page_reached/completed/ended_at)
-- has been silently updating zero rows this whole time.
create policy "Users can view their own reading sessions"
  on public.reading_sessions
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can update their own reading sessions"
  on public.reading_sessions
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
