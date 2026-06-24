import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import type { IncomingMessage } from "http";
import { handleAiRequest } from "./ai/ai-core";

const readJsonBody = (req: IncomingMessage) =>
  new Promise<unknown>((resolve, reject) => {
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

const chemoraDevApiPlugin = (mode: string): Plugin => ({
  name: "chemora-dev-api",
  configureServer(server) {
    const env = loadEnv(mode, process.cwd(), "");

    server.middlewares.use("/api/ai", async (req, res) => {
      if (req.method !== "POST") {
        res.statusCode = 405;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Method not allowed" }));
        return;
      }

      try {
        const body = await readJsonBody(req);
        const result = await handleAiRequest(body, env);

        res.statusCode = result.status;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(result.body));
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
