"use client";

import { useState } from "react";
import { api, useFeatures } from "@/lib/client";
import { absentStreak, attendance, type ClassRecord, DAYS, rate, type Slot, thisWeek } from "@/lib/attendance";
import { useStore } from "@/lib/store";
import { CLASS_STATUS, PageHeader, Stat } from "@/components/ui";

// ترتيب الأسبوع يبدأ السبت
const WEEK_ORDER = [6, 0, 1, 2, 3, 4, 5];
const PRESET: Slot[] = [0, 1, 2, 3, 4].map((day) => ({ day, time: "21:00" })).concat({ day: 5, time: "10:00" });

function calendarLink(days: number[], time: string): string {
  const BY = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
  const now = new Date();
  const [h, m] = time.split(":").map(Number);
  // أول يوم من الأيام دي جاي
  const start = new Date(now);
  for (let i = 0; i < 8; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    d.setHours(h, m, 0, 0);
    if (days.includes(d.getDay()) && d.getTime() > now.getTime()) {
      start.setTime(d.getTime());
      break;
    }
  }
  const fmt = (ms: number) =>
    new Date(ms)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "محاضرة CS — مسار مادا",
    dates: `${fmt(start.getTime())}/${fmt(start.getTime() + 45 * 60_000)}`,
    recur: `RRULE:FREQ=WEEKLY;BYDAY=${days.map((d) => BY[d]).join(",")}`,
    details: "افتح مسار مادا وابدأ 10 دقايق. أي جلسة في المعاد بتتحسب حضور.",
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

export default function AttendancePage() {
  const { state, ready, update, syncKey } = useStore();
  const features = useFeatures();
  const [draft, setDraft] = useState<Slot[] | null>(null);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [now] = useState(() => Date.now());
  if (!ready) return <p className="text-muted">...</p>;

  const tt = state.timetable;
  const slots = draft ?? tt?.slots ?? [];
  const records = attendance(state, now);
  const past = records.filter((r) => r.status !== "upcoming");
  const month = rate(past.filter((r) => r.at >= now - 30 * 86_400_000));
  const week = tt ? rate(thisWeek(records, now, tt.tz)) : { attended: 0, total: 0, pct: null };
  const streakAbsent = absentStreak(records);
  const extra = state.sessions.filter(
    (x) =>
      !records.some(
        (r) => x.ts - x.minutes * 60_000 >= r.at - 2 * 3_600_000 && x.ts - x.minutes * 60_000 <= r.at + 3 * 3_600_000,
      ),
  ).length;

  const setDay = (day: number, time: string | null) => {
    const rest = slots.filter((s) => s.day !== day);
    setDraft(time ? [...rest, { day, time }] : rest);
  };

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    setMsg("");
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    update((s) => ({ ...s, timetable: { slots: draft, tz, since: s.timetable?.since ?? Date.now() } }));
    if (features.remind && syncKey) {
      try {
        await api("/api/timetable", syncKey, { method: "POST", body: JSON.stringify({ tz, slots: draft }) });
        setMsg("اتحفظ ✓ هيجيلك إشعار في معاد كل محاضرة، وبعدها بـ 3 ساعات إشعار الحضور أو الغياب.");
      } catch (e) {
        setMsg(`الجدول اتحفظ، بس الإشعارات متجدولتش: ${(e as Error).message}`);
      }
    } else {
      setMsg("اتحفظ ✓ إشعارات السيرفر مش متظبطة، فضيف الجدول على Google Calendar من اللينكات تحت.");
    }
    setDraft(null);
    setSaving(false);
  };

  const toggleExcuse = (key: string) =>
    update((s) => ({
      ...s,
      excused: s.excused.includes(key) ? s.excused.filter((k) => k !== key) : [...s.excused, key],
    }));

  const byTime = new Map<string, number[]>();
  for (const s of tt?.slots ?? []) byTime.set(s.time, [...(byTime.get(s.time) ?? []), s.day]);

  return (
    <div>
      <PageHeader
        title="الجدول والحضور"
        sub="زي الكلية: ليك جدول محاضرات ثابت، وأي جلسة تبدأها من ساعتين قبل المحاضرة لحد 3 ساعات بعدها بتتحسب حضور. بعد 30 دقيقة من المعاد = متأخر."
      />

      {tt?.slots.length ? (
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat
            label="الحضور آخر 30 يوم"
            value={month.pct === null ? "—" : `${Math.round(month.pct * 100)}%`}
            sub={`${month.attended} من ${month.total} محاضرة`}
          />
          <Stat label="الأسبوع ده" value={`${week.attended}/${week.total}`} sub="اللي عدّى لحد دلوقتي" />
          <Stat label="غياب متتالي" value={streakAbsent} sub={streakAbsent >= 2 ? "ارجع في اللي جاية" : "تمام"} />
          <Stat label="جلسات إضافية" value={extra} sub="برا الجدول — بونص" />
        </div>
      ) : null}

      {month.pct !== null && month.pct < 0.75 && month.total >= 4 && (
        <section className="card mb-6 border-warn/40 bg-warn-soft text-sm leading-7">
          <b className="text-warn">حضورك تحت 75%.</b> في الكلية ده كان هيبقى حرمان. هنا مفيش حرمان — بس غالبًا الجدول
          تقيل على طاقتك الحقيقية. شيل محاضرة أو اتنين وخلّيه جدول تقدر تلتزم بيه.
        </section>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="card space-y-4 md:p-6">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-lg font-extrabold">جدول المحاضرات</h2>
            {!slots.length && (
              <button className="text-xs font-semibold text-accent underline" onClick={() => setDraft(PRESET)}>
                اقتراح: بعد الشغل
              </button>
            )}
          </div>
          <ul className="divide-y divide-line">
            {WEEK_ORDER.map((day) => {
              const slot = slots.find((s) => s.day === day);
              return (
                <li key={day} className="flex items-center justify-between gap-3 py-2.5">
                  <label className="flex items-center gap-2 font-semibold">
                    <input
                      type="checkbox"
                      className="size-4 accent-[var(--accent)]"
                      checked={!!slot}
                      onChange={(e) => setDay(day, e.target.checked ? "21:00" : null)}
                    />
                    {DAYS[day]}
                  </label>
                  {slot ? (
                    <input
                      type="time"
                      className="input w-32 py-1.5"
                      dir="ltr"
                      value={slot.time}
                      onChange={(e) => e.target.value && setDay(day, e.target.value)}
                    />
                  ) : (
                    <span className="text-sm text-muted">إجازة</span>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="text-xs leading-6 text-muted">
            {slots.length} محاضرات في الأسبوع. كن واقعي: جدول 4 محاضرات بتحضرهم أحسن من 7 بتغيب عن نصهم.
          </p>
          <button className="btn-primary w-full" disabled={!draft || saving} onClick={save}>
            {saving ? "..." : "احفظ الجدول"}
          </button>
          {msg && <p className="text-sm leading-7">{msg}</p>}
          {byTime.size > 0 && !(features.remind && syncKey) && (
            <div className="space-y-2 border-t border-line pt-3">
              <p className="text-sm font-semibold">ضيفه على Google Calendar (تذكير متكرر):</p>
              {[...byTime].map(([time, days]) => (
                <a
                  key={time}
                  className="btn-ghost w-full"
                  href={calendarLink(days, time)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {days.map((d) => DAYS[d]).join("، ")} — {time}
                </a>
              ))}
            </div>
          )}
        </section>

        <section className="card space-y-3 md:p-6">
          <h2 className="text-lg font-extrabold">كشف الحضور</h2>
          {records.length ? (
            <ul className="divide-y divide-line">
              {[...records]
                .reverse()
                .filter((r) => r.status !== "upcoming" || r.at < now + 3 * 86_400_000)
                .slice(0, 40)
                .map((r) => (
                  <Row key={r.key} r={r} onExcuse={() => toggleExcuse(r.key)} />
                ))}
            </ul>
          ) : (
            <p className="text-sm leading-7 text-muted">
              {tt?.slots.length ? "أول محاضرة هتظهر هنا." : "اعمل جدولك الأول، والكشف هيبدأ من النهارده."}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function Row({ r, onExcuse }: { r: ClassRecord; onExcuse: () => void }) {
  const st = CLASS_STATUS[r.status];
  return (
    <li className="flex items-center justify-between gap-2 py-2.5 text-sm">
      <span>
        <b>{new Date(r.at).toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "short" })}</b>
        <span className="ms-2 text-muted">
          {new Date(r.at).toLocaleTimeString("ar-EG", { hour: "numeric", minute: "2-digit" })}
        </span>
      </span>
      <span className="flex items-center gap-2">
        {(r.status === "absent" || r.status === "excused") && (
          <button className="text-xs text-muted underline" onClick={onExcuse}>
            {r.status === "absent" ? "كان عندي عذر" : "شيل العذر"}
          </button>
        )}
        <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${st.style}`}>{st.label}</span>
      </span>
    </li>
  );
}
