// إنجليزي البرمجة: اختبار تحديد مستوى + دروس قصيرة.
// الهدف مش إنجليزي عام — الهدف إن مادا يقرا المحاضرة والـ docs ورسالة الخطأ والـ problem set من غير ما يقف.
// كلمات كل درس بتتضاف للقاموس (state.glossary) وبتتراجع بنفس المراجعة المتباعدة.

export type Section = "vocab" | "errors" | "docs" | "instructions";

export const SECTIONS: Record<Section, { title: string; desc: string }> = {
  vocab: { title: "كلمات البرمجة", desc: "الكلمات اللي بتتكرر في كل محاضرة" },
  errors: { title: "رسائل الخطأ", desc: "تفهم الـ terminal وبايثون بيقولولك إيه" },
  docs: { title: "قراءة الـ docs", desc: "جمل التوثيق: returns, optional, raises..." },
  instructions: { title: "تعليمات الـ problem set", desc: "المطلوب منك بالظبط إيه" },
};

export type Question = {
  text: string; // الجملة الإنجليزي (أو رسالة الخطأ)
  ask: string; // السؤال بالعربي
  options: string[];
  answer: number;
  why: string; // الشرح بعد الإجابة
  code?: boolean; // الـ text يتعرض كـ terminal output
};

export type TestQuestion = Question & { section: Section };

