"use client";

import Link from "next/link";
import { useState } from "react";
import {
  daysBetween,
  dueReviews,
  lastBrokenPromise,
  nextPromise,
  promiseRate,
  streak,
  studiedDays,
  today,
  upcomingTasks,
  useStore,
  weekMinutes,
} from "@/lib/store";
import FocusTimer from "@/components/FocusTimer";
import LogForm from "@/components/LogForm";
import TaskCard from "@/components/TaskCard";
import ReviewCard from "@/components/ReviewCard";
import ReturnPicker, { formatWhen, PromiseResult, useSetPromise } from "@/components/ReturnPicker";

export default function TodayPage() {
  const { state, ready } = useStore();
  const [logMinutes, setLogMinutes] = useState<number | null>(null);

  if (!ready) return <p className="text-muted">...</p>;

  const now = today(); // ready = إحنا على المتصفح، فمفيش hydration mismatch
  const [current, tomorrow] = upcomingTasks(state, 2);
  const reviews = dueReviews(state);
  const last = state.sessions.at(-1);
  const gap = last ? daysBetween(last.date, now) : null;
  const upcoming = nextPromise(state);
  const broken = lastBrokenPromise(state);
  const rate = promiseRate(state);
  const days = studiedDays(state);

  return (
    <div className="space-y-4">
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
          <h2 className="font-bold">أهلاً يا مادا 👋</h2>
          <p className="mt-1 text-sm leading-7">
            كل يوم: مراجعة صغيرة ← المهمة اللي تحت ← تثبت إنك فهمت ← تحدد هترجع إمتى. شوف{" "}
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

      <PromiseBox upcomingAt={upcoming?.at} title={current?.title ?? "المذاكرة"} />

      <section className="grid grid-cols-3 gap-2 text-center">
        <Stat label="أيام متتالية" value={streak(state)} />
        <Stat label="الأسبوع ده" value={`${(weekMinutes(state) / 60).toFixed(1)}/${state.weeklyHours}س`} />
        <Stat label="وفيت بكلمتك" value={rate.total ? `${rate.kept}/${rate.total}` : "—"} />
      </section>

      <section className="card">
        <div className="flex justify-between text-xs text-muted">
          <span>آخر 14 يوم</span>
          <span>{gap === 0 ? "ذاكرت النهارده ✓" : "لسه النهارده"}</span>
        </div>
        <div className="mt-2 flex flex-row-reverse justify-between gap-1">
          {Array.from({ length: 14 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return <span key={i} className={`h-6 flex-1 rounded ${days.has(today(d)) ? "bg-accent" : "bg-line"}`} />;
          })}
        </div>
      </section>

      {reviews[0] && <ReviewCard key={reviews[0].id} task={reviews[0]} remaining={reviews.length} />}

      {current ? (
        <TaskCard key={current.id} task={current} label="مهمة النهارده" />
      ) : (
        <section className="card">خلّصت كل الخطة. 🎓</section>
      )}

      {logMinutes === null ? (
        <>
          <FocusTimer onDone={(m) => setLogMinutes(m)} />
          <button className="btn-ghost w-full" onClick={() => setLogMinutes(30)}>
            سجّل جلسة من غير تايمر
          </button>
        </>
      ) : (
        <LogForm initialMinutes={logMinutes} onClose={() => setLogMinutes(null)} />
      )}

      {tomorrow && (
        <section className="card space-y-1">
          <p className="text-xs font-semibold text-muted">اللي بعدها (بكرة غالبًا)</p>
          <a href={tomorrow.url} target="_blank" rel="noreferrer" className="block font-semibold" dir="auto">
            {tomorrow.title} ↗
          </a>
          <p className="text-xs text-muted">لو فاضي دقيقتين قبل النوم: بص على الصفحة بس، متذاكرش.</p>
        </section>
      )}
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
      <p className="rounded-xl border border-line px-3 py-2 text-sm">
        معادك الجاي: <b>{formatWhen(upcomingAt)}</b>
      </p>
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

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card p-3">
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}
