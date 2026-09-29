"use client";

import { useState } from "react";
import { api, useFeatures } from "@/lib/client";
import { mentorContext } from "@/lib/journey";
import type { Task } from "@/lib/tasks";
import { type TaskProgress, useStore } from "@/lib/store";

// pretesting: تخمّن إجابات أسئلة الدرس قبل ما تذاكره. الأبحاث بتقول إنه بيحسّن الفهم حتى لو التخمين غلط،
// وبيخليك تدخل المحاضرة بتدوّر على إجابات بدل ما تتفرج وخلاص.
export default function Pretest({ task }: { task: Task }) {
  const { state, update, syncKey } = useStore();
  const features = useFeatures();
  const progress: TaskProgress = state.tasks[task.id] ?? { answers: [], attempts: 0 };
  const questions = progress.primer ?? task.check;
  const [guesses, setGuesses] = useState<string[]>(() => questions.map((_, i) => progress.guesses?.[i] ?? ""));
  const [skipped, setSkipped] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const useAi = features.mentor && !!syncKey;

  const patch = (p: Partial<TaskProgress>) =>
    update((s) => ({
      ...s,
      tasks: { ...s.tasks, [task.id]: { ...(s.tasks[task.id] ?? { answers: [], attempts: 0 }), ...p } },
    }));

  const newQuestions = async () => {
    setBusy(true);
    setError("");
    try {
      const r = await api<{ questions: string[] }>("/api/mentor", syncKey, {
        method: "POST",
        body: JSON.stringify({
          mode: "primer",
          context: mentorContext(state),
          task: { title: task.title, url: task.url, check: task.check },
        }),
      });
      if (!r.questions.length) throw new Error("المشرف مرجّعش أسئلة. جرّب تاني.");
      patch({ primer: r.questions, guesses: undefined });
      setGuesses(r.questions.map(() => ""));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (progress.guesses?.length) {
    return (
      <div className="rounded-xl bg-bg p-3 text-sm">
        <button className="flex w-full items-center justify-between" onClick={() => setShowSaved(!showSaved)}>
          <span className="font-semibold">✓ خمّنت قبل الدرس</span>
          <span className="text-xs text-muted">{showSaved ? "اخفي" : "شوف تخميناتك"}</span>
        </button>
        {showSaved && (
          <ul className="mt-2 space-y-2 leading-7">
            {questions.map((q, i) => (
              <li key={q}>
                <p className="font-semibold">{q}</p>
                <p className="text-muted">{progress.guesses?.[i] || "—"}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
  if (skipped) return null;

  return (
    <div className="space-y-3 rounded-xl border border-dashed border-accent/50 p-3">
      <div>
        <p className="font-bold">قبل ما تفتح الدرس: خمّن (دقيقتين)</p>
        <p className="text-xs leading-6 text-muted">
          مش لازم تبقى صح. التخمين قبل الدرس بيخلّي مخك يدوّر على الإجابة وانت بتذاكر — وبعد ما تخلص هتشوف اتعلمت قد
          إيه.
        </p>
      </div>
      {questions.map((q, i) => (
        <label key={q} className="block space-y-1">
          <span className="text-sm font-semibold leading-7">{q}</span>
          <input
            className="input py-2 text-sm"
            dir="auto"
            placeholder="تخمينك..."
            value={guesses[i] ?? ""}
            onChange={(e) => setGuesses(guesses.map((g, j) => (j === i ? e.target.value : g)))}
          />
        </label>
      ))}
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <button
          className="btn-primary"
          disabled={!guesses.some((g) => g.trim())}
          onClick={() => patch({ guesses: guesses.map((g) => g.trim()) })}
        >
          احفظ تخميني
        </button>
        {useAi && (
          <button className="btn-ghost" disabled={busy} onClick={newQuestions}>
            {busy ? "..." : "أسئلة تانية من المشرف"}
          </button>
        )}
        <button className="text-xs text-muted underline" onClick={() => setSkipped(true)}>
          تخطّى المرة دي
        </button>
      </div>
    </div>
  );
}
