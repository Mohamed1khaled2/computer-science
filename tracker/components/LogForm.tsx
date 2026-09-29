"use client";

import { useState } from "react";
import { TASKS, taskById } from "@/lib/tasks";
import { today, upcomingTasks, useStore } from "@/lib/store";
import ReturnPicker, { PromiseResult, useSetPromise } from "./ReturnPicker";

const MIN_NOTE = 30;

export default function LogForm({ initialMinutes, onClose }: { initialMinutes: number; onClose: () => void }) {
  const { state, update } = useStore();
  const setPromise = useSetPromise();
  const [minutes, setMinutes] = useState(initialMinutes);
  const [taskId, setTaskId] = useState(() => upcomingTasks(state, 1)[0]?.id ?? TASKS[0].id);
  const [note, setNote] = useState("");
  const [returnAt, setReturnAt] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ at: number; status: string } | null>(null);

  const task = taskById(taskId)!;
  const noteOk = note.trim().length >= MIN_NOTE;
  const ready = noteOk && returnAt !== null && minutes > 0;

  const save = async () => {
    if (!ready) return;
    setSaving(true);
    update((s) => ({
      ...s,
      statuses: s.statuses[task.courseId] ? s.statuses : { ...s.statuses, [task.courseId]: "doing" },
      sessions: [
        ...s.sessions,
        {
          id: crypto.randomUUID(),
          date: today(),
          minutes,
          courseId: task.courseId,
          taskId,
          note: note.trim(),
          ts: Date.now(),
        },
      ],
    }));
    const next = upcomingTasks(state, 1)[0] ?? task;
    const status = await setPromise(returnAt, next.title);
    setResult({ at: returnAt, status });
    setSaving(false);
  };

  if (result) {
    return (
      <section className="card space-y-3">
        <h2 className="font-bold">جلسة متسجلة ✓</h2>
        <PromiseResult at={result.at} title={task.title} status={result.status} />
        <button className="btn-primary w-full" onClick={onClose}>
          تمام
        </button>
      </section>
    );
  }

  return (
    <section className="card space-y-4">
      <h2 className="font-bold">سجّل الجلسة</h2>
      <label className="block space-y-1">
        <span className="text-sm text-muted">دقايق</span>
        <input
          className="input"
          type="number"
          inputMode="numeric"
          min={1}
          value={minutes}
          onChange={(e) => setMinutes(Math.max(1, Number(e.target.value) || 1))}
        />
      </label>
      <label className="block space-y-1">
        <span className="text-sm text-muted">اشتغلت على</span>
        <select className="input" value={taskId} onChange={(e) => setTaskId(e.target.value)} dir="ltr">
          {TASKS.filter((t) => !state.tasks[t.id]?.doneAt || t.id === taskId)
            .slice(0, 40)
            .map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
        </select>
      </label>
      <label className="block space-y-1">
        <span className="text-sm text-muted">اتعلمت إيه؟ اشرحه بكلامك كأنك بتشرحه لحد (ده أهم سطر)</span>
        <textarea className="input min-h-24" value={note} onChange={(e) => setNote(e.target.value)} />
        {!noteOk && (
          <span className="text-xs text-warn">لسه {MIN_NOTE - note.trim().length} حرف — جملة واحدة حقيقية كفاية.</span>
        )}
      </label>
      <div className="space-y-1">
        <span className="text-sm font-semibold">هترجع إمتى؟ (لازم)</span>
        <ReturnPicker value={returnAt} onChange={setReturnAt} />
      </div>
      <div className="flex gap-2">
        <button className="btn-primary flex-1" onClick={save} disabled={!ready || saving}>
          {saving ? "..." : "حفظ + ثبّت المعاد"}
        </button>
        <button className="btn-ghost" onClick={onClose}>
          إلغاء
        </button>
      </div>
    </section>
  );
}
