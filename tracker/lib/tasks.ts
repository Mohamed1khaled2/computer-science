// المهام اليومية: كل مهمة = حاجة واحدة واضحة تعملها، ومنين، وإزاي، وأسئلة تثبت بيها إنك فهمت.
// المرحلة 0 و 1 متفصّلين درس بدرس. باقي الكورسات متقسمة لأسابيع لحد ما نوصلها ونفصّلها
// (اطلب من Claude يفصّل الكورس اللي عليه الدور في الملف ده).

import { ALL_COURSES } from "./roadmap";

export type Task = {
  id: string;
  courseId: string;
  title: string;
  url: string;
  minutes: number; // وقت تقديري للمهمة كلها (ممكن تاخد أكتر من جلسة)
  how: string[];
  check: string[]; // لازم تجاوبهم بكلامك عشان المهمة تتقفل
  code?: boolean; // لازم لينك للكود على GitHub
};

const MS = "https://missing.csail.mit.edu/2026";
const MIT = "https://ocw.mit.edu/courses/6-100l-introduction-to-cs-and-programming-using-python-fall-2022";
const PSETS = `${MIT}/lists/problem-sets/`;

const msHow = (extra?: string) => [
  "اقرا صفحة المحاضرة كلها، ولو فيه فيديو على قناة الكورس شوفه.",
  "جرّب كل أمر بإيدك في الترمينال وانت بتقرا (على Windows استخدم Git Bash أو WSL).",
  "حل تمارين آخر الصفحة (Exercises) — مش لازم كلها، على الأقل النص.",
  ...(extra ? [extra] : []),
  "اكتب الأوامر اللي اتعلمتها في ملف notes في ريبو learning-log.",
];

const MISSING: Omit<Task, "courseId">[] = [
  {
    id: "ms-1",
    title: "Missing Semester 1 — Course Overview + The Shell",
    url: `${MS}/course-shell/`,
    minutes: 120,
    how: msHow("اعمل ريبو اسمه learning-log على GitHub عشان كل ملاحظاتك تبقى فيه من النهارده."),
    check: [
      "إيه الفرق بين absolute path و relative path؟ وإيه معنى . و .. ؟",
      "الـ pipe | والـ redirect > بيعملوا إيه؟ اكتب مثال استخدمته فعلاً.",
      "ليه الـ quotes المفردة '...' غير المزدوجة \"...\" في bash؟",
    ],
  },
  {
    id: "ms-2",
    title: "Missing Semester 2 — Command-line Environment",
    url: `${MS}/command-line-environment/`,
    minutes: 120,
    how: msHow(),
    check: [
      "يعني إيه environment variable؟ وإزاي تخلي واحد يفضل موجود كل ما تفتح ترمينال؟",
      "إزاي توقف process شغال أو تشغّله في الخلفية؟ اكتب الأوامر.",
    ],
  },
  {
    id: "ms-3",
    title: "Missing Semester 3 — Development Environment and Tools",
    url: `${MS}/development-environment/`,
    minutes: 120,
    how: msHow("اختار حاجة واحدة من المحاضرة وطبّقها على بيئة شغلك الحقيقية (shortcut، setting، أداة)."),
    check: [
      "إيه الحاجة اللي غيّرتها في بيئة الشغل بتاعتك بعد المحاضرة دي؟ وليه؟",
      "اشرح فكرة واحدة من المحاضرة كأنك بتشرحها لزميل في الشغل.",
    ],
  },
  {
    id: "ms-4",
    title: "Missing Semester 4 — Debugging and Profiling",
    url: `${MS}/debugging-profiling/`,
    minutes: 120,
    how: msHow("جرّب debugger حقيقي (breakpoint + step) على bug من شغلك بدل console.log."),
    check: [
      "إيه الفرق بين debugging بالـ print وبالـ debugger؟ إمتى تستخدم كل واحد؟",
      "يعني إيه profiling؟ وإيه اللي بيقيسه؟",
    ],
  },
  {
    id: "ms-5",
    title: "Missing Semester 5 — Version Control and Git",
    url: `${MS}/version-control/`,
    minutes: 150,
    how: msHow("ارسم على ورقة الـ commit graph لريبو من شغلك بعد merge."),
    check: [
      "اشرح الـ data model بتاع Git: يعني إيه blob و tree و commit و ref؟",
      "إيه اللي بيحصل فعلاً لما تعمل git commit؟ وإيه الفرق بين merge و rebase؟",
    ],
  },
  {
    id: "ms-6",
    title: "Missing Semester 6 — Packaging and Shipping Code",
    url: `${MS}/shipping-code/`,
    minutes: 120,
    how: msHow(),
    check: [
      "إيه المشكلة اللي الـ dependency management والـ lock files بيحلوها؟",
      "إزاي كود بيتحول من جهازك لحاجة شغالة عند الناس؟ اشرح الخطوات.",
    ],
  },
  {
    id: "ms-7",
    title: "Missing Semester 7 — Agentic Coding",
    url: `${MS}/agentic-coding/`,
    minutes: 90,
    how: msHow("قارن اللي في المحاضرة بطريقة استخدامك للـ AI في الشغل دلوقتي."),
    check: [
      "إيه المخاطر لما تعتمد على agent يكتب الكود وانت مش فاهمه؟",
      "إيه قاعدة واحدة هتلتزم بيها من النهارده في استخدام الـ AI في الشغل؟",
    ],
  },
  {
    id: "ms-8",
    title: "Missing Semester 8 — Beyond the Code",
    url: `${MS}/beyond-code/`,
    minutes: 90,
    how: msHow(),
    check: ["إيه أهم فكرة في المحاضرة دي تنفعك في شغلك؟ اشرحها بمثال."],
  },
  {
    id: "ms-9",
    title: "Missing Semester 9 — Code Quality",
    url: `${MS}/code-quality/`,
    minutes: 120,
    how: msHow("شغّل formatter و linter على مشروع من مشاريعك وصلّح اللي طلع."),
    check: [
      "إيه الفرق بين formatter و linter و tests؟ كل واحد بيمسك إيه؟",
      "إيه مشكلة جودة لقيتها في كود من شغلك بعد المحاضرة دي؟",
    ],
    code: true,
  },
];

