-- room_members only had INSERT and SELECT policies. With no UPDATE policy,
-- upserting book_id on conflict (joinRoom / updateRoomMemberBook) fails with
-- 42501. With no DELETE policy, leaveRoom()'s delete has been silently
-- matching zero rows the whole time (RLS filters rows out of the DELETE's
-- USING scope rather than erroring), so leaving a room never actually
-- removed the membership row. Both are scoped to a user only ever touching
-- their own membership row.
create policy "Users can update their own room membership"
  on public.room_members
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete their own room membership"
  on public.room_members
  for delete
  to authenticated
  using (user_id = auth.uid());
