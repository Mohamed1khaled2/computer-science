"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { Timetable } from "./attendance";
import { ALL_COURSES } from "./roadmap";
import { TASKS, type Task } from "./tasks";

export type CourseStatus = "todo" | "doing" | "done" | "skipped";

export type Session = {
  id: string;
  date: string; // YYYY-MM-DD بالتوقيت المحلي
  minutes: number;
  courseId: string;
  taskId?: string;
  note: string;
  ts: number;
};

export type TaskProgress = {
  doneAt?: number;
  answers: string[];
  link?: string;
  proof?: "ai" | "self" | "forced"; // forced = اتقفلت بعد 3 محاولات فاشلة من غير إثبات
  score?: number;
  feedback?: string;
  followUp?: string;
  attempts: number;
  review?: { due: string; step: number }; // مراجعة متباعدة
  primer?: string[]; // أسئلة تسخين من المشرف قبل الدرس (لو مفيش، أسئلة الإثبات نفسها)
  guesses?: string[]; // تخمينات مادا قبل ما يذاكر (pretesting)
};

// "هرجع إمتى" — وعد بيتسجل في آخر كل جلسة، والإشعارات بتتبني عليه
export type Promise_ = { id: string; at: number; createdAt: number };

// محادثة المشرف الأكاديمي (AI)
export type ChatMessage = { id: string; role: "user" | "model"; text: string; ts: number };

// ملاحظات مادا (markdown). المشرف بيقراها وممكن يقترح تعديل، ومادا بيوافق أو يرفض.
export type Note = { id: string; title: string; body: string; courseId?: string; createdAt: number; updatedAt: number };

// بوست LinkedIn لكل كورس: مادا بيكتبه، والمشرف بيراجع بس
export type Post = { draft: string; lang: "ar" | "en"; postedAt?: number; url?: string; updatedAt: number };

export type State = {
  v: 1;
  weeklyHours: number;
  deadlines: Record<string, string>; // courseId → YYYY-MM-DD: موعد نهائي حدده مادا للكورس
  timetable?: Timetable; // جدول المحاضرات الأسبوعي (الحضور والغياب)
  excused: string[]; // محاضرات اتعلّمت "بعذر" (key = "YYYY-MM-DD HH:MM")
  statuses: Record<string, CourseStatus>;
  sessions: Session[];
  nextStep: string; // أول حاجة هتعملها المرة الجاية — بتتكتب في آخر كل جلسة
  later: string[]; // حاجات لامعة اتأجلت بدل ما تشتتك
  tasks: Record<string, TaskProgress>;
  promises: Promise_[];
  deletedIds: string[]; // جلسات وملاحظات اتمسحت، عشان المزامنة مترجعهاش
  chat: ChatMessage[];
  notes: Note[];
  posts: Record<string, Post>; // courseId → بوست "اتعلمت إيه"
  chatClearedAt?: number; // "محادثة جديدة": الرسايل الأقدم من كده متترجعش من المزامنة
  daily?: { date: string; text: string }; // رسالة المشرف بتاعة النهارده
  updatedAt: number;
};

const KEY = "mada-cs-state";
export const CHAT_LIMIT = 120;
const SYNC_KEY = "mada-cs-sync-key";

const EMPTY: State = {
  v: 1,
  weeklyHours: 9,
  deadlines: {},
  excused: [],
  statuses: {},
  sessions: [],
  nextStep: "",
  later: [],
  tasks: {},
  promises: [],
  deletedIds: [],
  chat: [],
  notes: [],
  posts: {},
  updatedAt: 0,
};

