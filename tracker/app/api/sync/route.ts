// مزامنة بين الموبايل والكمبيوتر عن طريق Upstash Redis.
// لو مش متظبطة، التطبيق بيشتغل عادي والبيانات بتفضل على الجهاز بس.

import { denied, KEYS, redis } from "@/lib/server";

export async function GET(req: Request) {
  const no = denied(req, "sync");
  if (no) return no;
  const result = await redis<string | null>(["GET", KEYS.state]);
  return Response.json(typeof result === "string" ? JSON.parse(result) : null);
}

export async function PUT(req: Request) {
  const no = denied(req, "sync");
  if (no) return no;
  const body = await req.text();
  if (body.length > 2_000_000) return Response.json({ error: "too large" }, { status: 413 });
  try {
    JSON.parse(body);
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
  await redis(["SET", KEYS.state, body]);
  return Response.json({ ok: true });
}
