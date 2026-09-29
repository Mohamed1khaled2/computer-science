"use client";

import { useState } from "react";
import { api, calendarUrl, useFeatures } from "@/lib/client";
import { useStore } from "@/lib/store";

function at(dayOffset: number, hour: number): number {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, 0, 0, 0);
  return d.getTime();
}

function toLocalInput(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatWhen(ms: number): string {
  return new Date(ms).toLocaleString("ar-EG", { weekday: "long", hour: "numeric", minute: "2-digit" });
}

// بيسجّل الوعد ويجدول الإشعارات لو السيرفر متظبط
export function useSetPromise() {
  const { update, syncKey } = useStore();
  const features = useFeatures();
  return async (when: number, taskTitle: string): Promise<"scheduled" | "local" | string> => {
    const id = crypto.randomUUID();
    update((s) => ({ ...s, promises: [...s.promises, { id, at: when, createdAt: Date.now() }] }));
    if (!features.remind || !syncKey) return "local";
    try {
      await api("/api/remind", syncKey, {
        method: "POST",
        body: JSON.stringify({ promiseId: id, at: when, taskTitle }),
      });
      return "scheduled";
    } catch (e) {
      return (e as Error).message;
    }
  };
}

export default function ReturnPicker({ value, onChange }: { value: number | null; onChange: (ms: number) => void }) {
  const [now] = useState(() => Date.now());
  const chips = [
    { label: "النهارده 9م", ms: at(0, 21) },
    { label: "بكرة 7ص", ms: at(1, 7) },
    { label: "بكرة 9م", ms: at(1, 21) },
    { label: "بعد بكرة 7ص", ms: at(2, 7) },
  ].filter((c) => c.ms > now + 30 * 60_000);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <button
            type="button"
            key={c.label}
            onClick={() => onChange(c.ms)}
            className={`rounded-lg border px-3 py-1.5 text-sm ${
              value === c.ms ? "border-accent bg-accent-soft font-bold text-accent" : "border-line"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <input
        type="datetime-local"
        className="input"
        dir="ltr"
        min={toLocalInput(now)}
        value={value ? toLocalInput(value) : ""}
        onChange={(e) => e.target.value && onChange(new Date(e.target.value).getTime())}
      />
      {value && <p className="text-sm text-muted">معادك: {formatWhen(value)}</p>}
    </div>
  );
}

export function PromiseResult({ at, title, status }: { at: number; title: string; status: string }) {
  return (
    <div className="space-y-2 rounded-xl bg-accent-soft p-3 text-sm leading-7">
      <p>
        اتسجّل: <b>{formatWhen(at)}</b>.{" "}
        {status === "scheduled"
          ? "هيجيلك إشعار في المعاد، وتاني بعده بساعة ونص لو مجتش."
          : status === "local"
            ? "الإشعارات من السيرفر مش متظبطة لسه، فحطّه في الكالندر عشان الموبايل يفكّرك:"
            : `الإشعار متجدولش (${status}). حطّه في الكالندر:`}
      </p>
      {status !== "scheduled" && (
        <a className="btn-ghost w-full" href={calendarUrl(at, title)} target="_blank" rel="noreferrer">
          ضيفه على Google Calendar
        </a>
      )}
    </div>
  );
}
