"use client";

import { minutesByDay } from "@/lib/journey";
import { type State, today } from "@/lib/store";

const WEEKS = 20;
const LEVELS = [0, 1, 30, 60, 120]; // دقايق
const FILL = ["bg-line", "bg-accent/30", "bg-accent/55", "bg-accent/80", "bg-accent"];

function level(min: number) {
  let l = 0;
  for (let i = 1; i < LEVELS.length; i++) if (min >= LEVELS[i]) l = i;
  return l;
}

// خريطة أيام المذاكرة (زي GitHub): عمود = أسبوع يبدأ السبت، الأقدم على اليمين
export default function Heatmap({ state }: { state: State }) {
  const byDay = minutesByDay(state);
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - ((now.getDay() + 1) % 7) - (WEEKS - 1) * 7);
  const todayKey = today(now);

  const weeks = Array.from({ length: WEEKS }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = new Date(start);
      date.setDate(start.getDate() + w * 7 + d);
      const key = today(date);
      return { key, min: byDay.get(key) ?? 0, future: key > todayKey, date };
    }),
  );
  const activeDays = [...byDay.keys()].filter((k) => k >= today(start)).length;

  return (
    <section className="card space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="font-bold">أيام المذاكرة</h2>
        <span className="text-xs text-muted">
          {activeDays} يوم في آخر {WEEKS} أسبوع
        </span>
      </div>
      <div className="flex gap-[3px]">
        {weeks.map((week, w) => (
          <div key={w} className="flex flex-1 flex-col gap-[3px]">
            {week.map((d) => (
              <span
                key={d.key}
                title={`${d.date.toLocaleDateString("ar-EG", { weekday: "short", day: "numeric", month: "short" })}: ${
                  d.min ? `${d.min} دقيقة` : "مفيش"
                }`}
                className={`aspect-square w-full rounded-[3px] ${d.future ? "opacity-0" : FILL[level(d.min)]} ${
                  d.key === todayKey ? "ring-1 ring-text/50" : ""
                }`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-1 text-[11px] text-muted">
        أقل
        {FILL.map((f) => (
          <span key={f} className={`size-2.5 rounded-[3px] ${f}`} />
        ))}
        أكتر
      </div>
    </section>
  );
}
