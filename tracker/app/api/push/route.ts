import { denied, KEYS, redis } from "@/lib/server";
import { pushAll } from "@/lib/push";

type Sub = { endpoint: string; keys: { p256dh: string; auth: string } };

function valid(s: unknown): s is Sub {
  const x = s as Sub;
  return typeof x?.endpoint === "string" && x.endpoint.startsWith("https://") && !!x.keys?.p256dh && !!x.keys?.auth;
}

// تسجيل جهاز للإشعارات
export async function POST(req: Request) {
  const no = denied(req, "push");
  if (no) return no;
  const sub = await req.json().catch(() => null);
  if (!valid(sub)) return Response.json({ error: "bad subscription" }, { status: 400 });
  const raw = JSON.stringify({ endpoint: sub.endpoint, keys: sub.keys });
  await redis(["SADD", KEYS.subs, raw]);
  return Response.json({ ok: true });
}

// إشعار تجريبي لكل الأجهزة
export async function PUT(req: Request) {
  const no = denied(req, "push");
  if (no) return no;
  const sent = await pushAll(new URL(req.url).origin, {
    title: "الإشعارات شغالة ✓",
    body: "كده هيجيلك إشعار في معاد كل محاضرة، وبعدها تسجيل الحضور أو الغياب.\nجرّب الزرار اللي تحت.",
    tag: "mada-test",
    actions: [{ action: "start", title: "ابدأ 10 دقايق", url: "/#start" }],
  });
  return Response.json({ sent });
}
