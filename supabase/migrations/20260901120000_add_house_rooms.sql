-- Rooms expire once their duration elapses, so the list empties out on its own
-- and new users can land on "no rooms yet". Add always-open "house" rooms:
-- isRoomActive() already treats a null duration_minutes as never-expiring, so
-- these are permanently joinable.
--
-- House rooms have no user host. Making host_id nullable expresses that, and
-- has a useful side effect: the existing rooms UPDATE/DELETE policies are both
-- `host_id = auth.uid()`, which can never be true for a null host, so no user
-- can rename or delete a house room.

alter table public.rooms alter column host_id drop not null;

insert into public.rooms (id, name, description, host_id, duration_minutes, started_at, vibe)
values
  (
    '00000000-0000-4000-8000-000000000001',
    'Rainy Library',
    'Soft rain on tall windows. Old shelves, nowhere else to be.',
    null, null, now(), 'quiet_company'
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    'Sunlit Corner',
    'A warm patch of afternoon light and a comfortable chair.',
    null, null, now(), 'quiet_company'
  ),
  (
    '00000000-0000-4000-8000-000000000003',
    'Cabin Night',
    'Firelight, thick walls, and the whole evening ahead of you.',
    null, null, now(), 'lost_in_a_book'
  )
on conflict (id) do nothing;
