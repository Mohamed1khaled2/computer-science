"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { ALL_COURSES } from "./roadmap";

export type CourseStatus = "todo" | "doing" | "done" | "skipped";

export type Session = {
  id: string;
  date: string; // YYYY-MM-DD بالتوقيت المحلي
  minutes: number;
  courseId: string;
  note: string;
  ts: number;
};

export type State = {
  v: 1;
  weeklyHours: number;
  statuses: Record<string, CourseStatus>;
  sessions: Session[];
  nextStep: string; // أول حاجة هتعملها المرة الجاية — بتتكتب في آخر كل جلسة
  later: string[]; // حاجات لامعة اتأجلت بدل ما تشتتك
  deletedIds: string[]; // جلسات اتمسحت، عشان المزامنة مترجعهاش
  updatedAt: number;
};

const KEY = "mada-cs-state";
const SYNC_KEY = "mada-cs-sync-key";

const EMPTY: State = {
  v: 1,
  weeklyHours: 9,
  statuses: {},
  sessions: [],
  nextStep: "",
  later: [],
  deletedIds: [],
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
  return { ...newer, sessions, deletedIds, updatedAt: Math.max(a.updatedAt, b.updatedAt) };
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
export function currentCourseId(s: State): string | undefined {
  const doing = ALL_COURSES.find((c) => s.statuses[c.id] === "doing");
  if (doing) return doing.id;
  return ALL_COURSES.find((c) => !s.statuses[c.id] || s.statuses[c.id] === "todo")?.id;
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
