-- room_members currently has a UNIQUE constraint on room_id alone, which
-- limits a room to a single member ever (blocking multiple simultaneous
-- readers, and blocking rejoining once any row has existed for that room),
-- and makes PostgREST infer the room_members relationship as one-to-one
-- (returning a single object instead of an array from `room_members(user_id)`
-- selects). Replace it with the composite (room_id, user_id) uniqueness the
-- app's joinRoom() upsert (onConflict: 'room_id,user_id') already assumes.

-- 1. Drop any UNIQUE CONSTRAINT on room_members(room_id) alone.
do $$
declare
    cname text;
begin
    select con.conname into cname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'room_members'
      and con.contype = 'u'
      and array(
        select attname::text from pg_attribute
        where attrelid = con.conrelid and attnum = any(con.conkey)
        order by attname
      ) = array['room_id'];

    if cname is not null then
        execute format('alter table public.room_members drop constraint %I', cname);
    end if;
end $$;

-- 2. Drop any bare UNIQUE INDEX on room_members(room_id) alone, in case it
--    wasn't backed by a formal constraint.
do $$
declare
    iname text;
begin
    select indexname into iname
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'room_members'
      and indexdef ilike '%unique%(room_id)%'
    limit 1;

    if iname is not null then
        execute format('drop index if exists public.%I', iname);
    end if;
end $$;

-- 3. Ensure the composite (room_id, user_id) uniqueness the app relies on.
do $$
begin
    if not exists (
        select 1
        from pg_constraint con
        join pg_class rel on rel.oid = con.conrelid
        join pg_namespace nsp on nsp.oid = rel.relnamespace
        where nsp.nspname = 'public'
          and rel.relname = 'room_members'
          and con.contype = 'u'
          and array(
            select attname::text from pg_attribute
            where attrelid = con.conrelid and attnum = any(con.conkey)
            order by attname
          ) = array['room_id', 'user_id']
    ) then
        alter table public.room_members
            add constraint room_members_room_id_user_id_key unique (room_id, user_id);
    end if;
end $$;
