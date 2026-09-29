// أدوات السيرفر المشتركة: Redis (Upstash REST) + التحقق من SYNC_KEY + الإعدادات المتاحة.

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

export const KEYS = {
  state: "mada-cs:state",
  subs: "mada-cs:push-subs",
  promise: "mada-cs:current-promise",
  schedules: "mada-cs:timetable-schedules", // QStash schedule ids بتاعة جدول المحاضرات
};

export const features = {
  sync: !!(process.env.SYNC_KEY && REDIS_URL && REDIS_TOKEN),
  examiner: !!(process.env.SYNC_KEY && (process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY)),
  mentor: !!(process.env.SYNC_KEY && process.env.GEMINI_API_KEY),
  push: !!(process.env.SYNC_KEY && REDIS_URL && process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
  remind: !!(
    process.env.SYNC_KEY &&
    REDIS_URL &&
    process.env.QSTASH_TOKEN &&
    process.env.VAPID_PUBLIC_KEY &&
    process.env.VAPID_PRIVATE_KEY
  ),
};

export function denied(req: Request, feature: keyof typeof features): Response | null {
  if (!features[feature]) return Response.json({ error: `${feature} not configured on server` }, { status: 501 });
  if (req.headers.get("x-sync-key") !== process.env.SYNC_KEY) {
    return Response.json({ error: "wrong sync key" }, { status: 401 });
  }
  return null;
}

export async function redis<T = unknown>(command: unknown[]): Promise<T> {
  const res = await fetch(REDIS_URL!, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`redis ${res.status}`);
  return ((await res.json()) as { result: T }).result;
}
