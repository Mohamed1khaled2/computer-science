// مزامنة بين الموبايل والكمبيوتر عن طريق Upstash Redis (REST، من غير أي مكتبة).
// المتغيرات: SYNC_KEY + (UPSTASH_REDIS_REST_URL/TOKEN أو KV_REST_API_URL/TOKEN من Vercel).
// لو مش متظبطة، التطبيق بيشتغل عادي والبيانات بتفضل على الجهاز بس.

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
const DATA_KEY = "mada-cs:state";

function authorized(req: Request): Response | null {
  if (!process.env.SYNC_KEY || !REDIS_URL || !REDIS_TOKEN) {
    return Response.json({ error: "sync not configured on server" }, { status: 501 });
  }
  if (req.headers.get("x-sync-key") !== process.env.SYNC_KEY) {
    return Response.json({ error: "wrong sync key" }, { status: 401 });
  }
  return null;
}

async function redis(command: unknown[]) {
  const res = await fetch(REDIS_URL!, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`redis ${res.status}`);
  return (await res.json()) as { result: unknown };
}

export async function GET(req: Request) {
  const denied = authorized(req);
  if (denied) return denied;
  const { result } = await redis(["GET", DATA_KEY]);
  return Response.json(typeof result === "string" ? JSON.parse(result) : null);
}

export async function PUT(req: Request) {
  const denied = authorized(req);
  if (denied) return denied;
  const body = await req.text();
  if (body.length > 2_000_000) return Response.json({ error: "too large" }, { status: 413 });
  try {
    JSON.parse(body);
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
  await redis(["SET", DATA_KEY, body]);
  return Response.json({ ok: true });
}
