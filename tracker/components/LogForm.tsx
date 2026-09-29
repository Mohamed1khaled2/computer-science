"use client";

import { useState } from "react";
import { PHASES } from "@/lib/roadmap";
import { today, useStore } from "@/lib/store";

export default function LogForm({
  initialMinutes,
  defaultCourseId,
  onClose,
}: {
  initialMinutes: number;
  defaultCourseId?: string;
  onClose: () => void;
}) {
  const { state, update } = useStore();
  const [minutes, setMinutes] = useState(initialMinutes);
  const [courseId, setCourseId] = useState(defaultCourseId ?? PHASES[0].courses[0].id);
  const [note, setNote] = useState("");
  const [nextStep, setNextStep] = useState(state.nextStep);

  const save = () => {
    update((s) => ({
      ...s,
      nextStep: nextStep.trim(),
      statuses: s.statuses[courseId] === "done" ? s.statuses : { ...s.statuses, [courseId]: "doing" },
      sessions: [
        ...s.sessions,
        { id: crypto.randomUUID(), date: today(), minutes, courseId, note: note.trim(), ts: Date.now() },
      ],
    }));
    onClose();
  };

  return (
    <section className="card space-y-3">
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
        <span className="text-sm text-muted">الكورس</span>
        <select className="input" value={courseId} onChange={(e) => setCourseId(e.target.value)} dir="ltr">
          {PHASES.map((p) => (
            <optgroup key={p.id} label={p.title}>
              {p.courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
      <label className="block space-y-1">
        <span className="text-sm text-muted">اتعلمت إيه؟ اشرحه في جملتين كأنك بتشرحه لحد (ده أهم سطر)</span>
        <textarea className="input min-h-24" value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      <label className="block space-y-1">
        <span className="text-sm text-muted">أول حاجة هتعملها المرة الجاية (محددة: &quot;PS2 سؤال 3&quot; مش &quot;أكمل&quot;)</span>
        <input className="input" value={nextStep} onChange={(e) => setNextStep(e.target.value)} />
      </label>
      <div className="flex gap-2">
        <button className="btn-primary flex-1" onClick={save}>
          حفظ
        </button>
        <button className="btn-ghost" onClick={onClose}>
          إلغاء
        </button>
      </div>
    </section>
  );
}
