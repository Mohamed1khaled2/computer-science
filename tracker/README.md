# مسار مادا — CS tracker

Next.js app to follow the OSSU-based plan from phone and laptop.

## Run locally

```bash
npm install
npm run dev
```

## Deploy on Vercel

1. Vercel → **Add New → Project** → import `Mohamed1khaled2/computer-science`.
2. **Root Directory: `tracker`** (important — the repo root is the OSSU curriculum).
3. Deploy. The app works immediately, with data saved on each device only.

## Phone ↔ laptop sync (optional, free)

1. In the Vercel project → **Storage** → create an **Upstash Redis** database and connect it to the project
   (this adds `KV_REST_API_URL` / `KV_REST_API_TOKEN` or `UPSTASH_REDIS_REST_*` automatically).
2. **Settings → Environment Variables** → add `SYNC_KEY` = any long random password.
3. Redeploy.
4. On each device: open the site → الإعدادات → paste the same `SYNC_KEY` → حفظ المفتاح.

On the phone: open the site → Share / menu → **Add to Home Screen** to use it like an app.
