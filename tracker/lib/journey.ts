// حسابات مشتقة من الـ state: التقدم، الدرجات، الإنجازات، والسياق اللي بيتبعت للمشرف.
// كله pure عشان يتستخدم في أي صفحة.

import { ALL_COURSES, type Course, PHASES, type Phase, phaseOf } from "./roadmap";
import { tasksOf, type Task } from "./tasks";
import {
  daysBetween,
  dueReviews,
  isDone,
  lastBrokenPromise,
  type State,
  streak,
  today,
  upcomingTasks,
  weekMinutes,
} from "./store";

export type Progress = { done: number; total: number; pct: number; hoursLeft: number; hoursTotal: number };

function closed(s: State, courseId: string) {
  const st = s.statuses[courseId];
  return st === "done" || st === "skipped";
}

export function courseProgress(s: State, courseId: string): Progress {
  const tasks = tasksOf(courseId);
  const all = closed(s, courseId);
  const done = all ? tasks.length : tasks.filter((t) => isDone(s, t.id)).length;
  const hoursTotal = tasks.reduce((a, t) => a + t.minutes / 60, 0);
  const hoursLeft = all ? 0 : tasks.reduce((a, t) => a + (isDone(s, t.id) ? 0 : t.minutes / 60), 0);
  return { done, total: tasks.length, pct: tasks.length ? done / tasks.length : 0, hoursLeft, hoursTotal };
}

export function phaseProgress(s: State, phase: Phase): Progress {
  const list = phase.courses.map((c) => courseProgress(s, c.id));
  const hoursTotal = list.reduce((a, p) => a + p.hoursTotal, 0);
  const hoursLeft = list.reduce((a, p) => a + p.hoursLeft, 0);
  return {
    done: list.reduce((a, p) => a + p.done, 0),
    total: list.reduce((a, p) => a + p.total, 0),
    pct: hoursTotal ? 1 - hoursLeft / hoursTotal : 0,
    hoursLeft,
    hoursTotal,
  };
}

// التقدم الكلي بالساعات، مش بعدد المهام (مهمة Missing Semester مش زي أسبوع Calculus)
export function overallProgress(s: State): Progress {
  const list = PHASES.map((p) => phaseProgress(s, p));
  const hoursTotal = list.reduce((a, p) => a + p.hoursTotal, 0);
  const hoursLeft = list.reduce((a, p) => a + p.hoursLeft, 0);
  return {
    done: list.reduce((a, p) => a + p.done, 0),
    total: list.reduce((a, p) => a + p.total, 0),
    pct: hoursTotal ? 1 - hoursLeft / hoursTotal : 0,
    hoursLeft,
    hoursTotal,
  };
}

export function currentTask(s: State): Task | undefined {
  return upcomingTasks(s, 1)[0];
}

export function currentCourse(s: State): Course | undefined {
  const t = currentTask(s);
  return t ? ALL_COURSES.find((c) => c.id === t.courseId) : undefined;
}

export function currentPhaseIndex(s: State): number {
  const t = currentTask(s);
  if (!t) return PHASES.length;
  return PHASES.findIndex((p) => p.courses.some((c) => c.id === t.courseId));
}

export function etaDate(s: State, hoursLeft: number): string {
  const d = new Date();
  d.setDate(d.getDate() + Math.ceil((hoursLeft / Math.max(1, s.weeklyHours)) * 7));
  return d.toLocaleDateString("ar-EG", { month: "long", year: "numeric" });
}

// ---------- المواعيد ----------

export type Schedule = {
  hoursLeft: number;
  start: Date; // متوقع تبدأ (لو الكورسات اللي قبله لسه)
  end: Date; // متوقع تخلص
  hoursBefore: number; // ساعات الكورسات اللي قبله في الترتيب ولسه مخلصتش
};

function plusWeeks(weeks: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + Math.ceil(weeks * 7));
  return d;
}

// الكورسات ماشية ورا بعض بالترتيب، بعدد ساعاتك في الأسبوع
export function schedule(s: State): Map<string, Schedule> {
  const weekly = Math.max(1, s.weeklyHours);
  const out = new Map<string, Schedule>();
  let before = 0;
  for (const c of ALL_COURSES) {
    const left = courseProgress(s, c.id).hoursLeft;
    if (left <= 0) continue;
    out.set(c.id, {
      hoursLeft: left,
      hoursBefore: before,
      start: plusWeeks(before / weekly),
      end: plusWeeks((before + left) / weekly),
    });
    before += left;
  }
  return out;
}

export function fmtDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d + "T12:00:00") : d;
  return date.toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" });
}