export function today(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

// الجلسات بتتجمع (union) عشان متتمسحش لو سجلت من الموبايل والكمبيوتر في نفس الوقت.
// باقي الحقول: الأحدث يكسب.
export function merge(a: State, b: State): State {
  const newer = a.updatedAt >= b.updatedAt ? a : b;
  const deletedIds = [...new Set([...(a.deletedIds ?? []), ...(b.deletedIds ?? [])])];
  const gone = new Set(deletedIds);
  const byId = new Map<string, Session>();
  for (const s of [...a.sessions, ...b.sessions]) if (!gone.has(s.id)) byId.set(s.id, s);
  const sessions = [...byId.values()].sort((x, y) => x.ts - y.ts);
  const older = newer === a ? b : a;
  const tasks = { ...(older.tasks ?? {}), ...(newer.tasks ?? {}) };
  const promises = [...new Map([...(a.promises ?? []), ...(b.promises ?? [])].map((p) => [p.id, p])).values()].sort(
    (x, y) => x.createdAt - y.createdAt,
  );
  const chatClearedAt = Math.max(a.chatClearedAt ?? 0, b.chatClearedAt ?? 0);
  const chat = [...new Map([...(a.chat ?? []), ...(b.chat ?? [])].map((m) => [m.id, m])).values()]
    .filter((m) => m.ts > chatClearedAt)
    .sort((x, y) => x.ts - y.ts)
    .slice(-CHAT_LIMIT);
  // الملاحظات: كل ملاحظة لوحدها، والأحدث تعديلاً يكسب
  const noteById = new Map<string, Note>();
  for (const n of [...(a.notes ?? []), ...(b.notes ?? [])]) {
    if (gone.has(n.id)) continue;
    const prev = noteById.get(n.id);
    if (!prev || n.updatedAt > prev.updatedAt) noteById.set(n.id, n);
  }
  const notes = [...noteById.values()].sort((x, y) => x.createdAt - y.createdAt);
  const posts: Record<string, Post> = { ...(a.posts ?? {}) };
  for (const [id, p] of Object.entries(b.posts ?? {}))
    if (!posts[id] || p.updatedAt > posts[id].updatedAt) posts[id] = p;
  return {
    ...newer,
    sessions,
    notes,
    posts,
    tasks,
    promises,
    chat,
    chatClearedAt,
    deletedIds,
    updatedAt: Math.max(a.updatedAt, b.updatedAt),
  };
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...EMPTY, ...JSON.parse(raw) };
  } catch {}
  return EMPTY;
}

type SyncStatus = "off" | "syncing" | "ok" | "error";

