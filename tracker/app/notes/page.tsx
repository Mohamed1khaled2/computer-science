"use client";

import { useState } from "react";
import { api, useFeatures } from "@/lib/client";
import { currentCourse, mentorContext } from "@/lib/journey";
import { ALL_COURSES, courseById } from "@/lib/roadmap";
import { type Note, useStore } from "@/lib/store";
import Icon from "@/components/Icon";
import Markdown from "@/components/Markdown";
import { PageHeader } from "@/components/ui";

const ACTIONS = [
  {
    label: "نظّمها",
    instruction:
      "Organize this note: clear headings, short bullet lists, fix typos. Keep all of the content and my wording.",
  },
  {
    label: "صحّح فهمي",
    instruction:
      "Check this note for technical mistakes or misconceptions. Keep the structure as is; only mark and fix wrong parts with the ⚠️ تصحيح line.",
  },
  {
    label: "كمّل الناقص",
    instruction:
      "Add the most important points from this lesson that are missing from my note, as short bullets in the right places, each marked (إضافة من المشرف). Don't rewrite what I wrote.",
  },
  {
    label: "أسئلة مراجعة",
    instruction:
      'Keep the note unchanged and append a section "## أسئلة مراجعة" with 3–5 questions (no answers) that test real understanding of it.',
  },
];

function newNote(courseId?: string): Note {
  const now = Date.now();
  return { id: crypto.randomUUID(), title: "", body: "", courseId, createdAt: now, updatedAt: now };
}

