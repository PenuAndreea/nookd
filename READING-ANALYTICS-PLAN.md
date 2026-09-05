# Reading analytics — session data model + the You tab

## Context

Readfolk creates and closes `reading_sessions` rows, but nothing reads them back.
The You tab exists ([you.tsx](src/app/(app)/(tabs)/you.tsx)) and is currently
profile + sign-out only. The goal is to make session data trustworthy, then show
a reader where their time went.

Most of the work is the first half. As stored today the rows cannot support any
of it:

- `end_reading_session` computes `now() - created_at`, where `now()` is whenever
  the session happened to be closed — for a back-out, whenever cron noticed.
- `start_reading_session` reuses **any** open session for a room with no bound
  ([20260828180000](supabase/migrations/20260828180000_start_reading_session_reuse_open.sql)),
  so returning the next day inherits yesterday's `created_at`. That migration's
  own comment concedes it can "inflate any per-session reading stats."
- Nothing records **which book** you were reading. The reading picker writes it
  to `room_members.book_id` and that row is `DELETE`d on leave.
- Room context evaporates: user rooms expire, and deletion is planned.
- The reflection write sets `ended_at` *after* the RPC already derived
  `duration_minutes` from it ([use-room-reflection.ts:33](src/hooks/use-room-reflection.ts:33)),
  so the two disagree.
- `completed` is set unconditionally to `true`, so it carries no information.

---

## The session lifecycle (agreed model)

**Being in the room means the room screen is open.** Leaving the screen *is*
leaving the room — pressing back prompts a confirmation and ends the session.
Within that, app state is irrelevant: a locked phone or a backgrounded app with
the room screen still mounted is reading, and it counts. The heartbeat stays, but
only as a presence signal and as the fallback for an orphaned session; it no
longer determines duration on any normal path.

This is a **change from today's behaviour**, where navigating away deliberately
keeps you in the room. See "Consequences of screen-scoped membership" below —
three existing pieces of UI depend on the old rule.

**One row per visit.** Never accumulate into an existing row. "Time in this room"
is `sum(duration_minutes) where room_id = ?`. Accumulating would destroy the
per-day and per-hour resolution that streaks and charts need, and make visits
uncountable.

**A session starts when** you join a room — explicit Join, `autojoin=1`, or (new)
creating a room as host.

**A session ends at whichever comes first**, recorded in a new `ended_reason`:

| Trigger | `ended_reason` | Duration is |
|---|---|---|
| Pressed *Leave* | `left` | exact |
| Pressed back / swiped back, and confirmed | `left` | exact |
| Switched to another room (`forceLeaveRoom`) | `switched` | exact |
| The room's clock reached zero | `completed` | to the scheduled end |
| App force-quit or crashed — nothing closed it | `orphaned` | capped, see below |

```
duration_minutes = ceil(epoch(least(ended_at, cap) - created_at) / 60)

cap = least(
        rooms.started_at + rooms.duration_minutes,   -- timed rooms only
        created_at + MAX_SESSION,                    -- 2 hours
        last_seen_at + ORPHAN_GRACE                  -- orphaned rows only: 30 min
      )
```

On every path but the last, `ended_at` is the real moment the user left, so the
cap never binds and the duration is exact — **including time with the phone
locked**, which is the whole point.

The cap exists for the one unclosable case: the app is killed, so no client code
runs and no explicit end is recorded. It also guarantees yesterday's open row can
never be inherited today, which **removes the need for a recency bound on session
reuse** — an open session stays valid exactly as long as membership does.

**Orphan crediting is deliberately a little generous.** The heartbeat stops both
when the app is killed *and* when the phone locks, and those are
indistinguishable server-side. Closing at `last_seen_at` exactly would rob a
reader who locked their phone and then force-quit, so an orphaned session is
credited to `last_seen_at + 30 minutes`, still bounded by the room's scheduled
end and `MAX_SESSION`. Erring generous is the right call on a path this rare, and
`ended_reason = 'orphaned'` labels the rows so the fuzz is auditable rather than
hidden.

`completed` is replaced by `ended_reason`: staying to a timed room's scheduled
end is now distinguishable from walking away, and orphaned rows are labelled
rather than silently mixed in with clean ones.

**Consequence worth accepting deliberately:** someone joining 40 minutes into a
60-minute room can accrue at most 20 more, because the cap is the room's
scheduled end. That is correct.

