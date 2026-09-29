// الحضور والغياب: جدول محاضرات أسبوعي، وكل محاضرة بتتحسب من الجلسات المتسجلة.
// pure ومن غير "use client" عشان السيرفر (إشعارات QStash) والواجهة يستخدموا نفس الحسبة.
// التوقيتات محسوبة بالـ timezone بتاع مادا، مش بتاع السيرفر (Vercel = UTC).

import type { State } from "./store";
import { TASKS } from "./tasks";

export type Slot = { day: number; time: string }; // day: 0 = الأحد (زي getDay)، time: "HH:MM"
export type Timetable = { slots: Slot[]; tz: string; since: number };
export type ClassStatus = "present" | "late" | "absent" | "excused" | "open" | "upcoming";
export type ClassRecord = { key: string; date: string; time: string; at: number; status: ClassStatus };

const H = 3_600_000;
export const BEFORE = 2 * H; // جلسة بدأت قبل المحاضرة بساعتين بتتحسب
export const AFTER = 3 * H; // بعد 3 ساعات من غير جلسة = غياب
export const LATE = 30 * 60_000;

export const DAYS = ["الأحد", "الاتنين", "التلات", "الأربع", "الخميس", "الجمعة", "السبت"];

type AttendanceState = Pick<State, "sessions" | "excused" | "timetable">;

function tzOffset(ts: number, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(ts));
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  return Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second")) - ts;
}

// "2026-10-01" + "21:00" في Africa/Cairo → timestamp
export function zoned(date: string, time: string, tz: string): number {
  const [y, m, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, h, mi);
  const first = guess - tzOffset(guess, tz);
  return guess - tzOffset(first, tz); // تصحيح لو فيه توقيت صيفي في النص
}

export function dateIn(ts: number, tz: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date(ts),
  );
}

function weekday(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function addDay(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

export function classesBetween(
  tt: Timetable,
  from: number,
  to: number,
): { key: string; date: string; time: string; at: number }[] {
  const out: { key: string; date: string; time: string; at: number }[] = [];
  const last = dateIn(to, tt.tz);
  for (let date = dateIn(from, tt.tz); date <= last; date = addDay(date, 1)) {
    const wd = weekday(date);
    for (const s of [...tt.slots].sort((a, b) => a.time.localeCompare(b.time))) {
      if (s.day !== wd) continue;
      const at = zoned(date, s.time, tt.tz);
      if (at >= from && at <= to) out.push({ key: `${date} ${s.time}`, date, time: s.time, at });
    }
  }
  return out;
}

// سجل المحاضرات من ساعة ما الجدول اتعمل (آخر 60 يوم) لحد آخر الأسبوع الجاي
export function attendance(s: AttendanceState, now: number, daysBack = 60): ClassRecord[] {
  const tt = s.timetable;
  if (!tt?.slots.length) return [];
  const from = Math.max(tt.since, now - daysBack * 24 * H);
  const starts = s.sessions.map((x) => x.ts - x.minutes * 60_000);
  const excused = new Set(s.excused ?? []);
  return classesBetween(tt, from, now + 7 * 24 * H).map((c) => {
    const start = starts.find((t) => t >= c.at - BEFORE && t <= c.at + AFTER);
    let status: ClassStatus;
    if (start !== undefined) status = start > c.at + LATE ? "late" : "present";
    else if (excused.has(c.key)) status = "excused";
    else if (now < c.at) status = "upcoming";
    else if (now < c.at + AFTER) status = "open";
    else status = "absent";
    return { ...c, status };
  });
}

export function rate(records: ClassRecord[]): { attended: number; total: number; pct: number | null } {
  const counted = records.filter((r) => r.status === "present" || r.status === "late" || r.status === "absent");
  const attended = counted.filter((r) => r.status !== "absent").length;
  return { attended, total: counted.length, pct: counted.length ? attended / counted.length : null };
}

// الأسبوع بيبدأ السبت (زي باقي التطبيق)
export function thisWeek(records: ClassRecord[], now: number, tz: string): ClassRecord[] {
  const today = dateIn(now, tz);
  const start = addDay(today, -((weekday(today) + 1) % 7));
  return records.filter((r) => r.date >= start && r.at <= now + 7 * 24 * H && r.date <= addDay(start, 6));
}

export function absentStreak(records: ClassRecord[]): number {
  let n = 0;
  for (const r of [...records].reverse()) {
    if (r.status === "upcoming" || r.status === "open" || r.status === "excused") continue;
    if (r.status !== "absent") break;
    n++;
  }
  return n;
}

// المهمة اللي عليها الدور (نفس منطق upcomingTasks بس من غير الـ client store)
export function nextTaskTitle(s: Pick<State, "tasks" | "statuses">): string | undefined {
  return TASKS.find((t) => {
    const st = s.statuses?.[t.courseId];
    return !s.tasks?.[t.id]?.doneAt && st !== "done" && st !== "skipped";
  })?.title;
}

export function formatClass(at: number, tz: string): string {
  return new Date(at).toLocaleString("ar-EG", { weekday: "long", hour: "numeric", minute: "2-digit", timeZone: tz });
}
