"use client";

import { courseById } from "@/lib/roadmap";
import { useStore } from "@/lib/store";

export default function LogPage() {
  const { state, ready, update } = useStore();
  if (!ready) return <p className="text-muted">...</p>;

  const sessions = [...state.sessions].reverse();
  if (!sessions.length) return <p className="card text-muted">لسه مفيش جلسات. أول جلسة هتظهر هنا.</p>;

  const byDate = new Map<string, typeof sessions>();
  for (const s of sessions) byDate.set(s.date, [...(byDate.get(s.date) ?? []), s]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        ده دليلك إنك ماشي. لما تحس إنك مش بتتقدم، ارجع اقرا هنا.
      </p>
      {[...byDate.entries()].map(([date, list]) => (
        <section key={date} className="card space-y-3">
          <div className="flex justify-between text-sm">
            <b>{new Date(date).toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" })}</b>
            <span className="text-muted">{list.reduce((a, s) => a + s.minutes, 0)} د</span>
          </div>
          {list.map((s) => (
            <div key={s.id} className="border-t border-line pt-2">
              <div className="flex items-center justify-between gap-2 text-xs text-muted">
                <span dir="ltr" className="truncate">
                  {courseById(s.courseId)?.name ?? s.courseId}
                </span>
                <span className="shrink-0">{s.minutes} د</span>
              </div>
              {s.note && <p className="mt-1 whitespace-pre-wrap text-sm leading-7">{s.note}</p>}
              <button
                className="mt-1 text-xs text-muted underline"
                onClick={() =>
                  confirm("تمسح الجلسة دي؟") &&
                  update((st) => ({
                    ...st,
                    sessions: st.sessions.filter((x) => x.id !== s.id),
                    deletedIds: [...st.deletedIds, s.id],
                  }))
                }
              >
                مسح
              </button>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
