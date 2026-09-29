"use client";

import { useEffect, useState, useCallback } from "react";
import { useStore } from "@/lib/store";
import { api } from "@/lib/client";

// التايمر بيتحفظ في localStorage عشان لو قفلت الشاشة على الموبايل يفضل شغال.
const KEY = "mada-cs-timer";
type Timer = {
  target: number;
  startedAt: number | null;
  elapsed: number;
  timerId?: string;
  chimed?: boolean;
};
const PRESETS = [10, 25, 50];

function read(): Timer {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { target: 25, startedAt: null, elapsed: 0, chimed: false };
}

function write(t: Timer) {
  try {
    localStorage.setItem(KEY, JSON.stringify(t));
  } catch {}
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

  const elapsedMs = t.elapsed + (t.startedAt ? Math.max(0, now - t.startedAt) : 0);
  const targetMs = t.target * 60_000;
  const isOvertime = elapsedMs >= targetMs;
  const running = t.startedAt !== null;
  const totalMinutes = Math.max(1, Math.round(elapsedMs / 60_000));

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

  const finish = () => {
    if (syncKey) {
      api("/api/timer", syncKey, { method: "POST", body: JSON.stringify({ action: "cancel" }) }).catch(() => {});
    }
    set({ target: t.target, startedAt: null, elapsed: 0, chimed: false, timerId: undefined });
    onDone(totalMinutes);
  };

  const pause = () => {
    if (syncKey) {
      api("/api/timer", syncKey, { method: "POST", body: JSON.stringify({ action: "cancel" }) }).catch(() => {});
    }
    set({ ...t, startedAt: null, elapsed: elapsedMs, timerId: undefined });
  };

  const resume = () => {
    const id = crypto.randomUUID();
    const delay = Math.max(1000, targetMs - elapsedMs);
    if (syncKey && delay > 1000) {
      api("/api/timer", syncKey, {
        method: "POST",
        body: JSON.stringify({ action: "start", timerId: id, minutes: t.target, delayMs: delay }),
      }).catch(() => {});
    }
    set({ ...t, startedAt: Date.now(), timerId: id });
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

      {isOvertime ? (
        <div className="space-y-1">
          <p className="font-semibold text-accent">
            🔔 خلصت الـ {t.target} دقيقة! التايمر مكمّل عدّ وقت إضافي 🔥
          </p>
          <p className="text-xs text-muted">
            إجمالي وقت الجلسة: {totalMinutes} دقيقة · كمّل مذاكرة براحتك أو سجّل الجلسة لما تخلص.
          </p>
        </div>
      ) : running ? (
        <p className="text-xs text-muted">جلسة تركيز شغالة... الموبايل في جيبك وهيجيلك إشعار أول ما الـ {t.target} دقيقة تخلص 🎯</p>
      ) : null}

      <div className="flex gap-2">
        {running ? (
          <button className="btn-ghost flex-1" onClick={pause}>
            إيقاف مؤقت
          </button>
        ) : (
          <button className="btn-primary flex-1" onClick={resume}>
            {elapsedMs > 0 ? "كمّل" : "ابدأ جلسة تركيز"}
          </button>
        )}

        {elapsedMs >= 60_000 && (
          <button className={isOvertime ? "btn-primary flex-1" : "btn-ghost flex-1"} onClick={finish}>
            سجّل الجلسة ({totalMinutes} د)
          </button>
        )}
      </div>

      {!running && elapsedMs === 0 && (
        <p className="text-xs text-muted">الموبايل بعيد، الـ AI مقفول، تاب واحد بس للكورس.</p>
      )}
    </section>
  );
}
