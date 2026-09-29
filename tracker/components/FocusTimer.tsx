"use client";

import { useEffect, useState } from "react";

// التايمر بيتحفظ في localStorage عشان لو قفلت الشاشة على الموبايل يفضل شغال.
const KEY = "mada-cs-timer";
type Timer = { target: number; startedAt: number | null; elapsed: number };
const PRESETS = [10, 25, 50];

function read(): Timer {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { target: 25, startedAt: null, elapsed: 0 };
}

function write(t: Timer) {
  try {
    localStorage.setItem(KEY, JSON.stringify(t));
  } catch {}
}

// بيشغّل التايمر من برا (زرار "ابدأ 10 دقايق"). الصفحة بتعمل remount للتايمر بعدها.
export function startTimer(minutes: number) {
  write({ target: minutes, startedAt: Date.now(), elapsed: 0 });
}

export function timerRunning(): boolean {
  const t = read();
  return t.startedAt !== null || t.elapsed > 0;
}

export default function FocusTimer({ onDone, onChange }: { onDone: (minutes: number) => void; onChange?: () => void }) {
  // بيترندر على المتصفح بس (الصفحة مستنية ready)، فقراية localStorage هنا آمنة
  const [t, setT] = useState<Timer>(read);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (t.startedAt === null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [t.startedAt]);

  const set = (next: Timer) => {
    setT(next);
    write(next);
    onChange?.();
  };

  const elapsedMs = t.elapsed + (t.startedAt ? Math.max(0, now - t.startedAt) : 0);
  const leftMs = Math.max(0, t.target * 60_000 - elapsedMs);
  const running = t.startedAt !== null;
  const finished = leftMs === 0;
  const mm = String(Math.floor(leftMs / 60_000)).padStart(2, "0");
  const ss = String(Math.floor((leftMs % 60_000) / 1000)).padStart(2, "0");

  const finish = () => {
    const minutes = Math.max(1, Math.round(elapsedMs / 60_000));
    set({ target: t.target, startedAt: null, elapsed: 0 });
    onDone(minutes);
  };

  return (
    <section className="card space-y-3 text-center">
      <div className="flex justify-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            disabled={running || elapsedMs > 0}
            onClick={() => set({ ...t, target: p })}
            className={`rounded-lg px-3 py-1 text-sm ${t.target === p ? "bg-accent-soft font-bold text-accent" : "text-muted"}`}
          >
            {p} د
          </button>
        ))}
      </div>
      <div className={`font-mono text-6xl font-bold tabular-nums ${finished ? "text-accent" : ""}`} dir="ltr">
        {mm}:{ss}
      </div>
      {finished && <p className="font-semibold text-accent">خلصت الجلسة. سجّلها واكتب الخطوة الجاية.</p>}
      <div className="flex gap-2">
        {!finished &&
          (running ? (
            <button className="btn-ghost flex-1" onClick={() => set({ ...t, startedAt: null, elapsed: elapsedMs })}>
              إيقاف مؤقت
            </button>
          ) : (
            <button className="btn-primary flex-1" onClick={() => set({ ...t, startedAt: Date.now() })}>
              {elapsedMs > 0 ? "كمّل" : "ابدأ جلسة تركيز"}
            </button>
          ))}
        {elapsedMs >= 60_000 && (
          <button className={finished ? "btn-primary flex-1" : "btn-ghost flex-1"} onClick={finish}>
            سجّل الجلسة
          </button>
        )}
      </div>
      {!running && elapsedMs === 0 && (
        <p className="text-xs text-muted">الموبايل بعيد، الـ AI مقفول، تاب واحد بس للكورس.</p>
      )}
    </section>
  );
}