**Open tunable:** `MAX_SESSION` = 2 hours. Worth revisiting with data — it is the
ceiling on a single unclosed sitting, so if readers regularly go longer in a
house room and get force-quit, this is the number that truncates them.

### Consequences of screen-scoped membership

Three existing pieces of UI were built on "you stay in the room after navigating
away" and change meaning once back means leave:

- **The "Return to room — 40 minutes in" banner**
  ([current-room-banner.tsx](src/components/organisms/current-room-banner.tsx))
  **is kept, narrowed to crash recovery.** It now appears only when a session was
  orphaned — the app was killed with a session still open — and offers both
  actions: return to the room (resuming that session) or end it now. Without it,
  an orphaned session is silently closed by the reaper and the reader has no way
  to reclaim the time. Its copy changes accordingly.
- **The silent re-join on revisit**
  ([use-room-session.ts:93-109](src/hooks/use-room-session.ts:93)) becomes the
  mechanism *behind* that banner rather than routine behaviour — keep it, but it
  should now only find a membership row in the orphan case.
- **The "Leave *X* and join this one?" prompt**
  ([use-room-session.ts:135](src/hooks/use-room-session.ts:135)) becomes nearly
  unreachable, since you can no longer be in room A while browsing room B. Keep
  it as the orphan path.

### Two implementation traps

- **The reflection sheet finishes with `router.back()`.** Once back is
  intercepted, that pop must not re-prompt "leave the room?" — the guard has to
  be disarmed as soon as the session is closed, not just when the sheet opens.
- **Only warn when actually joined.** Tapping a room card to look around without
  joining must still let back work freely.

---

## Stage 1 — Schema (migrations)

House style: lowercase SQL, a leading `--` block explaining *why*,
`security definer` + `set search_path = public` + `auth.uid()`-derived identity,
`revoke`/`grant`. Template:
[20260828190000_harden_reading_session_rpcs.sql](supabase/migrations/20260828190000_harden_reading_session_rpcs.sql).

### 1a. `<ts>_reading_session_analytics_columns.sql`

```sql
alter table public.reading_sessions
  add column if not exists book_id uuid references public.books(id),
  add column if not exists room_vibe text,
  add column if not exists room_name text,
  add column if not exists ended_reason text
    check (ended_reason in ('left', 'switched', 'completed', 'orphaned')),
  add column if not exists reflection_prompted_at timestamptz;
```

- `book_id` — a real FK. `books` rows are shared get-or-create reference data and
  are never deleted, so title/author/cover stay joinable rather than duplicated.
- `room_vibe` — denormalized on purpose: a closed value set, the natural grouping
  key, and the row it would join to is deletable.
- `room_name` — a snapshot of a *display label* a host can rename. Kept only so a
  deleted room still has something to show; group by `room_id`/`room_vibe`, never
  by this.
- `reflection_prompted_at` — makes "this session still owes a reflection" a
  queryable fact, which is what stops reflections being lost on unmount.

Also in this file:
- Recreate `heartbeat_reading_session` against `ended_at is null` **before**
  `drop column if exists completed` — it currently guards on `completed = false`,
  so the drop fails otherwise.
- **The `reading_sessions_room_id_fkey` delete rule is deliberately left alone**
  for now — see Deferred below. Nothing in this migration touches it.
- Indexes: `(user_id, created_at desc)` for the main stats query, and a partial
  `(user_id, ended_at desc) where ended_at is not null and reflection_prompted_at
  is null` for the pending-reflection lookup.
- `delete from public.reading_sessions;` — **destructive and irreversible**, in
  its own statement so it's easy to drop. Every existing row has a duration
  derived from reap time and no book or room snapshot; there is no correct
  backfill. **Confirm before running.**

### 1b. `<ts>_reading_session_close_with_cap.sql`

One shared `close_reading_session(p_session_id, p_reason)` so the user path, the
expiry path and the reaper can never drift apart — all three cap and snapshot
identically:

```sql
update reading_sessions s
set ended_at = now(),
    ended_reason = p_reason,
    duration_minutes = greatest(ceil(extract(epoch from (
      least(
        now(),
        -- A timed room caps at its scheduled end; an open-ended one at
        -- MAX_SESSION, so a forgotten session is bounded rather than
        -- recording the rest of the day.
        coalesce(
          (select r.started_at + make_interval(mins => r.duration_minutes)
             from rooms r where r.id = s.room_id and r.duration_minutes is not null),
          s.created_at + interval '2 hours'
        )
      ) - s.created_at
    )) / 60), 0),
    book_id = coalesce(
      s.book_id,
      (select rm.book_id from room_members rm
        where rm.room_id = s.room_id and rm.user_id = s.user_id),
      (select r.book_id from rooms r where r.id = s.room_id)),
    room_vibe = coalesce(s.room_vibe, (select r.vibe from rooms r where r.id = s.room_id)),
    room_name = coalesce(s.room_name, (select r.name from rooms r where r.id = s.room_id))
where s.id = p_session_id and s.ended_at is null
returning * into v_session;
```