export const TEST: TestQuestion[] = [
  // ---------- كلمات ----------
  {
    section: "vocab",
    text: "Open the directory and list its files.",
    ask: "directory يعني إيه؟",
    options: ["ملف", "فولدر (مجلد)", "أمر", "سيرفر"],
    answer: 1,
    why: "directory = folder. فولدر جواه ملفات. هتقابلها في أول محاضرة في Missing Semester.",
  },
  {
    section: "vocab",
    text: "The function takes two arguments.",
    ask: "arguments هنا يعني إيه؟",
    options: ["القيم اللي بتديها للدالة", "خناقات", "النتايج اللي الدالة بترجعها", "أخطاء"],
    answer: 0,
    why: "في الإنجليزي العادي argument = خناقة أو حُجّة، لكن في البرمجة = القيمة اللي بتبعتها للدالة أو للأمر.",
  },
  {
    section: "vocab",
    text: "This method is deprecated.",
    ask: "deprecated يعني إيه؟",
    options: ["سريع جداً", "جديد", "قديم وهيتشال قريب، متستخدموش", "فيه bug"],
    answer: 2,
    why: "deprecated = لسه شغال بس اتقرر إنه هيتشال، فاستخدم البديل اللي الـ docs بتقترحه.",
  },
  {
    section: "vocab",
    text: "Execute the script.",
    ask: "Execute يعني إيه؟",
    options: ["امسح", "اكتب", "انسخ", "شغّل"],
    answer: 3,
    why: "execute = run = شغّل. ومنها executable = ملف ينفع يتشغّل.",
  },
  {
    section: "vocab",
    text: "You don't have permission to edit this file.",
    ask: "permission يعني إيه؟",
    options: ["صلاحية / إذن", "مساحة", "نسخة", "باسورد"],
    answer: 0,
    why: "permission = صلاحية. ومنها Permission denied = الصلاحية مرفوضة.",
  },
  // ---------- رسائل الخطأ ----------
  {
    section: "errors",
    code: true,
    text: "bash: pyhton: command not found",
    ask: "الرسالة دي معناها إيه؟",
    options: [
      "مفيش إنترنت",
      "الـ shell مش لاقي أمر بالاسم ده — غالباً غلطة في الكتابة",
      "بايثون مش متسطب أكيد",
      "الملف مش موجود",
    ],
    answer: 1,
    why: "command not found = الأمر مش موجود. بص كويس: pyhton مكتوبة غلط، الصح python.",
  },
  {
    section: "errors",
    code: true,
    text: "FileNotFoundError: [Errno 2] No such file or directory: 'data.txt'",
    ask: "المشكلة إيه؟",
    options: [
      "الملف data.txt فاضي",
      "الملف مفتوح في برنامج تاني",
      "البرنامج مش لاقي data.txt في المكان اللي بيدور فيه",
      "مفيش صلاحية تقرا الملف",
    ],
    answer: 2,
    why: "No such file = مفيش ملف بالاسم ده. غالباً إنت مشغّل البرنامج من فولدر تاني غير اللي فيه الملف.",
  },
  {
    section: "errors",
    code: true,
    text: "fatal: not a git repository (or any of the parent directories): .git",
    ask: "git بيقولك إيه؟",
    options: [
      "إنت مش جوه فولدر فيه git repo",
      "git مش متسطب",
      "الريبو اتمسح من GitHub",
      "لازم تعمل commit الأول",
    ],
    answer: 0,
    why: "fatal = خطأ وقّف العملية. not a git repository = الفولدر اللي إنت فيه مش ريبو (ولا أي فولدر فوقه — parent directories).",
  },
  {
    section: "errors",
    code: true,
    text: 'TypeError: can only concatenate str (not "int") to str',
    ask: "إيه اللي حصل؟",
    options: ["قسمة على صفر", "متغير مش متعرّف", "الـ list فاضية", "بتحاول تلزق رقم في نص بـ +"],
    answer: 3,
    why: "concatenate = تلزق نصوص في بعض. بايثون بيقولك: أقدر ألزق str في str بس، مش int. الحل str(number).",
  },
  {
    section: "errors",
    code: true,
    text: "Warning: 3 tests skipped",
    ask: "Warning معناها إيه؟",
    options: [
      "البرنامج وقع",
      "تنبيه — البرنامج كمّل، بس فيه حاجة تاخد بالك منها",
      "كل التيستات فشلت",
      "لازم تعيد التسطيب",
    ],
    answer: 1,
    why: "warning = تحذير، مش error. البرنامج اشتغل. skipped = اتخطّت (متشغلتش)، مش فشلت.",
  },
  // ---------- الـ docs ----------
  {
    section: "docs",
    code: true,
    text: "get(key, default=None)\nReturn the value for key if key is in the dictionary, else default.",
    ask: "لو key مش موجود، get هترجّع إيه؟",
    options: ["هتطلّع error", "هترجّع 0", "هتضيف المفتاح", "هترجّع default"],
    answer: 3,
    why: "else default = غير كده رجّع default. وقيمته None لو مدّيتهوش حاجة.",
  },
  {
    section: "docs",
    text: "The -n flag is optional. If omitted, all lines are printed.",
    ask: "يعني إيه؟",
    options: [
      "لو مكتبتش -n هيطبع كل السطور",
      "لازم تكتب -n",
      "-n هو اللي بيطبع كل السطور",
      "-n ممنوع",
    ],
    answer: 0,
    why: "optional = اختياري. omitted = اتشال / مكتبتهوش. If omitted = لو مكتبتهوش.",
  },
  {
    section: "docs",
    text: "Raises ValueError if the list is empty.",
    ask: "Raises هنا يعني إيه؟",
    options: [
      "بترجّع كلمة ValueError كقيمة",
      "بتفضّي الليست",
      "بتطلّع (بترمي) خطأ ValueError لو الليست فاضية",
      "بتزوّد القيمة",
    ],
    answer: 2,
    why: "raise an error = يرمي خطأ. raises = الدالة دي بتوقف وتطلّع الخطأ ده في الحالة دي.",
  },
  {
    section: "docs",
    text: "This function must be called before any other function in the module.",
    ask: "must هنا يعني إيه؟",
    options: ["ممكن", "لازم", "ممنوع", "يُفضّل"],
    answer: 1,
    why: "must = لازم. must not = ممنوع. may = ممكن / مسموح. should = يُفضّل.",
  },
  {
    section: "docs",
    text: "Sorts the list in place, i.e., the original list is modified.",
    ask: "i.e. يعني إيه؟",
    options: ["مثلاً", "إلا", "يعني (بكلام تاني)", "وكمان"],
    answer: 2,
    why: "i.e. = يعني / بمعنى. e.g. = مثلاً. وin place = بتغيّر نفس الليست، مش بتعمل نسخة جديدة.",
  },
  // ---------- تعليمات ----------
  {
    section: "instructions",
    text: "Write a function that takes a list of numbers and returns the largest one.",
    ask: "المطلوب إيه بالظبط؟",
    options: [
      "تطبع أكبر رقم",
      "تدخّل الأرقام من المستخدم",
      "ترتّب الليست",
      "الدالة ترجّع أكبر رقم (return)",
    ],
    answer: 3,
    why: "returns ≠ prints. ده من أكتر الأخطاء في 6.100L: المطلوب return، ولو عملت print بس الـ tester هيقول إنك غلطان.",
  },
  {
    section: "instructions",
    text: "You may assume the input is a non-empty string.",
    ask: "يعني إيه؟",
    options: [
      "مش محتاج تتعامل مع حالة النص الفاضي",
      "لازم تتأكد إنه مش فاضي",
      "الإدخال لازم يبقى فاضي",
      "ممنوع تستخدم strings",
    ],
    answer: 0,
    why: "You may assume = اعتبر إن ده مضمون. non-empty = مش فاضي. فمش مطلوب منك تكتب كود لحالة النص الفاضي.",
  },
  {
    section: "instructions",
    text: "Do not modify the original list.",
    ask: "المطلوب إيه؟",
    options: ["امسح الليست بعد ما تخلص", "لازم تغيّر الليست", "ممنوع تغيّر الليست الأصلية", "ابعت الليست للمستخدم"],
    answer: 2,
    why: "modify = تعدّل / تغيّر. original = الأصلية. لو محتاج تغيّر، اشتغل على نسخة.",
  },
  {
    section: "instructions",
    text: "The password must be at least 8 characters long.",
    ask: "الباسورد كام حرف؟",
    options: ["8 بالظبط", "8 أو أقل", "أقل من 8", "8 أو أكتر"],
    answer: 3,
    why: "at least = على الأقل (8 أو أكتر). at most = بالكتير (8 أو أقل). دول بيفرقوا في شرط الـ if (>= ولا <=).",
  },
  {
    section: "instructions",
    text: "If the number is even, print 'even'; otherwise, print 'odd'.",
    ask: "otherwise يعني إيه؟",
    options: ["وكمان", "غير كده (لو الشرط متحققش)", "بعدين", "دايماً"],
    answer: 1,
    why: "otherwise = غير كده = else. أي جملة فيها otherwise غالباً هتبقى else في الكود.",
  },
];