type Ctx = {
  state: State;
  ready: boolean;
  update: (fn: (s: State) => State) => void;
  replace: (s: State) => void;
  syncKey: string;
  setSyncKey: (k: string) => void;
  syncStatus: SyncStatus;
  syncNow: () => Promise<void>;
};

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(EMPTY);
  const [ready, setReady] = useState(false);
  const [syncKey, setSyncKeyState] = useState("");
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("off");
  const stateRef = useRef(state);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const apply = (s: State) => {
    stateRef.current = s;
    setState(s);
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {}
  };

  const syncNow = useCallback(async () => {
    const key = syncKey;
    if (!key) return;
    setSyncStatus("syncing");
    try {
      const res = await fetch("/api/sync", { headers: { "x-sync-key": key } });
      if (!res.ok) throw new Error(String(res.status));
      const remote = (await res.json()) as State | null;
      const merged = remote ? merge(stateRef.current, { ...EMPTY, ...remote }) : stateRef.current;
      apply(merged);
      const put = await fetch("/api/sync", {
        method: "PUT",
        headers: { "x-sync-key": key, "content-type": "application/json" },
        body: JSON.stringify(merged),
      });
      if (!put.ok) throw new Error(String(put.status));
      setSyncStatus("ok");
    } catch {
      setSyncStatus("error");
    }
  }, [syncKey]);

  useEffect(() => {
    const initial = load();
    stateRef.current = initial;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate من localStorage بعد الـ SSR
    setState(initial);
    try {
      setSyncKeyState(localStorage.getItem(SYNC_KEY) ?? "");
    } catch {}
    setReady(true);
  }, []);

  // اسحب من السحابة أول ما التطبيق يفتح وكل ما ترجعله من تاب تاني
  useEffect(() => {
    if (!ready || !syncKey) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- مزامنة مع السيرفر (external system)
    syncNow();
    const onFocus = () => document.visibilityState === "visible" && syncNow();
    document.addEventListener("visibilitychange", onFocus);
    return () => document.removeEventListener("visibilitychange", onFocus);
  }, [ready, syncKey, syncNow]);

  const commit = (next: State) => {
    apply(next);
    if (syncKey) {
      if (pushTimer.current) clearTimeout(pushTimer.current);
      pushTimer.current = setTimeout(syncNow, 800);
    }
  };

  const update = (fn: (s: State) => State) => commit({ ...fn(stateRef.current), updatedAt: Date.now() });
  const replace = (s: State) => commit({ ...EMPTY, ...s, updatedAt: Date.now() });

  const setSyncKey = (k: string) => {
    setSyncKeyState(k);
    setSyncStatus(k ? "syncing" : "off");
    try {
      if (k) localStorage.setItem(SYNC_KEY, k);
      else localStorage.removeItem(SYNC_KEY);
    } catch {}
  };

  return (
    <StoreContext.Provider value={{ state, ready, update, replace, syncKey, setSyncKey, syncStatus, syncNow }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): Ctx {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore outside StoreProvider");
  return ctx;
}

// الكورس الحالي: أول واحد "شغال عليه"، وإلا أول واحد لسه متبدأش بالترتيب.
// الكورس الحالي = كورس أول مهمة لسه مخلصتش
export function currentCourseId(s: State): string | undefined {
  return upcomingTasks(s, 1)[0]?.courseId ?? ALL_COURSES.find((c) => !courseClosed(s, c.id))?.id;
}

export function minutesFor(s: State, courseId: string): number {
  return s.sessions.filter((x) => x.courseId === courseId).reduce((a, x) => a + x.minutes, 0);
}

export function studiedDays(s: State): Set<string> {
  return new Set(s.sessions.map((x) => x.date));
}

// أيام متتالية فيها مذاكرة، مع السماح بيوم واحد فايت (قاعدة "متفوّتش مرتين").
export function streak(s: State): number {
  const days = studiedDays(s);
  let count = 0;
  let missed = 0;
  const d = new Date();
  if (!days.has(today(d))) d.setDate(d.getDate() - 1); // النهارده لسه مخلصش
  for (let i = 0; i < 3650; i++) {
    if (days.has(today(d))) {
      count++;
      missed = 0;
    } else if (++missed >= 2) break;
    d.setDate(d.getDate() - 1);
  }
  return count;
}

export function weekMinutes(s: State): number {
  const start = new Date();
  start.setDate(start.getDate() - ((start.getDay() + 1) % 7)); // الأسبوع يبدأ السبت
  const from = today(start);
  return s.sessions.filter((x) => x.date >= from).reduce((a, x) => a + x.minutes, 0);
}

// ---------- المهام ----------

export function isDone(s: State, taskId: string): boolean {
  return !!s.tasks[taskId]?.doneAt;
}

function courseClosed(s: State, courseId: string): boolean {
  const st = s.statuses[courseId];
  return st === "done" || st === "skipped";
}

// المهام الجاية بالترتيب (بتتخطى الكورسات اللي اتعلّمت خلصت/متخطّاة)
export function upcomingTasks(s: State, n = 2): Task[] {
  return TASKS.filter((t) => !isDone(s, t.id) && !courseClosed(s, t.courseId)).slice(0, n);
}

// فترات المراجعة بالأيام بعد ما تخلص المهمة
export const REVIEW_STEPS = [1, 3, 7, 21, 60];

export function addDays(date: string, n: number): string {
  const d = new Date(date + "T12:00:00");
  d.setDate(d.getDate() + n);
  return today(d);
}

export function dueReviews(s: State): Task[] {
  const now = today();
  return TASKS.filter((t) => {
    const r = s.tasks[t.id]?.review;
    return r && r.due <= now;
  });
}

// ---------- الوعود ----------

// الوعد يتحسب "اتنفّذ" لو فيه جلسة بدأت من ساعتين قبله لحد 6 ساعات بعده
export function promiseKept(s: State, p: Promise_): boolean {
  return s.sessions.some((x) => x.ts >= p.at - 2 * 3_600_000 && x.ts <= p.at + 6 * 3_600_000);
}

export function nextPromise(s: State): Promise_ | undefined {
  const last = s.promises.at(-1);
  return last && last.at + 6 * 3_600_000 > Date.now() ? last : undefined;
}

export function lastBrokenPromise(s: State): Promise_ | undefined {
  const past = s.promises.filter((p) => p.at + 6 * 3_600_000 <= Date.now());
  const last = past.at(-1);
  return last && !promiseKept(s, last) && s.promises.at(-1) === last ? last : undefined;
}

export function promiseRate(s: State): { kept: number; total: number } {
  const past = s.promises.filter((p) => p.at + 6 * 3_600_000 <= Date.now()).slice(-30);
  return { kept: past.filter((p) => promiseKept(s, p)).length, total: past.length };
}
