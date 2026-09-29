"use client";

import { useState } from "react";
import { type State, useStore } from "@/lib/store";

export default function SettingsPage() {
  const { state, ready, update, replace, syncKey, setSyncKey, syncStatus, syncNow } = useStore();
  const [key, setKey] = useState<string | null>(null);
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
