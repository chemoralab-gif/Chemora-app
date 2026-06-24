import { handleAiRequest, type AiResponseBody } from "./ai-core";

type ApiRequest = {
  method?: string;
  body?: unknown;
};

type ApiResponse = {
  status: (statusCode: number) => {
    json: (body: AiResponseBody) => void;
  };
};

const getRuntimeEnv = () => {
  const runtime = globalThis as typeof globalThis & {
    process?: {
      env?: Record<string, string | undefined>;
    };
  };

  return runtime.process?.env ?? {};
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const result = await handleAiRequest(req.body, getRuntimeEnv());
  res.status(result.status).json(result.body);
}
