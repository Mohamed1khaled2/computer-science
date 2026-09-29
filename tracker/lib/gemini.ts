// Google Gemini عن طريق الـ REST API مباشرةً (من غير SDK).
// الموديل قابل للتغيير من GEMINI_MODEL؛ الافتراضي alias بيشاور دايمًا على أحدث Flash.

const BASE = "https://generativelanguage.googleapis.com/v1beta/models";
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";

export type GeminiTurn = { role: "user" | "model"; text: string };

type Options = {
  system: string;
  turns: GeminiTurn[];
  temperature?: number;
  maxOutputTokens?: number;
  json?: object; // responseSchema (OpenAPI subset)
};

function body({ system, turns, temperature = 0.7, maxOutputTokens = 4096, json }: Options) {
  return JSON.stringify({
    systemInstruction: { parts: [{ text: system }] },
    contents: turns.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
    generationConfig: {
      temperature,
      maxOutputTokens,
      ...(json ? { responseMimeType: "application/json", responseSchema: json } : {}),
    },
  });
}

export class GeminiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function call(method: string, opts: Options, query = ""): Promise<Response> {
  const res = await fetch(`${BASE}/${GEMINI_MODEL}:${method}${query}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
    body: body(opts),
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new GeminiError(res.status, `Gemini ${res.status}: ${detail.slice(0, 300)}`);
  }
  return res;
}

type Chunk = { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[] };

const textOf = (c: Chunk) =>
  c.candidates?.[0]?.content?.parts
    ?.filter((p) => !p.thought)
    .map((p) => p.text ?? "")
    .join("") ?? "";

export async function geminiText(opts: Options): Promise<string> {
  const res = await call("generateContent", opts);
  return textOf((await res.json()) as Chunk);
}

export async function geminiJson<T>(opts: Options & { json: object }): Promise<T> {
  return JSON.parse(await geminiText({ temperature: 0.2, ...opts })) as T;
}

// بيرجع stream نص عادي (من غير SSE) عشان الواجهة تقراه بسهولة
export async function geminiStream(opts: Options): Promise<ReadableStream<Uint8Array>> {
  const res = await call("streamGenerateContent", opts, "?alt=sse");
  const reader = res.body!.pipeThrough(new TextDecoderStream()).getReader();
  const enc = new TextEncoder();
  let buffer = "";
  return new ReadableStream({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) return controller.close();
      buffer += value;
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        try {
          const text = textOf(JSON.parse(line.slice(5)) as Chunk);
          if (text) controller.enqueue(enc.encode(text));
        } catch {}
      }
    },
    cancel() {
      reader.cancel();
    },
  });
}
