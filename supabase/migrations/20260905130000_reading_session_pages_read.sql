-- "Pages read" was derived at read time as the increase in page_reached
-- between consecutive sessions on the same book. That cannot work for the
-- first session on a book: with no earlier page to compare against, a reader
-- who noted page 20 saw "0 pages read". Counting it from zero instead would be
-- just as wrong the other way -- someone joining already 200 pages in has not
-- read 200 pages in one sitting.
--
-- The delta is not actually ambiguous, it was only being computed in the wrong
-- place. When the reflection is submitted the client still holds the reader's
-- previous page for that book (user_books.current_page, about to be
-- overwritten), so pages-this-session is exactly
--   max(0, page_reached - previous_current_page)
-- and a reader with no library entry yet correctly starts from 0.
--
-- Record it rather than re-deriving it, so the number is right for a single
-- session and does not depend on reflections being unbroken.

alter table public.reading_sessions
  add column if not exists pages_read int
    check (pages_read is null or pages_read >= 0);

comment on column public.reading_sessions.pages_read is
  'Pages covered in this session, computed against the reader''s previous '
  'recorded page at reflection time. Null when no page was recorded.';
