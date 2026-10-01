"use client";

import { useState } from "react";
import {
  type EnglishTest,
  type Lesson,
  level,
  orderedLessons,
  type Question,
  scoreTest,
  type Section,
  SECTIONS,
  TEST,
  weakSections,
} from "@/lib/english";
import { addTerms, findTerm, newTerm, type State, today, useStore } from "@/lib/store";
import { Bar, PageHeader } from "@/components/ui";

const english = (s: State) => s.english ?? { tests: [], done: [] };

export default function EnglishPage() {
  const { state, ready } = useStore();
  const [testing, setTesting] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  if (!ready) return <p className="text-muted">...</p>;

  const { tests, done } = english(state);
  const last = tests.at(-1);

  return (
    <div className="space-y-5">
      <PageHeader
        title="إنجليزي البرمجة"
        sub="مش كورس إنجليزي عام. بس الكلمات والجمل اللي هتقابلها في المحاضرات والـ docs ورسايل الخطأ والـ problem sets."
      />

      {testing ? (
        <PlacementTest
          onDone={() => {
            setTesting(false);
            window.scrollTo({ top: 0 });
          }}
        />
      ) : !last ? (
        <section className="card space-y-3">
          <h2 className="font-bold">نبدأ باختبار تحديد مستوى</h2>
          <p className="text-sm leading-7 text-muted">
            {TEST.length} سؤال اختيار من متعدد، حوالي 10 دقايق. 4 أقسام: كلمات البرمجة، رسائل الخطأ، قراءة الـ docs، وتعليمات
            الـ problem set. مش امتحان ومحدش هيشوفه — الهدف نعرف نبدأ منين.
          </p>
          <p className="text-sm leading-7 text-muted">
            لو مش عارف إجابة، اختار &quot;مش عارف&quot; بدل ما تخمّن. كده النتيجة هتبقى أصدق.
          </p>
          <button className="btn-primary w-full" onClick={() => setTesting(true)}>
            ابدأ الاختبار
          </button>
        </section>
      ) : (
        <Result tests={tests} onRetake={() => setTesting(true)} />
      )}

      {last && !testing && (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-bold">الدروس</h2>
            <span className="text-xs text-muted">
              {done.length}/{orderedLessons().length} خلصت
            </span>
          </div>
          <p className="text-sm leading-7 text-muted">
            مترتبة من الأضعف للأقوى حسب الاختبار. درس كل يومين، 10 دقايق، من الموبايل في البريك — مش من ساعة المذاكرة.
          </p>
          <ul className="space-y-2">
            {orderedLessons(last).map((l) => (
              <li key={l.id}>
                <LessonCard
                  lesson={l}
                  done={done.includes(l.id)}
                  weak={weakSections(last).includes(l.section)}
                  open={open === l.id}
                  toggle={() => setOpen(open === l.id ? null : l.id)}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

// ---------- الاختبار ----------

const DONT_KNOW = -1;

function PlacementTest({ onDone }: { onDone: () => void }) {
  const { update } = useStore();
  const [answers, setAnswers] = useState<number[]>([]);
  const i = answers.length;
  const q = TEST[i];

  const choose = (a: number) => {
    const next = [...answers, a];
    if (next.length < TEST.length) return setAnswers(next);
    update((s) => {
      const t: EnglishTest = { ts: Date.now(), date: today(), answers: next };
      return { ...s, english: { ...english(s), tests: [...english(s).tests, t] } };
    });
    onDone();
  };

  return (
    <section className="card space-y-4">
      <div className="flex justify-between text-xs text-muted">
        <span>{SECTIONS[q.section].title}</span>
        <span className="tabular-nums">
          {i + 1}/{TEST.length}
        </span>
      </div>
      <Bar pct={i / TEST.length} />
      <Prompt q={q} />
      <div className="grid gap-2">
        {q.options.map((o, k) => (
          <button key={`${i}-${k}`} className="btn-ghost justify-start text-start" onClick={() => choose(k)}>
            {o}
          </button>
        ))}
        <button className="btn justify-start text-muted" onClick={() => choose(DONT_KNOW)}>
          مش عارف
        </button>
      </div>
      {i > 0 && (
        <button className="text-xs text-muted underline" onClick={() => setAnswers(answers.slice(0, -1))}>
          ارجع للسؤال اللي فات
        </button>
      )}
    </section>
  );
}

function Prompt({ q }: { q: Question }) {
  return (
    <div className="space-y-2">
      {q.code ? (
        <pre dir="ltr" className="overflow-x-auto whitespace-pre-wrap rounded-xl bg-bg p-3 font-mono text-sm leading-6">
          {q.text}
        </pre>
      ) : (
        <p dir="ltr" className="rounded-xl bg-bg p-3 text-base font-semibold leading-7">
          {q.text}
        </p>
      )}
      <p className="font-bold">{q.ask}</p>
    </div>
  );
}

// ---------- النتيجة ----------

function Result({ tests, onRetake }: { tests: EnglishTest[]; onRetake: () => void }) {
  const last = tests[tests.length - 1];
  const first = tests[0];
  const { right, total, bySection } = scoreTest(last);
  const lvl = level(right);
  const weak = weakSections(last);
  const wrong = TEST.map((q, i) => ({ q, picked: last.answers[i] })).filter((x) => x.picked !== x.q.answer);

  return (
    <>
      <section className="hero space-y-2">
        <p className="text-sm opacity-80">نتيجة اختبار المستوى · {last.date}</p>
        <p className="text-4xl font-extrabold tabular-nums">
          {right}/{total}
        </p>
        <p className="font-bold">{lvl.title}</p>
        {tests.length > 1 && (
          <p className="text-sm opacity-90">
            أول اختبار ({first.date}): {scoreTest(first).right}/{total} ← دلوقتي: {right}/{total}
          </p>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {(Object.keys(SECTIONS) as Section[]).map((s) => (
          <div key={s} className="card space-y-2 p-3.5">
            <div className="flex justify-between text-sm">
              <b>
                {weak.includes(s) && "⚠ "}
                {SECTIONS[s].title}
              </b>
              <span className="tabular-nums text-muted">
                {bySection[s].right}/{bySection[s].total}
              </span>
            </div>
            <Bar pct={bySection[s].right / bySection[s].total} className={weak.includes(s) ? "bg-warn" : "bg-accent"} />
            <p className="text-xs text-muted">{SECTIONS[s].desc}</p>
          </div>
        ))}
      </section>

      <section className="card space-y-3">
        <h2 className="font-bold">هتتعلم إزاي</h2>
        <ol className="list-decimal space-y-2 ps-5 text-sm leading-7">
          {lvl.plan.map((p) => (
            <li key={p}>{p}</li>
          ))}
          <li>
            بعد 4 أسابيع، أعد الاختبار من الزرار اللي تحت. الهدف مش الدرجة الكاملة، الهدف تشوف إنك اتحسنت.
          </li>
        </ol>
        <p className="rounded-xl bg-bg p-3 text-sm leading-7">
          ده مش كورس جديد ولا بيغيّر الخطة. ساعات المذاكرة زي ما هي على الكورس الحالي، والإنجليزي 10 دقايق جنبها.
        </p>
      </section>

      {wrong.length > 0 && (
        <details className="card">
          <summary className="cursor-pointer font-bold">راجع الأسئلة اللي فاتتك ({wrong.length})</summary>
          <ul className="mt-3 space-y-3">
            {wrong.map(({ q, picked }) => (
              <li key={q.text} className="space-y-1 border-t border-line pt-3 text-sm leading-7">
                <p dir="ltr" className={q.code ? "font-mono" : "font-semibold"}>
                  {q.text}
                </p>
                <p className="text-muted">
                  إجابتك: {picked === DONT_KNOW ? "مش عارف" : q.options[picked]}
                </p>
                <p className="text-accent">الصح: {q.options[q.answer]}</p>
                <p>{q.why}</p>
              </li>
            ))}
          </ul>
        </details>
      )}

      <button className="btn-ghost w-full" onClick={onRetake}>
        أعد اختبار المستوى
      </button>
    </>
  );
}

// ---------- الدرس ----------

function LessonCard({
  lesson,
  done,
  weak,
  open,
  toggle,
}: {
  lesson: Lesson;
  done: boolean;
  weak: boolean;
  open: boolean;
  toggle: () => void;
}) {
  const { state, update } = useStore();
  const [picked, setPicked] = useState<(number | undefined)[]>([]);
  const fresh = lesson.words.filter((w) => !findTerm(state, w.en));
  const answered = lesson.quiz.every((_, i) => picked[i] !== undefined);
  const right = lesson.quiz.filter((q, i) => picked[i] === q.answer).length;

  const addWords = () =>
    update((s) => addTerms(s, fresh.map((w) => newTerm({ en: w.en, ar: w.ar, example: w.example }))));
  const finish = () =>
    update((s) => ({ ...s, english: { ...english(s), done: [...new Set([...english(s).done, lesson.id])] } }));

  return (
    <div className={`card ${weak && !done ? "border-warn/50" : ""}`}>
      <button className="flex w-full items-center justify-between gap-3 text-start" onClick={toggle}>
        <div>
          <p className="font-bold">
            {done && <span className="text-accent">✓ </span>}
            {lesson.title}
          </p>
          <p className="text-xs text-muted">
            {SECTIONS[lesson.section].title} · {lesson.words.length} كلمة
            {weak && " · ⚠ ابدأ بيه"}
          </p>
        </div>
        <span className="text-muted">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-5">
          <p className="text-sm leading-7 text-muted">{lesson.why}</p>

          <div className="space-y-2">
            <h3 className="font-bold">الكلمات</h3>
            <p className="text-xs text-muted">اقرا الكلمة الإنجليزي وفكّر في معناها قبل ما تبص على العربي.</p>
            <ul className="divide-y divide-line rounded-xl bg-bg">
              {lesson.words.map((w) => (
                <li key={w.en} className="space-y-0.5 p-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <b dir="ltr">{w.en}</b>
                    <span className="text-sm">{w.ar}</span>
                  </div>
                  <p dir="ltr" className="text-xs text-muted">
                    {w.example}
                  </p>
                </li>
              ))}
            </ul>
            <button className="btn-ghost w-full" disabled={!fresh.length} onClick={addWords}>
              {fresh.length ? `ضيف ${fresh.length} كلمة للقاموس (هتتراجع لوحدها)` : "كل الكلمات في القاموس ✓"}
            </button>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold">جمل بتتكرر</h3>
            <ul className="space-y-1.5 text-sm">
              {lesson.patterns.map((p) => (
                <li key={p.en} className="rounded-xl bg-bg p-3">
                  <p dir="ltr" className="font-mono">
                    {p.en}
                  </p>
                  <p className="text-muted">{p.ar}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold">جرّب نفسك</h3>
            {lesson.quiz.map((q, i) => (
              <div key={q.text} className="space-y-2">
                <Prompt q={q} />
                <div className="grid gap-1.5">
                  {q.options.map((o, k) => {
                    const shown = picked[i] !== undefined;
                    const style = !shown
                      ? "btn-ghost"
                      : k === q.answer
                        ? "btn border border-accent bg-accent-soft text-accent"
                        : k === picked[i]
                          ? "btn border border-warn bg-warn-soft text-warn"
                          : "btn-ghost opacity-50";
                    return (
                      <button
                        key={k}
                        className={`${style} justify-start text-start`}
                        disabled={shown}
                        onClick={() => setPicked((p) => Object.assign([...p], { [i]: k }))}
                      >
                        {o}
                      </button>
                    );
                  })}
                </div>
                {picked[i] !== undefined && <p className="text-sm leading-7">{q.why}</p>}
              </div>
            ))}
          </div>

          {answered && (
            <div className="space-y-2 rounded-xl bg-bg p-3 text-center">
              <p className="font-bold">
                {right}/{lesson.quiz.length}
              </p>
              {done ? (
                <p className="text-sm text-accent">الدرس ده خلص ✓</p>
              ) : right >= lesson.quiz.length - 1 ? (
                <button className="btn-primary w-full" onClick={finish}>
                  خلصت الدرس
                </button>
              ) : (
                <>
                  <p className="text-sm text-muted">راجع الكلمات تاني وجرّب من الأول.</p>
                  <button className="btn-ghost w-full" onClick={() => setPicked([])}>
                    جرّب تاني
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
