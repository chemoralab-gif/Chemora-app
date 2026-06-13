import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const chemoraSystemPrompt =
  "You are Chemora AI, a concise chemistry tutor inside a virtual chemistry lab. Answer chemistry questions from basic concepts to molecular behavior. Explain clearly, use equations when useful, and keep lab safety in mind.";

const readJsonBody = (req: any) =>
  new Promise<any>((resolve, reject) => {
    const chunks: Buffer[] = [];

    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      try {
        const rawBody = Buffer.concat(chunks).toString("utf8");
        resolve(rawBody ? JSON.parse(rawBody) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });

const getChemoraAnswer = (data: any) =>
  data?.candidates?.[0]?.content?.parts
    ?.map((part: any) => part?.text || "")
    .filter(Boolean)
    .join("\n") ||
  data?.choices?.[0]?.message?.content ||
  data?.output_text ||
  data?.answer ||
  data?.message ||
  data?.text ||
  "";

const toGeminiContents = (messages: any[]) =>
  messages.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  }));

const callGemini = async (apiKey: string, model: string, messages: any[]) => {
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
          parts: [{ text: chemoraSystemPrompt }],
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

const callOpenAiCompatible = async (apiKey: string, apiUrl: string, model: string, messages: any[]) => {
  const upstream = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: chemoraSystemPrompt }, ...messages],
      temperature: 0.35,
    }),
  });

  const data = await upstream.json().catch(() => ({}));
  return { upstream, data };
};

const chemoraDevApiPlugin = (mode: string): Plugin => ({
  name: "chemora-dev-api",
  configureServer(server) {
    const env = loadEnv(mode, process.cwd(), "");

    server.middlewares.use("/api/chemora-ai", async (req, res) => {
      if (req.method !== "POST") {
        res.statusCode = 405;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Method not allowed" }));
        return;
      }

      const apiKey = env.chemora_api || env.CHEMORA_API;
      const provider = env.CHEMORA_PROVIDER || (apiKey?.startsWith("AQ.") || apiKey?.startsWith("AIza") ? "gemini" : "openai");
      const apiUrl = env.CHEMORA_API_URL || "https://api.openai.com/v1/chat/completions";
      const model = env.CHEMORA_MODEL || (provider === "gemini" ? "gemini-2.0-flash" : "gpt-4o-mini");

      if (!apiKey) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Missing chemora_api environment variable" }));
        return;
      }

      try {
        const body = await readJsonBody(req);
        const messages = Array.isArray(body?.messages) ? body.messages : [];
        const cleanMessages = messages
          .filter((message: any) => message.role === "assistant" || message.role === "user")
          .map((message: any) => ({
            role: message.role,
            content: String(message.content || "").slice(0, 4000),
          }))
          .slice(-12);

        const { upstream, data } =
          provider === "gemini"
            ? await callGemini(apiKey, model, cleanMessages)
            : await callOpenAiCompatible(apiKey, apiUrl, model, cleanMessages);

        if (!upstream.ok) {
          res.statusCode = upstream.status;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: data?.error?.message || upstream.statusText || "Chemora API provider request failed" }));
          return;
        }

        const answer = getChemoraAnswer(data);

        res.statusCode = answer ? 200 : 502;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(answer ? { answer } : { error: "Chemora API provider returned no answer" }));
      } catch {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Chemora API request failed" }));
      }
    });
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    chemoraDevApiPlugin(mode),
    mode === "development" && process.env.VITE_COMPONENT_TAGGER === "true" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    modulePreload: false,
    target: "esnext",
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, "/");

          if (normalizedId.includes("vite/preload-helper")) return "vite-preload-helper";

          if (
            normalizedId.includes("/src/lib/data/chemicals/") ||
            normalizedId.includes("/src/lib/elements.ts")
          ) {
            return "chemistry-chemicals";
          }

          if (
            normalizedId.includes("/src/lib/allReactions.ts") ||
            normalizedId.includes("/src/lib/reactions.ts") ||
            normalizedId.includes("/src/lib/data/reactions/") ||
            normalizedId.includes("/src/lib/pdfReactions.ts")
          ) {
            return "chemistry-reactions";
          }

          if (
            normalizedId.includes("/src/lib/chemistryEngine.ts") ||
            normalizedId.includes("/src/lib/ruleBasedEngine.ts") ||
            normalizedId.includes("/src/lib/thermalSimulator.ts") ||
            normalizedId.includes("/src/lib/calorimetryEngine.ts")
          ) {
            return "chemistry-engine";
          }

          if (!normalizedId.includes("/node_modules/")) return;

          if (normalizedId.includes("/react/") || normalizedId.includes("/react-dom/")) return "vendor-react";
          if (normalizedId.includes("/lucide-react/")) return "vendor-icons";
          if (
            normalizedId.includes("/clsx/") ||
            normalizedId.includes("/class-variance-authority/") ||
            normalizedId.includes("/date-fns/")
          ) {
            return "vendor-utils";
          }
          if (normalizedId.includes("/html2canvas/") || normalizedId.includes("/jspdf/")) return "heavy-pdf";
          if (normalizedId.includes("/recharts/") || normalizedId.includes("/d3-")) return "heavy-charts";
          if (normalizedId.includes("/@radix-ui/")) return "vendor-ui";
        },
      },
    },
    chunkSizeWarningLimit: 2000,
  },
}));
