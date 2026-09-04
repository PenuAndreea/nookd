# Working in this repo

Readfolk is an Expo / React Native app on Supabase. `README.md` explains what the
app is and how the pieces fit; this file is the set of rules to follow while
changing it.

## Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before
writing any code. This project is on Expo SDK 57 / React Native 0.86 — keep this
link in step with `expo` in package.json.

## Components

- Look in `src/components/` before writing new markup. If something close
  already exists, extend it with a prop rather than duplicating it.
- New shared UI goes in the layer it belongs to: `atoms/` (no dependencies on
  other components), `molecules/` (composed of atoms), `organisms/` (composed of
  molecules). A component used by exactly one screen can stay in that screen's
  file until a second caller appears.
- Screens under `src/app/` compose components and own data/state. They should
  not define styled primitives — a `<View>` with a border radius and a shadow in
  a route file is a component that hasn't been extracted yet.
- No file over **300 lines**. When one grows past that, split it: pull markup
  into a component, pull logic into a hook in `src/hooks/`.

## Copy

- Every user-facing string lives in `src/i18n/locales/en.ts` and is read through
  `useTranslation()` / `t()`. This includes `Alert.alert` titles and bodies,
  placeholders, accessibility labels, and empty/error states.
- Key names follow the screen or feature that owns them (`rooms.create.*`,
  `auth.*`, `common.*`). Reuse `common.*` instead of adding a second spelling of
  "Cancel".

## Styling

- No raw values. Colors come from `useTheme()`, spacing from `Spacing`, corners
  from `BorderRadius`, and type from `Typography` / `TypographyStyles`. A hex
  code or a bare `padding: 12` in a component is a bug.
- Before adding a color, read the Theming section of the README: tokens that
  flip between light and dark (`text`, `background`) and tokens that are fixed in
  both (`sheetText`, `ink`, `accent`) are not interchangeable, and mixing them is
  how text goes invisible in dark mode.
- Check both light and dark mode for any visual change.
- Styles go in a `createStyles(colors)` `StyleSheet.create` at the bottom of the
  file, not inline.

## Data

- All Supabase queries and mutations live in `src/api/`, typed against
  `database.types.ts`. Components and screens call those functions; they never
  build a query themselves. (Realtime channel plumbing in `src/hooks/` is the one
  exception.)
- Schema changes are new files in `supabase/migrations/` — never edit a migration
  that has been applied. Then `npx supabase db push` and `npm run typegen`.
- When you add a table or a direct (non-RPC) write, confirm a matching RLS policy
  exists. A missing `UPDATE`/`DELETE` policy fails silently with zero rows
  affected, not with an error — the feature looks like it works.
- New per-item detail screens belong at the root of the navigation stack, not
  inside a tab. The README explains why.

## Testing

- Jest + React Native Testing Library (RNTL 14 — `render`, `renderHook`,
  `fireEvent`, and `act` are all async: `await` them). Tests live in a
  colocated `__tests__/` next to the file they cover
  (`src/hooks/__tests__/use-room-books.test.ts`), not in one top-level test tree.
- Mock at the module boundary, not the component: `jest.mock('@/api/rooms', ...)`,
  `jest.mock('@/contexts/rooms-context', ...)`, `jest.mock('expo-router', ...)`.
  Put `jest.mock(...)` calls after the imports in the same file — Babel hoists
  them regardless of position, and this keeps `import/first` lint happy.
- A hook that composes other hooks (e.g. `useRoomSession` wrapping
  `useRoomBooks`/`useRoomPresence`) gets its own test mocking those hooks
  directly, on top of — not instead of — testing each inner hook in isolation.
- `@gorhom/bottom-sheet`, `react-native-reanimated`, `react-native-safe-area-context`,
  and `.svg`/`.css` imports are stubbed globally via `moduleNameMapper` in
  `jest.config.js`, backed by the mocks in `test/`. Don't add a per-test
  `jest.mock()` for any of these — the global one already applies, and read the
  comment in the relevant `test/*-mock.js` file before touching it; each one
  works around a specific Babel/CJS interop failure, not a style preference.
- `screen.getByText(...)` needs real, current copy from `src/i18n/locales/en.ts`
  — `jest.setup.ts` initializes the actual i18n instance rather than a mock, so
  a stale string in a test fails the same way a user would notice it.
- A `testID` added purely so a test can find an element (e.g. a spinner with no
  visible text) is fine; don't reach for one when a query by text, placeholder,
  role, or label already works.
- New pages and components get tests as part of the same change, following the
  patterns above — not deferred to a separate pass.

## Before you call it done

- `npm run typecheck`, `npm run lint`, and `npm test` all pass.
- Any change you can see in the app is verified in the simulator, not reasoned
  about. Reproduce the broken behaviour first, then confirm the fix on screen.
- No commented-out code, debug colors, or leftover `console.log` in the diff.
- Don't add a dependency without asking first.
