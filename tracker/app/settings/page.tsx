"use client";

import { useState } from "react";
import { api, enablePush, useFeatures } from "@/lib/client";
import { type State, useStore } from "@/lib/store";

export default function SettingsPage() {
  const { state, ready, update, replace, syncKey, setSyncKey, syncStatus, syncNow } = useStore();
  const [key, setKey] = useState<string | null>(null);
  const features = useFeatures();
  const [pushMsg, setPushMsg] = useState("");
  if (!ready) return <p className="text-muted">...</p>;

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `mada-cs-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importJson = async (file: File) => {
    try {
      const data = JSON.parse(await file.text()) as State;
      if (!Array.isArray(data.sessions)) throw new Error();
      if (confirm("ده هيستبدل كل البيانات الحالية. متأكد؟")) replace(data);
    } catch {
      alert("الملف مش صالح");
    }
  };

  const statusText = {
    off: "مقفولة — البيانات على الجهاز ده بس",
    syncing: "بتزامن...",
    ok: "شغالة ✓",
    error: "فشلت — اتأكد من المفتاح وإعدادات Vercel",
  }[syncStatus];

  return (
    <div className="space-y-4">
      <section className="card space-y-2">
        <h2 className="font-bold">ساعات في الأسبوع</h2>
        <p className="text-sm text-muted">كن واقعي. 9 ساعات = ساعة كل يوم شغل + 4 ساعات في الإجازة.</p>
        <input
          className="input"
          type="number"
          inputMode="numeric"
          min={1}
          max={60}
          value={state.weeklyHours}
          onChange={(e) => update((s) => ({ ...s, weeklyHours: Math.max(1, Number(e.target.value) || 1) }))}
        />
      </section>

      <section className="card space-y-2">
        <h2 className="font-bold">مزامنة الموبايل والكمبيوتر</h2>
        <p className="text-sm text-muted">الحالة: {statusText}</p>
        <p className="text-sm leading-7 text-muted">
          اكتب نفس الـ SYNC_KEY اللي حطيته في Vercel، على كل جهاز.
        </p>
        <input
          className="input"
          type="password"
          dir="ltr"
          value={key ?? syncKey}
          onChange={(e) => setKey(e.target.value)}
          placeholder="SYNC_KEY"
        />
        <div className="flex gap-2">
          <button className="btn-primary flex-1" onClick={() => setSyncKey((key ?? syncKey).trim())}>
            حفظ المفتاح
          </button>
          {syncKey && (
            <button className="btn-ghost" onClick={syncNow}>
              زامن دلوقتي
            </button>
          )}
        </div>
      </section>

      <section className="card space-y-3">
        <h2 className="font-bold">الإشعارات</h2>
        <p className="text-sm leading-7 text-muted">
          فعّلها على كل جهاز (الموبايل أهم حاجة). على الآيفون: ضيف الموقع للشاشة الرئيسية الأول وافتحه من هناك.
        </p>
        <div className="flex gap-2">
          <button
            className="btn-primary flex-1"
            disabled={!features.push || !syncKey}
            onClick={async () => {
              setPushMsg("...");
              try {
                await enablePush(syncKey, features.vapidPublicKey!);
                setPushMsg("الجهاز ده هيجيله إشعارات ✓");
              } catch (e) {
                setPushMsg((e as Error).message);
              }
            }}
          >
            فعّل الإشعارات هنا
          </button>
          <button
            className="btn-ghost"
            disabled={!features.push || !syncKey}
            onClick={async () => {
              try {
                const r = await api<{ sent: number }>("/api/push", syncKey, { method: "PUT" });
                setPushMsg(`اتبعت لـ ${r.sent} جهاز`);
              } catch (e) {
                setPushMsg((e as Error).message);
              }
            }}
          >
            جرّب
          </button>
        </div>
        {pushMsg && <p className="text-sm">{pushMsg}</p>}
        {!syncKey && <p className="text-xs text-warn">احفظ الـ SYNC_KEY فوق الأول.</p>}
      </section>

      <section className="card space-y-2">
        <h2 className="font-bold">حالة السيرفر</h2>
        <ul className="space-y-1 text-sm">
          {(
            [
              ["sync", "مزامنة الأجهزة", "SYNC_KEY + Upstash Redis"],
              ["examiner", "ممتحن Claude", "ANTHROPIC_API_KEY"],
              ["push", "إشعارات", "VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY"],
              ["remind", "تذكير في معادك", "QSTASH_TOKEN"],
            ] as const
          ).map(([k, label, env]) => (
            <li key={k} className="flex justify-between gap-2">
              <span>
                {features[k] ? "✓" : "✗"} {label}
              </span>
              {!features[k] && (
                <span className="text-xs text-muted" dir="ltr">
                  {env}
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="card space-y-2">
        <h2 className="font-bold">نسخة احتياطية</h2>
        <div className="flex gap-2">
          <button className="btn-ghost flex-1" onClick={exportJson}>
            تصدير JSON
          </button>
          <label className="btn-ghost flex-1 cursor-pointer">
            استيراد
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])}
            />
          </label>
        </div>
      </section>
    </div>
  );
}
