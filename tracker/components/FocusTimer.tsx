"use client";

import { useEffect, useState, useCallback } from "react";
import { useStore } from "@/lib/store";
import { api } from "@/lib/client";

// التايمر بيتحفظ في localStorage عشان لو قفلت الشاشة على الموبايل يفضل شغال.
const KEY = "mada-cs-timer";
// كل كتابة بتبعت event عشان شريط التايمر اللي فوق (TimerBar) والكارت يفضلوا متزامنين
export const TIMER_EVENT = "mada-timer";
export type Timer = {
  target: number;
  startedAt: number | null;
  elapsed: number;
  timerId?: string;
  chimed?: boolean;
};
const PRESETS = [10, 25, 50];
const MAX_OVERTIME_MINUTES = 30; // أقصى وقت إضافي قبل ما التايمر يقف تلقائياً عشان لو نسيت الجهاز

export function readTimer(): Timer {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { target: 25, startedAt: null, elapsed: 0, chimed: false };
}

const read = readTimer;

function write(t: Timer) {
  try {
    localStorage.setItem(KEY, JSON.stringify(t));
  } catch {}
  window.dispatchEvent(new Event(TIMER_EVENT));
}

export function subscribeTimer(cb: () => void) {
  window.addEventListener(TIMER_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(TIMER_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function rawTimer(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** الوقت اللي اتذاكر فعلاً (ms)، بحد أقصى الهدف + الوقت الإضافي المسموح */
export function timerElapsed(t: Timer, now: number): number {
  const raw = t.elapsed + (t.startedAt ? Math.max(0, now - t.startedAt) : 0);
  return Math.min(raw, (t.target + MAX_OVERTIME_MINUTES) * 60_000);
}

function cancelServer(syncKey: string) {
  if (!syncKey) return;
  api("/api/timer", syncKey, { method: "POST", body: JSON.stringify({ action: "cancel" }) }).catch(() => {});
}

export function pauseTimer(syncKey: string) {
  const t = read();
  if (t.startedAt === null) return;
  cancelServer(syncKey);
  write({ ...t, startedAt: null, elapsed: timerElapsed(t, Date.now()), timerId: undefined });
}

export function resumeTimer(syncKey: string) {
  const t = read();
  if (t.startedAt !== null) return;
  const id = crypto.randomUUID();
  const delay = Math.max(1000, t.target * 60_000 - t.elapsed);
  if (syncKey && delay > 1000) {
    api("/api/timer", syncKey, {
      method: "POST",
      body: JSON.stringify({ action: "start", timerId: id, minutes: t.target, delayMs: delay }),
    }).catch(() => {});
  }
  write({ ...t, startedAt: Date.now(), timerId: id });
}

export function startTimer(minutes: number) {
  write({ target: minutes, startedAt: Date.now(), elapsed: 0, chimed: false });
}

export function timerRunning(): boolean {
  const t = read();
  return t.startedAt !== null || t.elapsed > 0;
}

function playChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // النغمة الأولى: 587.33 Hz (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.9);

    // النغمة الثانية: 880 Hz (A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, now + 0.25);
    gain2.gain.setValueAtTime(0.2, now + 0.25);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.25);
    osc2.stop(now + 1.2);
  } catch {}
}

function vibrateHaptic() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate([200, 100, 200, 100, 300]);
    } catch {}
  }
}

