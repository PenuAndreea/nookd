-- A user's personal reading list + progress against a cached book.
create table if not exists public.user_books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  status text not null default 'want_to_read'
    check (status in ('want_to_read', 'currently_reading', 'finished')),
  current_page int,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, book_id)
);

create index if not exists user_books_user_id_status_idx
  on public.user_books (user_id, status);

alter table public.user_books enable row level security;

-- A user's reading list is private by default...
create policy "users manage their own reading list"
  on public.user_books for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ...except "currently reading" rows, which are visible to any authenticated
-- user so the app can show "what others are reading" without exposing a
-- user's want-to-read pile or finished list.
create policy "currently reading is visible to other authenticated users"
  on public.user_books for select
  to authenticated
  using (status = 'currently_reading');
