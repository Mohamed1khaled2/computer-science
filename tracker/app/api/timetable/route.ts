// جدول المحاضرات → QStash schedules (cron بتوقيت مادا). كل ما الجدول يتغيّر بنمسح القديم ونعمل جديد.
// في معاد كل محاضرة QStash بينادي /api/remind/fire بـ kind: "class".

import { z } from "zod";
import { denied, KEYS, redis } from "@/lib/server";

const Body = z.object({
  tz: z.string().max(64),
  slots: z
    .array(z.object({ day: z.number().int().min(0).max(6), time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/) }))
    .max(21),
});

export async function POST(req: Request) {
  const no = denied(req, "remind");
  if (no) return no;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "bad request" }, { status: 400 });
  const { tz, slots } = parsed.data;
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
  } catch {
    return Response.json({ error: "bad timezone" }, { status: 400 });
  }

  const qstash = process.env.QSTASH_URL ?? "https://qstash.upstash.io";
  const auth = { Authorization: `Bearer ${process.env.QSTASH_TOKEN}` };

  const old = await redis<string[]>(["SMEMBERS", KEYS.schedules]);
  await Promise.all(old.map((id) => fetch(`${qstash}/v2/schedules/${id}`, { method: "DELETE", headers: auth })));
  await redis(["DEL", KEYS.schedules]);

  // المحاضرات اللي في نفس الساعة بتتجمع في cron واحد
  const byTime = new Map<string, number[]>();
  for (const s of slots) byTime.set(s.time, [...(byTime.get(s.time) ?? []), s.day]);

  const origin = process.env.APP_URL ?? new URL(req.url).origin;
  for (const [time, days] of byTime) {
    const [hh, mm] = time.split(":").map(Number);
    const res = await fetch(`${qstash}/v2/schedules/${origin}/api/remind/fire`, {
      method: "POST",
      headers: {
        ...auth,
        "Content-Type": "application/json",
        "Upstash-Cron": `CRON_TZ=${tz} ${mm} ${hh} * * ${[...new Set(days)].sort().join(",")}`,
        "Upstash-Forward-X-Remind-Secret": process.env.SYNC_KEY!,
        "Upstash-Retries": "2",
      },
      body: JSON.stringify({ kind: "class", time }),
    });
    if (!res.ok) return Response.json({ error: `qstash ${res.status}: ${await res.text()}` }, { status: 502 });
    const { scheduleId } = (await res.json()) as { scheduleId: string };
    await redis(["SADD", KEYS.schedules, scheduleId]);
  }
  return Response.json({ ok: true, schedules: byTime.size });
}
