"use client";

import Link from "next/link";
import { useState } from "react";
import { addDays, REVIEW_STEPS, type Term, today, useStore } from "@/lib/store";

// مراجعة كلمة من القاموس: تشوف الكلمة الإنجليزي، تفتكر معناها، وبعدين تكشف
export default function TermReview({ term, remaining }: { term: Term; remaining: number }) {
  const { update } = useStore();
  const [shown, setShown] = useState(false);
  const step = term.review?.step ?? 0;

  const rate = (remembered: boolean) => {
    const nextStep = remembered ? step + 1 : 0;
    const review =
      nextStep < REVIEW_STEPS.length ? { due: addDays(today(), REVIEW_STEPS[nextStep]), step: nextStep } : undefined;
    update((s) => ({
      ...s,
      glossary: s.glossary.map((t) => (t.id === term.id ? { ...t, review, updatedAt: Date.now() } : t)),
    }));
    setShown(false);
  };

  return (
    <section className="card space-y-3 border-accent/40">
      <div className="flex justify-between text-xs">
        <span className="font-semibold text-accent">كلمة من القاموس</span>
        <Link href="/glossary" className="text-muted">
          {remaining} متبقية
        </Link>
      </div>
      <p className="text-center text-xl font-extrabold" dir="ltr">
        {term.en}
      </p>
      {!shown ? (
        <button className="btn-ghost w-full" onClick={() => setShown(true)}>
          فكّر في معناها... وبعدين اكشف
        </button>
      ) : (
        <>
          <div className="rounded-xl bg-bg p-3 text-sm leading-7">
            <p className="font-semibold">{term.ar}</p>
            {term.example && (
              <p className="mt-1 text-muted" dir="auto">
                {term.example}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button className="btn-primary flex-1" onClick={() => rate(true)}>
              كنت عارفها
            </button>
            <button className="btn-ghost flex-1" onClick={() => rate(false)}>
              نسيتها
            </button>
          </div>
        </>
      )}
    </section>
  );
}
