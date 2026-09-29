"use client";

import Link from "next/link";
import { PHASES } from "@/lib/roadmap";
import { type CourseStatus, useStore } from "@/lib/store";
import {
  courseProgress,
  currentPhaseIndex,
  etaDate,
  fmtDate,
  overallProgress,
  phaseProgress,
  schedule,
} from "@/lib/journey";
import Icon from "@/components/Icon";
import { Bar, PageHeader, Stat, STATUS_LABEL, STATUS_STYLE } from "@/components/ui";

export default function RoadmapPage() {
  const { state, ready } = useStore();
  if (!ready) return <p className="text-muted">...</p>;

  const current = currentPhaseIndex(state);
  const sch = schedule(state);
  const overall = overallProgress(state);
  const courses = PHASES.flatMap((p) => p.courses);
  const coursesDone = courses.filter((c) => courseProgress(state, c.id).pct >= 1).length;

  // تاريخ متوقع لنهاية كل مرحلة لو فضلت ماشي بنفس عدد الساعات في الأسبوع
  const left = PHASES.map((p) => phaseProgress(state, p).hoursLeft);
  const eta = left.map((_, i) =>
    etaDate(
      state,
      left.slice(0, i + 1).reduce((a, b) => a + b, 0),
    ),
  );

  return (
    <div>
      <PageHeader
        title="الرحلة"
        sub={
          <>
            منهج OSSU متعدّل لمطوّر شغّال: اللي بيفرق في الشغل والإنترفيوهات الأول. التواريخ محسوبة على{" "}
            <b className="text-text">{state.weeklyHours} ساعة/أسبوع</b>.
          </>
        }
      />

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="التقدم الكلي" value={`${Math.round(overall.pct * 100)}%`} sub={<Bar pct={overall.pct} />} />
        <Stat label="كورسات خلصت" value={`${coursesDone}/${courses.length}`} />
        <Stat label="ساعات فاضلة" value={Math.round(overall.hoursLeft)} sub="تقديري" />
        <Stat label="التخرج المتوقع" value={<span className="text-lg">{eta.at(-1)}</span>} sub="لو كمّلت بنفس المعدل" />
      </div>

      <ol className="relative space-y-6">
        <span className="absolute inset-y-4 start-[19px] w-0.5 bg-line" aria-hidden />
        {PHASES.map((p, i) => {
          const pp = phaseProgress(state, p);
          const done = pp.pct >= 1;
          const here = i === current;
          return (
            <li key={p.id} id={p.id} className="relative scroll-mt-24 ps-14">
              <span
                className={`absolute start-0 top-3 grid size-10 place-items-center rounded-full border-4 border-bg text-sm font-extrabold ${
                  done ? "bg-accent text-bg" : here ? "bg-accent text-bg ring-4 ring-accent/25" : "bg-line text-muted"
                }`}
              >
                {done ? <Icon name="check" /> : i}
              </span>
              <section
                className={`card space-y-4 md:p-6 ${here ? "border-accent/50" : ""} ${!done && !here ? "opacity-90" : ""}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    {here && (
                      <span className="mb-1 inline-block rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-bg">
                        انت هنا
                      </span>
                    )}
                    <h2 className="text-lg font-extrabold">{p.title}</h2>
                  </div>
                  <span className="text-xs text-muted">{done ? "خلصت ✓" : `هتخلص تقريبًا ${eta[i]}`}</span>
                </div>
                <p className="text-sm leading-7">{p.why}</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Bar pct={pp.pct} />
                  </div>
                  <span className="text-xs tabular-nums text-muted">{Math.round(pp.pct * 100)}%</span>
                </div>

                <ul className="grid gap-2 sm:grid-cols-2">
                  {p.courses.map((c) => {
                    const cp = courseProgress(state, c.id);
                    const s: CourseStatus = state.statuses[c.id] ?? (cp.pct >= 1 ? "done" : cp.done ? "doing" : "todo");
                    return (
                      <li key={c.id}>
                        <Link
                          href={`/course/${c.id}`}
                          className="block h-full space-y-2 rounded-xl border border-line p-3 transition hover:border-accent/50 hover:bg-bg"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-sm font-semibold leading-6" dir="ltr">
                              {c.name}
                            </span>
                            <span
                              className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[s]}`}
                            >
                              {STATUS_LABEL[s]}
                            </span>
                          </div>
                          <Bar pct={cp.pct} />
                          <p className="text-xs text-muted">
                            {cp.done}/{cp.total} مهمة · ~{c.hours} ساعة ≈{" "}
                            {Math.max(1, Math.round(c.hours / Math.max(1, state.weeklyHours)))} أسبوع
                            {c.extra ? " · إضافي" : ""}
                          </p>
                          {sch.get(c.id) && (
                            <p className="text-xs text-muted">
                              تخلص تقريبًا {etaDate(state, sch.get(c.id)!.hoursBefore + sch.get(c.id)!.hoursLeft)}
                              {state.deadlines[c.id] && (
                                <span className="ms-1 rounded bg-gold-soft px-1.5 text-gold">
                                  موعدك: {fmtDate(state.deadlines[c.id])}
                                </span>
                              )}
                            </p>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>

                <p className="rounded-xl bg-gold-soft p-3 text-sm leading-7">
                  <b className="text-gold">مشروع المرحلة (للـ CV):</b> {p.proof}
                </p>
              </section>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
