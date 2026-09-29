"use client";

import { useEffect, useState } from "react";

export type Features = {
  sync: boolean;
  examiner: boolean;
  push: boolean;
  remind: boolean;
  vapidPublicKey: string | null;
};

const OFF: Features = { sync: false, examiner: false, push: false, remind: false, vapidPublicKey: null };
let cached: Promise<Features> | null = null;

export function useFeatures(): Features {
  const [f, setF] = useState<Features>(OFF);
  useEffect(() => {
    cached ??= fetch("/api/config")
      .then((r) => (r.ok ? r.json() : OFF))
      .catch(() => OFF);
    let alive = true;
    cached.then((v) => alive && setF(v));
    return () => {
      alive = false;
    };
  }, []);
  return f;
}

export async function api<T>(path: string, syncKey: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "content-type": "application/json", "x-sync-key": syncKey, ...(init.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  return body as T;
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export async function enablePush(syncKey: string, vapidPublicKey: string): Promise<void> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error("المتصفح ده مش بيدعم الإشعارات. على الآيفون لازم تضيف الموقع للشاشة الرئيسية الأول.");
  }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("الإذن اترفض. فعّله من إعدادات المتصفح للموقع ده.");
  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    }));
  await api("/api/push", syncKey, { method: "POST", body: JSON.stringify(sub) });
}

// لينك Google Calendar — بديل مضمون للإشعارات لو السيرفر مش متظبط
export function calendarUrl(at: number, title: string): string {
  const fmt = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `مذاكرة: ${title}`,
    dates: `${fmt(at)}/${fmt(at + 45 * 60_000)}`,
    details: "افتح مسار مادا وابدأ التايمر. 20 دقيقة على الأقل.",
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}
