// QStash بينادي هنا. نوعين:
// - وعد "هرجع إمتى" (due/check): push لكل الأجهزة، إلا لو الوعد اتغيّر أو انت ذاكرت فعلاً.
// - الجدول (class/attend-check): في معاد المحاضرة "المحاضرة بدأت"، وبعدها بـ 3 ساعات تسجيل حضور أو غياب.

import { KEYS, redis } from "@/lib/server";
import { pushAll } from "@/lib/push";
import {
  absentStreak,
  AFTER,
  attendance,
  BEFORE,
  classesBetween,
  dateIn,
  formatClass,
  nextTaskTitle,
  rate,
  thisWeek,
  zoned,
} from "@/lib/attendance";
import type { State } from "@/lib/store";

type Payload =
  | { kind: "due" | "check"; promiseId: string; at: number; taskTitle: string }
  | { kind: "class"; time: string }
  | { kind: "attend-check"; key: string; at: number };

async function loadState(): Promise<Partial<State>> {
  const raw = await redis<string | null>(["GET", KEYS.state]);
  return raw ? (JSON.parse(raw) as Partial<State>) : {};
}

export async function POST(req: Request) {
  if (!process.env.SYNC_KEY || req.headers.get("x-remind-secret") !== process.env.SYNC_KEY) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const p = (await req.json()) as Payload;
  const origin = new URL(req.url).origin;
  if (p.kind === "class") return classStarted(origin, p.time);
  if (p.kind === "attend-check") return attendCheck(origin, p.key);

  const current = await redis<string | null>(["GET", KEYS.promise]);
  if (current !== p.promiseId) return Response.json({ skipped: "promise replaced" });

  const state = await loadState();
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
  const sent = await pushAll(origin, { ...payload, url: "/" });
  return Response.json({ sent });
}

function weekLine(state: Partial<State>, now: number): string {
  const tt = state.timetable!;
  const records = attendance({ sessions: state.sessions ?? [], excused: state.excused ?? [], timetable: tt }, now);
  const r = rate(thisWeek(records, now, tt.tz));
  return r.total ? `حضورك الأسبوع ده: ${r.attended}/${r.total}` : "";
}

async function classStarted(origin: string, time: string) {
  const state = await loadState();
  const tt = state.timetable;
  if (!tt?.slots.length) return Response.json({ skipped: "no timetable" });
  const now = Date.now();
  const at = zoned(dateIn(now, tt.tz), time, tt.tz);
  const key = `${dateIn(now, tt.tz)} ${time}`;

  // اتسجّل تشيك الحضور بعد 3 ساعات في كل الأحوال
  const qstash = process.env.QSTASH_URL ?? "https://qstash.upstash.io";
  await fetch(`${qstash}/v2/publish/${process.env.APP_URL ?? origin}/api/remind/fire`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.QSTASH_TOKEN}`,
      "Content-Type": "application/json",
      "Upstash-Delay": `${Math.round(AFTER / 60_000)}m`,
      "Upstash-Forward-X-Remind-Secret": process.env.SYNC_KEY!,
      "Upstash-Retries": "2",
    },
    body: JSON.stringify({ kind: "attend-check", key, at }),
  });

  const already = (state.sessions ?? []).some((s) => s.ts - s.minutes * 60_000 >= at - BEFORE);
  if (already) return Response.json({ skipped: "already present" });

  const task = nextTaskTitle({ tasks: state.tasks ?? {}, statuses: state.statuses ?? {} });
  const sent = await pushAll(origin, {
    title: `📚 محاضرة ${formatClass(at, tt.tz)} بدأت`,
    body: [task, "ابدأ 10 دقايق بس وهتتحسب حضور.", weekLine(state, now)].filter(Boolean).join("\n"),
    url: "/",
    tag: "mada-class",
  });
  return Response.json({ sent });
}

async function attendCheck(origin: string, key: string) {
  const state = await loadState();
  const tt = state.timetable;
  if (!tt?.slots.length) return Response.json({ skipped: "no timetable" });
  const now = Date.now();
  const records = attendance({ sessions: state.sessions ?? [], excused: state.excused ?? [], timetable: tt }, now);
  const rec = records.find((r) => r.key === key);
  if (!rec || rec.status === "excused") return Response.json({ skipped: rec ? "excused" : "class removed" });

  const week = weekLine(state, now);
  const next = classesBetween(tt, now, now + 8 * 24 * 3_600_000)[0];
  const nextLine = next ? `المحاضرة الجاية: ${formatClass(next.at, tt.tz)}` : "";
  let payload: { title: string; body: string };
  if (rec.status === "present" || rec.status === "late") {
    payload = {
      title: rec.status === "late" ? "✓ اتسجّل حضورك (متأخر شوية)" : "✓ اتسجّل حضورك",
      body: [week, nextLine].filter(Boolean).join("\n"),
    };
  } else {
    const streak = absentStreak(records);
    payload =
      streak >= 2
        ? {
            title: `✗ غياب ${streak} محاضرات ورا بعض`,
            body: [
              "ده بالظبط المكان اللي كنت بتقف فيه قبل كده. المحاضرة الجاية 10 دقايق بس — المهم ترجع.",
              week,
              nextLine,
            ]
              .filter(Boolean)
              .join("\n"),
          }
        : {
            title: "✗ اتسجّلت غياب",
            body: ["عادي، مرة واحدة. القاعدة: متغيبش مرتين ورا بعض.", week, nextLine].filter(Boolean).join("\n"),
          };
  }
  const sent = await pushAll(origin, { ...payload, url: "/attendance", tag: "mada-attendance" });
  return Response.json({ sent, status: rec.status });
}
