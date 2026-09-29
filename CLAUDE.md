# CLAUDE.md

This repo is Mada's personal fork of the OSSU Computer Science curriculum (`ossu/computer-science`)
plus `tracker/`, a Next.js app Mada uses to follow the plan from phone and laptop.

## Who Mada is

- 21, studying/graduated in Information Systems (نظم ومعلومات), wanted Computer Science.
- Works 10–12 hours/day as a full-stack developer, and almost all of that code is AI-generated.
  Mada doesn't like this and wants real engineering skills and CS fundamentals.
- Has started self-study many times and stopped each time because of obstacles (fatigue after work,
  getting stuck, switching courses, losing the streak and feeling they have to restart).
- Realistic budget: ~9 hours/week (about 1 hour per workday plus a longer session on the day off).

## How to help Mada (important)

- Reply in Egyptian Arabic unless asked otherwise. Keep code, identifiers and course names in English.
- **When Mada is studying a course or solving a problem set: act as a tutor, not a solver.**
  Don't write the solution code. Ask guiding questions and give one hint at a time. Explain concepts freely.
  After Mada has solved it alone, reviewing the solution and showing a better approach is encouraged.
- For work tasks or for the `tracker/` app itself, normal coding help is fine.
- If Mada wants to switch courses, drop the plan, or "start over", point back to the current phase
  in `tracker/lib/roadmap.ts` and the "never miss twice" rule. New shiny topics go in the app's "later" list.
- Be honest about careers: the OSSU curriculum is not a degree. Mada should not claim a CS degree.
  The honest framing is "B.Sc. Information Systems + completed OSSU CS curriculum (self-study)", backed by projects on GitHub.

## The plan (source of truth: `tracker/lib/roadmap.ts`)

OSSU courses re-ordered for a working developer. Deliberate deviations from official OSSU order:

0. Missing Semester (tools)
1. Intro CS (MIT 6.100L, Python) — written by hand, no AI code
2. Math for CS (6.042J) + Algorithms 1 & 2 + NeetCode 150 (extra, for interviews). Calculus is postponed to phase 6.
3. Systems: Nand2Tetris I & II, OSTEP, Computer Networking
4. Databases (3 Stanford courses), secure coding, Software Engineering intro
5. SPD, Class-based design, Programming Languages, OOD, Software Architecture
6. Rest of OSSU: Calculus, security, ML, graphics, ethics, advanced electives, final project

Each phase has a "proof" project for GitHub/CV.

## tracker/ (Next.js 16, App Router, TypeScript, Tailwind v4)

```bash
cd tracker
npm install
npm run dev      # http://localhost:3000
npm run lint
npm run build
```

- Arabic RTL UI, installable as a PWA (`app/manifest.ts`). `components/Shell.tsx`: sidebar on desktop (md+), header + bottom tabs on phone.
  Pages: `/` dashboard (hero + journey track, main column = daily loop, side column = stats/heatmap/next tasks),
  `/roadmap` phase timeline, `/course/[id]` syllabus per course, `/transcript` academic record (credits ≈ hours/45, letter grade
  from examiner scores, milestones — always labelled self-study, not a degree), `/mentor` advisor chat, `/notes`, `/log`, `/help`, `/settings`.
- Learning in public: `PostComposer` on each course page (`state.posts[courseId]`, merged per course by `updatedAt`). Mada writes the
  post (optional guiding skeleton, their notes as raw material), the advisor only reviews; copy + LinkedIn share link, "posted" marks it.
