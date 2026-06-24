import { FormEvent, useState } from "react";
import { ArrowLeft, Send } from "lucide-react";

interface ChemistryAIAssistantProps {
  onClose: () => void;
}

interface Message {
  role: "assistant" | "user";
  content: string;
}

const askChemoraApi = async (messages: Message[]) => {
  const response = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  const data = (await response.json().catch(() => ({}))) as { answer?: string; error?: string };

  if (!response.ok) {
    throw new Error(data.error || "Chemora API request failed");
  }

  if (!data.answer) {
    throw new Error("Chemora API returned no answer");
  }

  return data.answer;
};

export default function ChemistryAIAssistant({ onClose }: ChemistryAIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Ask me anything in chemistry, from atoms and bonding to reactions, pH, moles, and molecular behavior.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isAsking, setIsAsking] = useState(false);

  const askAssistant = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || isAsking) return;

    const nextMessages: Message[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setIsAsking(true);

    try {
      const answer = await askChemoraApi(nextMessages);
      setMessages((current) => [...current, { role: "assistant", content: answer }]);
    } catch {
      setMessages((current) => [...current, { role: "assistant", content: "AI is offline" }]);
    } finally {
      setIsAsking(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void askAssistant(input);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-3 backdrop-blur-md animate-in fade-in duration-200">
      <div className="flex h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-[2rem] border border-primary/25 bg-[linear-gradient(180deg,hsl(var(--card))_0%,hsl(var(--secondary))_48%,hsl(var(--background))_100%)] shadow-2xl shadow-primary/15">
        <header className="flex items-center justify-between px-4 pb-3 pt-4">
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-background/65 text-foreground transition-all hover:-translate-x-0.5 hover:bg-primary/15 hover:text-primary"
            title="Exit Chemora AI"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="rounded-full border border-primary/20 bg-background/60 px-4 py-2 text-sm font-semibold text-primary shadow-lg shadow-primary/10">
            <span>Chemora AI +</span>
          </div>

          <div className="h-10 w-10" />
        </header>

        <main className="flex-1 space-y-4 overflow-y-auto px-4 py-3">
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={
                  message.role === "user"
                    ? "max-w-[82%] rounded-[1.4rem] rounded-br-md bg-primary px-4 py-3 text-sm leading-6 text-primary-foreground shadow-lg shadow-primary/20"
                    : "max-w-[88%] rounded-[1.4rem] rounded-bl-md bg-background/85 px-4 py-3 text-sm leading-6 text-foreground shadow-lg shadow-black/10"
                }
              >
                {message.content}
              </div>
            </div>
          ))}
          {isAsking && (
            <div className="flex justify-start">
              <div className="rounded-[1.4rem] rounded-bl-md bg-background/85 px-4 py-3 text-sm text-muted-foreground shadow-lg shadow-black/10">
                Thinking...
              </div>
            </div>
          )}
        </main>

        <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 pb-5 pt-3">
          <label className="sr-only" htmlFor="chemora-ai-question">
            Ask Chemora AI
          </label>
          <div className="flex min-h-12 flex-1 items-center rounded-full bg-background/85 px-4 shadow-lg shadow-black/10">
            <input
              id="chemora-ai-question"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask chemistry..."
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              disabled={isAsking}
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isAsking}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
            title="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
