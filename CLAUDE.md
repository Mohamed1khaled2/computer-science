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
- `lib/roadmap.ts` — phases/courses data. Edit this to change the plan.
- `lib/store.tsx` — client state (React context) persisted to `localStorage`.
  Optional cloud sync via `app/api/sync/route.ts` → Upstash Redis REST (no SDK).
  Merge rule: sessions are unioned by id (with `deletedIds` tombstones), other fields last-write-wins.
- Pages: `/` today (timer + log + next step + re-entry after a gap), `/roadmap`, `/log`, `/help` (obstacles + AI rules), `/settings` (sync key, weekly hours, export/import).
- Env vars (Vercel): `SYNC_KEY`, and either `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` or `KV_REST_API_URL`/`KV_REST_API_TOKEN`.
- Next 16 lint rules (`react-hooks/set-state-in-effect`, `purity`) are strict; pages render only after `ready` so reading `localStorage` during client render is safe.

## Rest of the repo

Upstream OSSU content (README.md, coursepages/, extras/, Jekyll config). Don't restructure it; keep it mergeable with upstream.