- `lib/journey.ts` — derived data (progress, grades, milestones, heatmap, `schedule()`: courses run back to back at `weeklyHours`,
  giving each one's expected start/end; `state.deadlines` holds Mada's optional per-course deadline, shown in `CourseTime`) and `mentorContext()`, the student summary sent to the advisor
  (includes the current course's notes in full, up to 8k chars, plus titles of the rest).
- Advisor ("المشرف"): `app/api/mentor` + `lib/gemini.ts` (Gemini REST, `GEMINI_API_KEY`, `GEMINI_MODEL` default `gemini-flash-latest`).
  Tutor rules live in its system prompt (no solution code, one hint at a time, don't allow switching the plan).
  Modes: `chat` (streamed text), `primer` (3 pretest questions), `teach` (classmate role-play, streamed),
  `post` (reviews Mada's own LinkedIn draft: feedback + light edit, honesty rules — never writes the post; needs 200 own chars), `daily` (one message per day cached in `state.daily`; without a key `fallbackDaily()` writes it),
  `note` (returns a rewritten note body; corrections marked `> ⚠️ تصحيح:`, additions marked; Mada accepts/rejects in `/notes`, with undo).
- `lib/roadmap.ts` — phases/courses. `lib/tasks.ts` — the daily tasks (where, how, proof questions).
  Missing Semester (2026) and MIT 6.100L are detailed lecture by lecture; other courses are generic weekly units.
  **When Mada reaches a new course, detail it in `lib/tasks.ts` the same way** (real lecture URLs, 2–3 check questions each, `code: true` for problem sets).
- `lib/store.tsx` — client state (React context) in `localStorage`, optional cloud sync via `app/api/sync`.
  Merge: sessions/promises/chat unioned by id (sessions and notes share `deletedIds` tombstones, chat has `chatClearedAt`),
  notes per id by newest `updatedAt`, `tasks` merged per key, rest last-write-wins.
- Daily loop on `/`: broken-promise banner → `StartCard` ("start 10 minutes" opens the lesson + starts the timer; tired mode offers
  light options) → spaced review (`ReviewCard`, steps 1/3/7/21/60 days) → today's task (`TaskCard`, with `Pretest`: guess answers
  before the lesson, optionally new questions from the advisor) → focus timer → session log (`LogForm`, requires a note and a return time).
- Attendance (`lib/attendance.ts`, pure, shared by client and server): weekly timetable in `state.timetable` (slots + Mada's timezone).
  A class is present if a session *started* (ts − minutes) from 2h before to 3h after it, late after 30 min, else absent; `state.excused`
  holds excused class keys. `/api/timetable` turns the timetable into QStash cron schedules (`CRON_TZ`); `/api/remind/fire` kind `class`
  pushes "class started" and queues `attend-check` 3h later, which pushes present/absent with the week's attendance. Page: `/attendance`.
- Proof: a task closes only after answering its check questions (and a GitHub link for code tasks), or — with the advisor on —
  by teaching it to a role-played classmate (`TeachBack`, mentor mode `teach`); the transcript is graded by `/api/examine` (`transcript`).
  With `ANTHROPIC_API_KEY`, `app/api/examine` grades with `claude-opus-5` (structured output, pass ≥ 7/10, server-side refusal fallback);
  otherwise with `GEMINI_API_KEY` it grades with Gemini (JSON `responseSchema`, same verdict shape);
  after 3 failed attempts it can be force-closed and is marked `proof: "forced"`. Without a key: honest self-check.
- Reminders: saving a return time → `app/api/remind` schedules two Upstash QStash messages (at the time, and +90 min)
  → `app/api/remind/fire` sends web push (`lib/push.ts`, `public/sw.js`) unless the promise was replaced or Mada already studied.
  Fallback: Google Calendar link.
- Icons: source SVGs in `tracker/public/icons/` (`logo`, `maskable`, `badge` = white on transparent for the Android status bar);
  PNGs are generated with `node scripts/make-icons.mjs` (Android notifications and iOS need PNG). `app/icon.svg` and `app/apple-icon.png` are copies.
  Push payloads can carry `actions` (buttons → url) and `badgeCount` (app icon badge; cleared when the dashboard opens).
  `/#start` starts a 10-minute timer, `/#tired` opens tired mode, `/#go` scrolls to the start card (the tap target on iPhone, which has no buttons).
  Mada uses an iPhone: push needs the home-screen PWA (`IosInstall` guide in settings). Every notification is listed in `tracker/NOTIFICATIONS.md` — keep it in sync.
- Server features are optional and detected in `lib/server.ts` (`/api/config`); every API route requires the `x-sync-key` header.
  Env vars are listed in `tracker/.env.example`.
- Next 16 lint rules (`react-hooks/set-state-in-effect`, `purity`) are strict; pages render only after `ready`, so reading `localStorage` during client render is safe.

## Rest of the repo

Upstream OSSU content (README.md, coursepages/, extras/, Jekyll config). Don't restructure it; keep it mergeable with upstream.
