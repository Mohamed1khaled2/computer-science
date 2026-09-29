"use client";

import Link from "next/link";
import { deadlineNeed, fmtDate, schedule } from "@/lib/journey";
import type { Course } from "@/lib/roadmap";
import { today, useStore } from "@/lib/store";
import Icon from "./Icon";

// الحد الزمني للكورس: مدته المتوقعة، هتخلص إمتى بمعدلك، وموعد نهائي تحدده انت
export default function CourseTime({ course }: { course: Course }) {
  const { state, update } = useStore();
  const weekly = Math.max(1, state.weeklyHours);
  const sch = schedule(state).get(course.id);
  const deadline = state.deadlines[course.id] ?? "";
  const weeks = course.hours / weekly;
  const need = sch && deadline ? deadlineNeed(sch, deadline) : null;

  const setDeadline = (v: string) =>
    update((s) => {
      const deadlines = { ...s.deadlines };
      if (v) deadlines[course.id] = v;
      else delete deadlines[course.id];
      return { ...s, deadlines };
    });

  return (
    <section className="card mb-6 space-y-4 md:p-6">
      <div className="flex items-center gap-2">
        <Icon name="clock" className="size-5 text-accent" />
        <h2 className="text-lg font-extrabold">الحد الزمني</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Cell
          k="مدة الكورس"
          v={`~${course.hours} ساعة`}
          sub={`= ${weeks < 1 ? "أقل من أسبوع" : `${Math.round(weeks)} أسبوع`} على ${weekly} س/أسبوع${
            weeks >= 5 ? ` (≈ ${(weeks / 4.3).toFixed(1)} شهر)` : ""
          }`}
        />
        {sch ? (
          <>
            <Cell
              k="فاضل منه"
              v={`~${Math.round(sch.hoursLeft)} ساعة`}
              sub={
                sch.hoursBefore > 0 ? `وقبله ${Math.round(sch.hoursBefore)} ساعة في كورسات تانية` : "هو اللي عليه الدور"
              }
            />
            <Cell
              k="هتخلص تقريبًا"
              v={fmtDate(sch.end)}
              sub={sch.hoursBefore > 0 ? `هتبدأه حوالي ${fmtDate(sch.start)}` : "لو فضلت ماشي بنفس المعدل"}
            />
          </>
        ) : (
          <Cell k="الحالة" v="خلص ✓" sub="مفيش وقت فاضل" />
        )}
      </div>

      {sch && (
        <div className="space-y-2 rounded-xl bg-bg p-3">
          <label className="flex flex-wrap items-center gap-2 text-sm font-semibold">
            الموعد النهائي بتاعك:
            <input
              type="date"
              className="input w-auto py-1.5"
              dir="ltr"
              min={today()}
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
            {deadline && (
              <button className="text-xs font-normal text-muted underline" onClick={() => setDeadline("")}>
                شيله
              </button>
            )}
          </label>
          {need ? (
            need.days <= 0 ? (
              <p className="text-sm leading-7 text-warn">
                الموعد عدّى. مش مشكلة — حط موعد جديد واقعي بدل ما تحس إنك متأخر.
              </p>
            ) : need.perWeek <= weekly ? (
              <p className="text-sm leading-7 text-accent">
                ✓ فاضل {need.days} يوم. محتاج ~{need.perWeek.toFixed(1)} س/أسبوع، وخطتك {weekly} — انت ماشي كويس.
              </p>
            ) : (
              <p className="text-sm leading-7 text-warn">
                فاضل {need.days} يوم. عشان تلحق محتاج ~{need.perWeek.toFixed(1)} س/أسبوع، وخطتك {weekly} بس. يا تزوّد
                الساعات من{" "}
                <Link href="/settings" className="underline">
                  الإعدادات
                </Link>
                ، يا تأخّر الموعد لحوالي {fmtDate(sch.end)}.
              </p>
            )
          ) : (
            <p className="text-xs leading-6 text-muted">
              اختياري. لو حطيت تاريخ، هقولك محتاج كام ساعة في الأسبوع عشان تلحقه.
            </p>
          )}
        </div>
      )}

      <p className="text-xs leading-6 text-muted">
        الساعات تقدير OSSU للكورس كله (محاضرات + مذاكرة + واجبات). الكورسات ماشية ورا بعض بالترتيب، فالتاريخ بيحسب
        الكورسات اللي قبله كمان، وبيتغيّر لوحده لما تخلّص مهام أو تغيّر ساعاتك في الأسبوع.
      </p>
    </section>
  );
}

function Cell({ k, v, sub }: { k: string; v: string; sub: string }) {
  return (
    <div className="rounded-xl border border-line p-3">
      <p className="eyebrow">{k}</p>
      <p className="mt-1 font-extrabold">{v}</p>
      <p className="mt-0.5 text-xs leading-5 text-muted">{sub}</p>
    </div>
  );
}
