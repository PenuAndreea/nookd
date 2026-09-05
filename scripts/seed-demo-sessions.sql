-- Demo reading history for a tester account.
--
-- NOT a migration: this is throwaway data for one account, and must never run
-- against a real user's database. Run it by hand:
--
--   npx supabase db query --linked "$(cat scripts/seed-demo-sessions.sql)"
--
-- Every row it writes has an id starting 'dddddddd-', so the whole seed can be
-- removed again with:
--
--   delete from reading_sessions where id::text like 'dddddddd-%';
--
-- The shape it builds: a reader who mostly reads in the evening, works through
-- one book at a time over about nine months, reads more often lately, and is
-- on a current streak. Pages progress through each book so per-book totals and
-- "pages read" are internally consistent, and a few sessions carry no book at
-- all so the "with no book logged" line has something to say.

do $seed$
declare
  v_user   uuid;
  v_room   uuid;
  v_arc    record;
  v_n      int;
  v_day    int;
  v_mins   int;
  v_pages  int;
  v_page   int;
  v_start  timestamptz;
  v_seq    int := 0;
  v_rooms  uuid[] := array[
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000003'
  ];
  v_moods  text[] := array['focused','cozy','focused','distracted','cozy','focused',null,'restless'];
  -- Written on roughly one session in three, the way a reader actually
  -- journals: often nothing, sometimes a line.
  v_notes  text[] := array[
    'Got properly lost in this one tonight. Didn''t notice the hour.',
    'Slow going, but the last chapter finally clicked.',
    'Kept re-reading the same paragraph. Not my evening.',
    'The dialogue in this section is doing a lot of quiet work.',
    'Read this one in the bath and nearly dropped it.',
    'Something about the pacing here reminds me of the last book.',
    'Short sitting, but I wanted to keep the streak going.',
    'Had to stop and write a line down. That does not happen often.',
    'Comfortable, unhurried. Exactly what I wanted after today.',
    'I can feel it building towards something.',
    'Distracted by my phone the whole time. Left early.',
    'Finished the section I have been circling for a week.'
  ];
  -- Sessions are placed at local wall-clock hours. created_at is timestamptz
  -- and the app reads the hour back in the device's own zone, so building
  -- these in UTC would shift every session into a different part of the day.
  v_zone   text := 'Europe/Amsterdam';
  v_today  timestamptz := (date_trunc('day', now() at time zone v_zone)) at time zone v_zone;
