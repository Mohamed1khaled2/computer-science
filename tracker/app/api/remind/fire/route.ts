// QStash بينادي هنا في المعاد. بنبعت push لكل الأجهزة، إلا لو الوعد اتغيّر أو انت ذاكرت فعلاً.

import { KEYS, redis } from "@/lib/server";
import { pushAll } from "@/lib/push";

type Payload = { kind: "due" | "check"; promiseId: string; at: number; taskTitle: string };
type Stored = { sessions?: { ts: number }[] };

export async function POST(req: Request) {
  if (!process.env.SYNC_KEY || req.headers.get("x-remind-secret") !== process.env.SYNC_KEY) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const p = (await req.json()) as Payload;

  const current = await redis<string | null>(["GET", KEYS.promise]);
  if (current !== p.promiseId) return Response.json({ skipped: "promise replaced" });

  const raw = await redis<string | null>(["GET", KEYS.state]);
  const state = raw ? (JSON.parse(raw) as Stored) : {};
  const showedUp = (state.sessions ?? []).some((s) => s.ts >= p.at - 2 * 3_600_000);
  if (showedUp) return Response.json({ skipped: "already studied" });

  const time = new Date(p.at).toLocaleTimeString("ar-EG", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Africa/Cairo",
  });
  const payload =
    p.kind === "due"
      ? { title: "معادك دلوقتي يا مادا ⏰", body: `${p.taskTitle}\n20 دقيقة بس. افتح وابدأ التايمر.` }
      : {
          title: "وعدت ترجع ولسه مجتش",
          body: `كان معادك ${time}. لسه فيه وقت — جلسة 20 دقيقة تنقذ اليوم.`,
        };
  const sent = await pushAll(new URL(req.url).origin, { ...payload, url: "/" });
  return Response.json({ sent });
}
