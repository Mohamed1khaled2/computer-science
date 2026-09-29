"use client";

import Link from "next/link";
import { useState } from "react";
import { courseById, phaseOf } from "@/lib/roadmap";
import {
  currentCourseId,
  daysBetween,
  minutesFor,
  streak,
  studiedDays,
  today,
  useStore,
  weekMinutes,
} from "@/lib/store";
import FocusTimer from "@/components/FocusTimer";
import LogForm from "@/components/LogForm";

export default function TodayPage() {
  const { state, ready } = useStore();
  const [logMinutes, setLogMinutes] = useState<number | null>(null);

  if (!ready) return <p className="text-muted">...</p>;

  const now = today(); // ready = إحنا على المتصفح، فمفيش hydration mismatch

  const cid = currentCourseId(state);
  const course = cid ? courseById(cid) : undefined;
  const phase = cid ? phaseOf(cid) : undefined;
  const last = state.sessions.at(-1);
  const gap = last ? daysBetween(last.date, now) : null;
  const studiedToday = gap === 0;
  const weekH = weekMinutes(state) / 60;
  const totalH = state.sessions.reduce((a, s) => a + s.minutes, 0) / 60;
  const spent = cid ? minutesFor(state, cid) / 60 : 0;
  const days = studiedDays(state);

  return (
    <div className="space-y-4">
      {gap !== null && gap >= 2 && (
        <section className="card border-warn/40 bg-warn-soft">
          <h2 className="font-bold text-warn">رجعت بعد {gap} يوم؟ تمام جدًا.</h2>
          <p className="mt-1 text-sm leading-7">
            متبدأش من الأول ومتغيّرش الخطة. النهارده بس: 10 دقايق تقرا ملاحظة آخر جلسة، وبعدين تعمل الخطوة الجاية. ده
            كل المطلوب.
          </p>
          {last?.note && <p className="mt-2 rounded-lg bg-card p-2 text-sm">آخر ملاحظة: {last.note}</p>}
        </section>
      )}

      {!state.sessions.length && (
        <section className="card bg-accent-soft">
          <h2 className="font-bold">أهلاً يا مادا 👋</h2>
          <p className="mt-1 text-sm leading-7">
            الخطة كلها قاعدة واحدة: <b>كل يوم خطوة صغيرة، حتى لو 20 دقيقة</b>. ابدأ دلوقتي بأول جلسة. شوف{" "}
            <Link href="/roadmap" className="text-accent underline">
              الخطة
            </Link>{" "}
            و{" "}
            <Link href="/help" className="text-accent underline">
              قواعد الـ AI
            </Link>
            .
          </p>
        </section>
      )}

      <section className="grid grid-cols-3 gap-2 text-center">
        <Stat label="أيام متتالية" value={streak(state)} />
        <Stat label="الأسبوع ده" value={`${weekH.toFixed(1)}/${state.weeklyHours}س`} />
        <Stat label="إجمالي" value={`${Math.floor(totalH)}س`} />
      </section>

      <section className="card">
        <div className="flex justify-between text-xs text-muted">
          <span>آخر 14 يوم</span>
          <span>{studiedToday ? "ذاكرت النهارده ✓" : "لسه النهارده"}</span>
        </div>
        <div className="mt-2 flex flex-row-reverse justify-between gap-1">
          {Array.from({ length: 14 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const on = days.has(today(d));
            return <span key={i} className={`h-6 flex-1 rounded ${on ? "bg-accent" : "bg-line"}`} />;
          })}
        </div>
      </section>

      {course && phase ? (
        <section className="card space-y-2">
          <p className="text-xs text-muted">{phase.title}</p>
          <a href={course.url} target="_blank" rel="noreferrer" className="block font-bold text-accent" dir="ltr">
            {course.name} ↗
          </a>
          <div className="h-2 overflow-hidden rounded-full bg-line">
            <div className="h-full bg-accent" style={{ width: `${Math.min(100, (spent / course.hours) * 100)}%` }} />
          </div>
          <p className="text-xs text-muted">
            {spent.toFixed(1)} من ~{course.hours} ساعة (تقديري)
          </p>
          {course.note && <p className="text-sm leading-7">{course.note}</p>}
          <div className="rounded-xl bg-accent-soft p-3">
            <p className="text-xs text-muted">الخطوة الجاية</p>
            <p className="font-semibold">{state.nextStep || "افتح أول محاضرة/فصل في الكورس."}</p>
          </div>
        </section>
      ) : (
        <section className="card">خلّصت كل الخطة. 🎓</section>
      )}

      {logMinutes === null ? (
        <FocusTimer onDone={(m) => setLogMinutes(m)} />
      ) : (
        <LogForm initialMinutes={logMinutes} defaultCourseId={cid} onClose={() => setLogMinutes(null)} />
      )}

      {logMinutes === null && (
        <button className="btn-ghost w-full" onClick={() => setLogMinutes(30)}>
          سجّل جلسة من غير تايمر
        </button>
      )}
    </div>
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
