"use client";

import { useState } from "react";
import { api, useFeatures } from "@/lib/client";
import { mentorContext } from "@/lib/journey";
import type { Course } from "@/lib/roadmap";
import { type Post, useStore } from "@/lib/store";
import Icon from "./Icon";

const MIN_OWN = 200;

// هيكل اختياري: أسئلة بتساعدك تفتكر. الحروف بتاعته مش بتتحسب من الـ 200.
const SKELETON = {
  en: (c: string) =>
    `I just finished "${c}" as part of my self-study of the OSSU Computer Science curriculum.\n\nThe 3 things I learned:\n1. \n2. \n3. \n\nThe hardest part was:\n\nHow it changes the way I work:\n\nCode: `,
  ar: (c: string) =>
    `خلّصت كورس "${c}" كجزء من دراستي الذاتية لمنهج OSSU في Computer Science.\n\nأهم 3 حاجات اتعلمتها:\n1. \n2. \n3. \n\nأصعب حاجة كانت:\n\nده غيّر طريقة شغلي إزاي:\n\nالكود: `,
};

// عدد الحروف اللي مادا كتبها فعلاً (من غير سطور الهيكل زي ما هي)
function ownChars(draft: string, lang: Post["lang"], course: string): number {
  const skeleton = new Set(
    SKELETON[lang](course)
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean),
  );
  return draft
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => !skeleton.has(l))
    .join("")
    .replace(/\s/g, "").length;
}

