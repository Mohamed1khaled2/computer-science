"use client";

import { useState } from "react";
import type { Task } from "@/lib/tasks";
import { addDays, REVIEW_STEPS, today, useStore } from "@/lib/store";

// مراجعة متباعدة: سؤال من درس خلّصته، تجاوب من دماغك، وبعدين تقارن بإجابتك الأصلية
export default function ReviewCard({ task, remaining }: { task: Task; remaining: number }) {
  const { state, update } = useStore();
  const progress = state.tasks[task.id];
  const step = progress?.review?.step ?? 0;
  const qi = step % task.check.length;
  const [answer, setAnswer] = useState("");
  const [shown, setShown] = useState(false);

  const rate = (remembered: boolean) => {
    const nextStep = remembered ? step + 1 : 0;
    const review =
      nextStep < REVIEW_STEPS.length ? { due: addDays(today(), REVIEW_STEPS[nextStep]), step: nextStep } : undefined;
    update((s) => ({ ...s, tasks: { ...s.tasks, [task.id]: { ...s.tasks[task.id], review } } }));
    setAnswer("");
    setShown(false);
  };

  return (
    <section className="card space-y-3 border-accent/40">
      <div className="flex justify-between text-xs">
        <span className="font-semibold text-accent">سخّن الأول: مراجعة</span>
        <span className="text-muted">{remaining} متبقية</span>
      </div>
      <p className="text-xs text-muted" dir="auto">
        {task.title}
      </p>
      <p className="font-semibold leading-7">{task.check[qi]}</p>
      <textarea
        className="input min-h-20"
        placeholder="جاوب من دماغك قبل ما تشوف..."
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
      />
      {!shown ? (
        <button className="btn-ghost w-full" disabled={answer.trim().length < 10} onClick={() => setShown(true)}>
          قارن بإجابتي الأصلية
        </button>
      ) : (
        <>
          <div className="rounded-xl bg-bg p-3 text-sm leading-7">
            <p className="text-xs text-muted">إجابتك وقت ما خلّصت الدرس:</p>
            <p className="whitespace-pre-wrap">{progress?.answers[qi] || "—"}</p>
          </div>
          <div className="flex gap-2">
            <button className="btn-primary flex-1" onClick={() => rate(true)}>
              كنت فاكر
            </button>
            <button className="btn-ghost flex-1" onClick={() => rate(false)}>
              نسيت
            </button>
          </div>
        </>
      )}
    </section>
  );
}
