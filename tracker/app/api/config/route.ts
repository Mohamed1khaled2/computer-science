import { features } from "@/lib/server";

// بيقول للواجهة أنهي مميزات متظبطة على السيرفر (من غير ما يكشف أي سر)
export function GET() {
  const examinerName = process.env.ANTHROPIC_API_KEY ? "Claude" : process.env.GEMINI_API_KEY ? "Gemini" : null;
  return Response.json({ ...features, examinerName, vapidPublicKey: process.env.VAPID_PUBLIC_KEY ?? null });
}
