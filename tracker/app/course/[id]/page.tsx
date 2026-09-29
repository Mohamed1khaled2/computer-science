"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { courseById, phaseOf } from "@/lib/roadmap";
import { tasksOf } from "@/lib/tasks";
import { type CourseStatus, upcomingTasks, useStore } from "@/lib/store";
import { courseProgress, courseScore, credits, letter, studiedMinutes } from "@/lib/journey";
import Icon from "@/components/Icon";
import CourseTime from "@/components/CourseTime";
import { BackLink, Bar, Stat, STATUS_LABEL, STATUS_STYLE } from "@/components/ui";

const STATUSES: CourseStatus[] = ["todo", "doing", "done", "skipped"];
const PROOF = { ai: "امتحان", self: "تقييم ذاتي", forced: "من غير إثبات" } as const;

export default function CoursePage() {
  const { id } = useParams<{ id: string }>();
  const { state, ready, update } = useStore();
  if (!ready) return <p className="text-muted">...</p>;

  const course = courseById(id);
  if (!course) {
    return (
      <div className="card space-y-2">
        <p>الكورس ده مش في الخطة.</p>
        <Link href="/roadmap" className="text-accent underline">
          ارجع للرحلة
        </Link>
      </div>
    );
  }

  const phase = phaseOf(course.id)!;
  const tasks = tasksOf(course.id);
  const cp = courseProgress(state, course.id);
  const score = courseScore(state, course.id);
  const minutes = studiedMinutes(state, course.id);
  const nextId = upcomingTasks(state, 1)[0]?.id;
  const status: CourseStatus = state.statuses[course.id] ?? (cp.pct >= 1 ? "done" : cp.done ? "doing" : "todo");
  const courseNotes = state.notes.filter((n) => n.courseId === course.id);
  const notes = state.sessions.filter((s) => s.courseId === course.id && s.note).reverse();

  return (
    <div>
      <BackLink href={`/roadmap#${phase.id}`} label="الرحلة" />

      <section className="card mb-5 space-y-4 md:p-6">
        <div>
          <p className="eyebrow">{phase.title}</p>
          <h1 className="mt-1 text-xl font-extrabold leading-8 md:text-2xl" dir="ltr">
            <span className="block text-left">{course.name}</span>
          </h1>
          {course.note && <p className="mt-2 text-sm leading-7 text-muted">{course.note}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a href={course.url} target="_blank" rel="noreferrer" className="btn-primary">
            صفحة الكورس الأصلية <Icon name="external" className="size-4" />
          </a>
          <div className="flex flex-wrap gap-1" role="group" aria-label="حالة الكورس">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => update((st) => ({ ...st, statuses: { ...st.statuses, [course.id]: s } }))}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
                  s === status ? STATUS_STYLE[s] : "border-line text-muted"
                }`}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="التقدم" value={`${Math.round(cp.pct * 100)}%`} sub={<Bar pct={cp.pct} />} />
        <Stat label="المهام" value={`${cp.done}/${cp.total}`} sub={`${credits(course)} ساعات معتمدة`} />
        <Stat label="وقت المذاكرة" value={`${(minutes / 60).toFixed(1)}س`} sub={`من ~${course.hours}س متوقعة`} />
        <Stat
          label="التقدير"
          value={score === null ? "—" : letter(score).letter}
          sub={score === null ? "بعد أول امتحان" : `متوسط ${score.toFixed(1)}/10`}
        />
      </div>

      <CourseTime course={course} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="card md:p-6">
          <h2 className="mb-3 text-lg font-extrabold">المنهج</h2>
          <ol className="divide-y divide-line">
            {tasks.map((t, i) => {
              const p = state.tasks[t.id];
              const done = !!p?.doneAt;
              const isNext = t.id === nextId;
              return (
                <li key={t.id}>
                  <details className="group py-3" open={isNext}>
                    <summary className="flex cursor-pointer list-none items-center gap-3">
                      <span
                        className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold ${
                          done
                            ? "bg-accent text-bg"
                            : isNext
                              ? "bg-accent-soft text-accent ring-2 ring-accent/40"
                              : "bg-bg text-muted"
                        }`}
                      >
                        {done ? <Icon name="check" className="size-4" /> : i + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold leading-6" dir="auto">
                          {t.title}
                        </span>
                        <span className="block text-xs text-muted">
                          ~{Math.round(t.minutes / 60)} ساعة{t.code ? " · كود + GitHub" : ""}
                          {isNext ? " · عليها الدور" : ""}
                        </span>
                      </span>
                      {done && p?.proof && (
                        <span
                          className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold ${
                            p.proof === "forced" ? "bg-warn-soft text-warn" : "bg-accent-soft text-accent"
                          }`}
                        >
                          {p.proof === "ai" && p.score !== undefined ? `${p.score}/10` : PROOF[p.proof]}
                        </span>
                      )}
                    </summary>
                    <div className="mt-3 space-y-3 ps-11 text-sm leading-7">
                      <a
                        href={t.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-accent"
                      >
                        افتح الدرس <Icon name="external" className="size-3.5" />
                      </a>
                      <ol className="list-decimal space-y-1 ps-5 text-muted">
                        {t.how.map((h) => (
                          <li key={h}>{h}</li>
                        ))}
                      </ol>
                      <div className="space-y-2">
                        <p className="font-semibold">أسئلة الإثبات:</p>
                        {t.check.map((q, qi) => (
                          <div key={q} className="rounded-xl bg-bg p-3">
                            <p className="font-semibold">{q}</p>
                            {done && p?.answers[qi] && (
                              <p className="mt-1 whitespace-pre-wrap text-muted">{p.answers[qi]}</p>
                            )}
                          </div>
                        ))}
                      </div>
                      {done && p?.feedback && (
                        <p className="rounded-xl bg-accent-soft p-3">
                          <b>رأي الممتحن:</b> {p.feedback}
                        </p>
                      )}
                      {p?.link && (
                        <a
                          href={p.link}
                          target="_blank"
                          rel="noreferrer"
                          className="block truncate text-accent underline"
                          dir="ltr"
                        >
                          {p.link}
                        </a>
                      )}
                      {isNext && (
                        <Link href="/" className="btn-primary">
                          ابدأها من صفحة النهارده
                        </Link>
                      )}
                    </div>
                  </details>
                </li>
              );
            })}
          </ol>
        </section>

        <aside className="space-y-4">
          <section className="rounded-2xl bg-gold-soft p-4 text-sm leading-7">
            <p className="font-bold text-gold">مشروع المرحلة (للـ CV)</p>
            <p className="mt-1">{phase.proof}</p>
          </section>

          <Link href="/mentor" className="card flex items-center gap-3 transition hover:border-accent/50">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
              <Icon name="chat" />
            </span>
            <span className="text-sm leading-6">
              <b className="block">اتزنقت في حاجة هنا؟</b>
              <span className="text-muted">اسأل المشرف — بيديك تلميح مش حل.</span>
            </span>
          </Link>

          <section className="card space-y-2">
            <div className="flex items-baseline justify-between">
              <h2 className="font-bold">ملاحظاتك</h2>
              <Link href="/notes" className="text-xs font-semibold text-accent">
                كل الملاحظات
              </Link>
            </div>
            {courseNotes.length ? (
              <ul className="space-y-1">
                {courseNotes.map((n) => (
                  <li key={n.id}>
                    <Link
                      href={`/notes#${n.id}`}
                      className="flex items-center gap-2 text-sm hover:text-accent"
                      dir="auto"
                    >
                      <Icon name="pen" className="size-4 shrink-0 text-muted" />
                      <span className="truncate">{n.title || "بدون عنوان"}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">مفيش ملاحظات مربوطة بالكورس ده لسه.</p>
            )}
          </section>

          <section className="card space-y-3">
            <h2 className="font-bold">سجل جلساتك في الكورس</h2>
            {notes.length ? (
              <ul className="max-h-[28rem] space-y-3 overflow-y-auto">
                {notes.map((s) => (
                  <li key={s.id} className="border-t border-line pt-2 first:border-0 first:pt-0">
                    <p className="text-xs text-muted">
                      {new Date(s.date).toLocaleDateString("ar-EG", { day: "numeric", month: "short" })} · {s.minutes} د
                    </p>
                    <p className="text-sm leading-7">{s.note}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">ملاحظات الجلسات بتاعة الكورس ده هتتجمع هنا.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