const L = (n: number, slug: string, title: string, check: string[]): Omit<Task, "courseId"> => ({
  id: `mit-l${n}`,
  title: `6.100L Lecture ${n} — ${title}`,
  url: `${MIT}/pages/lecture-${n}-${slug}/`,
  minutes: 120,
  how: [
    "افتح صفحة المحاضرة: شوف الفيديو (ممكن 1.25x) والـ slides جنبك.",
    "نزّل كود المحاضرة وشغّل الأمثلة بإيدك. غيّر فيها واتوقع النتيجة قبل ما تشغّل.",
    "حل الـ finger exercise بإيدك بدون AI، وبعدين قارن بالحل اللي في الصفحة.",
    "لو اتزنقت 30 دقيقة: برومبت المدرس في صفحة \"اتزنقت\" (تلميح مش حل).",
  ],
  check,
});

const P = (n: number, minutes: number, focus: string): Omit<Task, "courseId"> => ({
  id: `mit-ps${n}`,
  title: `6.100L Problem Set ${n}`,
  url: PSETS,
  minutes,
  how: [
    `افتح Problem Set ${n} من صفحة Problem Sets ونزّل الملفات.`,
    "اقرا المطلوب كله الأول واكتب خطة الحل على ورقة قبل ما تكتب كود.",
    "قسّمه على كذا جلسة — كل جلسة جزء واحد. الـ AI ممنوع يكتب ولا سطر.",
    "شغّل الـ tester اللي جاي مع الـ pset لحد ما كل حاجة تعدي.",
    "ارفع الحل على GitHub (ريبو private لو عايز) وحط اللينك هنا.",
  ],
  check: [
    `اشرح طريقة حلك بكلامك: ${focus}`,
    "إيه أصعب جزء؟ اتزنقت فين وحلّيتها إزاي؟",
    "لو هتحلها تاني من الأول، هتعمل إيه مختلف؟",
  ],
  code: true,
});