**Snapshotting at close, not at start, is the key simplification.** In every
close path the `room_members` row still exists — `leaveRoom` ends the session
*then* deletes membership ([use-room-presence.ts:124-128](src/hooks/use-room-presence.ts:124)),
`forceLeaveRoom` does the same ([rooms.ts:105-118](src/api/rooms.ts:105)), and on
back-out membership persists by design. So the database reads
`room_members.book_id` itself: **no RPC signature change, no typegen churn, and
the "picked a book after joining" path in
[use-room-books.ts:73](src/hooks/use-room-books.ts:73) needs no new code at all.**

The `coalesce` chain on `book_id` matters: `proceedToJoin`
([use-room-session.ts:112](src/hooks/use-room-session.ts:112)) joins book-club
rooms with no per-member book, while the room itself is pinned to one.

`end_reading_session` keeps its exact contract — `auth.uid()`-scoped, silent when
nothing matches (the reaper may have won the race; leaving must not fail because
of that) — and delegates with reason `'left'`. `start_reading_session` keeps its
signature and its reuse behaviour.

**No inferred books, by decision.** The chain stops at the room's pinned book —
it never falls back to whatever the reader happens to be `currently_reading`. So
skipping the reading picker (one tap, [use-room-books.ts:93](src/hooks/use-room-books.ts:93))
leaves `book_id` null, and that session counts toward total hours but toward no
book. Only explicitly chosen books are ever recorded.

**This has a UI consequence that must be handled honestly:** total reading time
will exceed the sum of per-book time, and the gap can be large. The books card
must not silently swallow it — show the unattributed remainder explicitly, e.g.
*"3h 20m across 4 books · 1h 10m with no book logged"*. Presenting per-book
totals as if they were the whole picture would be the one genuinely misleading
thing this feature could do. It also doubles as a gentle nudge toward using the
picker.

Known v1 limitation to document: switching books mid-session records only the
last one.

### 1c. `<ts>_reading_session_reaper.sql`

Replaces the dashboard-only `close-stale-reading-sessions` job, which closes on
`now()` and knows nothing about caps or snapshots. The new
`close_stale_reading_sessions()` closes any open session that has passed its cap
or gone quiet — `'completed'` when the room's clock ran out, `'orphaned'` when
the heartbeat stopped without an explicit end — delegating to the shared helper,
`limit 500` per run, scheduled every minute.

Now that back means leave, an open session with a dead heartbeat can only be a
killed app, so the reaper is a genuine crash-recovery path rather than routine
cleanup — and it must not race the banner. **Give the reader a window to reclaim
an orphan before closing it:** the reaper should only sweep sessions whose
heartbeat has been dead longer than `ORPHAN_GRACE` (30 min), so returning through
the banner inside that window resumes the same session rather than finding it
already closed. Past the window it closes at `last_seen_at + ORPHAN_GRACE` with
`ended_reason = 'orphaned'`.

Because duration is derived from the cap rather than from `now()`, **when cron
runs no longer affects any number**; the schedule only controls how promptly rows
are tidied. Requires `pg_cron`; if it isn't enabled, keep the function in the
migration and schedule from the SQL editor.

**RLS: no new policies needed** — the existing SELECT and UPDATE policies in
[20260828170100](supabase/migrations/20260828170100_add_reading_sessions_select_update_policies.sql)
already cover every stats read and the reflection write.

### Applying it

`npx supabase db push` — **ask before every run**; it writes the real project
(`nuyqlqtvchgnwnxjibzi`), and it is not a standing approval.

`npx supabase db query --linked -o json "<sql>"` works for read-only
introspection without Docker — use it to confirm the columns landed and to spot
check a session row. `db dump`/`diff`/`pull` need Docker and are unavailable.

