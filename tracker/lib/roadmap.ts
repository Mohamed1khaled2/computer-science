// خطة مادا: كورسات OSSU مترتبة حسب الأولوية لمطوّر شغّال full-time.
// الترتيب مختلف عن OSSU الرسمي عن قصد: اللي بيفرق في الشغل والإنترفيوهات الأول،
// والتفاضل والتكامل وباقي المنهج في آخر مرحلة. الساعات تقديرية (أسابيع × متوسط المجهود).

export type Course = {
  id: string;
  name: string;
  url: string;
  hours: number;
  note?: string;
  extra?: boolean; // مش من OSSU الأساسي
};

export type Phase = {
  id: string;
  title: string;
  why: string;
  proof: string; // مشروع/دليل تحطه على GitHub
  courses: Course[];
};

const OSSU = "https://github.com/ossu/computer-science/blob/master";

export const PHASES: Phase[] = [
  {
    id: "p0",
    title: "المرحلة 0 — التجهيز",
    why: "مكسب سريع في أسبوعين. أدوات هتستخدمها كل يوم في الشغل وفي باقي الخطة.",
    proof: "ريبو dotfiles + كل ملاحظاتك في ريبو learning-log على GitHub.",
    courses: [
      { id: "missing", name: "The Missing Semester of Your CS Education", url: "https://missing.csail.mit.edu/", hours: 24 },
    ],
  },
  {
    id: "p1",
    title: "المرحلة 1 — برمجة بإيدك (من غير AI)",
    why: "دي أهم مرحلة. هنا بتبني العضلة اللي الـ AI مش مخلّيها تكبر في الشغل.",
    proof: "3 برامج Python صغيرة مكتوبة 100% بإيدك، كل واحد فيه README بيشرح قررت إيه وليه.",
    courses: [
      {
        id: "intro-cs",
        name: "Introduction to CS and Programming using Python (MIT 6.100L)",
        url: `${OSSU}/coursepages/intro-cs/README.md`,
        hours: 112,
        note: "حل كل الـ problem sets بنفسك. الـ AI مسموح بس يشرح مفهوم، مش يكتب كود.",
      },
    ],
  },
  {
    id: "p2",
    title: "المرحلة 2 — رياضيات متقطعة وخوارزميات",
    why: "ده اللي بيتسأل في الإنترفيوهات، وده الفرق بين CS وبين حد بيجمّع كود.",
    proof: "مكتبة data structures كتبتها بنفسك + 150 مسألة محلولة مع شرح الـ complexity.",
    courses: [
      {
        id: "mcs",
        name: "Mathematics for Computer Science (MIT 6.042J)",
        url: "https://openlearninglibrary.mit.edu/courses/course-v1:OCW+6.042J+2T2019/about",
        hours: 90,
        note: "OSSU بيحط Calculus قبلها. إحنا أجّلناه للمرحلة 6 لأن 6.042 تتفهم من غيره في الغالب.",
      },
      {
        id: "algo1",
        name: "Algorithms: Design and Analysis, Part 1",
        url: "https://www.algorithmsilluminated.org/",
        hours: 60,
      },
      {
        id: "algo2",
        name: "Algorithms: Design and Analysis, Part 2",
        url: "https://www.algorithmsilluminated.org/",
        hours: 60,
      },
      {
        id: "neetcode",
        name: "NeetCode 150 (تدريب إنترفيو)",
        url: "https://neetcode.io/practice",
        hours: 100,
        extra: true,
        note: "بالتوازي مع Algorithms: مسألة أو اتنين في الأسبوع من الأول، وبعدين أكتر.",
      },
    ],
  },
  {
    id: "p3",
    title: "المرحلة 3 — الأنظمة: الكمبيوتر، الـ OS، الشبكات",
    why: "كفول ستاك: هتفهم ليه السيرفر بطيء، يعني إيه process و thread، وHTTP بيتنقل إزاي فعلاً.",
    proof: "shell صغير أو HTTP server من الصفر (من غير framework).",
    courses: [
      { id: "nand1", name: "Nand to Tetris Part I", url: "https://www.nand2tetris.org/", hours: 60 },
      { id: "nand2", name: "Nand to Tetris Part II", url: "https://www.nand2tetris.org/", hours: 90 },
      { id: "ostep", name: "Operating Systems: Three Easy Pieces", url: `${OSSU}/coursepages/ostep/README.md`, hours: 88 },
      {
        id: "net",
        name: "Computer Networking: a Top-Down Approach",
        url: "https://gaia.cs.umass.edu/kurose_ross/online_lectures.htm",
        hours: 64,
      },
    ],
  },
  {
    id: "p4",
    title: "المرحلة 4 — قواعد بيانات، أمان، هندسة برمجيات",
    why: "أقرب حاجة لشغلك اليومي. هتخليك تكتب كود production بثقة مش بالحظ.",
    proof: "تصميم schema حقيقي بمبرراته + مراجعة أمان لمشروع من مشاريعك.",
    courses: [
      { id: "db1", name: "Databases: Modeling and Theory", url: "https://www.edx.org/learn/databases/stanford-university-databases-modeling-and-theory", hours: 20 },
      { id: "db2", name: "Databases: Relational Databases and SQL", url: "https://www.edx.org/learn/relational-databases/stanford-university-databases-relational-databases-and-sql", hours: 20 },
      { id: "db3", name: "Databases: Semistructured Data", url: "https://www.edx.org/learn/relational-databases/stanford-university-databases-semistructured-data", hours: 20 },
      { id: "sec-coding", name: "Principles of Secure Coding", url: "https://www.coursera.org/learn/secure-coding-principles", hours: 16 },
      { id: "sec-vuln", name: "Identifying Security Vulnerabilities", url: "https://www.coursera.org/learn/identifying-security-vulnerabilities", hours: 16 },
      {
        id: "se-intro",
        name: "Software Engineering: Introduction",
        url: "https://github.com/ubccpsc/310/blob/main/resources/README.md",
        hours: 54,
      },
    ],
  },
  {
    id: "p5",
    title: "المرحلة 5 — تصميم البرامج ولغات البرمجة",
    why: "تفكير منظم في تصميم الكود، و functional/OOP بعمق. ده اللي بيطلّعك من junior.",
    proof: "refactor لمشروع حقيقي من شغلك مع شرح قبل/بعد.",
    courses: [
      { id: "spd", name: "Systematic Program Design", url: `${OSSU}/coursepages/spd/README.md`, hours: 117 },
      { id: "class-based", name: "Class-based Program Design", url: `${OSSU}/coursepages/class-based/README.md`, hours: 97 },
      { id: "pl", name: "Programming Languages (UW CSE341)", url: "https://courses.cs.washington.edu/courses/cse341/19sp/#lectures", hours: 66 },
      { id: "ood", name: "Object-Oriented Design", url: "https://course.ccs.neu.edu/cs3500f19/", hours: 97 },
      { id: "arch", name: "Software Architecture", url: "https://www.coursera.org/learn/software-architecture", hours: 14 },
    ],
  },
  {
    id: "p6",
    title: "المرحلة 6 — استكمال OSSU الكامل",
    why: "لو عايز تقول بضمير إنك خلّصت منهج CS كامل. مش شرط عشان تشتغل.",
    proof: "الـ Final Project بتاع OSSU.",
    courses: [
      { id: "calc-a", name: "Calculus 1A: Differentiation", url: "https://openlearninglibrary.mit.edu/courses/course-v1:MITx+18.01.1x+2T2019/about", hours: 104 },
      { id: "calc-b", name: "Calculus 1B: Integration", url: "https://openlearninglibrary.mit.edu/courses/course-v1:MITx+18.01.2x+3T2019/about", hours: 97 },
      { id: "calc-c", name: "Calculus 1C: Coordinate Systems & Infinite Series", url: "https://openlearninglibrary.mit.edu/courses/course-v1:MITx+18.01.3x+1T2020/about", hours: 45 },
      { id: "cyber", name: "Cybersecurity Fundamentals", url: "https://www.edx.org/learn/cybersecurity/rochester-institute-of-technology-cybersecurity-fundamentals", hours: 88 },
      { id: "sec-lang", name: "Security Vulnerabilities in C/C++ أو Java (واحد بس)", url: "https://www.coursera.org/learn/identifying-security-vulnerabilities-c-programming", hours: 20 },
      { id: "ml", name: "Machine Learning", url: "https://www.deeplearning.ai/courses/machine-learning-specialization/", hours: 99 },
      { id: "graphics", name: "Computer Graphics", url: "https://cseweb.ucsd.edu/~viscomp/classes/cse167/wi22/schedule.html", hours: 72 },
      { id: "ethics", name: "Ethics, Technology and Engineering", url: "https://www.coursera.org/learn/ethics-technology-engineering", hours: 18 },
      { id: "ip", name: "Introduction to Intellectual Property", url: "https://www.coursera.org/learn/introduction-intellectual-property", hours: 8 },
      { id: "privacy", name: "Data Privacy Fundamentals", url: "https://www.coursera.org/learn/northeastern-data-privacy", hours: 9 },
      { id: "final", name: "Advanced CS electives + Final Project", url: "https://github.com/ossu/computer-science#advanced-cs", hours: 150 },
    ],
  },
];

export const ALL_COURSES: Course[] = PHASES.flatMap((p) => p.courses);

export function phaseOf(courseId: string): Phase | undefined {
  return PHASES.find((p) => p.courses.some((c) => c.id === courseId));
}

export function courseById(id: string): Course | undefined {
  return ALL_COURSES.find((c) => c.id === id);
}
