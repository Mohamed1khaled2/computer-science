// لما تسجّل "هرجع إمتى": بنجدول إشعارين عن طريق Upstash QStash
// 1) في المعاد نفسه  2) بعده بساعة ونص لو مجتش
// بنحفظ id الوعد الحالي، فلو غيّرت المعاد، الإشعارات القديمة بتتجاهل نفسها.

import { z } from "zod";
import { denied, KEYS, redis } from "@/lib/server";

const Body = z.object({
  promiseId: z.string().max(100),
  at: z.number().int().positive(),
  taskTitle: z.string().max(300),
});

const CHECK_AFTER_MS = 90 * 60_000;

export async function POST(req: Request) {
  const no = denied(req, "remind");
  if (no) return no;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "bad request" }, { status: 400 });
  const { promiseId, at, taskTitle } = parsed.data;

  await redis(["SET", KEYS.promise, promiseId]);

  const origin = process.env.APP_URL ?? new URL(req.url).origin;
  const qstash = process.env.QSTASH_URL ?? "https://qstash.upstash.io";
  const schedule = async (kind: "due" | "check", when: number) => {
    const res = await fetch(`${qstash}/v2/publish/${origin}/api/remind/fire`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.QSTASH_TOKEN}`,
        "Content-Type": "application/json",
        "Upstash-Not-Before": String(Math.floor(when / 1000)),
        "Upstash-Forward-X-Remind-Secret": process.env.SYNC_KEY!,
        "Upstash-Retries": "2",
      },
      body: JSON.stringify({ kind, promiseId, at, taskTitle }),
    });
    if (!res.ok) throw new Error(`qstash ${res.status}: ${await res.text()}`);
  };

  await schedule("due", at);
  await schedule("check", at + CHECK_AFTER_MS);
  return Response.json({ ok: true });
}