// ---------- الدروس ----------

export type Word = { en: string; ar: string; example: string };
export type Lesson = {
  id: string;
  section: Section;
  title: string;
  why: string;
  words: Word[];
  patterns: { en: string; ar: string }[]; // جمل/تراكيب بتتكرر
  quiz: Question[];
};

export const LESSONS: Lesson[] = [
  {
    id: "terminal",
    section: "vocab",
    title: "كلمات الـ terminal",
    why: "دي لغة Missing Semester كلها. لو فهمتها، نص المحاضرة الأولى هيبقى مفهوم.",
    words: [
      { en: "shell", ar: "البرنامج اللي بتكتب فيه الأوامر (bash, zsh)", example: "Open a shell and type ls." },
      { en: "directory", ar: "فولدر", example: "cd changes the current directory." },
      { en: "path", ar: "العنوان/الطريق للملف أو الفولدر", example: "/home/mada/notes.txt is an absolute path." },
      { en: "current / working directory", ar: "الفولدر اللي إنت واقف فيه دلوقتي", example: "pwd prints the working directory." },
      { en: "command", ar: "أمر", example: "ls is a command that lists files." },
      { en: "argument", ar: "القيمة اللي بتديها للأمر أو الدالة", example: "In `cd notes`, notes is the argument." },
      { en: "flag / option", ar: "اختيار بيغيّر سلوك الأمر، بيبدأ بـ - أو --", example: "ls -l uses the -l flag." },
      { en: "output", ar: "اللي البرنامج بيطلّعه", example: "The output of ls is a list of files." },
      { en: "redirect", ar: "توجّه الـ output لمكان تاني (ملف مثلاً)", example: "ls > files.txt redirects the output to a file." },
      { en: "pipe", ar: "توصّل output أمر لـ input أمر تاني بـ |", example: "ls | grep py pipes the output of ls into grep." },
    ],
    patterns: [
      { en: "X prints Y", ar: "الأمر X بيطبع/بيعرض Y" },
      { en: "X takes Y as an argument", ar: "X بياخد Y كـ argument" },
      { en: "relative to the current directory", ar: "بالنسبة للفولدر اللي إنت فيه" },
    ],
    quiz: [
      {
        text: "Use the -a flag to show hidden files.",
        ask: "-a هنا إيه؟",
        options: ["ملف", "فولدر", "flag بيخلّي الأمر يعرض الملفات المخفية", "اسم المستخدم"],
        answer: 2,
        why: "flag = اختيار بيغيّر سلوك الأمر. hidden = مخفي.",
      },
      {
        text: "cat prints the contents of a file.",
        ask: "cat بيعمل إيه؟",
        options: ["بيمسح الملف", "بيعرض اللي جوه الملف", "بينسخ الملف", "بيطبع الملف على الطابعة"],
        answer: 1,
        why: "prints في الـ terminal = يعرض على الشاشة، مش طابعة. contents = المحتوى.",
      },
      {
        text: "The path is relative to the current directory.",
        ask: "يعني إيه؟",
        options: [
          "المسار بيبدأ من الفولدر اللي إنت فيه دلوقتي",
          "المسار بيبدأ من أول الهارد (/)",
          "المسار غلط",
          "المسار في فولدر قريبك",
        ],
        answer: 0,
        why: "relative path = نسبي، بيبدأ من مكانك. absolute path = كامل، بيبدأ من /.",
      },
      {
        text: "Redirect the output to a file called log.txt.",
        ask: "المطلوب إيه؟",
        options: ["اقرا log.txt", "امسح log.txt", "اطبع log.txt", "خلّي الـ output يتكتب في log.txt بدل الشاشة"],
        answer: 3,
        why: "redirect = توجيه. الـ output يروح للملف بدل الشاشة (بـ >).",
      },
    ],
  },
  {
    id: "errors",
    section: "errors",
    title: "قراءة رسائل الخطأ",
    why: "رسالة الخطأ بتقولك المشكلة فين بالظبط. اللي بيقراها بنفسه بيتعلم أسرع بكتير من اللي بيلزقها للـ AI.",
    words: [
      { en: "error", ar: "خطأ — البرنامج وقف", example: "SyntaxError: invalid syntax" },
      { en: "warning", ar: "تحذير — البرنامج كمّل بس خد بالك", example: "Warning: this feature is deprecated" },
      { en: "fatal", ar: "خطأ قاتل — العملية وقفت خالص", example: "fatal: not a git repository" },
      { en: "not found", ar: "مش لاقيه", example: "command not found" },
      { en: "denied", ar: "مرفوض", example: "Permission denied" },
      { en: "invalid", ar: "مش صالح / غلط", example: "invalid literal for int()" },
      { en: "unexpected", ar: "مكانش متوقع (حاجة جت في مكان غلط)", example: "SyntaxError: unexpected indent" },
      { en: "expected", ar: "كان متوقع / المفروض يجي", example: "expected ':'" },
      { en: "undefined / not defined", ar: "مش متعرّف (استخدمته قبل ما تعرّفه)", example: "NameError: name 'x' is not defined" },
      { en: "traceback", ar: "مسار الخطأ: الدوال اللي اتنادت لحد ما وقع (اقراه من تحت لفوق)", example: "Traceback (most recent call last):" },
      { en: "out of range", ar: "برّه الحدود (index أكبر من الليست)", example: "IndexError: list index out of range" },
    ],
    patterns: [
      { en: "ErrorType: message", ar: "أول كلمة = نوع الخطأ، والباقي = التفاصيل. اقرا الاتنين" },
      { en: "line 12, in <module>", ar: "رقم السطر اللي وقع فيه — روح له الأول" },
      { en: "most recent call last", ar: "آخر حاجة اتنفذت تحت — السطر الأخير هو الأهم" },
    ],
    quiz: [
      {
        code: true,
        text: "NameError: name 'totl' is not defined",
        ask: "المشكلة غالباً إيه؟",
        options: ["بايثون فيه bug", "كتبت اسم متغير غلط أو استخدمته قبل ما تعرّفه", "الملف مش موجود", "مفيش صلاحية"],
        answer: 1,
        why: "not defined = مش متعرّف. totl غالباً المقصود total.",
      },
      {
        code: true,
        text: "IndexError: list index out of range",
        ask: "إيه اللي حصل؟",
        options: [
          "الليست فيها أرقام بس",
          "الليست كبيرة أوي",
          "بتحاول توصل لعنصر رقمه أكبر من حجم الليست",
          "الليست مترتبة غلط",
        ],
        answer: 2,
        why: "index = رقم العنصر. out of range = برّه الحدود. لو الليست 3 عناصر، آخر index هو 2.",
      },
      {
        code: true,
        text: "ls: cannot access 'notes': No such file or directory",
        ask: "يعني إيه؟",
        options: ["مفيش حاجة اسمها notes في المكان ده", "notes فاضي", "notes مقفول", "ls مش شغال"],
        answer: 0,
        why: "cannot access = مش قادر يوصل. No such file or directory = مفيش ملف أو فولدر بالاسم ده هنا.",
      },
      {
        code: true,
        text: "SyntaxError: expected ':'",
        ask: "الحل إيه؟",
        options: ["تسطّب بايثون تاني", "تمسح السطر", "تغيّر اسم الملف", "ناقصك : في آخر سطر زي if أو def"],
        answer: 3,
        why: "expected = كان مستني. بايثون كان مستني : ومالقاهاش.",
      },
    ],
  },
  {
    id: "git",
    section: "vocab",
    title: "كلمات Git",
    why: "هتستخدمها كل يوم في الشغل، وهي محاضرة 5 في Missing Semester.",
    words: [
      { en: "repository (repo)", ar: "فولدر المشروع اللي git بيتابع تاريخه", example: "Clone the repository to your laptop." },
      { en: "commit", ar: "لقطة (snapshot) محفوظة من التعديلات + رسالة", example: "Commit your changes with a clear message." },
      { en: "stage", ar: "تجهّز تعديل عشان يدخل في الـ commit الجاي (git add)", example: "Stage only the files you changed." },
      { en: "branch", ar: "فرع: خط شغل منفصل", example: "Create a new branch for the feature." },
      { en: "merge", ar: "تدمج فرعين في بعض", example: "Merge the feature branch into main." },
      { en: "conflict", ar: "تعارض: نفس السطر اتغير في المكانين", example: "Resolve the merge conflict manually." },
      { en: "remote", ar: "نسخة الريبو اللي على سيرفر (GitHub)", example: "origin is the default remote." },
      { en: "clone", ar: "تنسخ ريبو من السيرفر لجهازك", example: "git clone <url>" },
      { en: "track", ar: "git يتابع تغييرات الملف", example: "Untracked files: notes.txt" },
      { en: "revert", ar: "ترجّع تعديل (بـ commit جديد بيلغيه)", example: "Revert the last commit." },
    ],
    patterns: [
      { en: "Your branch is ahead of 'origin/main' by 2 commits.", ar: "عندك 2 commits على جهازك لسه مرفعتهمش (push)" },
      { en: "nothing to commit, working tree clean", ar: "مفيش تعديلات — كله محفوظ" },
      { en: "Changes not staged for commit", ar: "عدّلت ملفات بس لسه معملتلهاش add" },
    ],
    quiz: [
      {
        code: true,
        text: "Untracked files:\n  notes.txt",
        ask: "يعني إيه؟",
        options: ["notes.txt اتمسح", "git لسه مش بيتابع notes.txt", "notes.txt فيه conflict", "notes.txt اترفع"],
        answer: 1,
        why: "untracked = مش متتابع. لازم git add عشان يبدأ يتابعه.",
      },
      {
        code: true,
        text: "Your branch is behind 'origin/main' by 3 commits.",
        ask: "تعمل إيه؟",
        options: ["git pull — تجيب الـ 3 commits الجداد", "git push", "تمسح الفرع", "مفيش حاجة"],
        answer: 0,
        why: "behind = متأخر. السيرفر عنده 3 commits إنت معندكش. ahead = العكس (push).",
      },
      {
        code: true,
        text: "CONFLICT (content): Merge conflict in app.py",
        ask: "إيه اللي حصل؟",
        options: ["app.py اتمسح", "git وقع", "نفس الحتة في app.py اتغيرت في الفرعين، ولازم تختار", "app.py مش متتابع"],
        answer: 2,
        why: "conflict = تعارض. git مش عارف ياخد أنهي نسخة، فإنت اللي بتقرر.",
      },
      {
        text: "Stage the changes before you commit.",
        ask: "المطلوب إيه؟",
        options: ["اعمل push", "امسح التعديلات", "اعمل branch جديد", "اعمل git add للتعديلات قبل الـ commit"],
        answer: 3,
        why: "stage = تجهّز (git add). الترتيب: تعدّل → stage → commit → push.",
      },
    ],
  },
  {
    id: "instructions",
    section: "instructions",
    title: "لغة الـ problem set",
    why: "نص الغلطات في الـ problem sets بيبقى من فهم غلط للمطلوب، مش من الكود.",
    words: [
      { en: "implement", ar: "تكتب الكود اللي بيعمل الحاجة دي", example: "Implement the function is_word_guessed." },
      { en: "return", ar: "الدالة ترجّع قيمة (مش تطبعها)", example: "The function should return True or False." },
      { en: "assume", ar: "تعتبر إن ده مضمون، مش لازم تتأكد منه", example: "You may assume the list is sorted." },
      { en: "given", ar: "مُعطى / اللي بنديهولك", example: "Given a string s, count the vowels." },
      { en: "such that", ar: "بحيث إن", example: "Find x such that x * x == n." },
      { en: "at least / at most", ar: "على الأقل (>=) / بالكتير (<=)", example: "The list has at most 100 elements." },
      { en: "otherwise", ar: "غير كده (else)", example: "Return the index; otherwise, return -1." },
      { en: "handle", ar: "تتعامل مع حالة معيّنة في الكود", example: "Make sure to handle the empty list." },
      { en: "edge case", ar: "حالة طرفية (فاضي، صفر، سالب، عنصر واحد)", example: "Test the edge cases too." },
      { en: "respectively", ar: "على الترتيب", example: "a and b are 3 and 5, respectively." },
    ],
    patterns: [
      { en: "should / must", ar: "مطلوب منك — مش اختياري" },
      { en: "You may / You can", ar: "مسموح لك (اختياري)" },
      { en: "Do not / You should not", ar: "ممنوع — غالباً الـ grader بيتأكد منه" },
    ],
    quiz: [
      {
        text: "Return -1 if the item is not in the list; otherwise, return its index.",
        ask: "لو العنصر موجود ترجّع إيه؟",
        options: ["-1", "مكانه (index)", "True", "العنصر نفسه"],
        answer: 1,
        why: "otherwise = غير كده = لو موجود. index = رقم مكانه.",
      },
      {
        text: "Your function should handle negative numbers.",
        ask: "يعني إيه؟",
        options: ["ممنوع أرقام سالبة", "شيل الأرقام السالبة", "الكود لازم يشتغل صح لو جاله رقم سالب", "حوّل السالب لموجب"],
        answer: 2,
        why: "handle = تتعامل معاها صح. ده edge case لازم تجرّبه بنفسك.",
      },
      {
        text: "a and b are the width and the height, respectively.",
        ask: "b هو إيه؟",
        options: ["الطول (height)", "العرض (width)", "الاتنين", "مش واضح"],
        answer: 0,
        why: "respectively = على الترتيب: الأول للأول، والتاني للتاني. a = width و b = height.",
      },
      {
        text: "The list will contain at most 10 elements.",
        ask: "الليست فيها كام عنصر؟",
        options: ["10 بالظبط", "أكتر من 10", "10 أو أكتر", "10 أو أقل"],
        answer: 3,
        why: "at most = بالكتير = 10 أو أقل.",
      },
    ],
  },
  {
    id: "python",
    section: "vocab",
    title: "كلمات بايثون الأساسية",
    why: "دي اللي هتسمعها في كل محاضرة في MIT 6.100L.",
    words: [
      { en: "variable", ar: "متغيّر: اسم بيشاور على قيمة", example: "x is a variable bound to 5." },
      { en: "assign / assignment", ar: "تدّي قيمة لمتغير (=)", example: "x = 5 assigns 5 to x." },
      { en: "expression", ar: "حاجة بتتحسب وتطلّع قيمة", example: "3 + 4 is an expression." },
      { en: "evaluate", ar: "تحسب قيمة الـ expression", example: "Python evaluates 3 + 4 to 7." },
      { en: "loop / iterate", ar: "تكرار / تلف على العناصر واحد واحد", example: "Iterate over the list with a for loop." },
      { en: "condition", ar: "شرط", example: "The loop stops when the condition is False." },
      { en: "define / call", ar: "تعرّف دالة (def) / تنادي عليها", example: "Define the function first, then call it." },
      { en: "parameter", ar: "اسم القيمة في تعريف الدالة", example: "def f(x): — x is a parameter." },
      { en: "integer / float / string", ar: "رقم صحيح / رقم بعلامة عشرية / نص", example: "5 is an int, 5.0 is a float, '5' is a str." },
      { en: "immutable", ar: "مينفعش يتغيّر بعد ما يتعمل", example: "Strings and tuples are immutable." },
    ],
    patterns: [
      { en: "x is bound to 5", ar: "المتغير x بيشاور على 5" },
      { en: "evaluates to", ar: "قيمته بتطلع..." },
      { en: "iterate over the list", ar: "تلف على الليست عنصر عنصر" },
    ],
    quiz: [
      {
        text: "The expression 2 ** 3 evaluates to 8.",
        ask: "evaluates to يعني إيه؟",
        options: ["بيتطبع", "قيمته بتطلع 8", "بيتخزّن في 8", "بيتكرر 8 مرات"],
        answer: 1,
        why: "evaluate = يحسب. evaluates to 8 = لما تحسبه يطلع 8.",
      },
      {
        text: "Strings are immutable.",
        ask: "يعني إيه؟",
        options: ["مينفعش تغيّر حرف جوه string موجود", "مينفعش تطبعها", "بتتمسح لوحدها", "لازم تبقى فاضية"],
        answer: 0,
        why: "immutable = مش قابل للتغيير. s[0] = 'a' هيطلّع error. mutable = قابل (زي list).",
      },
      {
        text: "Iterate over the characters in the string.",
        ask: "المطلوب إيه؟",
        options: ["تعد الحروف", "تمسح الحروف", "تلف على الحروف واحد واحد (for loop)", "تعكس الـ string"],
        answer: 2,
        why: "iterate over = تلف على. for c in s: ...",
      },
      {
        text: "Call the function with two arguments.",
        ask: "المطلوب إيه؟",
        options: ["تعرّف الدالة", "تمسح الدالة", "تكتب return", "تنادي الدالة وتديها قيمتين"],
        answer: 3,
        why: "call = تنادي/تشغّل. define = تعرّف (def). الاتنين مختلفين.",
      },
    ],
  },
  {
    id: "docs",
    section: "docs",
    title: "قراءة الـ docs",
    why: "الـ docs هي المصدر الحقيقي. اللي بيعرف يقراها مش محتاج حد يشرحله كل function.",
    words: [
      { en: "returns", ar: "بترجّع", example: "Returns the number of items in a container." },
      { en: "optional", ar: "اختياري", example: "The second argument is optional." },
      { en: "default", ar: "القيمة الافتراضية لو مدّيتش حاجة", example: "sep defaults to ' '." },
      { en: "omitted", ar: "اتشال / مكتبتهوش", example: "If omitted, the default is used." },
      { en: "raises", ar: "بترمي خطأ", example: "Raises KeyError if the key is missing." },
      { en: "deprecated", ar: "قديم وهيتشال — استخدم البديل", example: "Deprecated since version 3.10." },
      { en: "in place", ar: "بتغيّر نفس الحاجة، مش بتعمل نسخة", example: "list.sort() sorts the list in place." },
      { en: "e.g. / i.e.", ar: "مثلاً / يعني", example: "a sequence (e.g. a list or a tuple)" },
      { en: "usage", ar: "طريقة الاستخدام (الشكل اللي تكتب بيه الأمر)", example: "usage: git [--version] <command> [<args>]" },
      { en: "[ ] in usage", ar: "الحاجة اللي بين [ ] اختيارية", example: "ls [OPTION]... [FILE]..." },
    ],
    patterns: [
      { en: "Return X if Y, else Z", ar: "لو Y رجّع X، غير كده رجّع Z" },
      { en: "X defaults to Y", ar: "لو مدّيتش X، قيمته هتبقى Y" },
      { en: "New in version 3.8", ar: "الحاجة دي موجودة من نسخة 3.8 بس" },
    ],
    quiz: [
      {
        code: true,
        text: "print(*objects, sep=' ', end='\\n')\nsep and end default to ' ' and '\\n', respectively.",
        ask: "لو مكتبتش end، print هتعمل إيه في الآخر؟",
        options: ["مسافة", "سطر جديد", "ولا حاجة", "error"],
        answer: 1,
        why: "default = الافتراضي. respectively = على الترتيب: sep → ' '، end → '\\n' (سطر جديد).",
      },
      {
        text: "sorted() returns a new sorted list; list.sort() sorts the list in place.",
        ask: "الفرق إيه؟",
        options: [
          "مفيش فرق",
          "sort() أسرع بس",
          "sorted() بتغيّر الأصلية",
          "sorted() بترجّع ليست جديدة، وsort() بتغيّر نفس الليست",
        ],
        answer: 3,
        why: "returns a new = بترجّع جديدة. in place = في نفس المكان (الأصلية بتتغير).",
      },
      {
        code: true,
        text: "usage: cp [-r] SOURCE DEST",
        ask: "إيه الاختياري هنا؟",
        options: ["-r", "SOURCE", "DEST", "كلهم"],
        answer: 0,
        why: "اللي بين [ ] اختياري. SOURCE و DEST لازم تكتبهم.",
      },
      {
        text: "This parameter is deprecated and will be removed in a future version.",
        ask: "تعمل إيه؟",
        options: ["تستخدمه عادي للأبد", "متستخدموش واستخدم البديل", "تسطّب نسخة قديمة", "تبلّغ عن bug"],
        answer: 1,
        why: "deprecated + will be removed = هيتشال. ابعد عنه.",
      },
    ],
  },
  {
    id: "verbs",
    section: "vocab",
    title: "أفعال البرمجة",
    why: "أفعال بتتقال في الشغل وفي الكورسات بمعنى غير معناها العادي.",
    words: [
      { en: "store", ar: "تخزّن", example: "Store the result in a variable." },
      { en: "fetch", ar: "تجيب (من سيرفر أو ذاكرة)", example: "Fetch the data from the API." },
      { en: "parse", ar: "تحلّل نص وتحوّله لبيانات منظمة", example: "Parse the JSON response." },
      { en: "compute", ar: "تحسب", example: "Compute the average of the list." },
      { en: "invoke", ar: "تنادي/تشغّل (زي call)", example: "The function is invoked twice." },
      { en: "trigger", ar: "يتسبب في حدوث حاجة / يشغّلها", example: "Clicking the button triggers a request." },
      { en: "render", ar: "يرسم/يعرض على الشاشة", example: "React renders the component." },
      { en: "override", ar: "تكتب فوق سلوك قديم بسلوك جديد", example: "The subclass overrides the method." },
      { en: "yield", ar: "يطلّع/ينتج (وفي بايثون كلمة محجوزة)", example: "The search yields three results." },
      { en: "propagate", ar: "ينتشر/يطلع لفوق (الخطأ بيطلع للي نادى)", example: "The exception propagates to the caller." },
    ],
    patterns: [
      { en: "the caller", ar: "الكود اللي نادى الدالة" },
      { en: "under the hood", ar: "من جوه / إزاي بيشتغل فعلاً" },
      { en: "out of the box", ar: "شغال من غير أي إعداد" },
    ],
    quiz: [
      {
        text: "Parse the input string into a list of integers.",
        ask: "المطلوب إيه؟",
        options: ["تطبع النص", "تمسح النص", "تحوّل النص لليست أرقام", "تعد الأرقام"],
        answer: 2,
        why: "parse = تحلّل النص وتطلع منه بيانات. '1 2 3' → [1, 2, 3].",
      },
      {
        text: "The error propagates up to the caller.",
        ask: "يعني إيه؟",
        options: [
          "الخطأ بيطلع للدالة اللي نادت الدالة دي",
          "الخطأ اختفى",
          "الخطأ اتصلّح",
          "الخطأ بيتكرر",
        ],
        answer: 0,
        why: "propagate = ينتشر لفوق. the caller = اللي نادى. ده اللي بتشوفه في الـ traceback.",
      },
      {
        text: "This works out of the box.",
        ask: "يعني إيه؟",
        options: ["لازم تعدّل فيه كتير", "شغال على طول من غير إعداد", "مش شغال", "برّه الصندوق"],
        answer: 1,
        why: "out of the box = جاهز من أول ما تفتحه. مش ترجمة حرفية!",
      },
      {
        text: "Saving the file triggers a rebuild.",
        ask: "يعني إيه؟",
        options: ["الحفظ بيوقف البناء", "الحفظ بيمسح الـ build", "لازم تعمل build قبل الحفظ", "لما تحفظ، الـ build بيبدأ لوحده"],
        answer: 3,
        why: "trigger = يشغّل/يتسبب في. الحفظ هو اللي بيبدأ الـ rebuild.",
      },
    ],
  },
];

