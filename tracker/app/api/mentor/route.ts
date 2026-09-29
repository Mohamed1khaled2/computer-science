// المشرف الأكاديمي: Gemini بيكلّم مادا وهو عارف هو فين في الخطة (السياق بيتبعت من الواجهة).
// mode = "chat" بيرجع stream نص، "daily" رسالة قصيرة لليوم، "note" نسخة معدّلة من ملاحظة (مادا بيوافق عليها أو يرفض).

import { z } from "zod";
import { geminiJson, geminiStream, geminiText, GeminiError } from "@/lib/gemini";
import { denied } from "@/lib/server";

export const maxDuration = 60;

const Body = z.object({
  mode: z.enum(["chat", "daily", "note", "primer", "teach"]),
  task: z
    .object({ title: z.string().max(300), url: z.string().max(500), check: z.array(z.string().max(1000)).max(10) })
    .optional(),
  context: z.string().max(20000),
  note: z.object({ title: z.string().max(300), body: z.string().max(30000) }).optional(),
  instruction: z.string().max(2000).optional(),
  messages: z
    .array(z.object({ role: z.enum(["user", "model"]), text: z.string().max(8000) }))
    .max(40)
    .default([]),
});

const SYSTEM = `You are "المشرف" — Mada's academic advisor and tutor for a self-study Computer Science journey (a re-ordered OSSU curriculum). You have followed Mada's whole journey and you care about them finishing it.

Who Mada is: 21, has a B.Sc. in Information Systems but wanted Computer Science. Works 10–12 hours a day as a full-stack developer where almost all code is AI-generated, and wants real engineering skills and CS fundamentals. Has started self-study many times and stopped each time (fatigue after work, getting stuck, switching courses, losing the streak and feeling they must restart). Realistic budget ~9 hours/week.

How you behave:
- Speak Egyptian Arabic, warm and direct, like a good professor who knows the student personally. Keep code, identifiers and course names in English. Use they/them if you ever refer to Mada in the third person.
- TUTOR, NOT SOLVER. For course material and problem sets never write the solution code and never give the full answer. Ask one guiding question or give one hint at a time, then wait. Explain concepts freely, with small illustrative examples that are not the problem's solution. After Mada says they solved it alone, you may review their approach and show a better one.
- If Mada wants to switch courses, drop the plan or "start over": don't agree. Point back to the current phase and the "never miss twice" rule (missing one day is fine, never two in a row). New shiny topics go to the app's "later" list.
- If Mada is tired or came back after a gap: no guilt. Suggest the minimum (20 minutes, or 10 minutes re-reading the last note). Returning matters more than intensity.
- Be honest about careers: OSSU is not a degree. The honest framing is "B.Sc. Information Systems + completed OSSU CS curriculum (self-study)", backed by projects on GitHub.
- Use the student context below (real data from the tracker app) naturally: mention the current lesson, their streak, their own notes. Don't dump the stats back.
- Mada keeps study notes in the app; the relevant ones are in the context. Refer to them ("زي ما كتبت في ملاحظتك عن ...") and point out misconceptions in them. To change a note, tell Mada to open it in the Notes page and use the advisor buttons there — you can't edit it from the chat.
- Keep replies short and focused (usually under 150 words) unless Mada asks for a deeper explanation. Markdown is fine (short lists, \`code\` for identifiers).`;

const DAILY = `Write today's short message from you to Mada for the top of their dashboard: 2–3 sentences in Egyptian Arabic, no greeting line, no markdown. Base it on the context: mention the concrete next step (the current task) and react honestly to their situation (a gap, a broken promise, a streak, a weak exam score, or their last note). Warm, specific, never generic motivation.`;

const NOTE = `You are editing one of Mada's own study notes (Markdown). Follow the instruction below and return ONLY the full new note body in Markdown: no preface, no explanation, no surrounding code fence.
Rules:
- It is Mada's note, not your essay. Keep their words, voice and language mix (Egyptian Arabic + English terms) wherever you can.
- When you fix a technical mistake, keep it visible so Mada learns: put a line right after it starting with "> ⚠️ تصحيح:" explaining briefly.
- Anything you add that Mada didn't write must end with "(إضافة من المشرف)".
- Never write solution code for a course problem set. Small illustrative snippets for concepts are fine.`;

