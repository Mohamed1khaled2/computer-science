"use client";

import Link from "next/link";
import { PHASES } from "@/lib/roadmap";
import { useStore } from "@/lib/store";
import { courseProgress, courseScore, credits, letter, milestones, studiedMinutes } from "@/lib/journey";
import Icon from "@/components/Icon";
import { PageHeader, Stat } from "@/components/ui";

// السجل الأكاديمي: زي كشف درجات الكلية، بس بأمانة إنه دراسة ذاتية مش شهادة
export default function TranscriptPage() {
  const { state, ready } = useStore();
  if (!ready) return <p className="text-muted">...</p>;

  const rows = PHASES.map((p) => ({
    phase: p,
    courses: p.courses.map((c) => {
      const cp = courseProgress(state, c.id);
      const skipped = state.statuses[c.id] === "skipped";
      const score = courseScore(state, c.id);
      return { c, cp, skipped, score, complete: cp.pct >= 1 && !skipped };
    }),
  }));
  const graded = rows.flatMap((r) => r.courses).filter((r) => r.complete && r.score !== null);
  const gpaCredits = graded.reduce((a, r) => a + credits(r.c), 0);
  const gpa = gpaCredits ? graded.reduce((a, r) => a + letter(r.score!).points * credits(r.c), 0) / gpaCredits : null;
  const earned = rows
    .flatMap((r) => r.courses)
    .filter((r) => r.complete)
    .reduce((a, r) => a + credits(r.c), 0);
  const total = rows.flatMap((r) => r.courses).reduce((a, r) => a + credits(r.c), 0);
  const ms = milestones(state);

  return (
    <div>
      <PageHeader
        title="السجل الأكاديمي"
        sub="كل كورس ليه ساعات معتمدة (≈ 45 ساعة شغل للساعة) وتقدير محسوب من درجات الممتحن. ده سجل دراستك الذاتية، مش شهادة جامعية."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="المعدل (من 4)" value={gpa === null ? "—" : gpa.toFixed(2)} sub="الكورسات المكتملة بامتحان" />
        <Stat label="ساعات معتمدة" value={`${earned}/${total}`} />
        <Stat label="ساعات مذاكرة فعلية" value={(studiedMinutes(state) / 60).toFixed(1)} />
        <Stat label="إنجازات" value={`${ms.filter((m) => m.done).length}/${ms.length}`} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          {rows.map(({ phase, courses }, i) => (
            <section key={phase.id} className="card overflow-hidden p-0">
              <div className="flex items-baseline justify-between border-b border-line bg-bg/60 px-4 py-3">
                <h2 className="font-bold">{phase.title}</h2>
                <span className="text-xs text-muted">الترم {i}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="text-xs text-muted">
                      <th className="px-4 py-2 text-start font-semibold">الكورس</th>
                      <th className="px-2 py-2 font-semibold">ساعات</th>
                      <th className="px-2 py-2 font-semibold">التقدم</th>
                      <th className="px-4 py-2 font-semibold">التقدير</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map(({ c, cp, skipped, score, complete }) => (
                      <tr key={c.id} className="border-t border-line">
                        <td className="px-4 py-2.5">
                          <Link href={`/course/${c.id}`} className="block hover:text-accent" dir="ltr">
                            <span className="block text-left">{c.name}</span>
                          </Link>
                        </td>
                        <td className="px-2 py-2.5 text-center tabular-nums">{credits(c)}</td>
                        <td className="px-2 py-2.5 text-center tabular-nums text-muted">
                          {skipped ? "متخطّى" : `${Math.round(cp.pct * 100)}%`}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {skipped ? (
                            <span className="text-muted">—</span>
                          ) : score !== null ? (
                            <span
                              className={`inline-block min-w-10 rounded-md px-2 py-0.5 font-bold ${
                                complete ? "bg-accent-soft text-accent" : "bg-bg text-muted"
                              }`}
                              title={complete ? `متوسط ${score.toFixed(1)}/10` : "تقدير مبدئي — الكورس لسه مخلصش"}
                            >
                              {letter(score).letter}
                              {!complete && "*"}
                            </span>
                          ) : (
                            <span className="text-muted">{cp.done ? "IP" : "—"}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
          <p className="text-xs leading-6 text-muted">
            * تقدير مبدئي لكورس لسه شغال. IP = In Progress. المهام اللي اتقفلت من غير إثبات بتتحسب صفر، والتقييم الذاتي
            مش داخل في التقدير.
          </p>
        </div>

        <aside className="space-y-4">
          <section className="card space-y-3">
            <h2 className="font-bold">الإنجازات</h2>
            <ul className="grid grid-cols-2 gap-2">
              {ms.map((m) => (
                <li
                  key={m.id}
                  title={m.hint}
                  className={`rounded-xl border p-2.5 text-center ${
                    m.done ? "border-gold/40 bg-gold-soft" : "border-line opacity-60"
                  }`}
                >
                  <span
                    className={`mx-auto grid size-8 place-items-center rounded-full ${m.done ? "text-gold" : "text-muted"}`}
                  >
                    <Icon name={m.done ? "cap" : "lock"} />
                  </span>
                  <span className="mt-1 block text-xs font-bold">{m.title}</span>
                  <span className="block text-[11px] leading-4 text-muted">{m.hint}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="card space-y-2 text-sm leading-7">
            <h2 className="font-bold">إزاي تقولها في الـ CV</h2>
            <p className="rounded-xl bg-bg p-3" dir="ltr">
              B.Sc. Information Systems + completed OSSU Computer Science curriculum (self-study)
            </p>
            <p className="text-muted">
              ومعاها لينكات مشاريع المراحل على GitHub. ده أقوى من أي ادعاء، ومحدش هيقدر يشكك فيه.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
