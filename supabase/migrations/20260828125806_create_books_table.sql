-- Local cache of book metadata, keyed by Open Library's stable "work" key.
-- Gives rooms and reading-list rows a real foreign key instead of a loose ISBN number.
create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  open_library_key text not null unique,
  title text not null,
  author text,
  isbn text[],
  cover_url text,
  page_count int,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.books enable row level security;

-- Books are shared reference data: any authenticated user can read them.
create policy "books are readable by authenticated users"
  on public.books for select
  to authenticated
  using (true);

-- Any authenticated user may cache a new book or refresh one they searched up
-- (get-or-create pattern from the client, no ownership concept for this table).
create policy "authenticated users can insert books"
  on public.books for insert
  to authenticated
  with check (true);

create policy "authenticated users can update books"
  on public.books for update
  to authenticated
  using (true)
  with check (true);