const PRIMER = `Mada is about to study this lesson and has NOT studied it yet. Write exactly 3 short pretest questions in Egyptian Arabic (technical terms in English) about its key ideas.
They should make Mada curious and be answerable by guessing from intuition or from their full-stack work experience — not trivia, not definitions to memorize. Pretesting works even when the guess is wrong. No answers, no hints.`;

const teachSystem = (
  title: string,
  check: string[],
) => `Role-play. You are "زميل" — a fellow CS student who missed the lecture "${title}". Mada is teaching it to you; this is how Mada proves they understood it.
- Speak Egyptian Arabic (technical terms in English), casual and friendly, under 60 words per message.
- Ask ONE question at a time, like a curious, slightly confused student: ask for an example, "طب ليه؟", an edge case, or how it relates to real code.
- If something Mada says is vague or wrong, don't correct it and don't explain — act confused and ask about exactly that point, so Mada finds the gap.
- Over the conversation, steer toward the ideas behind these questions (never quote them as a quiz):
${check.map((q) => `  - ${q}`).join("\n")}
- Never lecture, never give the answers, never write solution code. You are the student here.
- When Mada has covered the ideas well, say you get it now and summarize in one sentence what you learned from them.`;

export async function POST(req: Request) {
  const no = denied(req, "mentor");
  if (no) return no;

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "bad request" }, { status: 400 });
  const { mode, context, messages, note, instruction, task } = parsed.data;
  const system = `${SYSTEM}\n\n<student_context>\n${context}\n</student_context>`;

  try {
    if (mode === "primer") {
      if (!task) return Response.json({ error: "task required" }, { status: 400 });
      const r = await geminiJson<{ questions: string[] }>({
        system,
        turns: [{ role: "user", text: `${PRIMER}\n\n<lesson>${task.title}</lesson>\n<source>${task.url}</source>` }],
        temperature: 0.8,
        json: {
          type: "OBJECT",
          properties: { questions: { type: "ARRAY", items: { type: "STRING" } } },
          required: ["questions"],
        },
      });
      return Response.json({ questions: (r.questions ?? []).slice(0, 3) });
    }
    if (mode === "teach") {
      if (!task || !messages.length || messages.at(-1)!.role !== "user") {
        return Response.json({ error: "task and a user message required" }, { status: 400 });
      }
      const stream = await geminiStream({
        system: teachSystem(task.title, task.check),
        turns: messages,
        temperature: 0.8,
      });
      return new Response(stream, {
        headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
      });
    }
    if (mode === "note") {
      if (!note || !instruction) return Response.json({ error: "note and instruction required" }, { status: 400 });
      const text = await geminiText({
        system,
        turns: [
          {
            role: "user",
            text: `${NOTE}\n\n<instruction>${instruction}</instruction>\n<note_title>${note.title}</note_title>\n<note_body>\n${note.body}\n</note_body>`,
          },
        ],
        temperature: 0.3,
        maxOutputTokens: 8192,
      });
      // لو الموديل لفّ الرد في ```markdown نشيلها
      const body = text
        .trim()
        .replace(/^```(?:markdown|md)?\n([\s\S]*)\n```$/, "$1")
        .trim();
      return Response.json({ text: body });
    }
    if (mode === "daily") {
      const text = await geminiText({ system, turns: [{ role: "user", text: DAILY }], temperature: 0.9 });
      return Response.json({ text: text.trim() });
    }
    if (!messages.length || messages.at(-1)!.role !== "user") {
      return Response.json({ error: "last message must be from user" }, { status: 400 });
    }
    const stream = await geminiStream({ system, turns: messages });
    return new Response(stream, {
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
    });
  } catch (error) {
    if (error instanceof GeminiError) {
      const status = error.status === 429 ? 429 : 502;
      const msg = error.status === 429 ? "Gemini: وصلت للحد، استنى دقيقة" : error.message;
      return Response.json({ error: msg }, { status });
    }
    throw error;
  }
}
