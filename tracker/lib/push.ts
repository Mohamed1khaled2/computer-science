import webpush from "web-push";
import { KEYS, redis } from "./server";

// أزرار الإشعار (Android والكمبيوتر، iOS بيتجاهلها): كل زرار بيفتح url
export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  actions?: { action: string; title: string; url: string }[];
  badgeCount?: number; // الرقم الأحمر على أيقونة التطبيق (iOS 16.4+ والكمبيوتر). 0 = امسحه
};

export async function pushAll(origin: string, payload: PushPayload) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? origin,
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  const subs = await redis<string[]>(["SMEMBERS", KEYS.subs]);
  let sent = 0;
  await Promise.all(
    subs.map(async (raw) => {
      try {
        await webpush.sendNotification(JSON.parse(raw), JSON.stringify(payload), { TTL: 3600, urgency: "high" });
        sent++;
      } catch (e) {
        // الاشتراك انتهى (الموبايل لغى الإذن أو مسح الموقع) — امسحه
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await redis(["SREM", KEYS.subs, raw]);
      }
    }),
  );
  return sent;
}
