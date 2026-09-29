// شكل الإشعارات اللي هتوصلك (تقريبي لشكل Android). النصوص نفسها اللي بيبعتها /api/remind/fire.
const SAMPLES = [
  {
    when: "في معاد المحاضرة",
    title: "📚 محاضرة الخميس 9:00 م بدأت",
    body: "Missing Semester 1 — Course Overview + The Shell\nابدأ 10 دقايق بس وهتتحسب حضور.\nحضورك الأسبوع ده: 3/4",
    actions: ["ابدأ 10 دقايق", "تعبان"],
  },
  {
    when: "بعد المحاضرة بـ 3 ساعات — لو حضرت",
    title: "✓ اتسجّل حضورك",
    body: "حضورك الأسبوع ده: 4/4\nالمحاضرة الجاية: الجمعة 10:00 ص",
    actions: ["كشف الحضور"],
    tap: "بيفتح كشف الحضور · وبيمسح الرقم الأحمر",
  },
  {
    when: "بعد المحاضرة بـ 3 ساعات — لو غبت",
    title: "✗ اتسجّلت غياب",
    body: "عادي، مرة واحدة. القاعدة: متغيبش مرتين ورا بعض.\nحضورك الأسبوع ده: 3/5",
    actions: ["ابدأ 10 دقايق دلوقتي", "كان عندي عذر"],
  },
  {
    when: "في المعاد اللي وعدت ترجع فيه",
    title: "معادك دلوقتي يا مادا ⏰",
    body: "Missing Semester 2 — Command-line Environment\n20 دقيقة بس. افتح وابدأ التايمر.",
    actions: ["ابدأ 10 دقايق"],
  },
];

export default function NotificationPreview({ ios = false }: { ios?: boolean }) {
  return (
    <details className="rounded-xl bg-bg p-3">
      <summary className="cursor-pointer text-sm font-semibold">شكل الإشعارات اللي هتوصلك</summary>
      <ul className="mt-3 space-y-3">
        {SAMPLES.map((n) => (
          <li key={n.title}>
            <p className="mb-1 text-xs text-muted">{n.when}</p>
            <div className="rounded-2xl border border-line bg-card p-3 shadow-sm">
              <div className="flex items-center gap-1.5 text-[11px] text-muted">
                {/* eslint-disable-next-line @next/next/no-img-element -- أيقونة صغيرة ثابتة */}
                <img src="/icons/icon-192.png" alt="" className="size-4 rounded" />
                مسار مادا · دلوقتي
              </div>
              <p className="mt-1.5 text-sm font-bold">{n.title}</p>
              <p className="whitespace-pre-line text-sm leading-6 text-muted" dir="auto">
                {n.body}
              </p>
              {ios ? (
                <p className="mt-2 border-t border-line pt-2 text-xs text-muted">
                  {n.tap ?? "الضغط عليه بيفتح كارت «ابدأ 10 دقايق» · والرقم الأحمر يظهر على الأيقونة"}
                </p>
              ) : (
                <div className="mt-2 flex gap-4 border-t border-line pt-2 text-xs font-bold text-accent">
                  {n.actions.map((a) => (
                    <span key={a}>{a}</span>
                  ))}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs leading-6 text-muted">
        {ios
          ? "على الآيفون مفيش أزرار في الإشعارات، فالضغط على الإشعار نفسه بيعمل الحاجة المهمة."
          : "الأزرار بتظهر على Android والكمبيوتر. الآيفون بيعرض الإشعار من غيرها، والضغط عليه بيفتح التطبيق."}
      </p>
    </details>
  );
}
