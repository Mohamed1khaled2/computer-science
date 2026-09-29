"use client";

import Link from "next/link";
import { useState } from "react";
import { TASKS, type Task } from "@/lib/tasks";
import { dueReviews, today, useStore } from "@/lib/store";
import Icon from "./Icon";

// أصعب حاجة بعد يوم شغل هي إنك تبدأ. زرار واحد: يفتح الدرس ويشغّل 10 دقايق.
// ولو تعبان: بدائل خفيفة عشان اليوم ميتقفلش بصفر.
export default function StartCard({ task, onStart }: { task?: Task; onStart: (minutes: number) => void }) {
  const { state, update } = useStore();
  const [tired, setTired] = useState(false);
  const doneTasks = TASKS.filter((t) => state.tasks[t.id]?.doneAt);
  const hasNotes = state.notes.some((n) => n.body.trim());

  const quick = () => {
    if (task) window.open(task.url, "_blank", "noreferrer");
    onStart(10);
  };

  // سؤالين قديمين: بنقدّم ميعاد مراجعتهم للنهارده
  const pullReviews = () => {
    if (!dueReviews(state).length) {
      const picks = [...doneTasks].sort(() => Math.random() - 0.5).slice(0, 2);
      update((s) => ({
        ...s,
        tasks: Object.fromEntries(
          Object.entries(s.tasks).map(([id, p]) =>
            picks.some((t) => t.id === id)
              ? [id, { ...p, review: { due: today(), step: p.review?.step ?? 0 } }]
              : [id, p],
          ),
        ),
      }));
    }
    onStart(10);
    setTimeout(() => document.getElementById("review")?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  };

  return (
    <section className="card space-y-3 border-accent/40">
      {!tired ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-extrabold">مش لازم ساعة. ابدأ 10 دقايق.</h2>
              <p className="text-sm text-muted">بيفتح الدرس ويشغّل التايمر. لو كمّلت بعدها — بونص.</p>
            </div>
            <button className="btn-primary px-6 py-3 text-base" onClick={quick}>
              <Icon name="clock" /> ابدأ 10 دقايق
            </button>
          </div>
          <button className="text-sm text-muted underline" onClick={() => setTired(true)}>
            راجع من الشغل مهدود؟
          </button>
        </>
      ) : (
        <>
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="font-extrabold">وضع التعب: اختار حاجة خفيفة</h2>
            <button className="text-xs text-muted underline" onClick={() => setTired(false)}>
              رجوع
            </button>
          </div>
          <p className="text-sm leading-7 text-muted">
            الهدف مش إنك تتقدم النهارده، الهدف إن اليوم ميتقفلش بصفر. أي واحدة من دول بتتحسب جلسة وحضور.
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {doneTasks.length > 0 && (
              <Option title="راجع سؤالين قديمين" sub="من دماغك، 10 دقايق" onClick={pullReviews} />
            )}
            {hasNotes && (
              <Link href="/notes" onClick={() => onStart(10)} className="block">
                <OptionBody title="اقرا ملاحظاتك" sub="بس قراية، ومن غير ضغط" />
              </Link>
            )}
            <Option title="أول 10 دقايق من الدرس" sub="وتقف عادي بعدها" onClick={quick} />
          </div>
          <p className="rounded-xl bg-bg p-3 text-sm leading-7">
            حتى ده كتير؟ نام. يوم واحد مش مشكلة — المهم متفوّتش التاني.
          </p>
        </>
      )}
    </section>
  );
}

function Option({ title, sub, onClick }: { title: string; sub: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-start">
      <OptionBody title={title} sub={sub} />
    </button>
  );
}

function OptionBody({ title, sub }: { title: string; sub: string }) {
  return (
    <span className="block h-full rounded-xl border border-line p-3 transition hover:border-accent/50 hover:bg-bg">
      <b className="block text-sm">{title}</b>
      <span className="text-xs text-muted">{sub}</span>
    </span>
  );
}
