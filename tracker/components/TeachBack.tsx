"use client";

import { useEffect, useRef, useState } from "react";
import { mentorContext } from "@/lib/journey";
import type { Task } from "@/lib/tasks";
import { useStore } from "@/lib/store";
import Icon from "./Icon";
import Markdown from "./Markdown";

type Msg = { role: "user" | "model"; text: string };

const MIN_TURNS = 3;

// "اشرح للمشرف": المشرف بيمثّل إنه زميل فاتته المحاضرة، وانت بتشرحله (protégé effect).
// لما تخلص، المحادثة بتروح للممتحن بدل الإجابات المكتوبة.
export default function TeachBack({
  task,
  busy,
  onGrade,
}: {
  task: Task;
  busy: boolean;
  onGrade: (transcript: string, madaText: string) => void;
}) {
  const { state, syncKey } = useStore();
  const intro = `أنا فاتتني محاضرة "${task.title}" 😅 ممكن تشرحهالي؟ ابدأ بأهم فكرة فيها، وبمثال لو ينفع.`;
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [msgs.length, pending]);

  const madaTurns = msgs.filter((m) => m.role === "user");
  const madaText = madaTurns.map((m) => m.text).join("\n\n");
  const canGrade = madaTurns.length >= MIN_TURNS && madaText.length >= 200 && pending === null && !busy;

  const send = async () => {
    const text = input.trim();
    if (!text || pending !== null) return;
    const next = [...msgs, { role: "user" as const, text }];
    setMsgs(next);
    setInput("");
    setError("");
    setPending("");
    let answer = "";
    try {
      const res = await fetch("/api/mentor", {
        method: "POST",
        headers: { "content-type": "application/json", "x-sync-key": syncKey },
        body: JSON.stringify({
          mode: "teach",
          context: mentorContext(state),
          task: { title: task.title, url: task.url, check: task.check },
          messages: next.slice(-20),
        }),
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
      setMsgs([...next, { role: "model", text: answer.trim() || "..." }]);
    } catch (e) {
      setError((e as Error).message);
      setMsgs(msgs);
      setInput(text);
    } finally {
      setPending(null);
    }
  };

  const transcript = [`زميل: ${intro}`, ...msgs.map((m) => `${m.role === "user" ? "مادا" : "زميل"}: ${m.text}`)].join(
    "\n\n",
  );

  return (
    <div className="space-y-3">
      <p className="text-sm leading-7 text-muted">
        من غير ما تبص في الدرس. الزميل هيسأل ويستعبط — اشرح لحد ما يفهم. بعد {MIN_TURNS} ردود على الأقل، الممتحن بيقيّم
        شرحك على أسئلة الدرس.
      </p>
      <div className="max-h-[26rem] space-y-2 overflow-y-auto rounded-xl bg-bg p-3">
        <Bubble role="model" text={intro} />
        {msgs.map((m, i) => (
          <Bubble key={i} role={m.role} text={m.text} />
        ))}
        {pending !== null && <Bubble role="model" text={pending || "..."} />}
        <div ref={endRef} />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex items-end gap-2">
        <textarea
          className="input max-h-40 min-h-11 resize-none"
          rows={2}
          dir="auto"
          placeholder="اشرحله..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              send();
            }
          }}
        />
        <button
          className="btn-primary size-11 shrink-0 p-0"
          disabled={!input.trim() || pending !== null}
          onClick={send}
          aria-label="إرسال"
        >
          <Icon name="send" className="size-5 -scale-x-100" />
        </button>
      </div>
      <button className="btn-primary w-full" disabled={!canGrade} onClick={() => onGrade(transcript, madaText)}>
        {busy ? "بيقيّم..." : canGrade ? "خلّصت الشرح — قيّمني" : `كمّل الشرح (${madaTurns.length}/${MIN_TURNS})`}
      </button>
    </div>
  );
}

function Bubble({ role, text }: Msg) {
  return role === "user" ? (
    <div className="flex justify-start">
      <p
        className="max-w-[85%] whitespace-pre-wrap rounded-2xl bg-accent px-3 py-1.5 text-sm leading-7 text-bg"
        dir="auto"
      >
        {text}
      </p>
    </div>
  ) : (
    <div className="flex justify-end">
      <div className="max-w-[90%] rounded-2xl bg-card px-3 py-1.5 text-sm leading-7" dir="auto">
        <span className="mb-0.5 block text-[11px] font-bold text-muted">زميل</span>
        <Markdown text={text} />
      </div>
    </div>
  );
}
