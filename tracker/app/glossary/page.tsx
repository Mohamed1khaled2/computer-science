"use client";

import { useState } from "react";
import { currentCourse } from "@/lib/journey";
import { courseById } from "@/lib/roadmap";
import { addTerms, dueTerms, findTerm, newTerm, type Term, useStore } from "@/lib/store";
import { PageHeader } from "@/components/ui";

const EMPTY_FORM = { en: "", ar: "", example: "" };

export default function GlossaryPage() {
  const { state, ready, update } = useStore();
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  if (!ready) return <p className="text-muted">...</p>;

  const due = dueTerms(state);
  const learned = state.glossary.filter((t) => !t.review).length;
  const q = query.trim().toLowerCase();
  const terms = [...state.glossary]
    .reverse()
    .filter((t) => !q || `${t.en}\n${t.ar}\n${t.example ?? ""}`.toLowerCase().includes(q));
  const dup = !editing && form.en.trim() ? findTerm(state, form.en) : undefined;
  const canSave = form.en.trim() && form.ar.trim() && !dup;

  const save = () => {
    if (!canSave) return;
    if (editing) {
      update((s) => ({
        ...s,
        glossary: s.glossary.map((t) =>
          t.id === editing
            ? { ...t, en: form.en.trim(), ar: form.ar.trim(), example: form.example.trim() || undefined, updatedAt: Date.now() }
            : t,
        ),
      }));
    } else {
      update((s) => addTerms(s, [newTerm({ ...form, courseId: currentCourse(s)?.id })]));
    }
    setForm(EMPTY_FORM);
    setEditing(null);
  };

  const edit = (t: Term) => {
    setEditing(t.id);
    setForm({ en: t.en, ar: t.ar, example: t.example ?? "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = (t: Term) => {
    if (!confirm(`تمسح "${t.en}" من القاموس؟`)) return;
    update((s) => ({
      ...s,
      glossary: s.glossary.filter((x) => x.id !== t.id),
      deletedIds: [...s.deletedIds, t.id],
    }));
    if (editing === t.id) {
      setEditing(null);
      setForm(EMPTY_FORM);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="القاموس"
        sub="الكلمات الإنجليزي اللي وقفتك وانت بتذاكر. كل كلمة بتطلعلك مراجعة في الصفحة الرئيسية بعد يوم، 3، 7، 21، و60 يوم لحد ما تتحفظ."
      />

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="card p-3">
          <p className="text-2xl font-extrabold tabular-nums">{state.glossary.length}</p>
          <p className="text-xs text-muted">كلمة</p>
        </div>
        <div className="card p-3">
          <p className="text-2xl font-extrabold tabular-nums">{due.length}</p>
          <p className="text-xs text-muted">مراجعة النهارده</p>
        </div>
        <div className="card p-3">
          <p className="text-2xl font-extrabold tabular-nums">{learned}</p>
          <p className="text-xs text-muted">اتحفظت</p>
        </div>
      </div>

      <section className="card space-y-3">
        <h2 className="font-bold">{editing ? "عدّل الكلمة" : "ضيف كلمة"}</h2>
        <input
          className="input"
          dir="ltr"
          placeholder="English — e.g. recursion"
          value={form.en}
          onChange={(e) => setForm({ ...form, en: e.target.value })}
        />
        <input
          className="input"
          placeholder="معناها بكلامك — مثلاً: دالة بتنادي نفسها"
          value={form.ar}
          onChange={(e) => setForm({ ...form, ar: e.target.value })}
        />
        <input
          className="input"
          dir="auto"
          placeholder="مثال أو الجملة اللي قابلتها فيها (اختياري)"
          value={form.example}
          onChange={(e) => setForm({ ...form, example: e.target.value })}
        />
        {dup && (
          <p className="text-xs text-warn">
            الكلمة دي موجودة بالفعل: {dup.ar}
          </p>
        )}
        <div className="flex gap-2">
          <button className="btn-primary flex-1" disabled={!canSave} onClick={save}>
            {editing ? "احفظ" : "ضيف"}
          </button>
          {editing && (
            <button
              className="btn-ghost"
              onClick={() => {
                setEditing(null);
                setForm(EMPTY_FORM);
              }}
            >
              إلغاء
            </button>
          )}
        </div>
      </section>

      {state.glossary.length > 0 && (
        <input className="input" placeholder="دوّر في القاموس..." value={query} onChange={(e) => setQuery(e.target.value)} />
      )}

      {terms.length ? (
        <ul className="grid gap-2 md:grid-cols-2">
          {terms.map((t) => (
            <li key={t.id} className="card space-y-1 p-3">
              <div className="flex items-start justify-between gap-2">
                <b dir="ltr">{t.en}</b>
                <span className="shrink-0 text-xs text-muted">
                  {t.review ? `مراجعة ${t.review.due}` : "اتحفظت ✓"}
                </span>
              </div>
              <p className="text-sm leading-7">{t.ar}</p>
              {t.example && (
                <p className="text-xs leading-6 text-muted" dir="auto">
                  {t.example}
                </p>
              )}
              <div className="flex items-center justify-between pt-1 text-xs text-muted">
                <span dir="ltr">{t.courseId ? courseById(t.courseId)?.name.split("(")[0].trim() : ""}</span>
                <span className="flex gap-3">
                  <button className="underline" onClick={() => edit(t)}>
                    عدّل
                  </button>
                  <button className="underline" onClick={() => remove(t)}>
                    امسح
                  </button>
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">
          {q
            ? "مفيش نتايج."
            : "لسه فاضي. وانت بتذاكر، أي كلمة تتكرر وتوقفك ضيفها هنا — أو من زرار \"اشرحلي الدرس بالعربي\" في مهمة النهارده."}
        </p>
      )}
    </div>
  );
}
