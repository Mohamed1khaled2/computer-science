"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/ui";

const OBSTACLES = [
  {
    q: "راجع من الشغل مهدود ومش قادر",
    a: "الحد الأدنى 20 دقيقة: محاضرة واحدة أو مسألة واحدة. لو ده كتير، 10 دقايق تقرا ملاحظاتك. الأحسن: خلّي الجلسة الصبح قبل الشغل، لأن بعد 10 ساعات مفيش طاقة للتفكير.",
  },
  {
    q: "وقفت أيام/أسابيع وحاسس إني فشلت",
    a: 'مفيش "أبدأ من الأول". افتح الصفحة الرئيسية، اقرا آخر ملاحظة، واعمل الخطوة الجاية. القاعدة: متفوّتش يومين ورا بعض. يوم واحد عادي.',
  },
  {
    q: "اتزنقت في مسألة أو مفهوم",
    a: "قاعدة الـ 30 دقيقة: حاول 30 دقيقة لوحدك واكتب على ورقة جربت إيه. بعدها اسأل الـ AI بالبرومبت اللي تحت (تلميح بس، مش حل)، أو اسأل في Discord بتاع OSSU. لو لسه، علّم عليها وكمّل وارجعلها بعد يومين.",
  },
  {
    q: "الكورس ممل أو صعب زيادة",
    a: 'مسموح تبدّل الترتيب جوه نفس المرحلة، ومسموح تسرّع المحاضرات لـ 1.5x. مش مسموح تغيّر الخطة كلها أو تدوّر على كورس "أحسن". الملل عادة معناه إنك محتاج تحل بإيدك مش تتفرج.',
  },
  {
    q: "لقيت كورس/framework جديد شكله أحلى",
    a: 'اكتبه في قائمة "بعدين" تحت وارجع لخطتك. التنقل بين الكورسات هو أكبر سبب إنك كل شوية تبدأ من الأول.',
  },
  {
    q: "أسبوع شغل مضغوط جدًا",
    a: "وضع الصيانة: 3 جلسات × 20 دقيقة في الأسبوع. الهدف إن السلسلة متتقطعش، مش إنك تتقدم.",
  },
];

const AI_RULES = [
  "في الكورسات والمسائل: الـ AI ممنوع يكتب كود. مسموح بس يشرح مفهوم أو يديك تلميح.",
  "في الشغل: استخدمه عادي، بس متعملش commit لسطر مش قادر تشرحه.",
  "مرة في الأسبوع في الشغل: feature أو bug صغير بإيدك من غير أي AI.",
  "بعد ما تحل لوحدك: ساعتها اطلب من الـ AI يراجع الحل ويقارنه بحل أحسن. ده بيعلّم جدًا.",
];

const TUTOR_PROMPT = `أنا بتعلم CS ومحتاجك مدرس مش حد بيحل.
متكتبليش أي كود ومتقوليش الحل.
اسألني أسئلة توصلني للحل بنفسي، وإديني تلميح واحد في كل مرة.
المسألة: ...
اللي جربته: ...
فين حاسس إني واقف: ...`;

export default function HelpPage() {
  const { state, update } = useStore();
  const [item, setItem] = useState("");
  const [copied, setCopied] = useState(false);

  return (
    <div>
      <PageHeader title="اتزنقت؟" sub="كل مرة وقفت فيها قبل كده كان ليها سبب. دوس على المشكلة اللي قدامك دلوقتي." />
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <section className="space-y-2">
          {OBSTACLES.map((o) => (
            <details key={o.q} className="card">
              <summary className="cursor-pointer font-semibold">{o.q}</summary>
              <p className="mt-2 text-sm leading-7">{o.a}</p>
            </details>
          ))}
        </section>

        <div className="space-y-4">
          <section className="card space-y-3">
            <h2 className="font-bold">قواعد الـ AI</h2>
            <p className="text-sm leading-7 text-muted">
              دراسة Anthropic (2026) لقت إن المطورين اللي بيخلّوا الـ AI يكتب الكود وهم بيتعلموا فهموا أقل بكتير من اللي
              استخدموه يسألوه عن المفاهيم بس.
            </p>
            <ol className="list-decimal space-y-2 ps-5 text-sm leading-7">
              {AI_RULES.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ol>
            <pre className="whitespace-pre-wrap rounded-xl bg-bg p-3 text-sm leading-7">{TUTOR_PROMPT}</pre>
            <button
              className="btn-ghost w-full"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(TUTOR_PROMPT);
                  setCopied(true);
                } catch {}
              }}
            >
              {copied ? "اتنسخ ✓" : "انسخ برومبت المدرس"}
            </button>
          </section>

          <section className="card space-y-3">
            <h2 className="font-bold">قائمة &quot;بعدين&quot;</h2>
            <p className="text-sm text-muted">أي حاجة لامعة عايز تتعلمها — اكتبها هنا وارجع لخطتك.</p>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!item.trim()) return;
                update((s) => ({ ...s, later: [...s.later, item.trim()] }));
                setItem("");
              }}
            >
              <input
                className="input"
                value={item}
                onChange={(e) => setItem(e.target.value)}
                placeholder="مثلاً: Rust"
              />
              <button className="btn-primary">أضف</button>
            </form>
            <ul className="space-y-1 text-sm">
              {state.later.map((l, i) => (
                <li key={i} className="flex justify-between border-t border-line pt-1">
                  <span>{l}</span>
                  <button
                    className="text-xs text-muted"
                    onClick={() => update((s) => ({ ...s, later: s.later.filter((_, j) => j !== i) }))}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
