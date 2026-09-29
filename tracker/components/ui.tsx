import Link from "next/link";
import { PHASES } from "@/lib/roadmap";
import type { CourseStatus } from "@/lib/store";
import type { ClassStatus } from "@/lib/attendance";
import Icon from "./Icon";

export const STATUS_LABEL: Record<CourseStatus, string> = {
  todo: "لسه",
  doing: "شغال",
  done: "خلص ✓",
  skipped: "متخطّى",
};
export const STATUS_STYLE: Record<CourseStatus, string> = {
  todo: "text-muted border-line",
  doing: "text-warn border-warn/50 bg-warn-soft",
  done: "text-accent border-accent/50 bg-accent-soft",
  skipped: "text-muted border-line line-through",
};

export const CLASS_STATUS: Record<ClassStatus, { label: string; style: string }> = {
  present: { label: "حاضر ✓", style: "bg-accent-soft text-accent" },
  late: { label: "متأخر", style: "bg-accent-soft text-accent" },
  absent: { label: "غايب ✗", style: "bg-warn-soft text-warn" },
  excused: { label: "بعذر", style: "bg-bg text-muted" },
  open: { label: "دلوقتي", style: "bg-gold-soft text-gold" },
  upcoming: { label: "جاية", style: "bg-bg text-muted" },
};

export function PageHeader({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3 md:mb-7">
      <div>
        <h1 className="text-2xl font-extrabold md:text-3xl">{title}</h1>
        {sub && <p className="mt-1 max-w-2xl text-sm leading-7 text-muted">{sub}</p>}
      </div>
      {children}
    </header>
  );
}

export function Bar({ pct, className = "bg-accent" }: { pct: number; className?: string }) {
  const w = Math.round(Math.min(1, Math.max(0, pct)) * 100);
  return (
    <div className="track" role="progressbar" aria-valuenow={w} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full ${className}`} style={{ width: `${w ? Math.max(w, 2) : 0}%` }} />
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="card p-3.5">
      <div className="eyebrow">{label}</div>
      <div className="mt-1 text-2xl font-extrabold tabular-nums">{value}</div>
      {sub && <div className="mt-1.5 text-xs text-muted">{sub}</div>}
    </div>
  );
}

// شريط المراحل: كل مرحلة شريحة، والحالية عليها "انت هنا"
export function JourneyTrack({ current, phasePct, onHero }: { current: number; phasePct: number; onHero?: boolean }) {
  return (
    <div>
      <div className="flex gap-1.5">
        {PHASES.map((p, i) => {
          const fill = i < current ? 1 : i === current ? phasePct : 0;
          return (
            <Link
              key={p.id}
              href={`/roadmap#${p.id}`}
              title={p.title}
              className={`h-2.5 flex-1 overflow-hidden rounded-full ${onHero ? "bg-white/20" : "bg-line"} ${
                i === current ? (onHero ? "ring-2 ring-white/50" : "ring-2 ring-accent/40") : ""
              }`}
            >
              <span
                className={`block h-full rounded-full ${onHero ? "bg-white" : "bg-accent"}`}
                style={{ width: `${Math.round(fill * 100)}%` }}
              />
            </Link>
          );
        })}
      </div>
      <div className={`mt-1.5 flex gap-1.5 text-[11px] ${onHero ? "text-white/70" : "text-muted"}`}>
        {PHASES.map((p, i) => (
          <span key={p.id} className={`flex-1 text-center ${i === current ? "font-bold" : ""}`}>
            {i === current ? "انت هنا" : i}
          </span>
        ))}
      </div>
    </div>
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-text">
      <Icon name="arrow" className="size-4 rotate-180" />
      {label}
    </Link>
  );
}
