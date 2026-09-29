"use client";

import { PHASES } from "@/lib/roadmap";
import { type CourseStatus, minutesFor, useStore } from "@/lib/store";

const NEXT: Record<CourseStatus, CourseStatus> = { todo: "doing", doing: "done", done: "skipped", skipped: "todo" };
const LABEL: Record<CourseStatus, string> = { todo: "لسه", doing: "شغال", done: "خلص ✓", skipped: "متخطّى" };
const STYLE: Record<CourseStatus, string> = {
  todo: "text-muted border-line",
  doing: "text-warn border-warn/50 bg-warn-soft",
  done: "text-accent border-accent/50 bg-accent-soft",
  skipped: "text-muted border-line line-through",
};

export default function RoadmapPage() {
  const { state, ready, update } = useStore();
  if (!ready) return <p className="text-muted">...</p>;

  const status = (id: string): CourseStatus => state.statuses[id] ?? "todo";
  const remaining = (id: string, hours: number) => {
    const s = status(id);
    if (s === "done" || s === "skipped") return 0;
    return Math.max(0, hours - minutesFor(state, id) / 60);
  };

  // تاريخ متوقع لنهاية كل مرحلة لو فضلت ماشي بنفس عدد الساعات في الأسبوع
  const eta: { date: string }[] = [];
  let cumulative = 0;
  for (const p of PHASES) {
    cumulative += p.courses.reduce((a, c) => a + remaining(c.id, c.hours), 0);
    const d = new Date();
    d.setDate(d.getDate() + Math.ceil((cumulative / Math.max(1, state.weeklyHours)) * 7));
    eta.push({ date: d.toLocaleDateString("ar-EG", { month: "long", year: "numeric" }) });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm leading-7 text-muted">
        الترتيب ده متعدّل عن OSSU الرسمي عشان يناسب مطوّر شغّال: اللي بيفرق في الشغل الأول. التواريخ محسوبة على{" "}
        <b className="text-text">{state.weeklyHours} ساعة/أسبوع</b> (غيّرها من الإعدادات). دوس على حالة الكورس عشان
        تغيّرها.
      </p>
      {PHASES.map((p, i) => {
        const done = p.courses.every((c) => ["done", "skipped"].includes(status(c.id)));
        return (
          <section key={p.id} className="card space-y-3">
            <div>
              <h2 className="font-bold">{p.title}</h2>
              <p className="text-xs text-muted">
                {done ? "خلصت ✓" : `هتخلص تقريبًا ${eta[i].date}`}
              </p>
            </div>
            <p className="text-sm leading-7">{p.why}</p>
            <ul className="space-y-2">
              {p.courses.map((c) => {
                const s = status(c.id);
                const spent = minutesFor(state, c.id) / 60;
                return (
                  <li key={c.id} className="flex items-center gap-2">
                    <button
                      onClick={() => update((st) => ({ ...st, statuses: { ...st.statuses, [c.id]: NEXT[s] } }))}
                      className={`w-16 shrink-0 rounded-lg border px-1 py-1 text-xs font-semibold ${STYLE[s]}`}
                    >
                      {LABEL[s]}
                    </button>
                    <a href={c.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 text-sm" dir="ltr">
                      <span className="block truncate text-left">{c.name}</span>
                      <span className="block text-left text-xs text-muted">
                        {spent > 0 ? `${spent.toFixed(1)} / ` : ""}~{c.hours}h{c.extra ? " · extra" : ""}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
            <p className="rounded-xl bg-accent-soft p-3 text-sm leading-7">
              <b>الدليل للـ CV:</b> {p.proof}
            </p>
          </section>
        );
      })}
    </div>
  );
}
