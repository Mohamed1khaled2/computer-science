"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api, useFeatures } from "@/lib/client";
import { currentCourse, currentTask, mentorContext } from "@/lib/journey";
import { type ChatMessage, CHAT_LIMIT, dueReviews, type Note, streak, useStore, weekMinutes } from "@/lib/store";
import Icon from "@/components/Icon";
import Markdown from "@/components/Markdown";

const HISTORY = 20; // عدد الرسايل اللي بتتبعت للموديل

const NOTE_HISTORY = 40; // أقصى عدد رسايل بيتحوّل لملاحظة (حد الـ API)

// عنوان من أول سطر في الرد، من غير علامات Markdown
function titleOf(text: string): string {
  const line = text.split("\n").find((l) => l.trim()) ?? "";
  const clean = line.replace(/[#*_`>]/g, "").trim();
  return clean.length > 60 ? clean.slice(0, 57) + "..." : clean;
}

const STARTERS = [
  "اشرحلي أهم فكرة في الدرس الحالي بمثال",
  "اتزنقت في مسألة — عايز تلميح بس، مش حل",
  "راجع من الشغل تعبان ومش قادر النهارده",
  "ساعدني أوزّع ساعات الأسبوع ده",
  "حاسس إني عايز أغيّر الكورس",
];

export default function MentorPage() {
  const { state, ready, update, syncKey } = useStore();
  const features = useFeatures();
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<Record<string, string>>({}); // message id → note id
  const router = useRouter();
  const endRef = useRef<HTMLDivElement>(null);
  const useAi = features.mentor && !!syncKey;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [state.chat.length, pending]);

  if (!ready) return <p className="text-muted">...</p>;

  const task = currentTask(state);
  const course = currentCourse(state);

  const addNote = (title: string, body: string): string => {
    const now = Date.now();
    const n: Note = { id: crypto.randomUUID(), title, body, courseId: course?.id, createdAt: now, updatedAt: now };
    update((s) => ({ ...s, notes: [...s.notes, n] }));
    return n.id;
  };

  // رد واحد → ملاحظة زي ما هو (من غير AI)، ومعاه سؤالك اللي قبله
  const saveReply = (m: ChatMessage) => {
    const i = state.chat.findIndex((x) => x.id === m.id);
    const q = state.chat.slice(0, i).findLast((x) => x.role === "user");
    const quote = q ? q.text.split("\n").map((l) => `> ${l}`).join("\n") + "\n\n" : "";
    const id = addNote(titleOf(m.text) || "من المشرف", quote + m.text);
    setSaved((s) => ({ ...s, [m.id]: id }));
  };

  // المحادثة كلها → المشرف يلخّصها في ملاحظة، وبعدين تتفتح في صفحة الملاحظات
  const saveChat = async () => {
    if (saving || !state.chat.length) return;
    setSaving(true);
    setError("");
    try {
      const messages = state.chat.slice(-NOTE_HISTORY).map(({ role, text }) => ({ role, text: text.slice(0, 8000) }));
      const r = await api<{ title: string; text: string }>("/api/mentor", syncKey, {
        method: "POST",
        body: JSON.stringify({ mode: "chatnote", context: mentorContext(state), messages }),
      });
      if (!r.text) throw new Error("المشرف مرجّعش حاجة. جرّب تاني.");
      const id = addNote(r.title || "ملخص محادثة مع المشرف", r.text);
      router.push(`/notes#${id}`);
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  };

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || pending !== null || !useAi) return;
    setError("");
    setInput("");
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", text: content, ts: Date.now() };
    const history = [...state.chat, userMsg].slice(-HISTORY).map(({ role, text }) => ({ role, text }));
    update((s) => ({ ...s, chat: [...s.chat, userMsg].slice(-CHAT_LIMIT) }));
    setPending("");
    let answer = "";
    try {
      const res = await fetch("/api/mentor", {
        method: "POST",
        headers: { "content-type": "application/json", "x-sync-key": syncKey },
        body: JSON.stringify({ mode: "chat", context: mentorContext(state), messages: history }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      const reader = res.body!.pipeThrough(new TextDecoderStream()).getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += value;
        setPending(answer);
      }
      if (!answer.trim()) throw new Error("المشرف مردّش. جرّب تاني.");
      const reply: ChatMessage = { id: crypto.randomUUID(), role: "model", text: answer.trim(), ts: Date.now() };
      update((s) => ({ ...s, chat: [...s.chat, reply].slice(-CHAT_LIMIT) }));
    } catch (e) {
      setError((e as Error).message);
      setInput(content);
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <section className="card flex h-[calc(100dvh-11rem)] flex-col p-0 md:h-[calc(100dvh-4rem)]">
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-accent text-bg">
              <Icon name="spark" />
            </span>
            <div>
              <h1 className="font-extrabold">المشرف</h1>
              <p className="text-xs text-muted">{useAi ? "عارف انت فين في الخطة · بيعلّم مش بيحل" : "مش متوصّل لسه"}</p>
            </div>
          </div>
          {state.chat.length > 0 && (
            <div className="flex shrink-0 items-center gap-3">
              {useAi && (
                <button
                  className="text-xs font-bold text-accent underline disabled:opacity-50"
                  disabled={saving || pending !== null}
                  onClick={saveChat}
                >
                  {saving ? "بيلخّص..." : "احفظها كملاحظة"}
                </button>
              )}
              <button
                className="text-xs text-muted underline"
                onClick={() =>
                  confirm("تبدأ محادثة جديدة؟ القديمة هتتمسح.") &&
                  update((s) => ({ ...s, chat: [], chatClearedAt: Date.now() }))
                }
              >
                محادثة جديدة
              </button>
            </div>
          )}
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {!state.chat.length && pending === null && (
            <div className="mx-auto max-w-md space-y-4 py-6 text-center">
              <p className="text-lg font-bold">أنا معاك في الرحلة كلها.</p>
              <p className="text-sm leading-7 text-muted">
                اسألني عن أي مفهوم، أو قولي اتزنقت فين وأديك تلميح واحد في المرة. مش هكتبلك حل مسألة — بس هفضل وراك لحد
                ما تحلها بنفسك.
              </p>
            </div>
          )}
          {state.chat.map((m) => (
            <div key={m.id}>
              <Bubble role={m.role} text={m.text} />
              {m.role === "model" && (
                <div className="mt-1 flex justify-end px-1 text-[11px] text-muted">
                  {saved[m.id] ? (
                    <Link href={`/notes#${saved[m.id]}`} className="text-accent underline">
                      اتحفظت · افتحها
                    </Link>
                  ) : (
                    <button className="underline hover:text-accent" onClick={() => saveReply(m)}>
                      احفظ الرد ده
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
          {pending !== null &&
            (pending ? (
              <Bubble role="model" text={pending} />
            ) : (
              <div className="flex gap-1 px-2 py-3">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="size-2 animate-bounce rounded-full bg-muted"
                    style={{ animationDelay: `${i * 120}ms` }}
                  />
                ))}
              </div>
            ))}
          <div ref={endRef} />
        </div>

        <div className="space-y-2 border-t border-line p-3">
          {!useAi ? (
            <p className="rounded-xl bg-warn-soft p-3 text-sm leading-7">
              المشرف محتاج <code dir="ltr">GEMINI_API_KEY</code> على السيرفر و الـ SYNC_KEY محفوظ في{" "}
              <Link href="/settings" className="underline">
                الإعدادات
              </Link>
              . لحد ما يتظبط، رسالة كل يوم في الصفحة الرئيسية بتتبني على حالتك من غير AI.
            </p>
          ) : (
            <>
              {!state.chat.length && (
                <div className="flex flex-wrap gap-1.5">
                  {STARTERS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-full border border-line px-3 py-1.5 text-xs hover:border-accent"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              {error && <p className="text-sm text-red-500">{error}</p>}
              <form
                className="flex items-end gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
              >
                <textarea
                  className="input max-h-40 min-h-11 resize-none"
                  rows={1}
                  dir="auto"
                  placeholder="اكتب للمشرف... (Enter للإرسال، Shift+Enter لسطر جديد)"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      send(input);
                    }
                  }}
                />
                <button
                  className="btn-primary size-11 shrink-0 p-0"
                  disabled={!input.trim() || pending !== null}
                  aria-label="إرسال"
                >
                  <Icon name="send" className="size-5 -scale-x-100" />
                </button>
              </form>
            </>
          )}
        </div>
      </section>

      <aside className="hidden space-y-4 lg:block">
        <section className="card space-y-3 text-sm">
          <h2 className="font-bold">اللي المشرف عارفه عنك</h2>
          <p className="text-xs leading-6 text-muted">بيتبعت مع كل رسالة عشان ميسألكش انت فين كل مرة.</p>
          <dl className="space-y-2">
            <Row k="الكورس" v={course ? <span dir="ltr">{course.name.split("(")[0]}</span> : "—"} />
            <Row k="الدرس" v={task ? <span dir="auto">{task.title}</span> : "—"} />
            <Row k="السلسلة" v={`${streak(state)} يوم`} />
            <Row k="الأسبوع" v={`${(weekMinutes(state) / 60).toFixed(1)} من ${state.weeklyHours} ساعة`} />
            <Row k="مراجعات" v={dueReviews(state).length} />
            <Row k="آخر ملاحظة" v={state.sessions.at(-1)?.note ?? "—"} />
          </dl>
        </section>
        <section className="card space-y-2 text-sm leading-7">
          <h2 className="font-bold">قواعد المشرف</h2>
          <ul className="list-disc space-y-1 ps-5 text-muted">
            <li>بيشرح المفاهيم براحته.</li>
            <li>في المسائل: سؤال أو تلميح واحد في المرة، من غير كود حل.</li>
            <li>بعد ما تحل لوحدك: يراجع حلّك ويوريك أحسن.</li>
            <li>مش هيوافقك تغيّر الخطة أو تبدأ من الأول.</li>
          </ul>
        </section>
      </aside>
    </div>
  );
}

function Bubble({ role, text }: { role: ChatMessage["role"]; text: string }) {
  if (role === "user") {
    return (
      <div className="flex justify-start">
        <p
          className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-ss-sm bg-accent px-3.5 py-2 text-sm leading-7 text-bg"
          dir="auto"
        >
          {text}
        </p>
      </div>
    );
  }
  return (
    <div className="flex justify-end">
      <div className="max-w-[90%] rounded-2xl rounded-se-sm bg-bg px-3.5 py-2 text-sm leading-7" dir="auto">
        <Markdown text={text} />
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[4.5rem_1fr] gap-2">
      <dt className="text-muted">{k}</dt>
      <dd className="line-clamp-3 min-w-0">{v}</dd>
    </div>
  );
}
