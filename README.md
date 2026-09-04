# Readfolk

Readfolk is a social reading app built with Expo and Supabase. It combines a
personal book library with **Silent Rooms** — timed, presence-based group
reading sessions you can join, see who else is reading alongside you, and
leave a short reflection when you're done.

## Features

- **Silent Rooms** — timed or always-open ("house") rooms with a vibe
  (Quiet Company, Lost in a Book, Fantasy, Nonfiction, or Book Club), live
  presence via Supabase Realtime, a countdown/count-up timer, and a
  reflection prompt on leaving.
- **One room at a time** — joining a second room prompts you to leave the
  first, enforced client-side against a shared rooms cache.
- **Book club rooms** — pinned to a single book at creation.
- **Open rooms** — each member can privately tag what they're personally
  reading, aggregated into a "Currently reading" list in the room sheet.
- **Personal library** — search via the Open Library API, track status
  (want to read / currently reading / finished) and page progress, with
  "What others are reading" and "Popular books" discovery shelves.
- **Light and dark mode**, fully themed.

## Tech stack

- [Expo](https://expo.dev) (SDK 57) / React Native, with
  [Expo Router](https://docs.expo.dev/router/introduction/) for file-based
  navigation
- [Supabase](https://supabase.com) — Postgres, Row Level Security, Realtime
  Presence, and a handful of `SECURITY DEFINER` RPCs for the reading-session
  lifecycle
- TypeScript throughout, with `database.types.ts` generated from the live
  schema
- [@gorhom/bottom-sheet](https://gorhom.dev/react-native-bottom-sheet/) for
  in-app sheets
- Styling via `StyleSheet.create` and a small theme system in
  `src/constants/theme.ts` (see [Theming](#theming) below) — no CSS-in-JS
  library

## Project structure

```
src/
  app/                  Expo Router routes (file-based)
    (auth)/              Sign in / sign up
    (app)/(tabs)/        Home and Books tabs
    (app)/room/[id]      A silent room, and create-room — root-level
                          screens, not nested in a tab (see note below)
  api/                  Supabase queries, grouped by feature (rooms, books)
  components/
    atoms/                Smallest building blocks (Button, Chip, Avatar…)
    molecules/             Composed from atoms (SearchField, BookRow…)
    organisms/              Composed from molecules (sheets, room cards…)
  contexts/              Auth session and a shared rooms cache
  hooks/                 useTheme, useRoomPresence, useElapsedSeconds…
  constants/theme.ts     Colors, spacing, type scale
  lib/room-theme.ts      Per-room background artwork, keyed by vibe
supabase/
  migrations/           SQL migrations (source of truth for the schema)
```

A room screen lives at the **root** of the navigation stack, not inside the
Home tab, even though it's opened from there — a screen pushed into one
tab's stack from another tab gets left behind when you switch tabs, which
used to make rooms pile up on the back stack. Keep new per-item detail
screens (if any) at the root for the same reason.

## Getting started

### Prerequisites

- Node.js and npm
- A [Supabase](https://supabase.com) project, with the CLI linked
  (`npx supabase link`) if you intend to run migrations
- Xcode (iOS) and/or Android Studio, for native builds — or the
  [Expo Go](https://expo.dev/go) app for a quick start without either

### Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file with your Supabase project's public credentials:

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-public-key
   EXPO_PUBLIC_SUPABASE_PROJECT_ID=your-project-ref
   ```

   These are the anon/publishable key and project ref, safe to ship in the
   client — Row Level Security policies (see `supabase/migrations/`) are
   what actually restrict access.

3. Apply the database schema:

   ```bash
   npx supabase db push
   ```

4. Start the dev server:

   ```bash
   npm start
   ```

   Then press `i` for the iOS Simulator, `a` for Android, or scan the QR
   code with Expo Go.

### Other scripts

| Script | What it does |
| --- | --- |
| `npm run ios` / `npm run android` | Build and run a native dev build (needed once any native module changes) |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run typegen` | Regenerates `database.types.ts` from the linked Supabase project |

## Database

Schema changes live as new files under `supabase/migrations/` — never edit
a migration that's already been applied. After adding one:

```bash
npx supabase db push
```

Then run `npm run typegen` to keep `database.types.ts` in sync, since the
app's `src/api/*` layer is typed against it.

When adding a new table or a direct (non-RPC) write, double-check a
matching RLS policy actually exists — a missing `UPDATE`/`DELETE` policy
fails *silently* (zero rows affected), not with an error.

## Theming

`src/constants/theme.ts` exports a `Colors` object with `light` and `dark`
palettes, consumed via the `useTheme()` hook. Two token families are worth
understanding before adding a new color:

- **Theme-flipping tokens** (`text`, `textSecondary`, `background`, …) —
  use these for anything sitting on a page background, which does change
  between light and dark mode.
- **Fixed tokens** (`sheetText`, `ink`, `accent`, `timerCardText`, …) — for
  text/icons on a surface that is *always* the same color regardless of
  theme (a bottom sheet, an input, the primary accent-filled button, the
  floating "+" button). These deliberately hold the same value in both
  palettes — pairing a fixed-color surface with a theme-flipping text token
  is how text silently goes invisible in dark mode.

If you're adding a component with its own white/colored surface, check
which category it falls into before picking a text color.

## Known limitations

- No `profiles` table yet — display names are a placeholder and avatars are
  deterministic (Dicebear, seeded by user id), not user-editable.
- Rooms you've joined but that have since expired stay in `room_members`
  indefinitely (filtered out of every view, but not cleaned up).
