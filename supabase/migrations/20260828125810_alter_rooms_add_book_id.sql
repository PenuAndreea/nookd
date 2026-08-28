-- Replace the loose, never-actually-wired `isbn` number column with a real
-- foreign key to the new `books` table.
alter table public.rooms
  add column if not exists book_id uuid references public.books(id);

alter table public.rooms
  drop column if exists isbn;