**`npm run typegen` may not work here.** The script needs
`EXPO_PUBLIC_SUPABASE_PROJECT_ID`, and on this machine `database.types.ts` has
previously had to be hand-edited to match each migration. Try the script first;
if it fails, hand-edit the `reading_sessions` `Row`/`Insert`/`Update` blocks —
drop `completed`, add `book_id`, `room_vibe`, `room_name`, `ended_reason`,
`reflection_prompted_at` — and add the new functions to the `Functions` section.
The entire `@/api/*` type layer depends on this file staying in sync, so verify
with `npm run typecheck` either way.

---

## Stage 2 — Behaviour changes

### Host auto-joins on create

[create-room.tsx:94](src/app/(app)/create-room.tsx:94) currently inserts the room
and calls `router.back()`. It must instead join the host and route them *into*
the room.

**The easy thing to miss:** creating a room bypasses the "Leave *X* and join this
one?" prompt that `handleJoinPress` uses ([use-room-session.ts:135](src/hooks/use-room-session.ts:135)),
so today's path would put the host in two rooms at once. Creation needs the same
guard — check `currentRoom` before creating, and `forceLeaveRoom` first if the
host confirms.

Cleanest route: create the room, then `router.replace('/room/[id]?autojoin=1')`.
That reuses the entire existing join path rather than duplicating it, and the
back-out lands on the list rather than on the create form.

### Back means leave

The room screen must intercept dismissal while joined and confirm before popping.

**Mechanism (verify against the SDK 57 docs before writing it, per AGENTS.md):**
expo-router 57 vendors React Navigation inside itself — there is no
`@react-navigation/*` package installed, and `usePreventRemove` is present in
`expo-router/build/react-navigation/core/` but **not** re-exported from
`expo-router`'s public API. The supported route is `useNavigation()` from
`expo-router` plus a `beforeRemove` listener calling `e.preventDefault()`, then
dispatching the original action once the user confirms. Confirm this also covers
the iOS swipe-back gesture (`react-native-screens` 4.26 needs the native dismiss
suppressed, not just the JS action).

Behaviour: only guard when `isJoined`; on confirm run the existing
`handleLeaveRoom` (which already ends the session, clears membership and opens
the reflection sheet); disarm the guard the moment the session is closed so the
reflection sheet's own `router.back()` passes through untouched.

New copy in `rooms.*`: a leave-confirmation title and body, reusing
`common.cancel`.

### Room expiry auto-closes the session

Two halves, because a user may or may not be looking at the screen:

- **On screen:** the room screen already derives `displayedElapsedSeconds`
  ([use-room-session.ts:54-57](src/hooks/use-room-session.ts:54)). When a timed
  room's remaining time reaches zero, end the session, clear membership, and open
  the reflection sheet — the same path as *Leave*, with reason `completed`.
- **Off screen:** the reaper in 1c handles everyone else, capping at the room's
  scheduled end so the recorded duration is identical either way.

### Smaller client changes

- **[src/api/rooms.ts](src/api/rooms.ts)** — narrow `updateReadingSession`'s patch
  to `'thoughts' | 'page_reached' | 'mood' | 'reflection_prompted_at'`. Dropping
  `ended_at`/`completed` fixes the lifecycle corruption.
- **[use-room-reflection.ts](src/hooks/use-room-reflection.ts)** — stamp
  `reflection_prompted_at` on submit *and* on skip, so a skipped session isn't
  re-offered forever. Rename `lastSessionId` → `sessionId` and make the
  `router.back()` coupling an optional `onDone`, so the You tab can reuse it.
- **[use-room-presence.ts](src/hooks/use-room-presence.ts)** — add a comment at
  `leaveRoom` that ending the session must stay *before* the membership delete,
  since the snapshot now depends on that ordering.
- **Minimum session floor** — a 10-second bounce into a room shouldn't pollute
  averages. Sessions under ~1 minute are excluded from stats (a filter in the
  aggregators, not a delete).
- **Copy fix, required:** `rooms.readingPicker.subtitle`
  ([en.ts:111](src/i18n/locales/en.ts:111)) says the book is *"not tracked"*.
  That stops being true — rewrite it to say it's saved to the reader's history.

**Durable pending reflections** replace the lost-on-unmount path:
`getPendingReflection(userId)` returns the most recent closed session with
`reflection_prompted_at is null` within 48h (so a forgotten session can't ambush
someone a week later), surfaced as a card on the You tab that opens the existing
[reflection-sheet.tsx](src/components/organisms/reflection-sheet.tsx).

---

## Stage 3 — Data layer

