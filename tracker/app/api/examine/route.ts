// الممتحن: Claude بيقرا إجاباتك على أسئلة المهمة ويحكم إذا كنت فهمت فعلاً.
// النجاح = 7/10 أو أكتر (السيرفر هو اللي بيقرر، مش الموديل).

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
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
  answers: z.array(z.string().max(4000)).max(10),
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
"followUp" is one new, slightly harder question on the same material that checks transfer, in Egyptian Arabic.`;

export async function POST(req: Request) {
  const no = denied(req, "examiner");
  if (no) return no;

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "bad request" }, { status: 400 });
  const { taskId, answers, link } = parsed.data;
  const task = taskById(taskId);
  if (!task) return Response.json({ error: "unknown task" }, { status: 404 });

  const qa = task.check
    .map((q, i) => `<question n="${i + 1}">${q}</question>\n<answer n="${i + 1}">${answers[i] ?? ""}</answer>`)
    .join("\n");
  const content = `<task>${task.title}</task>
<source>${task.url}</source>
${link ? `<code_link>${link}</code_link>\n` : ""}${qa}`;

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
    const v = response.parsed_output;
    const score = Math.max(0, Math.min(10, v.score));
    return Response.json({ ...v, score, passed: score >= PASS });
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
