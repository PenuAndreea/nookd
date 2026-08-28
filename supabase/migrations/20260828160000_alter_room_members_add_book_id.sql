-- Self-tag: what a member says they're reading during this room session
-- (open/presence rooms only — book club rooms already have room.book_id).
-- Purely social texture, optional, cleared when the member leaves (row is
-- deleted on leave).
alter table public.room_members
  add column if not exists book_id uuid references public.books(id);
