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

- Arabic RTL UI, mobile-first, installable as a PWA (`app/manifest.ts`).
- `lib/roadmap.ts` — phases/courses. `lib/tasks.ts` — the daily tasks (where, how, proof questions).
  Missing Semester (2026) and MIT 6.100L are detailed lecture by lecture; other courses are generic weekly units.
  **When Mada reaches a new course, detail it in `lib/tasks.ts` the same way** (real lecture URLs, 2–3 check questions each, `code: true` for problem sets).
- `lib/store.tsx` — client state (React context) in `localStorage`, optional cloud sync via `app/api/sync`.
  Merge: sessions/promises unioned by id (sessions have `deletedIds` tombstones), `tasks` merged per key, rest last-write-wins.
- Daily loop on `/`: broken-promise banner → spaced review (`ReviewCard`, steps 1/3/7/21/60 days) → today's task (`TaskCard`)
  → focus timer → session log (`LogForm`, requires a note and a return time) → tomorrow's task preview.
- Proof: a task closes only after answering its check questions (and a GitHub link for code tasks).
  With `ANTHROPIC_API_KEY`, `app/api/examine` grades with `claude-opus-5` (structured output, pass ≥ 7/10, server-side refusal fallback);
  after 3 failed attempts it can be force-closed and is marked `proof: "forced"`. Without a key: honest self-check.
- Reminders: saving a return time → `app/api/remind` schedules two Upstash QStash messages (at the time, and +90 min)
  → `app/api/remind/fire` sends web push (`lib/push.ts`, `public/sw.js`) unless the promise was replaced or Mada already studied.
  Fallback: Google Calendar link.
- Server features are optional and detected in `lib/server.ts` (`/api/config`); every API route requires the `x-sync-key` header.
  Env vars are listed in `tracker/.env.example`.
- Next 16 lint rules (`react-hooks/set-state-in-effect`, `purity`) are strict; pages render only after `ready`, so reading `localStorage` during client render is safe.

## Rest of the repo

Upstream OSSU content (README.md, coursepages/, extras/, Jekyll config). Don't restructure it; keep it mergeable with upstream.
