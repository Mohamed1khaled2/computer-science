// الممتحن (Claude لو مفتاحه موجود، وإلا Gemini) بيقرا إجاباتك على أسئلة المهمة ويحكم إذا كنت فهمت فعلاً.
// النجاح = 7/10 أو أكتر (السيرفر هو اللي بيقرر، مش الموديل).

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { GeminiError, geminiJson } from "@/lib/gemini";
import { denied } from "@/lib/server";
import { taskById } from "@/lib/tasks";

export const maxDuration = 60;

const PASS = 7;

const Verdict = z.object({
  perQuestion: z.array(
    z.object({
      verdict: z.enum(["correct", "partial", "wrong"]),
      feedback: z.string(),
    }),
  ),
  score: z.number().int(),
  summary: z.string(),
  followUp: z.string(),
});

const Body = z.object({
  taskId: z.string(),
  answers: z.array(z.string().max(4000)).max(10).default([]),
  transcript: z.string().max(30000).optional(), // "اشرح للمشرف": المحادثة بدل الإجابات المكتوبة
  link: z.string().max(500).optional(),
});

const SYSTEM = `You are a strict but kind computer-science examiner for Mada, a working full-stack developer who is self-studying the OSSU curriculum without relying on AI-written code.

You receive one study task (a lecture or problem set), the questions Mada must answer to prove understanding, and Mada's answers written in Egyptian Arabic or English.

Judge whether each answer shows real understanding in Mada's own words:
- "correct": accurate and shows understanding, even if informal or short.
- "partial": right direction but missing a key idea or containing a misconception.
- "wrong": incorrect, empty, off-topic, or a vague generic sentence that could be written without studying.
Answers that read like pasted textbook or AI text with no personal example should be at most "partial"; say so kindly.

Give a whole-number score from 0 to 10 for the whole task.
Write all feedback in Egyptian Arabic (keep technical terms in English). For wrong or partial answers, point to exactly what is missing or where to look in the lecture, but do not write the full correct answer, so that Mada fixes it independently.
"summary" is one or two sentences of overall feedback.
"followUp" is one new, slightly harder question on the same material that checks transfer, in Egyptian Arabic.
Sometimes instead of written answers you get a <teaching_transcript>: Mada explained the lesson to a role-played confused classmate. Then judge each question by what Mada explained in the transcript (the classmate's lines are not Mada's knowledge); a question whose idea Mada never covered is "wrong".`;

// نفس شكل Verdict بس بصيغة responseSchema بتاعة Gemini
const GEMINI_SCHEMA = {
  type: "OBJECT",
  properties: {
    perQuestion: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          verdict: { type: "STRING", enum: ["correct", "partial", "wrong"] },
          feedback: { type: "STRING" },
        },
        required: ["verdict", "feedback"],
      },
    },
    score: { type: "INTEGER" },
    summary: { type: "STRING" },
    followUp: { type: "STRING" },
  },
  required: ["perQuestion", "score", "summary", "followUp"],
  propertyOrdering: ["perQuestion", "score", "summary", "followUp"],
};

function result(v: z.infer<typeof Verdict>) {
  const score = Math.max(0, Math.min(10, Math.round(v.score)));
  return Response.json({ ...v, score, passed: score >= PASS });
}

async function gradeWithGemini(content: string) {
  try {
    const raw = await geminiJson<unknown>({
      system: SYSTEM,
      turns: [{ role: "user", text: content }],
      json: GEMINI_SCHEMA,
    });
    const v = Verdict.safeParse(raw);
    if (!v.success) return Response.json({ error: "examiner could not grade this, use self-check" }, { status: 502 });
    return result(v.data);
  } catch (error) {
    if (error instanceof GeminiError) {
      if (error.status === 429) return Response.json({ error: "rate limited, try again in a minute" }, { status: 429 });
      return Response.json({ error: error.message }, { status: 502 });
    }
    if (error instanceof SyntaxError) {
      return Response.json({ error: "examiner could not grade this, use self-check" }, { status: 502 });
    }
    throw error;
  }
}

export async function POST(req: Request) {
  const no = denied(req, "examiner");
  if (no) return no;

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "bad request" }, { status: 400 });
  const { taskId, answers, link, transcript } = parsed.data;
  const task = taskById(taskId);
  if (!task) return Response.json({ error: "unknown task" }, { status: 404 });

  const qa = transcript
    ? `${task.check.map((q, i) => `<question n="${i + 1}">${q}</question>`).join("\n")}\n<teaching_transcript>\n${transcript}\n</teaching_transcript>`
    : task.check
        .map((q, i) => `<question n="${i + 1}">${q}</question>\n<answer n="${i + 1}">${answers[i] ?? ""}</answer>`)
        .join("\n");
  const content = `<task>${task.title}</task>
<source>${task.url}</source>
${link ? `<code_link>${link}</code_link>\n` : ""}${qa}`;

  if (!process.env.ANTHROPIC_API_KEY) return gradeWithGemini(content);

  const client = new Anthropic();
  try {
    const response = await client.beta.messages.parse({
      model: "claude-opus-5",
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium", format: betaZodOutputFormat(Verdict) },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM,
      messages: [{ role: "user", content }],
    });

    if (response.stop_reason === "refusal" || !response.parsed_output) {
      return Response.json({ error: "examiner could not grade this, use self-check" }, { status: 502 });
    }
    return result(response.parsed_output);
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return Response.json({ error: "rate limited, try again in a minute" }, { status: 429 });
    }
    if (error instanceof Anthropic.AuthenticationError) {
      return Response.json({ error: "ANTHROPIC_API_KEY is invalid" }, { status: 500 });
    }
    if (error instanceof Anthropic.APIError) {
      return Response.json({ error: `Claude API error ${error.status}` }, { status: 502 });
    }
    throw error;
  }
}
