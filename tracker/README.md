# مسار مادا — CS tracker

Next.js app to follow the OSSU-based plan from phone and laptop: daily task with exact
steps, proof-of-understanding (graded by Claude), spaced review, and a mandatory
"when will you come back?" that sends push reminders.

## Run locally

```bash
npm install
npm run dev
```

## Deploy on Vercel

1. Vercel → **Add New → Project** → import `Mohamed1khaled2/computer-science`.
2. **Root Directory: `tracker`** (important).
3. Deploy. The app works immediately (data stays on each device, no reminders, self-check instead of AI grading).

Then turn on each feature by adding environment variables (**Settings → Environment Variables**) and redeploying.
The app's **الإعدادات → حالة السيرفر** shows which ones are active.

| Feature | Env vars | Where to get them |
|---|---|---|
| Sync phone ↔ laptop | `SYNC_KEY` + Redis | `SYNC_KEY`: any long random password. Redis: Vercel → **Storage** → Upstash **Redis** → connect to project (adds `KV_REST_API_URL`/`KV_REST_API_TOKEN`). |
| Push notifications | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | `npx web-push generate-vapid-keys` |
| Reminder at your promised time | `QSTASH_TOKEN` (+ `QSTASH_URL` if shown) | Vercel → **Storage/Marketplace** → Upstash **QStash**, or console.upstash.com → QStash |
| Claude examiner | `ANTHROPIC_API_KEY` | platform.claude.com → API keys (uses `claude-opus-5`, a few cents per check) |

Optional: `APP_URL` = your production URL (e.g. `https://mada-cs.vercel.app`) if reminders should always hit that domain.

## Each device

1. Open the site → الإعدادات → paste the same `SYNC_KEY` → حفظ المفتاح.
2. **Phone:** Add to Home Screen (required for notifications on iPhone), open it from the icon, then الإعدادات → فعّل الإشعارات هنا → جرّب.

Without the server reminders, every saved return time offers an **Add to Google Calendar** link, so the phone still reminds you.