**`src/lib/date.ts`** — no date library exists and none is being added.
`toISOString()` must never appear in a bucketing path: it silently reassigns
early-morning timestamps to the previous day.

`parsePgTimestamp` (the microsecond regex, currently duplicated in
[use-elapsed-seconds.ts](src/hooks/use-elapsed-seconds.ts) and
[(tabs)/index.tsx:34](src/app/(app)/(tabs)/index.tsx:34) — **refactor both onto
it**), `startOfLocalDay`, `localDayKey`, `startOfLocalWeek`, `startOfLocalMonth`,
`addDays`, `daysBetween`, `eachLocalDay` (DST-safe: walks day starts, not
`+86_400_000`), `splitDuration`.

**`src/api/stats.ts`** — `getReadingSessions(userId, sinceIso?)` and
`getPendingReflection(userId)`. Explicit column list, not `select('*')`
(`thoughts` is unbounded free text), with `book:books(...)` embedded. Finished
books reuse the existing [`getUserBooks(userId, 'finished')`](src/api/books.ts).

**Aggregators — pure and split by family** (one file won't fit the 300-line cap):

- `src/lib/stats-time.ts` — `totalMinutes`, `sessionCount`,
  `averageSessionMinutes`, `longestSessionMinutes`, `minutesByDay` (zero-filled),
  `minutesByWeek`.
- `src/lib/stats-books.ts` — `bookBreakdown` (this is "3 min reading Harry
  Potter" — a `SUM` over `book_id`, and the same function answers *total* time
  per book across every room), `unattributedMinutes` (the `book_id is null`
  remainder, so the card can state the gap rather than hide it), `booksFinished`,
  and `pagesRead`. **`page_reached`
  is an absolute page**, so pages read is the positive delta from the previous
  session on the same book; negative deltas count as zero. It has an obvious
  wrong implementation (`sum(page_reached)`) that yields plausible garbage — the
  most test-worthy function in the feature.
- `src/lib/stats-habits.ts` — `currentStreak` (ending today *or yesterday*, so it
  doesn't read as broken before you've read today), `longestStreak`,
  `minutesByWeekday`, `busiestHour`, `moodBreakdown`, `completionRate` (now
  meaningful via `ended_reason`), `vibeBreakdown` (computed, no v1 UI).
- `src/lib/stats.ts` — thin: a `ReadingSummary` type and one `summarize()`.

**`src/hooks/use-reading-stats.ts`** — `{ summary, loading, error, range,
setRange, reload }`, following [use-books-library.ts](src/hooks/use-books-library.ts).
The fetch pulls the year window once and the aggregators slice it, so changing
range is instant and offline.

**Reuse note:** [src/lib/reading-progress.ts](src/lib/reading-progress.ts)
already computes ratio/percent/pagesLeft for a book — use it for per-book rows
rather than recomputing.

---

## Stage 4 — UI

The tab already exists. [you.tsx](src/app/(app)/(tabs)/you.tsx) is profile +
sign-out; stats sections go above the identity block, or the file converts to a
`you/` folder with the profile moving to a sub-screen if it outgrows 300 lines.
No tab-bar work needed — there are already four tabs and no floating button.

**Charts: plain `<View>`s, not SVG, for everything except a mood ring.** Nothing
in `src/` imports `react-native-svg` directly today (it's pulled in only via
`react-native-svg-transformer` for `.svg` assets), so it's an untested path in
this jest setup. Bars and heatmap cells are percentage-width Views — the exact
technique already in `timer-card.tsx`. Reserve SVG for the one thing Views can't
do (`Circle` + `strokeDasharray`), land it last, and if jest chokes add a
`test/rn-svg-mock.tsx` to `moduleNameMapper` alongside the four mocks already
there.

**New atom:** `progress-bar.tsx`, extracted from the two hand-rolled copies in
[timer-card.tsx:37](src/components/organisms/timer-card.tsx:37) and
[book-item.tsx:47](src/components/organisms/book-item.tsx:47); forwarding
`testID` keeps the existing book-item test green.

**New molecules:** `stat-tile.tsx`, `stat-tile-row.tsx`, `bar-chart.tsx` (guards
all-zero data; takes a written-out `accessibilityLabel`), `stat-section.tsx`,
`ring-chart.tsx` (last). Range chips reuse [atoms/chip.tsx](src/components/atoms/chip.tsx)
as [book-status-chips.tsx](src/components/molecules/book-status-chips.tsx) does.

**New organisms:** `stats-time-card.tsx`, `stats-books-card.tsx` (top-5 list from
the existing [book-row.tsx](src/components/molecules/book-row.tsx) via its
`belowInfo` slot), `stats-habits-card.tsx`, `pending-reflection-card.tsx`.

**Reused as-is:** `empty-state`, `error-state` (`onRetry={reload}`,
`common.tryAgain`), `book-row`, `typography`, `icon`, `chip`, `reflection-sheet`.

**i18n:** a new top-level `you.*` group in [en.ts](src/i18n/locales/en.ts)
(`range`, `time`, `books`, `habits`, `reflection`). Mood labels reuse
`rooms.sessionMoods.*`; vibe labels reuse `rooms.vibes.*` in v2. Every string via
`t()`, including chart accessibility labels.

---

## Stage 5 — Tests

Colocated `__tests__/`, RNTL 14 (`await` every `render`/`renderHook`/
`fireEvent`/`act`), mocked at the module boundary, asserted against **real copy**.
Patterns: [use-books-library.test.ts](src/hooks/__tests__/use-books-library.test.ts),
[books/__tests__/index.test.tsx](src/app/(app)/(tabs)/books/__tests__/index.test.tsx).

Highest-value assertions:
- `stats-books.test.ts` — pages 20 → 60 → 90 on one book is **70**, not 170;
  negative deltas contribute 0; two books don't cross-contaminate; per-book totals
  sum across different rooms.
- `stats-habits.test.ts` — a streak ending yesterday still counts; a one-day gap
  breaks it; mood shares sum to 1 with nulls out of the denominator.
- `stats-time.test.ts` — `null` durations ignored, not `NaN`; empty average is 0;
  sub-minute sessions excluded; `minutesByDay(_, 7)` returns exactly 7 buckets.
- `date.test.ts` — `localDayKey` returns the **local** day for a near-midnight
  timestamp (the `toISOString` trap); `eachLocalDay` across a month boundary.
- `use-reading-stats.test.ts` — changing range re-derives with **no second network
  call**.
- `you.test.tsx` — sections by real copy, `EmptyState` on `[]`, `ErrorState` +
  working retry, pending card only when one exists. The existing
  [you.test.tsx](src/app/(app)/(tabs)/__tests__/you.test.tsx) must keep passing.
- Room-expiry auto-close and host auto-join both get hook-level tests.

**Existing tests to update:** `use-room-reflection.test.ts` (patch no longer has
`completed`/`ended_at`; skip is async and writes), `use-room-presence.test.ts`,
and verify — don't assume — that `timer-card`/`book-item` still pass after the
`ProgressBar` extraction.

---

## Sequencing & verification

Each stage leaves `npm run typecheck && npm run lint && npm test` green.

1. **Migrations + the client changes that depend on them** (the `completed` drop
   breaks the build otherwise).
   *Simulator — the stage that most needs it:* **reproduce the inflated number
   first**, so the fix is demonstrated rather than assumed. Then join a house
   room, lock the phone 5 minutes, return and press Leave → confirm ~5 minutes
   recorded, `ended_reason = 'left'`, and `book_id`/`room_vibe`/`room_name`
   populated. Join a 2-minute timed room and wait it out → `'completed'` and a
   reflection prompt. Join and abandon → capped, not open-ended.
2. **Host auto-join + room-expiry auto-close.** *Verify:* create a room while
   already in another and confirm the switch prompt appears; create normally and
   land inside the room already joined.
3. **`date.ts` + the `parsePgTimestamp` refactor.** *Verify:* the Rooms subtitle
   still says "40 minutes in" and the room timer still counts.
4. **`ProgressBar` extraction.** *Verify:* both bars look unchanged, light and dark.
5. **Aggregators + data layer.** `npm test` is the verification; nothing imports
   them yet.
6. **The You tab sections.** *Verify:* numbers match the sessions from step 1;
   kill the network for `ErrorState` + retry; a fresh account for `EmptyState`;
   both themes.
7. **Mood ring + pending reflection card.**

**Before done:** typecheck, lint, tests pass; every visible change confirmed live
in the simulator in both light and dark mode; no leftover `console.log`, debug
colors, or commented-out code.

---

## Stage 1 outcome (applied 2026-09-05)

Five migrations applied; `reading_sessions` reset to 0 rows. Verified live in the
simulator: a 62-second session recorded `duration_minutes = 1`, `ended_reason =
'left'`, and snapshotted *Harry Potter and the Chamber of Secrets*, `Rainy
Library`, `quiet_company`. Skip stamped `reflection_prompted_at` without
inventing a mood.

**Deviation from the plan's cap formula, deliberately.** The plan applied
`MAX_SESSION` to every close. That is wrong: it would truncate a legitimate
three-hour sitting that the reader ended themselves. `MAX_SESSION` and the
orphan grace now apply **only to `ended_reason = 'orphaned'`**, where no client
was present and the end time is untrustworthy. A timed room's scheduled end
still caps everything. Verified: explicit leave after 3h in a house room records
180 minutes, while the same timings orphaned record 120.

**The plan's premise about the old reaper was wrong.** It did not close on
`now()` — it backdated to `last_seen_at` with a two-minute idle window. So
historical durations were *truncated*, not inflated: 97 rows averaging 1 minute,
longest 8. Same conclusion (unusable), opposite direction.

**`npm run typegen` works** (source `.env` first). `database.types.ts` is
gitignored, so it exists only locally. It is kept hand-edited here on purpose:
codegen also exposes `close_reading_session` and `close_stale_reading_sessions`,
which are revoked from `authenticated` — typing them turns a compile error into
a runtime permission error.

**Found: room_members rows leak.** Membership is only deleted on an explicit
Leave, so 16 rows had accumulated since June. Consequence seen live — the room
screen's timer reads `room_members.joined_at` while the session reads its own
`created_at`, and they had drifted to 137 minutes versus 62 seconds. Migration
`20260905120400` makes the reaper delete membership when it closes a session,
since being closed and still being a member are contradictory states. **15 legacy
rows predate that fix and need a one-off cleanup** — all in expired rooms, so
invisible in the UI.

**Found: the reflection sheet hides the page field for member-picked books.**
`reflection-sheet.tsx` gates "page reached" and "I finished this book" on
`room.book_id`, so in a house room the session records a book but the reflection
cannot record a page against it. That gate should be the *session's* book, not
the room's. Fold into Stage 2 — it directly limits the pages/pace stats.

---

## Stage 2 outcome (applied 2026-09-05)

All four behaviour changes shipped and verified live.

**Back means leave.** `usePreventRemove` via a deep import into
`expo-router/build/react-navigation/core`, isolated in
[use-leave-room-guard.ts](src/hooks/use-leave-room-guard.ts). It resolves at
runtime under Metro, not just at typecheck. Verified that the **swipe-back
gesture** triggers the dialog and cancels mid-gesture — the case the documented
`beforeRemove` listener would have missed on a native stack, which is why the
deep import was worth taking. Cancel keeps the reader in the room; Leave records
`ended_reason = 'left'` and clears membership.

**`ended_reason` is never trusted from the client.** Migration
`20260905120600` moved the 'completed' verdict server-side: `close_reading_session`
overrides whatever the caller says when the room's scheduled end has passed. So
the on-screen expiry path and the reaper produce identical rows, and the client
keeps sending 'left' without needing to know. Verified: a room whose clock ran
out while the reader watched recorded `'completed'`, with `ended_at` **0.7s**
after the room's scheduled end.

**Host auto-joins on create** via `router.replace('/room/<id>?autojoin=1')`,
reusing the whole existing join path rather than duplicating it — including the
"already in another room" prompt — and leaving no create form on the stack.

**The reflection sheet gate is fixed.** It now keys off the *session's* book
(`selfBook ?? room.book`) rather than `room.book_id`. Verified in a house room:
"Page reached (of 300)" and "I finished this book" now appear, page 142 saved to
both the session and the `user_books` entry. Before this, every reflection in a
house room silently discarded the page and the finished flag.

**Verified end to end:** four sessions recorded across two rooms with three
different books, each with the right duration, reason, book and room snapshot.
53 suites / 261 tests green; lint at its pre-existing baseline.

---

## Stages 3 & 4 outcome (applied 2026-09-05)

The You tab is live and rendering real data. 64 suites / 397 tests.

**Deviations from the plan, all deliberate:**

- **Ranges are rolling windows, not calendar periods.** The plan filtered by
  calendar year while charting a fixed 365 buckets — on 3 January that shows
  three days of data across a year-wide chart. Week/month/year are now trailing
  7/30/365-day windows, so the filter and the chart always describe the same
  thing.
- **No ring chart, and no `react-native-svg` at all.** The mood breakdown is
  labelled bars reusing the new `ProgressBar` atom: it reads better at four
  moods than a donut, and it removes the one piece of the plan that carried a
  jest-transform risk. Stage 6 of the original plan is therefore already done.
- **`busiestHour` is rendered as a part of day, not a clock time.** Hermes ships
  a cut-down Intl, so `toLocaleTimeString(undefined, { hour: 'numeric' })`
  rendered a bare `00`. Caught in the simulator, not by tests. "in the evening"
  is also the more useful claim.

**Reused rather than rebuilt:** `EmptyState`, `ErrorState`, `BookRow` (its
`belowInfo` slot carries the per-book time), `Chip`, `Typography`, and
`reading-progress.ts`.

**`ProgressBar` extracted** from the duplicated copies in `timer-card.tsx` and
`book-item.tsx`; both existing tests passed unchanged because `testID` is
forwarded.

**`parsePgTimestamp` is now the single source of truth** for the Postgres
microsecond quirk — `use-elapsed-seconds.ts` and the Rooms screen both switched
onto it. TypeScript caught that a hoisted `function tick()` blocked narrowing,
which the previous non-null `Date.parse` had hidden.

**Verified in the simulator, light and dark**, against 20 seeded sessions
(since removed): 3h 3m across 8 sessions, a 5-day streak, per-book rows with
covers, a mood breakdown, and the "1h with no book logged" line that keeps
per-book totals honest.

**Deferred:** the pending-reflection card. `getPendingReflection` and its tests
exist; only the card and `use-pending-reflection` remain.

---

## Fix from user testing (2026-09-05)

**A reflected session is never dropped, however short.** Reported from the
simulator: a 12-second session with a mood and a page recorded contributed to
nothing — not the session count, not the mood breakdown. The sub-minute floor
exists to discard accidental bounces into a room, but a bounce does not come
with a mood, written thoughts, or a page. `countsTowardStats` now keeps any
session the reader reflected on and applies the length floor only to the rest.
Verified live: sessions 3 -> 4, books 3 -> 4, total time unchanged at 3m (it
counts as a sitting but genuinely added no minutes).

Also fixed from the same session: "You read most often in the late night" was
not English — each part-of-day value is now a complete phrase carrying its own
preposition rather than the sentence template supplying "the".

---

## Deferred to v2 (data accrues from day one)

Per-nook time, share of time by vibe, rooms joined over time, distinct rooms
visited. `room_vibe`/`room_name` are recorded from Stage 1 and `vibeBreakdown()`
is written and tested in Stage 3, so v2 is a UI-only change with real history
behind it.

Also deferred: room-level totals ("47 hours read in Rainy Library, by 12 people")
and per-book community totals — both need a cross-user read policy or an
aggregate RPC, which per-user stats do not.

## Open items

- **FK delete rules — checked against the live database, left unchanged by
  decision.** Actual values:

  | Constraint | References | On delete |
  |---|---|---|
  | `reading_sessions_room_id_fkey` | `rooms` | **NO ACTION** |
  | `reading_sessions_user_id_fkey1` | `auth.users` | **CASCADE** |
  | `room_members_room_id_fkey` | `rooms` | NO ACTION |
  | `room_members_user_id_fkey1` | `auth.users` | CASCADE |

  **Deleting a user account deletes their sessions.** That is the privacy-correct
  default — `thoughts` is free text the reader wrote — and needs no change. It
  does mean any future room-level or community aggregate shrinks when someone
  deletes their account; note it there rather than fighting it here.

  **Deleting a room is currently blocked, not destructive.** `NO ACTION` means
  Postgres raises a foreign-key violation rather than cascading, so no history
  can be silently lost. **Revisit before room deletion ships** — it will fail
  outright otherwise. The recommended resolution then is `on delete set null`:
  the `room_vibe`/`room_name` snapshots added in 1a mean a session still knows it
  happened in a "Quiet Company" room called "Rainy Library" after the room row is
  gone. A soft delete (`rooms.deleted_at`) sidesteps the constraint entirely and
  is worth considering. `cascade` is the one option to avoid.
- **`MAX_SESSION` = 2 hours and `ORPHAN_GRACE` = 30 min** — both guesses; revisit
  with real data. `ORPHAN_GRACE` does double duty (how long the recovery banner
  stays available, and how much time an unrecovered orphan is credited), so
  changing it moves both.
- **Time read outside a room** — the only thing that would justify a stored total
  on `user_books` rather than a `SUM` over sessions. Not planned; say so if it is.
