type ChatMessage = {
  role: "assistant" | "user";
  content: string;
};

const systemPrompt =
  "You are Chemora AI, a concise chemistry tutor inside a virtual chemistry lab. Answer chemistry questions from basic concepts to molecular behavior. Explain clearly, use equations when useful, and keep lab safety in mind.";

const getAnswerFromResponse = (data: any) => {
  return (
    data?.candidates?.[0]?.content?.parts
      ?.map((part: any) => part?.text || "")
      .filter(Boolean)
      .join("\n") ||
    data?.choices?.[0]?.message?.content ||
    data?.output_text ||
    data?.answer ||
    data?.message ||
    data?.text ||
    ""
  );
};

const toGeminiContents = (messages: ChatMessage[]) =>
  messages.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  }));

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

  const data = await upstream.json().catch(() => ({}));
  return { upstream, data };
};

const callOpenAiCompatible = async (apiKey: string, apiUrl: string, model: string, messages: ChatMessage[]) => {
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

  const data = await upstream.json().catch(() => ({}));
  return { upstream, data };
};

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.chemora_api || process.env.CHEMORA_API;
  const provider = process.env.CHEMORA_PROVIDER || (apiKey?.startsWith("AQ.") || apiKey?.startsWith("AIza") ? "gemini" : "openai");
  const apiUrl = process.env.CHEMORA_API_URL || "https://api.openai.com/v1/chat/completions";
  const model = process.env.CHEMORA_MODEL || (provider === "gemini" ? "gemini-2.0-flash" : "gpt-4o-mini");

  if (!apiKey) {
    res.status(500).json({ error: "Missing chemora_api environment variable" });
    return;
  }

  const messages = Array.isArray(req.body?.messages) ? (req.body.messages as ChatMessage[]) : [];
  const cleanMessages = messages
    .filter((message) => message.role === "assistant" || message.role === "user")
    .map((message) => ({
      role: message.role,
      content: String(message.content || "").slice(0, 4000),
    }))
    .slice(-12);

  if (cleanMessages.length === 0) {
    res.status(400).json({ error: "No messages provided" });
    return;
  }

  try {
    const { upstream, data } =
      provider === "gemini"
        ? await callGemini(apiKey, model, cleanMessages)
        : await callOpenAiCompatible(apiKey, apiUrl, model, cleanMessages);

    if (!upstream.ok) {
      res.status(upstream.status).json({
        error: data?.error?.message || upstream.statusText || "Chemora API provider request failed",
      });
      return;
    }

    const answer = getAnswerFromResponse(data);

    if (!answer) {
      res.status(502).json({ error: "Chemora API provider returned no answer" });
      return;
    }

    res.status(200).json({ answer });
  } catch {
    res.status(500).json({ error: "Chemora API request failed" });
  }
}
