-- Vibe tag selected at room creation ("book_club", "fantasy", "nonfiction",
-- "quiet_company", "lost_in_a_book"). Only the "book_club" vibe pairs a room
-- with a book_id from the create-room flow.
alter table public.rooms
  add column if not exists vibe text;