export default function FocusTimer({
  onDone,
  onChange,
}: {
  onDone: (minutes: number) => void;
  onChange?: () => void;
}) {
  const { syncKey } = useStore();
  const [t, setT] = useState<Timer>(read);
  const [now, setNow] = useState(() => Date.now());

  // اتغيّر من برّه (شريط التايمر فوق أو تاب تاني) → اقرا تاني
  useEffect(
    () =>
      subscribeTimer(() =>
        setT((prev) => {
          const next = read();
          return JSON.stringify(next) === JSON.stringify(prev) ? prev : next;
        })
      ),
    []
  );

  useEffect(() => {
    if (t.startedAt === null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [t.startedAt]);

  const set = useCallback(
    (next: Timer) => {
      setT(next);
      write(next);
      onChange?.();
    },
    [onChange]
  );

  const targetMs = t.target * 60_000;
  const maxAllowedMs = targetMs + MAX_OVERTIME_MINUTES * 60_000;
  const rawElapsed = t.elapsed + (t.startedAt ? Math.max(0, now - t.startedAt) : 0);
  const isCapped = rawElapsed >= maxAllowedMs;
  const elapsedMs = Math.min(rawElapsed, maxAllowedMs);
  const isOvertime = elapsedMs >= targetMs;
  const running = t.startedAt !== null;
  const totalMinutes = Math.max(1, Math.round(elapsedMs / 60_000));

  // إيقاف التايمر تلقائياً لو عدى الحد الأقصى للوقت الإضافي لحماية الإحصائيات لو نسيت الجهاز
  useEffect(() => {
    if (running && rawElapsed >= maxAllowedMs) {
      if (syncKey) {
        api("/api/timer", syncKey, { method: "POST", body: JSON.stringify({ action: "cancel" }) }).catch(() => {});
      }
      set({ ...t, startedAt: null, elapsed: maxAllowedMs, timerId: undefined });
    }
  }, [running, rawElapsed, maxAllowedMs, syncKey, set, t]);

  // تشغيل رنة التنبيه والاهتزاز أول ما الهدف يكتمل لأول مرة
  useEffect(() => {
    if (!running || t.chimed) return;
    if (elapsedMs >= targetMs) {
      playChime();
      vibrateHaptic();
      set({ ...t, chimed: true });
    }
  }, [running, t, elapsedMs, targetMs, set]);

  // جدولة إشعار السيرفر لو بدأ التايمر من غير ما يكون متجدول
  useEffect(() => {
    if (!running || !syncKey || t.timerId || elapsedMs >= targetMs) return;
    const id = crypto.randomUUID();
    const delay = Math.max(1000, targetMs - elapsedMs);
    api("/api/timer", syncKey, {
      method: "POST",
      body: JSON.stringify({ action: "start", timerId: id, minutes: t.target, delayMs: delay }),
    }).catch(() => {});
    set({ ...t, timerId: id });
  }, [running, syncKey, t, elapsedMs, targetMs, set]);

  let mm = "00";
  let ss = "00";
  if (!isOvertime) {
    const leftMs = Math.max(0, targetMs - elapsedMs);
    mm = String(Math.floor(leftMs / 60_000)).padStart(2, "0");
    ss = String(Math.floor((leftMs % 60_000) / 1000)).padStart(2, "0");
  } else {
    const overMs = elapsedMs - targetMs;
    mm = String(Math.floor(overMs / 60_000)).padStart(2, "0");
    ss = String(Math.floor((overMs % 60_000) / 1000)).padStart(2, "0");
  }

  const finish = (mins?: number) => {
    if (syncKey) {
      api("/api/timer", syncKey, { method: "POST", body: JSON.stringify({ action: "cancel" }) }).catch(() => {});
    }
    set({ target: t.target, startedAt: null, elapsed: 0, chimed: false, timerId: undefined });
    onDone(mins ?? totalMinutes);
  };

  const pause = () => {
    pauseTimer(syncKey);
    onChange?.();
  };

  const resume = () => {
    resumeTimer(syncKey);
    onChange?.();
  };

  const reset = () => {
    if (elapsedMs > 60_000) {
      const ok = typeof window !== "undefined" ? window.confirm("متأكد إنك عايز تلغي وتصفر التايمر من غير ما تسجل؟") : true;
      if (!ok) return;
    }
    if (syncKey) {
      api("/api/timer", syncKey, { method: "POST", body: JSON.stringify({ action: "cancel" }) }).catch(() => {});
    }
    set({ target: t.target, startedAt: null, elapsed: 0, chimed: false, timerId: undefined });
  };

  return (
    <section className="card space-y-3 text-center">
      <div className="flex justify-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            disabled={running || elapsedMs > 0}
            onClick={() => set({ ...t, target: p, chimed: false, timerId: undefined })}
            className={`rounded-lg px-3 py-1 text-sm ${t.target === p ? "bg-accent-soft font-bold text-accent" : "text-muted"}`}
          >
            {p} د
          </button>
        ))}
      </div>

      <div className={`font-mono text-6xl font-bold tabular-nums ${isOvertime ? "text-accent" : ""}`} dir="ltr">
        {isOvertime ? `+${mm}:${ss}` : `${mm}:${ss}`}
      </div>

      {isCapped ? (
        <div className="space-y-1 rounded-lg border border-warn/30 bg-warn/10 p-2.5">
          <p className="font-semibold text-warn">
            ⏸️ التايمر وقف تلقائياً بعد {MAX_OVERTIME_MINUTES} دقيقة إضافية
          </p>
          <p className="text-xs text-muted">
            عشان لو نسيت الجهاز مفتوح، تقدر تسجل مدة الهدف بس ({t.target} د) أو تصفر التايمر.
          </p>
        </div>
      ) : isOvertime ? (
        <div className="space-y-1">
          <p className="font-semibold text-accent">
            🔔 خلصت الـ {t.target} دقيقة! التايمر مكمّل عدّ وقت إضافي 🔥
          </p>
          <p className="text-xs text-muted">
            إجمالي الجلسة: {totalMinutes} دقيقة · لو نسيت التايمر شغال تقدر تسجّل وقت الهدف بس ({t.target} د) أو تصفره.
          </p>
        </div>
      ) : running ? (
        <p className="text-xs text-muted">جلسة تركيز شغالة... الموبايل في جيبك وهيجيلك إشعار أول ما الـ {t.target} دقيقة تخلص 🎯</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {running ? (
          <button className="btn-ghost flex-1 min-w-[120px]" onClick={pause}>
            إيقاف مؤقت
          </button>
        ) : (
          <button className="btn-primary flex-1 min-w-[120px]" onClick={resume}>
            {elapsedMs > 0 ? "كمّل" : "ابدأ جلسة تركيز"}
          </button>
        )}

        {isOvertime ? (
          <>
            <button
              className="btn-ghost flex-1 min-w-[130px] text-xs font-semibold"
              title={`تسجيل ${t.target} دقيقة فقط وتجاهل الوقت الإضافي`}
              onClick={() => finish(t.target)}
            >
              سجّل الـ {t.target} د بس
            </button>
            <button
              className="btn-primary flex-1 min-w-[130px] text-xs font-semibold"
              onClick={() => finish(totalMinutes)}
            >
              سجّل الإجمالي ({totalMinutes} د)
            </button>
          </>
        ) : elapsedMs >= 60_000 ? (
          <button className="btn-ghost flex-1 min-w-[120px]" onClick={() => finish(totalMinutes)}>
            سجّل الجلسة ({totalMinutes} د)
          </button>
        ) : null}
      </div>

      {(running || elapsedMs > 0) && (
        <div className="pt-1">
          <button
            type="button"
            className="text-xs text-muted hover:text-warn transition-colors underline decoration-dotted cursor-pointer"
            onClick={reset}
          >
            ✕ إلغاء وتصفير التايمر (بدون تسجيل)
          </button>
        </div>
      )}

      {!running && elapsedMs === 0 && (
        <p className="text-xs text-muted">الموبايل بعيد، الـ AI مقفول، تاب واحد بس للكورس.</p>
      )}
    </section>
  );
}
