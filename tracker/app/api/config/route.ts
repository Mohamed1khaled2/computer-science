import { features } from "@/lib/server";

// بيقول للواجهة أنهي مميزات متظبطة على السيرفر (من غير ما يكشف أي سر)
export function GET() {
  return Response.json({ ...features, vapidPublicKey: process.env.VAPID_PUBLIC_KEY ?? null });
}
