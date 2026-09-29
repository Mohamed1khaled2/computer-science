"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  daysBetween,
  dueReviews,
  isDone,
  lastBrokenPromise,
  nextPromise,
  promiseRate,
  streak,
  today,
  upcomingTasks,
  useStore,
  weekMinutes,
} from "@/lib/store";
import { courseProgress, currentPhaseIndex, overallProgress, phaseProgress, studiedMinutes } from "@/lib/journey";
import { ALL_COURSES, courseById, PHASES } from "@/lib/roadmap";
import FocusTimer, { startTimer, timerRunning } from "@/components/FocusTimer";
import StartCard from "@/components/StartCard";
import LogForm from "@/components/LogForm";
import TaskCard from "@/components/TaskCard";
import ReviewCard from "@/components/ReviewCard";
import MentorNote from "@/components/MentorNote";
import Heatmap from "@/components/Heatmap";
import TodayClasses from "@/components/TodayClasses";
import Icon from "@/components/Icon";
import { Bar, JourneyTrack, Stat } from "@/components/ui";
import ReturnPicker, { formatWhen, PromiseResult, useSetPromise } from "@/components/ReturnPicker";

function greeting(h: number) {
  if (h < 5) return "سهران يا مادا؟";
  if (h < 12) return "صباح الخير يا مادا";
  if (h < 17) return "أهلاً يا مادا";
  return "مساء الخير يا مادا";
}