// ---------- النتيجة والمستوى ----------

export type EnglishTest = { ts: number; date: string; answers: number[] }; // answers[i] = اختيار مادا في TEST[i]

export function scoreTest(t: EnglishTest) {
  const bySection = Object.fromEntries(
    (Object.keys(SECTIONS) as Section[]).map((s) => [s, { right: 0, total: 0 }]),
  ) as Record<Section, { right: number; total: number }>;
  let right = 0;
  TEST.forEach((q, i) => {
    const ok = t.answers[i] === q.answer;
    bySection[q.section].total++;
    if (ok) {
      bySection[q.section].right++;
      right++;
    }
  });
  return { right, total: TEST.length, bySection };
}

export type Level = { id: "start" | "mid" | "good"; title: string; plan: string[] };

export function level(right: number): Level {
  if (right <= 9)
    return {
      id: "start",
      title: "بداية — ومفيش أي مشكلة",
      plan: [
        "المصدر العربي هو الأساس دلوقتي. افهم الفكرة بالعربي الأول، وبعدين بص على الإنجليزي.",
        "درس من دروس الصفحة دي كل يومين (10 دقايق). ابدأ بالترتيب اللي تحت.",
        "ضيف كلمات كل درس للقاموس، وراجعها لما تطلعلك في الصفحة الرئيسية.",
        "الفيديوهات الإنجليزي: ترجمة إنجليزي (مش عربي) + سرعة 0.75، ووقّف عند أي كلمة متكررة.",
      ],
    };
  if (right <= 15)
    return {
      id: "mid",
      title: "متوسط — فاهم كتير، وناقصك الكلمات التقنية",
      plan: [
        "ابدأ بالدروس اللي في الأقسام اللي جبت فيها أقل (متعلّمة تحت بـ ⚠).",
        "شوف الدرس بالعربي لو محتاج، بس حاول تتفرج على المحاضرة الإنجليزي كاملة بعدها بالترجمة الإنجليزي.",
        "كل رسالة خطأ في الشغل أو المذاكرة: اقراها بصوت عالي وترجمها لنفسك قبل ما تعمل أي حاجة.",
      ],
    };
  return {
    id: "good",
    title: "كويس — الإنجليزي مش هو اللي موقفك",
    plan: [
      "لو المحاضرة صعبة، غالباً المشكلة في سرعة الشرح أو إن الفكرة جديدة، مش في اللغة.",
      "استخدم سرعة 0.75 والترجمة الإنجليزي، ووقّف الفيديو وجرّب بإيدك.",
      "\"اشرحلي بالعربي\" في كارت المهمة يديك الفكرة قبل المحاضرة، فتدخل وإنت عارف الكلام رايح فين.",
    ],
  };
}

// ترتيب الدروس: الأقسام الأضعف الأول، وجوه كل قسم بترتيب LESSONS
export function orderedLessons(t?: EnglishTest): Lesson[] {
  if (!t) return LESSONS;
  const { bySection } = scoreTest(t);
  const ratio = (s: Section) => bySection[s].right / bySection[s].total;
  return [...LESSONS].sort((a, b) => ratio(a.section) - ratio(b.section));
}

export function weakSections(t: EnglishTest): Section[] {
  const { bySection } = scoreTest(t);
  return (Object.keys(SECTIONS) as Section[]).filter((s) => bySection[s].right / bySection[s].total < 0.6);
}
