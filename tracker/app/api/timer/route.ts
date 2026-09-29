import { denied, KEYS, redis } from "@/lib/server";

export async function POST(req: Request) {
  const no = denied(req, "remind");
  if (no) return no;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "bad request" }, { status: 400 });
  }

  const { action } = body as { action?: string };

  if (action === "cancel") {
    await redis(["DEL", KEYS.timer]).catch(() => {});
    return Response.json({ ok: true });
  }

  if (action === "start") {
    const { timerId, minutes, delayMs } = body as {
      timerId?: string;
      minutes?: number;
      delayMs?: number;
    };

    if (!timerId || typeof minutes !== "number") {
      return Response.json({ error: "missing parameters" }, { status: 400 });
    }

    await redis(["SET", KEYS.timer, timerId]);

    const origin = process.env.APP_URL ?? new URL(req.url).origin;
    const qstash = process.env.QSTASH_URL ?? "https://qstash.upstash.io";
    const delay = Math.max(1000, delayMs ?? minutes * 60_000);
    const notBeforeSec = Math.floor((Date.now() + delay) / 1000);

    const res = await fetch(`${qstash}/v2/publish/${origin}/api/remind/fire`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.QSTASH_TOKEN}`,
        "Content-Type": "application/json",
        "Upstash-Not-Before": String(notBeforeSec),
        "Upstash-Forward-X-Remind-Secret": process.env.SYNC_KEY!,
        "Upstash-Retries": "2",
      },
      body: JSON.stringify({ kind: "timer", timerId, minutes }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error(`[timer] qstash error ${res.status}:`, errText);
      return Response.json({ error: "qstash failed", details: errText }, { status: 502 });
    }

    return Response.json({ ok: true });
  }

  return Response.json({ error: "unknown action" }, { status: 400 });
}