export default function TodayPage() {
  const { state, ready } = useStore();
  const [logMinutes, setLogMinutes] = useState<number | null>(null);
  const [timerKey, setTimerKey] = useState(0); // remount للتايمر لما يتشغّل من StartCard
  const [, refresh] = useState(0); // التايمر بدأ/اتصفّر → StartCard يختفي/يظهر
  const [tiredFromPush, setTiredFromPush] = useState(false);

  // أزرار الإشعار بتفتح /#start (ابدأ 10 دقايق) أو /#tired (وضع التعب)، والضغط على الإشعار نفسه /#go
  useEffect(() => {
    if (!ready) return;
    const handle = () => {
      const h = window.location.hash;
      if (h !== "#start" && h !== "#tired" && h !== "#go") return;
      history.replaceState(null, "", "/");
      // #go: الضغط على الإشعار (الوحيد على iPhone) → كارت "ابدأ 10 دقايق"
      if (h === "#go") {
        setTimeout(() => document.getElementById("start")?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
        return;
      }
      if (h === "#tired") return setTiredFromPush(true);
      if (!timerRunning()) startTimer(10);
      setTimerKey((k) => k + 1);
      setTimeout(() => document.getElementById("timer")?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
    };
    handle();
    // فتحت التطبيق = شفت التنبيه → امسح الرقم الأحمر من على الأيقونة
    if ("clearAppBadge" in navigator) navigator.clearAppBadge().catch(() => {});
    window.addEventListener("hashchange", handle);
    return () => window.removeEventListener("hashchange", handle);
  }, [ready]);

  if (!ready) return <p className="text-muted">...</p>;

  const now = today(); // ready = إحنا على المتصفح، فمفيش hydration mismatch
  const upcoming = upcomingTasks(state, 5);
  const [current, ...next] = upcoming;
  const reviews = dueReviews(state);
  const last = state.sessions.at(-1);
  const gap = last ? daysBetween(last.date, now) : null;
  const promise = nextPromise(state);
  const broken = lastBrokenPromise(state);
  const rate = promiseRate(state);
  const phaseIdx = currentPhaseIndex(state);
  const phase = PHASES[phaseIdx];
  const phasePct = phase ? phaseProgress(state, phase).pct : 1;
  const overall = overallProgress(state);
  const course = current ? courseById(current.courseId) : undefined;
  const cp = course ? courseProgress(state, course.id) : null;
  const week = weekMinutes(state) / 60;
  const st = streak(state);
  // كورس خلص ولسه ما اتنشرش عنه بوست
  const toShare = ALL_COURSES.find(
    (c) => state.statuses[c.id] !== "skipped" && !state.posts[c.id]?.postedAt && courseProgress(state, c.id).pct >= 1,
  );

  return (
    <div className="space-y-5">
      {/* الهيرو: انت فين في الرحلة */}
      <section className="hero">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-white/75">
              {new Date().toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <h1 className="mt-1 text-2xl font-extrabold md:text-3xl">{greeting(new Date().getHours())}</h1>
            {phase && (
              <p className="mt-2 text-sm leading-7 text-white/85">
                {phase.title}
                {course && (
                  <>
                    {" · "}
                    <span dir="ltr">{course.name.split("(")[0].trim()}</span>
                  </>
                )}
              </p>
            )}
          </div>
          <div className="flex gap-3 text-center">
            <div className="rounded-2xl bg-white/10 px-4 py-2.5">
              <div className="flex items-center justify-center gap-1 text-2xl font-extrabold tabular-nums">
                <Icon name="flame" className="size-5" />
                {st}
              </div>
              <div className="text-xs text-white/75">يوم متتالي</div>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-2.5">
              <div className="text-2xl font-extrabold tabular-nums">{Math.round(overall.pct * 100)}%</div>
              <div className="text-xs text-white/75">من الخطة</div>
            </div>
          </div>
        </div>
        <div className="mt-5">
          <JourneyTrack current={phaseIdx} phasePct={phasePct} onHero />
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* العمود الأساسي: شغل النهارده */}
        <div className="space-y-4">
          <MentorNote />

          {toShare && (
            <Link
              href={`/course/${toShare.id}#post`}
              className="card flex items-center gap-3 border-gold/40 bg-gold-soft"
            >
              <Icon name="share" className="size-6 shrink-0 text-gold" />
              <span className="text-sm leading-6">
                <b className="block">
                  خلّصت <span dir="ltr">{toShare.name.split("(")[0].trim()}</span> 🎉
                </b>
                اكتب بوست بكلامك عن اللي اتعلمته — الناس محتاجة تعرف إنك ماشي.
              </span>
            </Link>
          )}

          {broken && (
            <section className="card border-warn/40 bg-warn-soft">
              <h2 className="font-bold text-warn">وعدت ترجع {formatWhen(broken.at)} ومرجعتش.</h2>
              <p className="mt-1 text-sm leading-7">
                مش هنلوم بعض. القاعدة: متفوّتش مرتين ورا بعض. ابدأ دلوقتي بـ 20 دقيقة بس وخلاص.
              </p>
            </section>
          )}

          {!broken && gap !== null && gap >= 2 && (
            <section className="card border-warn/40 bg-warn-soft">
              <h2 className="font-bold text-warn">رجعت بعد {gap} يوم؟ تمام جدًا.</h2>
              <p className="mt-1 text-sm leading-7">
                متبدأش من الأول ومتغيّرش الخطة. 10 دقايق تقرا آخر ملاحظة، وبعدين كمّل المهمة اللي تحت.
              </p>
              {last?.note && <p className="mt-2 rounded-lg bg-card p-2 text-sm">آخر ملاحظة: {last.note}</p>}
            </section>
          )}

          {!state.sessions.length && (
            <section className="card bg-accent-soft">
              <h2 className="font-bold">إزاي اليوم بيمشي هنا</h2>
              <ol className="mt-2 list-decimal space-y-1 ps-5 text-sm leading-7">
                <li>مراجعة صغيرة لو فيه سؤال قديم مستحق.</li>
                <li>المهمة اللي تحت: افتح الدرس وذاكر بالتايمر.</li>
                <li>تثبت إنك فهمت بإجابة أسئلة (الممتحن بيصحح).</li>
                <li>تسجّل الجلسة وتحدد هترجع إمتى.</li>
              </ol>
              <p className="mt-2 text-sm">
                شوف{" "}
                <Link href="/help" className="text-accent underline">
                  قواعد الـ AI
                </Link>{" "}
                وفعّل الإشعارات من{" "}
                <Link href="/settings" className="text-accent underline">
                  الإعدادات
                </Link>
                .
              </p>
            </section>
          )}

          {logMinutes === null && !timerRunning() && (
            <StartCard
              key={String(tiredFromPush)}
              task={current}
              tired={tiredFromPush}
              onStart={(m) => {
                startTimer(m);
                setTimerKey((k) => k + 1);
                setTimeout(
                  () => document.getElementById("timer")?.scrollIntoView({ behavior: "smooth", block: "center" }),
                  50,
                );
              }}
            />
          )}

          {reviews[0] && (
            <div id="review">
              <ReviewCard key={reviews[0].id} task={reviews[0]} remaining={reviews.length} />
            </div>
          )}

          {current ? (
            <TaskCard key={current.id} task={current} label="مهمة النهارده" />
          ) : (
            <section className="card">خلّصت كل الخطة. 🎓</section>
          )}

          {logMinutes === null ? (
            <>
              <div id="timer">
                <FocusTimer key={timerKey} onDone={(m) => setLogMinutes(m)} onChange={() => refresh((n) => n + 1)} />
              </div>
              <button className="btn-ghost w-full" onClick={() => setLogMinutes(30)}>
                سجّل جلسة من غير تايمر
              </button>
            </>
          ) : (
            <LogForm initialMinutes={logMinutes} onClose={() => setLogMinutes(null)} />
          )}
        </div>

        {/* العمود الجانبي: الصورة الكبيرة */}
        <aside className="space-y-4">
          <PromiseBox upcomingAt={promise?.at} title={current?.title ?? "المذاكرة"} />

          <TodayClasses />

          <div className="grid grid-cols-2 gap-3">
            <Stat
              label="الأسبوع ده"
              value={
                <>
                  {week.toFixed(1)}
                  <span className="text-sm font-semibold text-muted">/{state.weeklyHours}س</span>
                </>
              }
              sub={<Bar pct={week / state.weeklyHours} />}
            />
            <Stat
              label="وفيت بكلمتك"
              value={rate.total ? `${rate.kept}/${rate.total}` : "—"}
              sub="المواعيد اللي حددتها"
            />
            <Stat
              label="إجمالي"
              value={`${(studiedMinutes(state) / 60).toFixed(1)}س`}
              sub={`${state.sessions.length} جلسة`}
            />
            <Stat
              label="مهام بإثبات"
              value={Object.values(state.tasks).filter((t) => t.doneAt).length}
              sub={`${reviews.length} مراجعة مستحقة`}
            />
          </div>

          {course && cp && (
            <Link href={`/course/${course.id}`} className="card block space-y-2 transition hover:border-accent/50">
              <p className="eyebrow">الكورس الحالي</p>
              <p className="font-bold leading-7" dir="ltr">
                <span className="block text-left">{course.name}</span>
              </p>
              <Bar pct={cp.pct} />
              <div className="flex justify-between text-xs text-muted">
                <span>
                  {cp.done} من {cp.total} مهمة
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-accent">
                  صفحة الكورس <Icon name="arrow" className="size-3.5" />
                </span>
              </div>
            </Link>
          )}

          {next.length > 0 && (
            <section className="card space-y-2">
              <p className="eyebrow">اللي جاي</p>
              <ol className="space-y-2">
                {next.map((t, i) => (
                  <li key={t.id} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-bg text-[11px] text-muted">
                      {i + 2}
                    </span>
                    <a
                      href={t.url}
                      target="_blank"
                      rel="noreferrer"
                      className="min-w-0 leading-6 hover:text-accent"
                      dir="auto"
                    >
                      {t.title}
                    </a>
                  </li>
                ))}
              </ol>
              <p className="text-xs text-muted">لو فاضي دقيقتين قبل النوم: بص على صفحة الدرس الجاي بس، متذاكرش.</p>
            </section>
          )}

          <Heatmap state={state} />

          {last?.note && (
            <section className="card space-y-1">
              <p className="eyebrow">آخر حاجة كتبتها</p>
              <p className="text-sm leading-7">{last.note}</p>
              <p className="text-xs text-muted">
                {daysBetween(last.date, now) === 0 ? "النهارده" : `من ${daysBetween(last.date, now)} يوم`} ·{" "}
                {last.taskId && isDone(state, last.taskId) ? "المهمة اتقفلت ✓" : "لسه شغال عليها"}
              </p>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

function PromiseBox({ upcomingAt, title }: { upcomingAt?: number; title: string }) {
  const setPromise = useSetPromise();
  const [value, setValue] = useState<number | null>(null);
  const [result, setResult] = useState<{ at: number; status: string } | null>(null);

  if (result) return <PromiseResult at={result.at} title={title} status={result.status} />;
  if (upcomingAt) {
    return (
      <section className="card flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
          <Icon name="check" />
        </span>
        <div>
          <p className="eyebrow">معادك الجاي</p>
          <p className="font-bold">{formatWhen(upcomingAt)}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="card space-y-3 border-accent/50">
      <h2 className="font-bold">هتذاكر إمتى الجاية؟</h2>
      <p className="text-sm text-muted">اللي بيحدد معاد بيرجع. حدده دلوقتي.</p>
      <ReturnPicker value={value} onChange={setValue} />
      <button
        className="btn-primary w-full"
        disabled={!value}
        onClick={async () => value && setResult({ at: value, status: await setPromise(value, title) })}
      >
        ثبّت المعاد
      </button>
    </section>
  );
}