const MIT_TASKS: Omit<Task, "courseId">[] = [
  {
    id: "mit-setup",
    title: "6.100L — تجهيز Python + Problem Set 0",
    url: `${MIT}/pages/material-by-lecture/`,
    minutes: 90,
    how: [
      "نزّل Python 3.8 (OSSU بيوصي بيها للكورس ده) باستخدام uv أو pyenv، وافتح VS Code.",
      "افتح Problem Set 0 من صفحة Problem Sets وحلّه.",
      "اعمل فولدر mit-6100l في learning-log لكل حلول الكورس.",
    ],
    check: ["شغّلت إيه بالظبط عشان تجهز البيئة؟ وإيه اللي وقفك لو فيه؟"],
    code: true,
  },
  L(1, "introduction", "Introduction", [
    "يعني إيه declarative knowledge و imperative knowledge؟ مثال لكل واحد.",
    "إيه الفرق بين object type زي int و float و bool؟ وإيه اللي بيحصل في 5/2 مقابل 5//2؟",
  ]),
  L(2, "strings-inputoutput-branching", "Strings, Input/Output, Branching", [
    "اشرح string slicing: s[1:4] و s[::-1] بيرجعوا إيه لو s = \"python\"؟",
    "ليه input() بترجع string دايمًا؟ وإزاي بتتعامل مع ده؟",
  ]),
  L(3, "iteration", "Iteration", [
    "إمتى تستخدم while وإمتى for؟ اكتب مثال لكل واحد.",
    "إيه اللي بيعمل infinite loop؟ وإزاي تتجنبه؟",
  ]),
  L(4, "loops-over-strings-guess-and-check-binary", "Loops over Strings, Guess-and-Check, Binary", [
    "اشرح فكرة guess-and-check (exhaustive enumeration) ومتى تبقى بطيئة.",
    "حوّل الرقم 13 لـ binary يدوي واشرح الخطوات.",
  ]),
  L(5, "floats-and-approximation-methods", "Floats and Approximation Methods", [
    "ليه 0.1 + 0.2 == 0.3 بترجع False؟ وإزاي تقارن floats صح؟",
    "اشرح فكرة approximation باستخدام epsilon.",
  ]),
  L(6, "bisection-search", "Bisection Search", [
    "اشرح bisection search خطوة بخطوة لإيجاد الجذر التربيعي لـ 25.",
    "ليه bisection أسرع بكتير من guess-and-check؟ (فكّر في عدد الخطوات)",
  ]),
  L(7, "decomposition-abstraction-functions", "Decomposition, Abstraction, Functions", [
    "إيه الفرق بين decomposition و abstraction؟ مثال من شغلك.",
    "إيه الفرق بين return و print جوه function؟ وإيه اللي بترجعه function مفيهاش return؟",
  ]),
  P(1, 420, "إزاي قسّمت المشكلة لخطوات، وإيه الـ loop/الشروط اللي استخدمتها وليه."),
  L(8, "functions-as-objects", "Functions as Objects", [
    "يعني إيه إن الـ function نفسها object؟ اكتب مثال بتبعت فيه function لـ function تانية.",
    "اشرح الـ scope: متغير جوه function وبرّاها بنفس الاسم — مين بيكسب؟",
  ]),
  L(9, "lambda-functions-tuples-and-lists", "Lambda Functions, Tuples, and Lists", [
    "إيه الفرق بين tuple و list؟ وإمتى تستخدم tuple؟",
    "اكتب lambda بتربّع رقم واشرح إمتى lambda مفيدة.",
  ]),
  L(10, "lists-mutability", "Lists, Mutability", [
    "يعني إيه mutable؟ إيه الفرق بين L.append(x) و L + [x]؟",
    "إيه اللي بيحصل لو عدّلت list وانت بتلف عليها بـ for؟",
  ]),
  L(11, "aliasing-cloning", "Aliasing, Cloning", [
    "لو A = [1,2] و B = A وبعدين B.append(3) — A بقت إيه وليه؟",
    "إيه الفرق بين shallow copy و deep copy؟",
  ]),
  P(2, 480, "الـ data structures اللي استخدمتها (lists/strings) وإزاي اتعاملت مع الـ mutability."),
  L(12, "list-comprehension-functions-as-objects-testing-debugging", "List Comprehension, Testing, Debugging", [
    "اكتب list comprehension بترجع مربعات الأرقام الزوجية من 0 لـ 10.",
    "إيه الفرق بين black-box و glass-box testing؟",
  ]),
  L(13, "exceptions-assertions", "Exceptions, Assertions", [
    "إيه الفرق بين try/except و assert؟ إمتى تستخدم كل واحد؟",
    "إيه اللي ممكن يحصل لو عملت except: من غير ما تحدد نوع الـ exception؟",
  ]),
  L(14, "dictionaries", "Dictionaries", [
    "ليه الـ key في dict لازم يكون immutable؟",
    "امتى dict أحسن من list؟ مثال من مشروع حقيقي.",
  ]),
  L(15, "recursion", "Recursion", [
    "اشرح الـ base case والـ recursive case في factorial.",
    "إيه اللي بيحصل في الـ call stack لما تنادي fib(4)؟ ارسمه.",
  ]),
  P(3, 480, "الـ dictionaries/الـ functions اللي بنيتها وإزاي اختبرتهم."),
  L(16, "recursion-on-non-numerics", "Recursion on Non-Numerics", [
    "اكتب (بالكلام) خطوات recursive function بتشوف لو string palindrome.",
    "إزاي تعمل recursion على list متداخلة (nested)؟",
  ]),
  L(17, "python-classes", "Python Classes", [
    "إيه الفرق بين class و instance؟ و self بتشاور على إيه؟",
    "ليه نعمل class بدل ما نستخدم dict؟",
  ]),
  L(18, "more-python-class-methods", "More Python Class Methods", [
    "إيه وظيفة __str__ و __eq__؟ إيه اللي بيحصل لو معرفتهمش؟",
    "يعني إيه getter/setter وليه ممكن نستخدمهم؟",
  ]),
  L(19, "inheritance", "Inheritance", [
    "اشرح inheritance بمثال، وإيه اللي بيحصل لما subclass تعمل override لميثود.",
    "إمتى inheritance تبقى فكرة وحشة؟",
  ]),
  P(4, 540, "الـ recursion أو الـ classes اللي كتبتها وإزاي اتأكدت إنها صح."),
  L(20, "fitness-tracker-object-oriented-programming-example", "Fitness Tracker OOP Example", [
    "إزاي اتقسّم مثال الـ fitness tracker لـ classes؟ ليه التقسيم ده منطقي؟",
  ]),
  L(21, "timing-programs-counting-operations", "Timing Programs, Counting Operations", [
    "ليه قياس الوقت بالثواني مش طريقة كويسة لمقارنة الخوارزميات؟",
    "عدّ عدد العمليات في loop جوه loop على list طولها n.",
  ]),
  L(22, "big-oh-and-theta", "Big Oh and Theta", [
    "إيه الفرق بين O و Θ؟",
    "إيه الـ complexity بتاعة linear search و binary search؟ وليه؟",
  ]),
  L(23, "complexity-classes-examples", "Complexity Classes Examples", [
    "رتّب من الأسرع للأبطأ: O(n log n), O(1), O(2^n), O(n), O(n^2), O(log n)",
    "هات مثال لكود O(n^2) من شغلك أو تخيّلي، وإزاي تخليه أسرع.",
  ]),
  L(24, "sorting-algorithms", "Sorting Algorithms", [
    "اشرح merge sort خطوة بخطوة على [5, 2, 4, 1].",
    "ليه merge sort هو O(n log n)؟",
  ]),
  P(5, 540, "الـ algorithm اللي استخدمته والـ complexity بتاعته."),
  L(25, "plotting", "Plotting", ["إزاي ترسم نتيجة تجربة عشان تفهم الـ complexity من الرسم؟"]),
  L(26, "list-access-hashing-simulations-and-wrap-up", "List Access, Hashing, Simulations", [
    "ليه الوصول لعنصر في list بالـ index هو O(1)؟",
    "اشرح فكرة الـ hashing وليه البحث في dict أسرع من list.",
  ]),
];

