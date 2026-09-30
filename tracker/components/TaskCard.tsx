"use client";

import { useState } from "react";
import { api, useFeatures } from "@/lib/client";
import { phaseOf } from "@/lib/roadmap";
import type { Task } from "@/lib/tasks";
import { addDays, REVIEW_STEPS, today, type TaskProgress, useStore } from "@/lib/store";
import ExplainAr from "./ExplainAr";
import Pretest from "./Pretest";
import TeachBack from "./TeachBack";

const MIN_ANSWER = 40;
const MAX_FAILS = 3;

type Verdict = {
  score: number;
  passed: boolean;
  summary: string;
  followUp: string;
  perQuestion: { verdict: "correct" | "partial" | "wrong"; feedback: string }[];
};

const MARK = { correct: "✓", partial: "~", wrong: "✗" } as const;

export default function TaskCard({ task, label }: { task: Task; label: string }) {
  const { state, update, syncKey } = useStore();
  const features = useFeatures();
  const progress: TaskProgress = state.tasks[task.id] ?? { answers: [], attempts: 0 };
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<string[]>(() => task.check.map((_, i) => progress.answers[i] ?? ""));
  const [link, setLink] = useState(progress.link ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [selfOk, setSelfOk] = useState(false);
  const [mode, setMode] = useState<"write" | "teach">("write");

  const useAi = features.examiner && !!syncKey;
  const answersOk = answers.every((a) => a.trim().length >= MIN_ANSWER);
  const linkOk = !task.code || /^https?:\/\/\S+$/.test(link.trim());
  const canSubmit = answersOk && linkOk && (useAi || selfOk) && !busy;
  const canTeach = useAi && features.mentor;

  const save = (patch: Partial<TaskProgress>) =>
    update((s) => ({
      ...s,
      tasks: {
        ...s.tasks,
        [task.id]: { ...progress, answers: answers.map((a) => a.trim()), link: link.trim() || undefined, ...patch },
      },
    }));

  const complete = (proof: TaskProgress["proof"], v?: Verdict, extra: Partial<TaskProgress> = {}) =>
    save({
      ...extra,
      doneAt: Date.now(),
      proof,
      score: v?.score,
      feedback: v?.summary,
      followUp: v?.followUp,
      attempts: progress.attempts + 1,
      review: { due: addDays(today(), REVIEW_STEPS[0]), step: 0 },
    });

  // teach = المحادثة بتاعة "اشرح للمشرف" بدل الإجابات المكتوبة
  const submit = async (teach?: { transcript: string; madaText: string }) => {
    setError("");
    if (!useAi) return complete("self");
    if (!linkOk) return setError("حط لينك الكود على GitHub الأول.");
    setBusy(true);
    try {
      const v = await api<Verdict>("/api/examine", syncKey, {
        method: "POST",
        body: JSON.stringify(
          teach
            ? { taskId: task.id, transcript: teach.transcript, link: link.trim() || undefined }
            : { taskId: task.id, answers, link: link.trim() || undefined },
        ),
      });
      setVerdict(v);
      // في وضع الشرح، "إجابتك" اللي بتظهر في المراجعة المتباعدة = كلامك في المحادثة
      const extra = teach ? { answers: task.check.map(() => teach.madaText.slice(0, 4000)) } : {};
      if (v.passed) complete("ai", v, extra);
      else save({ ...extra, attempts: progress.attempts + 1, score: v.score, feedback: v.summary });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const phase = phaseOf(task.courseId);

  return (
    <section className="card space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold text-accent">{label}</span>
        <span className="text-xs text-muted">~{Math.round(task.minutes / 60)} ساعة · ممكن على كذا جلسة</span>
      </div>
      <h2 className="font-bold leading-7" dir="auto">
        {task.title}
      </h2>
      {phase && <p className="text-xs text-muted">{phase.title}</p>}

      <Pretest task={task} />

      {/* تحت التخمين: خمّن الأول وبعدين اقرا الشرح، عشان الشرح ميكشفش إجابات الـ pretest */}
      <ExplainAr task={task} />

      <a href={task.url} target="_blank" rel="noreferrer" className="btn-primary w-full">
        افتح الدرس ↗
      </a>

      <div>
        <p className="mb-1 text-sm font-semibold">إزاي:</p>
        <ol className="list-decimal space-y-1 ps-5 text-sm leading-7">
          {task.how.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ol>
      </div>

      {!open ? (
        <button className="btn-ghost w-full" onClick={() => setOpen(true)}>
          خلّصت؟ أثبت إنك فهمت
        </button>
      ) : (
        <div className="space-y-3 border-t border-line pt-3">
          {canTeach && (
            <div className="flex rounded-xl border border-line p-1 text-sm">
              {(
                [
                  ["write", "اكتب الإجابات"],
                  ["teach", "اشرح لزميل 🎓"],
                ] as const
              ).map(([m, l]) => (
                <button
                  key={m}
                  onClick={() => {
                    setMode(m);
                    setVerdict(null);
                  }}
                  className={`flex-1 rounded-lg py-1.5 ${mode === m ? "bg-accent-soft font-bold text-accent" : "text-muted"}`}
                >
                  {l}
                </button>
              ))}
            </div>
          )}
          {mode === "write" && (
            <p className="text-sm text-muted">
              جاوب بكلامك من غير ما تبص في الدرس. {useAi ? `${features.examinerName} هيصحح، والنجاح من 7/10.` : ""}
            </p>
          )}
          {mode === "write" &&
            task.check.map((q, i) => (
              <label key={q} className="block space-y-1">
                <span className="text-sm font-semibold leading-7">
                  {i + 1}. {q}
                </span>
                {!progress.primer && progress.guesses?.[i] && (
                  <span className="block text-xs leading-6 text-muted">تخمينك قبل الدرس: {progress.guesses[i]}</span>
                )}
                <textarea
                  className="input min-h-20"
                  value={answers[i]}
                  onChange={(e) => setAnswers(answers.map((a, j) => (j === i ? e.target.value : a)))}
                />
                {verdict?.perQuestion[i] && (
                  <span
                    className={`block text-sm leading-7 ${verdict.perQuestion[i].verdict === "correct" ? "text-accent" : "text-warn"}`}
                  >
                    {MARK[verdict.perQuestion[i].verdict]} {verdict.perQuestion[i].feedback}
                  </span>
                )}
              </label>
            ))}
          {task.code && (
            <label className="block space-y-1">
              <span className="text-sm font-semibold">لينك الكود على GitHub</span>
              <input
                className="input"
                dir="ltr"
                inputMode="url"
                placeholder="https://github.com/..."
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
            </label>
          )}
          {!useAi && (
            <label className="flex items-start gap-2 text-sm leading-7">
              <input
                type="checkbox"
                className="mt-1.5"
                checked={selfOk}
                onChange={(e) => setSelfOk(e.target.checked)}
              />
              رجعت للدرس وقارنت إجاباتي بيه، وصلّحت الغلط. (مفيش ممتحن AI متظبط — الأمانة عليك.)
            </label>
          )}
          {mode === "teach" && (
            <>
              <TeachBack task={task} busy={busy} onGrade={(transcript, madaText) => submit({ transcript, madaText })} />
              {verdict && (
                <ul className="space-y-1 text-sm leading-7">
                  {task.check.map((q, i) =>
                    verdict.perQuestion[i] ? (
                      <li
                        key={q}
                        className={verdict.perQuestion[i].verdict === "correct" ? "text-accent" : "text-warn"}
                      >
                        {MARK[verdict.perQuestion[i].verdict]} <b>{q}</b> — {verdict.perQuestion[i].feedback}
                      </li>
                    ) : null,
                  )}
                </ul>
              )}
            </>
          )}
          {mode === "write" && !answersOk && <p className="text-xs text-warn">كل إجابة {MIN_ANSWER} حرف على الأقل.</p>}
          {verdict && (
            <div className={`rounded-xl p-3 text-sm leading-7 ${verdict.passed ? "bg-accent-soft" : "bg-warn-soft"}`}>
              <b>
                {verdict.score}/10 —{" "}
                {verdict.passed
                  ? "نجحت ✓"
                  : mode === "teach"
                    ? "لسه. كمّل اشرح النقط الناقصة وقيّم تاني."
                    : "لسه. صلّح اللي فوق وجرّب تاني."}
              </b>
              <p>{verdict.summary}</p>
              {verdict.passed && verdict.followUp && <p className="mt-2">سؤال زيادة تفكّر فيه: {verdict.followUp}</p>}
            </div>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
          {mode === "write" && (
            <button className="btn-primary w-full" disabled={!canSubmit} onClick={() => submit()}>
              {busy ? `${features.examinerName} بيصحح...` : useAi ? "صحّحلي" : "قفّل المهمة"}
            </button>
          )}
          {useAi && progress.attempts >= MAX_FAILS && !verdict?.passed && (
            <button className="w-full text-xs text-muted underline" onClick={() => complete("forced")}>
              اقفلها من غير إثبات (هتتعلّم عليها في السجل)
            </button>
          )}
        </div>
      )}
    </section>
  );
}
