"use client";

import Link from "next/link";
import { useState } from "react";
import { attendance, dateIn, rate } from "@/lib/attendance";
import { useStore } from "@/lib/store";
import Icon from "./Icon";
import { CLASS_STATUS } from "./ui";

// محاضرات النهارده + نسبة الحضور، في العمود الجانبي للصفحة الرئيسية
export default function TodayClasses() {
  const { state } = useStore();
  const [now] = useState(() => Date.now());
  const tt = state.timetable;

  if (!tt?.slots.length) {
    return (
      <Link href="/attendance" className="card flex items-center gap-3 transition hover:border-accent/50">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
          <Icon name="calendar" />
        </span>
        <span className="text-sm leading-6">
          <b className="block">اعمل جدول محاضرات</b>
          <span className="text-muted">مواعيد ثابتة + تسجيل حضور وغياب زي الكلية.</span>
        </span>
      </Link>
    );
  }

  const records = attendance(state, now);
  const todayKey = dateIn(now, tt.tz);
  const today = records.filter((r) => r.date === todayKey);
  const next = records.find((r) => r.status === "upcoming");
  const month = rate(records.filter((r) => r.at >= now - 30 * 86_400_000 && r.at <= now));

  return (
    <Link href="/attendance" className="card block space-y-3 transition hover:border-accent/50">
      <div className="flex items-baseline justify-between">
        <p className="eyebrow">محاضرات النهارده</p>
        <span className="text-xs text-muted">
          الحضور {month.pct === null ? "—" : `${Math.round(month.pct * 100)}%`}
        </span>
      </div>
      {today.length ? (
        <ul className="space-y-2">
          {today.map((r) => (
            <li key={r.key} className="flex items-center justify-between text-sm">
              <span className="font-semibold">
                {new Date(r.at).toLocaleTimeString("ar-EG", { hour: "numeric", minute: "2-digit" })}
              </span>
              <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${CLASS_STATUS[r.status].style}`}>
                {CLASS_STATUS[r.status].label}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">
          النهارده إجازة.{" "}
          {next &&
            `الجاية: ${new Date(next.at).toLocaleString("ar-EG", { weekday: "long", hour: "numeric", minute: "2-digit" })}`}
        </p>
      )}
    </Link>
  );
}