// عشان تلحق الموعد: كل الساعات لحد آخر الكورس ده (هو + اللي قبله) على الأسابيع الفاضلة
export function deadlineNeed(sch: Schedule, deadline: string): { days: number; perWeek: number } {
  const days = Math.ceil((Date.parse(deadline + "T23:59:59") - Date.now()) / 86_400_000);
  const perWeek = (sch.hoursBefore + sch.hoursLeft) / Math.max(days / 7, 1 / 7);
  return { days, perWeek };
}

export function studiedMinutes(s: State, courseId?: string): number {
  return s.sessions.filter((x) => !courseId || x.courseId === courseId).reduce((a, x) => a + x.minutes, 0);
}

// ---------- السجل الأكاديمي ----------

// ساعة معتمدة ≈ 45 ساعة شغل (محاضرات + مذاكرة + واجبات)، زي النظام الأمريكي تقريبًا
export function credits(c: Course): number {
  return Math.max(1, Math.round(c.hours / 45));
}

// متوسط درجات الممتحن للمهام اللي اتقفلت بإثبات (الـ forced بتتحسب صفر)
export function courseScore(s: State, courseId: string): number | null {
  const scores = tasksOf(courseId)
    .map((t) => s.tasks[t.id])
    .filter((p) => p?.doneAt && p.proof !== "self")
    .map((p) => (p!.proof === "forced" ? 0 : (p!.score ?? 0)));
  return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
}

const GRADES: [number, string, number][] = [
  [9.3, "A", 4],
  [9, "A-", 3.7],
  [8.7, "B+", 3.3],
  [8.3, "B", 3],
  [8, "B-", 2.7],
  [7.7, "C+", 2.3],
  [7.3, "C", 2],
  [7, "C-", 1.7],
  [0, "F", 0],
];

export function letter(score: number): { letter: string; points: number } {
  const [, l, p] = GRADES.find(([min]) => score >= min)!;
  return { letter: l, points: p };
}

// ---------- الإنجازات ----------

export type Milestone = { id: string; title: string; hint: string; done: boolean };

export function milestones(s: State): Milestone[] {
  const hours = studiedMinutes(s) / 60;
  const tasksDone = Object.values(s.tasks).filter((t) => t.doneAt).length;
  const aiPassed = Object.values(s.tasks).filter((t) => t.proof === "ai").length;
  const perfect = Object.values(s.tasks).some((t) => t.proof === "ai" && t.score === 10);
  const st = streak(s);
  const comeback = s.sessions.some((x, i) => i > 0 && daysBetween(s.sessions[i - 1].date, x.date) >= 4);
  const phaseDone = (i: number) => phaseProgress(s, PHASES[i]).pct >= 1;
  return [
    { id: "first", title: "أول جلسة", hint: "سجّل أول جلسة مذاكرة", done: s.sessions.length > 0 },
    { id: "task1", title: "أول إثبات", hint: "اقفل أول مهمة بإجابة الأسئلة", done: tasksDone > 0 },
    { id: "streak7", title: "أسبوع متواصل", hint: "7 أيام من غير ما تفوّت مرتين", done: st >= 7 },
    { id: "h10", title: "10 ساعات", hint: "إجمالي 10 ساعات مذاكرة", done: hours >= 10 },
    { id: "comeback", title: "الرجوع", hint: "رجعت بعد انقطاع 4 أيام أو أكتر — ودي أصعب حاجة", done: comeback },
    { id: "ai5", title: "5 امتحانات", hint: "انجح في 5 مهام قدام الممتحن", done: aiPassed >= 5 },
    { id: "perfect", title: "10/10", hint: "درجة كاملة في مهمة", done: perfect },
    { id: "streak30", title: "شهر متواصل", hint: "30 يوم سلسلة", done: st >= 30 },
    { id: "h50", title: "50 ساعة", hint: "إجمالي 50 ساعة", done: hours >= 50 },
    { id: "p0", title: "خلّصت التجهيز", hint: "خلّص المرحلة 0", done: phaseDone(0) },
    { id: "p1", title: "مبرمج بإيده", hint: "خلّص المرحلة 1 (MIT 6.100L)", done: phaseDone(1) },
    { id: "h100", title: "100 ساعة", hint: "إجمالي 100 ساعة", done: hours >= 100 },
  ];
}

// ---------- خريطة الأيام ----------

export function minutesByDay(s: State): Map<string, number> {
  const m = new Map<string, number>();
  for (const x of s.sessions) m.set(x.date, (m.get(x.date) ?? 0) + x.minutes);
  return m;
}

// ---------- سياق المشرف ----------

