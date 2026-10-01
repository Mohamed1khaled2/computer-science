"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useStore } from "@/lib/store";
import {
  pauseTimer,
  rawTimer,
  resumeTimer,
  subscribeTimer,
  timerElapsed,
  type Timer,
} from "./FocusTimer";

// شريط ثابت فوق في كل الصفحات طول ما فيه جلسة تركيز (شغالة أو متوقفة مؤقتاً).
// بيستخبى على "/" لما كارت التايمر نفسه ظاهر على الشاشة.
export default function TimerBar() {
  const { syncKey } = useStore();
  const path = usePathname();
  const raw = useSyncExternalStore(subscribeTimer, rawTimer, () => null);
  const t: Timer | null = raw ? safeParse(raw) : null;
  const running = !!t?.startedAt;
  const active = !!t && (running || t.elapsed > 0);

  const [now, setNow] = useState(() => Date.now());
  const [cardVisible, setCardVisible] = useState(false);

  useEffect(() => {
    if (!active) return;
    const tick = () => {
      setNow(Date.now());
      const el = document.getElementById("timer");
      if (!el) return setCardVisible(false);
      const r = el.getBoundingClientRect();
      setCardVisible(r.bottom > 80 && r.top < window.innerHeight - 80);
    };
    tick();
    const id = setInterval(tick, running ? 1000 : 3000);
    window.addEventListener("scroll", tick, { passive: true });
    return () => {
      clearInterval(id);
      window.removeEventListener("scroll", tick);
    };
  }, [active, running, path]);

  if (!t || !active) return null;

  const targetMs = t.target * 60_000;
  const elapsed = timerElapsed(t, now);
  const over = elapsed >= targetMs;
  const shown = over ? elapsed - targetMs : targetMs - elapsed;
  const mm = String(Math.floor(shown / 60_000)).padStart(2, "0");
  const ss = String(Math.floor((shown % 60_000) / 1000)).padStart(2, "0");
  const pct = Math.min(100, (elapsed / targetMs) * 100);
  const hidden = path === "/" && cardVisible;

  return (
    <div
      className={`grid transition-[grid-template-rows,opacity] duration-300 ${
        hidden ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
      }`}
      aria-hidden={hidden}
    >
      <div className="overflow-hidden">
        <div className="relative border-b border-line bg-card/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2 md:px-8">
            <span className="relative flex size-2.5 shrink-0">
              {running && (
                <span
                  className={`absolute inline-flex size-full animate-ping rounded-full opacity-60 ${over ? "bg-warn" : "bg-accent"}`}
                />
              )}
              <span
                className={`relative inline-flex size-2.5 rounded-full ${
                  !running ? "bg-muted/50" : over ? "bg-warn" : "bg-accent"
                }`}
              />
            </span>

            <Link href="/#timer" className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-xs font-semibold">
                {!running
                  ? "الجلسة متوقفة مؤقتاً"
                  : over
                    ? "خلصت الهدف 🔥 وقت إضافي"
                    : "جلسة تركيز شغالة"}
              </p>
              <p className="text-[11px] text-muted">
                الهدف {t.target} د · {Math.floor(elapsed / 60_000)} د لحد دلوقتي
              </p>
            </Link>

            <span
              dir="ltr"
              className={`font-mono text-2xl font-bold tabular-nums ${
                !running ? "text-muted" : over ? "text-warn" : "text-accent"
              }`}
            >
              {over ? "+" : ""}
              {mm}:{ss}
            </span>

            <button
              type="button"
              onClick={() =>
                running ? pauseTimer(syncKey) : resumeTimer(syncKey)
              }
              aria-label={running ? "إيقاف مؤقت" : "كمّل"}
              className="grid size-9 shrink-0 place-items-center rounded-full border border-line bg-bg text-text transition hover:border-accent hover:text-accent"
            >
              {running ? (
                <svg
                  viewBox="0 0 24 24"
                  className="size-4"
                  fill="currentColor"
                  aria-hidden
                >
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  className="size-4"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
                </svg>
              )}
            </button>

            <Link
              href="/#timer"
              className="hidden shrink-0 rounded-full bg-accent px-3 py-1.5 text-xs font-bold text-bg sm:block"
            >
              {elapsed >= 60_000 ? "سجّل" : "افتح"}
            </Link>
          </div>

          {/* شريط التقدم */}
          <div className="absolute inset-x-0 bottom-0 h-[3px] bg-line/50">
            <div
              className={`h-full transition-[width] duration-1000 ease-linear ${over ? "bg-warn" : "bg-accent"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function safeParse(raw: string): Timer | null {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
