-- Existing rows cached the Open Library "-S" (small, ~45px) cover size,
-- which renders blurry at the 80-130px sizes the app displays covers at.
-- New rows now cache "-L" (large, ~500px) — see src/api/books.ts. Backfill
-- already-cached rows to match.
update public.books
  set cover_url = regexp_replace(cover_url, '-S\.jpg$', '-L.jpg')
  where cover_url like '%-S.jpg';
