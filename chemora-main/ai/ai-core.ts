export type ChatMessage = {
  role: "assistant" | "user";
  content: string;
};

export type AiResponseBody = {
  answer?: string;
  error?: string;
};

export type AiResult = {
  status: number;
  body: AiResponseBody;
};

type AiEnv = Record<string, string | undefined>;
type Provider = "gemini" | "openai";
type JsonRecord = Record<string, unknown>;

const systemPrompt =
  "You are Chemora AI, a concise chemistry tutor inside a virtual chemistry lab. Answer chemistry questions from basic concepts to molecular behavior. Explain clearly, use equations when useful, and keep lab safety in mind.";

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asString = (value: unknown) => (typeof value === "string" ? value : "");

const getErrorMessage = (data: unknown) => {
  if (!isRecord(data)) return "";
  const error = data.error;

  if (typeof error === "string") return error;
  if (isRecord(error)) return asString(error.message);

  return "";
};

const getAnswerFromResponse = (data: unknown) => {
  if (!isRecord(data)) return "";

  const candidates = data.candidates;
  if (Array.isArray(candidates)) {
    const firstCandidate = candidates[0];
    if (isRecord(firstCandidate) && isRecord(firstCandidate.content)) {
      const parts = firstCandidate.content.parts;
      if (Array.isArray(parts)) {
        const geminiAnswer = parts
          .map((part) => (isRecord(part) ? asString(part.text) : ""))
          .filter(Boolean)
          .join("\n");

        if (geminiAnswer) return geminiAnswer;
      }
    }
  }

  const choices = data.choices;
  if (Array.isArray(choices)) {
    const firstChoice = choices[0];
    if (isRecord(firstChoice) && isRecord(firstChoice.message)) {
      const openAiAnswer = asString(firstChoice.message.content);
      if (openAiAnswer) return openAiAnswer;
    }
  }

  return (
    asString(data.output_text) ||
    asString(data.answer) ||
    asString(data.message) ||
    asString(data.text)
  );
};

const toGeminiContents = (messages: ChatMessage[]) =>
  messages.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  }));

const readJson = async (response: Response) => response.json().catch((): unknown => ({}));

const callGemini = async (apiKey: string, model: string, messages: ChatMessage[]) => {
  const geminiModel = model.startsWith("gemini-") ? model : "gemini-2.0-flash";
  const upstream = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: toGeminiContents(messages),
        generationConfig: {
          temperature: 0.35,
        },
      }),
    },
  );

  const data = await readJson(upstream);
  return { upstream, data };
};

const callOpenAiCompatible = async (
  apiKey: string,
  apiUrl: string,
  model: string,
  messages: ChatMessage[],
) => {
  const upstream = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      temperature: 0.35,
    }),
  });

  const data = await readJson(upstream);
  return { upstream, data };
};

const normalizeProvider = (value: string | undefined, apiKey: string): Provider => {
  const provider = value?.toLowerCase();
  if (provider === "gemini" || provider === "google") return "gemini";
  if (provider === "openai") return "openai";

  return apiKey.startsWith("AQ.") || apiKey.startsWith("AIza") ? "gemini" : "openai";
};

const getCleanMessages = (body: unknown) => {
  const messages = isRecord(body) && Array.isArray(body.messages) ? body.messages : [];

  return messages
    .filter((message): message is ChatMessage => {
      if (!isRecord(message)) return false;
      return (
        (message.role === "assistant" || message.role === "user") &&
        typeof message.content === "string" &&
        message.content.trim().length > 0
      );
    })
    .map((message) => ({
      role: message.role,
      content: message.content.slice(0, 4000),
    }))
    .slice(-12);
};

export const handleAiRequest = async (body: unknown, env: AiEnv): Promise<AiResult> => {
  const apiKey = env.chemora_api || env.CHEMORA_API;

  if (!apiKey) {
    return {
      status: 500,
      body: { error: "Missing chemora_api environment variable" },
    };
  }

  const messages = getCleanMessages(body);

  if (messages.length === 0) {
    return {
      status: 400,
      body: { error: "No messages provided" },
    };
  }

  const provider = normalizeProvider(env.CHEMORA_PROVIDER, apiKey);
  const apiUrl = env.CHEMORA_API_URL || "https://api.openai.com/v1/chat/completions";
  const model = env.CHEMORA_MODEL || (provider === "gemini" ? "gemini-2.0-flash" : "gpt-4o-mini");

  try {
    const { upstream, data } =
      provider === "gemini"
        ? await callGemini(apiKey, model, messages)
        : await callOpenAiCompatible(apiKey, apiUrl, model, messages);

    if (!upstream.ok) {
      return {
        status: upstream.status,
        body: {
          error: getErrorMessage(data) || upstream.statusText || "Chemora API provider request failed",
        },
      };
    }

    const answer = getAnswerFromResponse(data);

    if (!answer) {
      return {
        status: 502,
        body: { error: "Chemora API provider returned no answer" },
      };
    }

    return {
      status: 200,
      body: { answer },
    };
  } catch {
    return {
      status: 500,
      body: { error: "Chemora API request failed" },
    };
  }
};