export default function PostComposer({ course, complete }: { course: Course; complete: boolean }) {
  const { state, update, syncKey } = useStore();
  const features = useFeatures();
  const post: Post = state.posts[course.id] ?? { draft: "", lang: "en", updatedAt: 0 };
  const [open, setOpen] = useState(complete && !post.postedAt);
  const [review, setReview] = useState<{ feedback: string[]; edited: string } | null>(null);
  const [undo, setUndo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState(post.url ?? "");
  const useAi = features.mentor && !!syncKey;
  const name = course.name.split("(")[0].trim();
  const own = ownChars(post.draft, post.lang, name);
  const notes = state.notes.filter((n) => n.courseId === course.id);
  const sessionNotes = state.sessions.filter((s) => s.courseId === course.id && s.note).slice(-8);

  const patch = (p: Partial<Post>) =>
    update((s) => ({
      ...s,
      posts: { ...s.posts, [course.id]: { ...(s.posts[course.id] ?? post), ...p, updatedAt: Date.now() } },
    }));

  const askReview = async () => {
    setBusy(true);
    setError("");
    setReview(null);
    try {
      const r = await api<{ feedback: string[]; edited: string }>("/api/mentor", syncKey, {
        method: "POST",
        body: JSON.stringify({
          mode: "post",
          context: mentorContext(state),
          post: { text: post.draft, lang: post.lang, course: course.name },
        }),
      });
      setReview(r);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(post.draft);
      setCopied(true);
    } catch {}
  };

  if (!open) {
    return (
      <button
        id="post"
        className="card flex w-full items-center gap-3 text-start transition hover:border-accent/50"
        onClick={() => setOpen(true)}
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
          <Icon name="share" />
        </span>
        <span className="text-sm leading-6">
          <b className="block">{post.postedAt ? "✓ نشرت اللي اتعلمته" : "انشر اللي اتعلمته على LinkedIn"}</b>
          <span className="text-muted">
            {post.postedAt
              ? new Date(post.postedAt).toLocaleDateString("ar-EG", { day: "numeric", month: "long" })
              : "بوست بكلامك انت — والمشرف يراجع بس."}
          </span>
        </span>
      </button>
    );
  }

  return (
    <section id="post" className="card scroll-mt-24 space-y-4 md:p-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon name="share" className="size-5 text-accent" />
          <h2 className="text-lg font-extrabold">اتعلمت إيه؟ — بوست LinkedIn</h2>
        </div>
        <button className="text-xs text-muted underline" onClick={() => setOpen(false)}>
          اقفل
        </button>
      </div>
      <p className="text-sm leading-7 text-muted">
        اكتبه انت، بكلامك وبتجربتك الحقيقية. الكتابة نفسها مراجعة للكورس، والناس بتعرف البوست المكتوب بـ AI. المشرف
        بيراجع بعد ما تكتب، مش بيكتب مكانك.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-line p-0.5 text-sm">
          {(["en", "ar"] as const).map((l) => (
            <button
              key={l}
              onClick={() => patch({ lang: l })}
              className={`rounded-md px-3 py-1 ${post.lang === l ? "bg-accent-soft font-bold text-accent" : "text-muted"}`}
            >
              {l === "en" ? "English" : "عربي"}
            </button>
          ))}
        </div>
        {!post.draft.trim() && (
          <button className="btn-ghost py-1.5" onClick={() => patch({ draft: SKELETON[post.lang](name) })}>
            حط أسئلة ترشدني
          </button>
        )}
      </div>

      {(notes.length > 0 || sessionNotes.length > 0) && (
        <details className="rounded-xl bg-bg p-3 text-sm">
          <summary className="cursor-pointer font-semibold">مادتك الخام: ملاحظاتك في الكورس ده</summary>
          <ul className="mt-2 max-h-56 space-y-2 overflow-y-auto leading-7">
            {notes.map((n) => (
              <li key={n.id}>
                <b dir="auto">{n.title || "بدون عنوان"}</b>
                <p className="line-clamp-3 text-muted" dir="auto">
                  {n.body}
                </p>
              </li>
            ))}
            {sessionNotes.map((s) => (
              <li key={s.id} className="text-muted" dir="auto">
                • {s.note}
              </li>
            ))}
          </ul>
        </details>
      )}

      <textarea
        className="input min-h-72 text-sm leading-7"
        dir={post.lang === "en" ? "ltr" : "rtl"}
        placeholder={
          post.lang === "en"
            ? "What did you learn? What was hard? How does it help your work?"
            : "اتعلمت إيه؟ إيه كان صعب؟ ده بيفيدك في شغلك إزاي؟"
        }
        value={post.draft}
        onChange={(e) => {
          patch({ draft: e.target.value });
          setCopied(false);
        }}
      />
      <p className={`text-xs ${own >= MIN_OWN ? "text-muted" : "text-warn"}`}>
        {own >= MIN_OWN ? `${own} حرف بكلامك ✓` : `كتبت ${own} حرف بكلامك — المراجعة بتشتغل من ${MIN_OWN}.`}
      </p>

      {useAi && (
        <button className="btn-ghost" disabled={busy || own < MIN_OWN} onClick={askReview}>
          <Icon name="spark" className="size-4" /> {busy ? "المشرف بيقرا..." : "خلّي المشرف يراجع"}
        </button>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {review && (
        <div className="space-y-3 rounded-xl border border-accent/40 p-3">
          <p className="text-sm font-bold">ملاحظات المشرف:</p>
          <ul className="list-disc space-y-1 ps-5 text-sm leading-7">
            {review.feedback.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          {review.edited && review.edited !== post.draft && (
            <>
              <p className="text-sm font-bold">نسخة متعدّلة (تعديل خفيف على كلامك):</p>
              <p
                className="whitespace-pre-wrap rounded-xl bg-bg p-3 text-sm leading-7"
                dir={post.lang === "en" ? "ltr" : "rtl"}
              >
                {review.edited}
              </p>
              <div className="flex gap-2">
                <button
                  className="btn-primary flex-1"
                  onClick={() => {
                    setUndo(post.draft);
                    patch({ draft: review.edited });
                    setReview(null);
                  }}
                >
                  خد التعديل
                </button>
                <button className="btn-ghost flex-1" onClick={() => setReview({ ...review, edited: "" })}>
                  خليني على نسختي
                </button>
              </div>
            </>
          )}
        </div>
      )}
      {undo !== null && !review && (
        <button
          className="text-xs text-muted underline"
          onClick={() => {
            patch({ draft: undo });
            setUndo(null);
          }}
        >
          رجّع نسختي قبل التعديل
        </button>
      )}

      <div className="flex flex-wrap gap-2 border-t border-line pt-4">
        <button className="btn-ghost" disabled={!post.draft.trim()} onClick={copy}>
          {copied ? "اتنسخ ✓" : "انسخ البوست"}
        </button>
        <a
          className={`btn-primary ${post.draft.trim() ? "" : "pointer-events-none opacity-40"}`}
          href={`https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(post.draft)}`}
          target="_blank"
          rel="noreferrer"
          onClick={copy}
        >
          افتح LinkedIn <Icon name="external" className="size-4" />
        </a>
      </div>
      <p className="text-xs leading-6 text-muted">
        لو النص مظهرش في LinkedIn لوحده، هو متنسخ — الصقه. حط لينك مشروعك على GitHub في البوست.
      </p>

      <div className="space-y-2 rounded-xl bg-bg p-3">
        {post.postedAt ? (
          <p className="text-sm">
            ✓ نشرته {new Date(post.postedAt).toLocaleDateString("ar-EG", { day: "numeric", month: "long" })}
            {post.url && (
              <a href={post.url} target="_blank" rel="noreferrer" className="ms-2 text-accent underline">
                افتح البوست
              </a>
            )}
          </p>
        ) : (
          <>
            <input
              className="input py-2 text-sm"
              dir="ltr"
              placeholder="لينك البوست بعد ما تنشره (اختياري)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button
              className="btn-primary w-full"
              disabled={!post.draft.trim()}
              onClick={() =>
                patch({ postedAt: Date.now(), url: /^https?:\/\//.test(url.trim()) ? url.trim() : undefined })
              }
            >
              نشرته ✓
            </button>
          </>
        )}
      </div>
    </section>
  );
}