// ملخص قصير لحالة مادا بيتبعت مع كل رسالة للمشرف، عشان يبقى "عارف" هو فين
export function mentorContext(s: State): string {
  const t = currentTask(s);
  const phase = t ? phaseOf(t.courseId) : undefined;
  const course = currentCourse(s);
  const cp = course ? courseProgress(s, course.id) : null;
  const overall = overallProgress(s);
  const last = s.sessions.at(-1);
  const gap = last ? daysBetween(last.date, today()) : null;
  const broken = lastBrokenPromise(s);
  const weak = Object.entries(s.tasks)
    .filter(([, p]) => p.score !== undefined && p.score < 7)
    .slice(-3)
    .map(([id]) => id);
  const notes = s.sessions
    .slice(-4)
    .map((x) => `- ${x.date} (${x.minutes} min): ${x.note}`)
    .join("\n");
  return [
    `Today: ${today()}`,
    `Overall plan progress: ${Math.round(overall.pct * 100)}% (${Math.round(overall.hoursLeft)}h left)`,
    phase ? `Current phase: ${phase.title}` : "All phases finished",
    course && cp ? `Current course: ${course.name} — ${cp.done}/${cp.total} tasks done` : "",
    t ? `Current task: ${t.title} (${t.url})` : "",
    course && s.deadlines[course.id]
      ? `Mada's own deadline for this course: ${s.deadlines[course.id]} (expected finish at current pace: ${
          schedule(s).get(course.id)?.end.toISOString().slice(0, 10) ?? "done"
        })`
      : "",
    `Streak: ${streak(s)} days · This week: ${(weekMinutes(s) / 60).toFixed(1)}h of ${s.weeklyHours}h target`,
    `Total sessions: ${s.sessions.length} · Due reviews: ${dueReviews(s).length}`,
    gap !== null ? `Days since last session: ${gap}` : "Has not logged any session yet",
    broken ? `Broke the last promise to return (${new Date(broken.at).toISOString()})` : "",
    weak.length ? `Recent tasks with weak exam scores: ${weak.join(", ")}` : "",
    s.later.length ? `"Later" list (postponed shiny topics): ${s.later.join(", ")}` : "",
    notes ? `Last session notes (Mada's own words):\n${notes}` : "",
    notesForMentor(s, course?.id),
  ]
    .filter(Boolean)
    .join("\n");
}

// رسالة اليوم من غير AI: بتتبني على الحالة، عشان التطبيق يفضل "بيكلمك" حتى من غير مفتاح
export function fallbackDaily(s: State): string {
  const last = s.sessions.at(-1);
  const gap = last ? daysBetween(last.date, today()) : null;
  const st = streak(s);
  const t = currentTask(s);
  if (!last) return "أول يوم في الرحلة. مش محتاج تبقى جاهز، محتاج تبدأ. 20 دقيقة في المهمة اللي تحت وخلاص.";
  if (gap !== null && gap >= 2)
    return `غبت ${gap} يوم، وده عادي. اللي بيفرق مش إنك متقعش، إنك ترجع. افتح آخر ملاحظة كتبتها وابدأ من هناك.`;
  if (gap === 0) return "ذاكرت النهارده ✓ لو لسه عندك طاقة، راجع سؤال قديم. لو لأ، ارتاح — بكرة معادنا.";
  if (st >= 7) return `${st} يوم متواصل. انت مش بتجرّب تاني، انت بتبني عادة فعلاً. كمّل بنفس الهدوء.`;
  return t ? `النهارده: ${t.title}. خطوة واحدة واضحة، وأنا معاك فيها.` : "خلّصت الخطة كلها. 🎓";
}

// ملاحظات مادا للمشرف: ملاحظات الكورس الحالي كاملة (لحد حد معين) + عناوين الباقي
function notesForMentor(s: State, courseId?: string): string {
  if (!s.notes.length) return "";
  const LIMIT = 8000;
  const recent = [...s.notes].sort((a, b) => b.updatedAt - a.updatedAt);
  const full = recent.filter((n) => n.courseId === courseId);
  const others = recent.filter((n) => n.courseId !== courseId);
  let used = 0;
  const parts: string[] = [];
  for (const n of full) {
    const body = n.body.slice(0, Math.max(0, LIMIT - used));
    if (!body) break;
    used += body.length;
    parts.push(`<note title="${n.title}">\n${body}${body.length < n.body.length ? "\n[...]" : ""}\n</note>`);
  }
  const titles = others.slice(0, 30).map((n) => `- ${n.title}`);
  return [
    parts.length ? `Mada's notes for the current course:\n${parts.join("\n")}` : "",
    titles.length ? `Other notes (titles only):\n${titles.join("\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