begin
  select id into v_user from auth.users
  where email = 'andreeapenu.work@gmail.com';

  if v_user is null then
    raise exception 'tester account not found';
  end if;

  delete from reading_sessions where id::text like 'dddddddd-%';

  -- One arc per book: read over [from_day, to_day] days ago, `sessions` times,
  -- covering `pages` pages in total.
  for v_arc in
    select * from (values
      ('7c9b6f8e-b6ea-4035-8739-959f5767c356'::uuid, 268, 232, 11, 300),  -- Philosopher's Stone
      ('8e9805de-81ef-4ba0-876d-a6dffcbf95db'::uuid, 226, 178, 14, 491),  -- The Circle
      ('73c475ae-f085-4dce-8be8-367b57fedaf4'::uuid, 170, 128, 12, 300),  -- Klara and the Sun
      ('c826999c-55d5-4794-823a-d8e1aaa57758'::uuid, 120,  92,  8, 175),  -- Notes of a Native Son
      ('dc7b0776-3093-4e1c-9b40-ee1626de9cda'::uuid,  84,  40, 15, 300),  -- The Lord of the Rings
      ('e55d9bf2-4fd9-425f-97cc-9bebae076abe'::uuid,  34,  20,  6, 180),  -- The Obstacle is the Way
      ('9ca3541a-ee49-4247-96a1-ab831a862564'::uuid,  17,   0, 13, 240),  -- The Pragmatic Programmer
      (null,                                          150,   5,  9, 0)    -- no book logged
    ) as t(book_id, from_day, to_day, sessions, pages)
  loop
    v_page := 0;

    for v_n in 1 .. v_arc.sessions loop
      v_seq := v_seq + 1;

      -- Spread the sessions across the arc, oldest first.
      v_day := v_arc.from_day
             - ((v_arc.from_day - v_arc.to_day) * (v_n - 1) / greatest(v_arc.sessions - 1, 1));

      -- 20-85 minutes, varying so averages and "longest" are not flat.
      v_mins := 20 + ((v_seq * 17) % 66);

      -- Mostly evenings, some afternoons — enough to make "you read most often
      -- in the evening" true rather than an artefact.
      v_start := v_today - make_interval(days => v_day)
               + make_interval(hours => (array[20,21,19,15,22,20,18])[1 + (v_seq % 7)])
               + make_interval(mins => (v_seq * 13) % 60);

      if v_arc.book_id is null then
        v_pages := null;
      else
        v_pages := v_arc.pages / v_arc.sessions;
        -- Let the last session absorb the remainder so the book adds up.
        if v_n = v_arc.sessions then
          v_pages := v_arc.pages - v_page;
        end if;
        v_page := v_page + v_pages;
      end if;

      v_room := v_rooms[1 + (v_seq % 3)];

      insert into reading_sessions (
        id, user_id, room_id, created_at, ended_at, last_seen_at,
        duration_minutes, ended_reason, mood, page_reached, pages_read,
        book_id, room_vibe, room_name
      )
      select
        ('dddddddd-0000-4000-8000-' || lpad(v_seq::text, 12, '0'))::uuid,
        v_user, v_room, v_start, v_start + make_interval(mins => v_mins),
        v_start + make_interval(mins => v_mins), v_mins,
        case when v_seq % 11 = 0 then 'completed' else 'left' end,
        v_moods[1 + (v_seq % 8)],
        case when v_arc.book_id is null then null else v_page end,
        v_pages,
        v_arc.book_id, r.vibe, r.name
      from rooms r where r.id = v_room;

      -- Roughly a third carry a written note.
      if v_seq % 3 = 1 then
        update reading_sessions
        set thoughts = v_notes[1 + (v_seq % 12)]
        where id = ('dddddddd-0000-4000-8000-' || lpad(v_seq::text, 12, '0'))::uuid;
      end if;
    end loop;
  end loop;

  -- A current streak: read on each of the last five days, on top of whatever
  -- the arcs already placed there.
  for v_n in 0 .. 4 loop
    v_seq := v_seq + 1;
    v_start := v_today - make_interval(days => v_n)
             + make_interval(hours => 20, mins => (v_n * 7) % 60);
    v_mins := 30 + (v_n * 11) % 40;

    insert into reading_sessions (
      id, user_id, room_id, created_at, ended_at, last_seen_at,
      duration_minutes, ended_reason, mood, page_reached, pages_read,
      book_id, room_vibe, room_name
    )
    select
      ('dddddddd-0000-4000-8000-' || lpad(v_seq::text, 12, '0'))::uuid,
      v_user, v_rooms[1 + (v_n % 3)], v_start, v_start + make_interval(mins => v_mins),
      v_start + make_interval(mins => v_mins), v_mins, 'left',
      v_moods[1 + (v_n % 8)], 240 + v_n * 14, 14,
      '9ca3541a-ee49-4247-96a1-ab831a862564', r.vibe, r.name
    from rooms r where r.id = v_rooms[1 + (v_n % 3)];

    update reading_sessions
    set thoughts = v_notes[1 + (v_n % 12)]
    where id = ('dddddddd-0000-4000-8000-' || lpad(v_seq::text, 12, '0'))::uuid
      and v_n % 2 = 0;
  end loop;

  -- Everything seeded above has already been through the reflection flow --
  -- a mood or a note means the reader was asked. Without this stamp every
  -- demo session counts as "still owed a reflection" and the You tab offers
  -- the newest one back forever.
  update reading_sessions
  set reflection_prompted_at = ended_at
  where id::text like 'dddddddd-%';

  -- Keep the library consistent with the reading above: the finished books
  -- marked finished, the current one in progress at the page last reached.
  insert into user_books (user_id, book_id, status, current_page, started_at, finished_at)
  select v_user, b.book_id, b.status, b.current_page,
         now() - make_interval(days => b.started), 
         case when b.status = 'finished'
              then now() - make_interval(days => b.finished) end
  from (values
    ('7c9b6f8e-b6ea-4035-8739-959f5767c356'::uuid, 'finished',          300, 268, 232),
    ('8e9805de-81ef-4ba0-876d-a6dffcbf95db'::uuid, 'finished',          491, 226, 178),
    ('73c475ae-f085-4dce-8be8-367b57fedaf4'::uuid, 'finished',          300, 170, 128),
    ('c826999c-55d5-4794-823a-d8e1aaa57758'::uuid, 'finished',          175, 120,  92),
    ('dc7b0776-3093-4e1c-9b40-ee1626de9cda'::uuid, 'finished',          300,  84,  40),
    ('e55d9bf2-4fd9-425f-97cc-9bebae076abe'::uuid, 'currently_reading', 180,  34,   0),
    ('9ca3541a-ee49-4247-96a1-ab831a862564'::uuid, 'currently_reading', 296,  17,   0)
  ) as b(book_id, status, current_page, started, finished)
  on conflict (user_id, book_id) do update
    set status = excluded.status,
        current_page = excluded.current_page,
        started_at = excluded.started_at,
        finished_at = excluded.finished_at;
end
$seed$;
