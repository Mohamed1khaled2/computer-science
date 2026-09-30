"use client";

import Link from "next/link";
import { useState } from "react";
import { api, useFeatures } from "@/lib/client";
import { mentorContext } from "@/lib/journey";
import type { Task } from "@/lib/tasks";
import { addTerms, findTerm, newTerm, type TaskProgress, useStore } from "@/lib/store";
import Markdown from "./Markdown";

type Explain = NonNullable<TaskProgress["explain"]>;

// "اشرحلي بالعربي": خريطة للدرس بالعربي قبل ما تذاكره من المصدر الإنجليزي، + الكلمات اللي ممكن توقفك.
// المصدر بيفضل إنجليزي؛ ده بس بيخلّي المحاضرة أسهل تتفهم.
export default function ExplainAr({ task }: { task: Task }) {
  const { state, update, syncKey } = useStore();
  const features = useFeatures();
  const saved = state.tasks[task.id]?.explain;
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!features.mentor || !syncKey) return null;

  const fetchExplain = async () => {
    setBusy(true);
    setError("");
    try {
      const r = await api<{ text: string; terms: Explain["terms"] }>("/api/mentor", syncKey, {
        method: "POST",
        body: JSON.stringify({
          mode: "explain",
          context: mentorContext(state),
          task: { title: task.title, url: task.url, check: task.check },
        }),
      });
      if (!r.text) throw new Error("المشرف مرجّعش شرح. جرّب تاني.");
      update((s) => ({
        ...s,
        tasks: {
          ...s.tasks,
          [task.id]: { ...(s.tasks[task.id] ?? { answers: [], attempts: 0 }), explain: { text: r.text, terms: r.terms } },
        },
      }));
      setOpen(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const add = (terms: Explain["terms"]) =>
    update((s) => addTerms(s, terms.map((t) => newTerm({ ...t, courseId: task.courseId }))));

  if (!saved) {
    return (
      <div className="space-y-1">
        <button className="btn-ghost w-full" disabled={busy} onClick={fetchExplain}>
          {busy ? "المشرف بيحضّر الشرح..." : "اشرحلي الدرس بالعربي الأول 🇪🇬"}
        </button>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  const missing = saved.terms.filter((t) => !findTerm(state, t.en));

  return (
    <div className="rounded-xl bg-bg p-3 text-sm">
      <button className="flex w-full items-center justify-between" onClick={() => setOpen(!open)}>
        <span className="font-semibold">الدرس بالعربي (قبل ما تفتحه)</span>
        <span className="text-xs text-muted">{open ? "اخفي" : "افتح"}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          <div className="leading-7">
            <Markdown text={saved.text} />
          </div>
          {saved.terms.length > 0 && (
            <div className="space-y-2 border-t border-line pt-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">كلمات هتقابلك</p>
                {missing.length > 0 ? (
                  <button className="text-xs font-semibold text-accent underline" onClick={() => add(missing)}>
                    ضيف الكل للقاموس ({missing.length})
                  </button>
                ) : (
                  <Link href="/glossary" className="text-xs text-muted underline">
                    كلها في القاموس ✓
                  </Link>
                )}
              </div>
              <ul className="space-y-1.5">
                {saved.terms.map((t) => {
                  const has = !!findTerm(state, t.en);
                  return (
                    <li key={t.en} className="flex items-start justify-between gap-2 leading-6">
                      <span>
                        <b dir="ltr" className="inline-block">
                          {t.en}
                        </b>{" "}
                        — {t.ar}
                      </span>
                      <button
                        className={`shrink-0 text-xs ${has ? "text-muted" : "font-semibold text-accent"}`}
                        disabled={has}
                        onClick={() => add([t])}
                      >
                        {has ? "✓" : "+ قاموس"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          <p className="text-xs leading-6 text-muted">
            ده مجرد خريطة. ذاكر من المصدر الإنجليزي، وأي كلمة توقفك ضيفها للقاموس.{" "}
            <button className="underline" disabled={busy} onClick={fetchExplain}>
              {busy ? "..." : "اشرح تاني"}
            </button>
          </p>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      )}
    </div>
  );
}