export default function NotesPage() {
  const { state, ready, update, syncKey } = useStore();
  const features = useFeatures();
  // /notes#<id> بيفتح ملاحظة معينة (من صفحة الكورس). أول render مستني ready فمفيش hydration mismatch
  const [selected, setSelected] = useState<string | null>(() =>
    typeof window === "undefined" ? null : decodeURIComponent(window.location.hash.slice(1)) || null,
  );
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState(false);
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [proposal, setProposal] = useState<{ noteId: string; text: string } | null>(null);
  const [undo, setUndo] = useState<{ noteId: string; body: string } | null>(null);
  if (!ready) return <p className="text-muted">...</p>;

  const useAi = features.mentor && !!syncKey;
  const notes = [...state.notes].sort((a, b) => b.updatedAt - a.updatedAt);
  const q = query.trim().toLowerCase();
  const shown = q ? notes.filter((n) => (n.title + "\n" + n.body).toLowerCase().includes(q)) : notes;
  const note = state.notes.find((n) => n.id === selected) ?? null;

  const patch = (id: string, p: Partial<Note>) =>
    update((s) => ({ ...s, notes: s.notes.map((n) => (n.id === id ? { ...n, ...p, updatedAt: Date.now() } : n)) }));

  const create = () => {
    const n = newNote(currentCourse(state)?.id);
    update((s) => ({ ...s, notes: [...s.notes, n] }));
    open(n.id);
    setPreview(false);
  };

  const open = (id: string | null) => {
    setSelected(id);
    setProposal(null);
    setUndo(null);
    setError("");
  };

  const remove = (id: string) => {
    if (!confirm("تمسح الملاحظة دي؟")) return;
    update((s) => ({ ...s, notes: s.notes.filter((n) => n.id !== id), deletedIds: [...s.deletedIds, id] }));
    open(null);
  };

  const ask = async (instruction: string) => {
    if (!note || !instruction.trim() || busy) return;
    setBusy(true);
    setError("");
    setProposal(null);
    try {
      const r = await api<{ text: string }>("/api/mentor", syncKey, {
        method: "POST",
        body: JSON.stringify({
          mode: "note",
          context: mentorContext(state),
          note: { title: note.title || "بدون عنوان", body: note.body },
          instruction: instruction.trim(),
        }),
      });
      if (!r.text) throw new Error("المشرف مرجّعش حاجة. جرّب تاني.");
      setProposal({ noteId: note.id, text: r.text });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="الملاحظات"
        sub="اكتب بكلامك. المشرف بيقرا ملاحظات الكورس الحالي في الشات، وتقدر تطلب منه ينظّمها أو يصحّحها — وانت اللي بتوافق على التعديل."
      >
        <button className="btn-primary" onClick={create}>
          + ملاحظة جديدة
        </button>
      </PageHeader>

      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* القايمة: على الموبايل بتختفي لما تفتح ملاحظة */}
        <aside className={`space-y-3 ${note ? "hidden lg:block" : ""}`}>
          <input
            className="input"
            placeholder="دوّر في الملاحظات..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {shown.length ? (
            <ul className="space-y-2">
              {shown.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => open(n.id)}
                    className={`card block w-full p-3 text-start transition hover:border-accent/50 ${
                      n.id === selected ? "border-accent/60 bg-accent-soft" : ""
                    }`}
                  >
                    <span className="block truncate font-bold" dir="auto">
                      {n.title || "بدون عنوان"}
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-muted" dir="auto">
                      {n.body || "فاضية"}
                    </span>
                    <span className="mt-1 block text-[11px] text-muted">
                      {n.courseId ? (courseById(n.courseId)?.name.split("(")[0].trim() ?? "") + " · " : ""}
                      {new Date(n.updatedAt).toLocaleDateString("ar-EG", { day: "numeric", month: "short" })}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="card text-sm leading-7 text-muted">
              {q ? "مفيش نتايج." : "لسه مفيش ملاحظات. اكتب اللي فهمته من آخر درس — بكلامك، حتى لو ناقص."}
            </p>
          )}
        </aside>

        {note ? (
          <section className="space-y-4">
            <div className="card space-y-3 md:p-5">
              <div className="flex items-center gap-2">
                <button className="rounded-lg p-1.5 text-muted lg:hidden" onClick={() => open(null)} aria-label="رجوع">
                  <Icon name="arrow" className="size-5 rotate-180" />
                </button>
                <input
                  className="min-w-0 flex-1 bg-transparent text-xl font-extrabold outline-none placeholder:text-muted"
                  placeholder="العنوان"
                  dir="auto"
                  value={note.title}
                  onChange={(e) => patch(note.id, { title: e.target.value })}
                />
                <button className="text-xs text-muted underline" onClick={() => remove(note.id)}>
                  مسح
                </button>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <select
                  className="input w-auto max-w-full py-1.5 text-sm"
                  dir="ltr"
                  value={note.courseId ?? ""}
                  onChange={(e) => patch(note.id, { courseId: e.target.value || undefined })}
                >
                  <option value="">بدون كورس</option>
                  {ALL_COURSES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <div className="flex rounded-lg border border-line p-0.5 text-sm">
                  {[false, true].map((p) => (
                    <button
                      key={String(p)}
                      onClick={() => setPreview(p)}
                      className={`rounded-md px-3 py-1 ${preview === p ? "bg-accent-soft font-bold text-accent" : "text-muted"}`}
                    >
                      {p ? "عرض" : "كتابة"}
                    </button>
                  ))}
                </div>
              </div>
              {preview ? (
                <div className="min-h-[50vh] rounded-xl border border-line p-3 text-sm leading-7" dir="auto">
                  {note.body ? <Markdown text={note.body} /> : <p className="text-muted">فاضية.</p>}
                </div>
              ) : (
                <textarea
                  className="input min-h-[50vh] font-mono text-sm leading-7"
                  dir="auto"
                  placeholder={"اكتب بكلامك... Markdown مدعوم:\n## عنوان\n- نقطة\n`code`"}
                  value={note.body}
                  onChange={(e) => patch(note.id, { body: e.target.value })}
                />
              )}
              <p className="text-xs text-muted">بتتحفظ لوحدها.</p>
            </div>

            <div className="card space-y-3">
              <div className="flex items-center gap-2">
                <Icon name="spark" className="size-5 text-accent" />
                <h2 className="font-bold">اطلب من المشرف</h2>
              </div>
              {!useAi ? (
                <p className="text-sm leading-7 text-muted">
                  محتاج <code dir="ltr">GEMINI_API_KEY</code> على السيرفر والـ SYNC_KEY في الإعدادات.
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    {ACTIONS.map((a) => (
                      <button
                        key={a.label}
                        className="btn-ghost py-1.5"
                        disabled={busy || !note.body.trim()}
                        onClick={() => ask(a.instruction)}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                  <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      ask(custom);
                    }}
                  >
                    <input
                      className="input"
                      placeholder="أو اكتب طلبك: مثلاً «حوّل الجزء ده لجدول»"
                      value={custom}
                      onChange={(e) => setCustom(e.target.value)}
                    />
                    <button className="btn-primary shrink-0" disabled={busy || !custom.trim()}>
                      اطلب
                    </button>
                  </form>
                  {busy && <p className="text-sm text-muted">المشرف بيقرا ملاحظتك...</p>}
                  {error && <p className="text-sm text-red-500">{error}</p>}
                </>
              )}

              {proposal?.noteId === note.id && (
                <div className="space-y-3 border-t border-line pt-3">
                  <p className="text-sm font-bold">اقتراح المشرف — راجعه قبل ما توافق:</p>
                  <div
                    className="max-h-[60vh] overflow-y-auto rounded-xl border border-accent/40 bg-accent-soft/40 p-3 text-sm leading-7"
                    dir="auto"
                  >
                    <Markdown text={proposal.text} />
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="btn-primary flex-1"
                      onClick={() => {
                        setUndo({ noteId: note.id, body: note.body });
                        patch(note.id, { body: proposal.text });
                        setProposal(null);
                      }}
                    >
                      اقبل التعديل
                    </button>
                    <button className="btn-ghost flex-1" onClick={() => setProposal(null)}>
                      ارفض
                    </button>
                  </div>
                </div>
              )}

              {undo?.noteId === note.id && !proposal && (
                <button
                  className="text-xs text-muted underline"
                  onClick={() => {
                    patch(note.id, { body: undo.body });
                    setUndo(null);
                  }}
                >
                  رجّع النسخة اللي قبل التعديل
                </button>
              )}
            </div>
          </section>
        ) : (
          <div className="card hidden place-items-center text-center text-sm leading-7 text-muted lg:grid lg:min-h-[50vh]">
            <div className="space-y-3">
              <p>اختار ملاحظة من القايمة، أو ابدأ واحدة جديدة.</p>
              <button className="btn-ghost" onClick={create}>
                + ملاحظة جديدة
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
