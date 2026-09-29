"use client";

// على الآيفون الإشعارات مش بتشتغل غير لو التطبيق متضاف للشاشة الرئيسية ومفتوح منها (iOS 16.4+).
// الصفحات بتترندر بعد ready (على المتصفح بس)، فقراية navigator هنا آمنة.
export function isIos(): boolean {
  return /iPhone|iPad|iPod/.test(navigator.userAgent);
}

export function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export default function IosInstall() {
  if (!isIos() || isStandalone()) return null;
  return (
    <div className="space-y-2 rounded-xl border border-gold/40 bg-gold-soft p-3 text-sm leading-7">
      <p className="font-bold text-gold">انت فاتح من Safari — الإشعارات مش هتشتغل من هنا</p>
      <ol className="list-decimal space-y-1 ps-5">
        <li>
          دوس زرار المشاركة <span dir="ltr">(⬆️)</span> تحت في Safari.
        </li>
        <li>
          اختار <b dir="ltr">Add to Home Screen</b> (إضافة إلى الشاشة الرئيسية).
        </li>
        <li>افتح «مسار مادا» من الأيقونة الجديدة، مش من Safari.</li>
        <li>ارجع للإعدادات هنا، احفظ الـ SYNC_KEY، ودوس «فعّل الإشعارات هنا» ووافق.</li>
      </ol>
      <p className="text-xs text-muted">محتاج iOS 16.4 أو أحدث (الإعدادات ← عام ← حول).</p>
    </div>
  );
}
