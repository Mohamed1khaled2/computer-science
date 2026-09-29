"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api, useFeatures } from "@/lib/client";
import { fallbackDaily, mentorContext } from "@/lib/journey";
import { today, useStore } from "@/lib/store";
import Icon from "./Icon";

// رسالة المشرف لليوم: بتتولّد مرة واحدة في اليوم (Gemini)، ومن غيره رسالة مبنية على حالتك
export default function MentorNote() {
  const { state, update, syncKey } = useStore();
  const features = useFeatures();
  const [loading, setLoading] = useState(false);
  const asked = useRef(false);
  const cached = state.daily?.date === today() ? state.daily.text : null;
  const useAi = features.mentor && !!syncKey;

  useEffect(() => {
    if (!useAi || cached || asked.current) return;
    asked.current = true;
    setLoading(true);
    api<{ text: string }>("/api/mentor", syncKey, {
      method: "POST",
      body: JSON.stringify({ mode: "daily", context: mentorContext(state) }),
    })
      .then((r) => r.text && update((s) => ({ ...s, daily: { date: today(), text: r.text } })))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [useAi, cached, syncKey, state, update]);

  const text = cached ?? (loading ? null : fallbackDaily(state));

  return (
    <section className="card flex gap-3 border-accent/30">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
        <Icon name="spark" />
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        <p className="eyebrow">من المشرف</p>
        {text ? (
          <p className="leading-8">{text}</p>
        ) : (
          <div className="space-y-2 py-1">
            <span className="block h-3 w-4/5 animate-pulse rounded bg-line" />
            <span className="block h-3 w-3/5 animate-pulse rounded bg-line" />
          </div>
        )}
        <Link href="/mentor" className="inline-flex items-center gap-1 text-sm font-semibold text-accent">
          كلّمه <Icon name="arrow" className="size-4" />
        </Link>
      </div>
    </section>
  );
}