// الكورسات اللي لسه متفصّلتش: أسبوع = ~8 ساعات شغل
function weekly(courseId: string, name: string, url: string, hours: number): Task[] {
  const weeks = Math.max(1, Math.round(hours / 8));
  return Array.from({ length: weeks }, (_, i) => ({
    id: `${courseId}-w${i + 1}`,
    courseId,
    title: `${name} — الجزء ${i + 1} من ${weeks}`,
    url,
    minutes: Math.round((hours * 60) / weeks),
    how: [
      "كمّل الكورس من حيث وقفت: المحاضرات/الفصول اللي بتساوي حوالي أسبوع من الكورس.",
      "حل كل التمارين والـ assignments بإيدك قبل ما تشوف أي حل.",
      "اكتب ملخص بكلامك في learning-log.",
    ],
    check: [
      "إيه الموضوعات اللي غطيتها في الجزء ده؟ اشرح أهم فكرة فيهم كأنك بتشرحها لحد.",
      "إيه مسألة/تمرين حلّيته؟ اشرح طريقة الحل.",
      "إيه اللي لسه مش واضح؟",
    ],
  }));
}

const DETAILED: Record<string, Omit<Task, "courseId">[]> = {
  missing: MISSING,
  "intro-cs": MIT_TASKS,
};

export const TASKS: Task[] = ALL_COURSES.flatMap((c) =>
  DETAILED[c.id]
    ? DETAILED[c.id].map((t) => ({ ...t, courseId: c.id }))
    : weekly(c.id, c.name, c.url, c.hours),
);

export function taskById(id: string): Task | undefined {
  return TASKS.find((t) => t.id === id);
}

export function tasksOf(courseId: string): Task[] {
  return TASKS.filter((t) => t.courseId === courseId);
}
