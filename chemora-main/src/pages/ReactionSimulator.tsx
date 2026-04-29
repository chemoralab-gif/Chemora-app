import { useState } from "react";
import { react } from "@/lib/reactionApi";
import type { ReactionResult } from "@/lib/chemistryEngine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FlaskConical, Zap, ArrowLeft, Plus, X, Atom } from "lucide-react";
import { Link } from "react-router-dom";

const SUGGESTED = ["Na", "Cl", "O", "H", "Fe", "Mg", "Ca", "Ag", "K", "N", "S", "He", "Al", "Cu", "Zn", "Br"];

export default function ReactionSimulator() {
  const [reactants, setReactants] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ReactionResult | null>(null);

  const addReactant = (sym: string) => {
    const s = sym.trim();
    if (s && !reactants.includes(s)) setReactants((p) => [...p, s]);
    setInput("");
  };

  const removeReactant = (sym: string) => setReactants((p) => p.filter((r) => r !== sym));

  const simulate = () => {
    if (reactants.length === 0) return;
    const res = react({ reactants });
    setResult(res.data);
  };

  const outcomeBadge = (outcome: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      reaction: { label: "⚗️ Reaction", cls: "bg-primary/20 text-primary border-primary/40" },
      no_reaction: { label: "✕ No Reaction", cls: "bg-destructive/20 text-destructive border-destructive/40" },
      dissolution: { label: "💧 Dissolution", cls: "bg-accent/20 text-accent border-accent/40" },
    };
    const m = map[outcome] ?? map.no_reaction;
    return <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-semibold ${m.cls}`}>{m.label}</span>;
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-border bg-card/80 backdrop-blur-sm">
        <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <Atom className="w-5 h-5 text-primary" />
        <h1 className="text-base font-semibold tracking-tight">Reaction Simulator</h1>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row gap-6 p-4 sm:p-6 max-w-6xl mx-auto w-full">
        {/* Input panel */}
        <Card className="lg:w-[400px] shrink-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-primary" />
              Reactants
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current reactants */}
            <div className="flex flex-wrap gap-2 min-h-[36px]">
              {reactants.length === 0 && (
                <span className="text-xs text-muted-foreground italic">Add elements below…</span>
              )}
              {reactants.map((r) => (
                <Badge key={r} variant="secondary" className="gap-1 font-mono text-sm pl-2.5 pr-1.5 py-1">
                  {r}
                  <button onClick={() => removeReactant(r)} className="hover:text-destructive transition-colors ml-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addReactant(input);
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Element symbol (e.g. Na)"
                className="font-mono"
              />
              <Button type="submit" size="sm" variant="secondary" disabled={!input.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </form>

            {/* Quick-add */}
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Quick add</p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED.map((s) => (
                  <button
                    key={s}
                    onClick={() => addReactant(s)}
                    disabled={reactants.includes(s)}
                    className="text-xs font-mono px-2 py-1 rounded border border-border hover:border-primary/50 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-secondary/40"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulate */}
            <Button onClick={simulate} className="w-full gap-2" disabled={reactants.length < 1}>
              <Zap className="w-4 h-4" />
              Simulate Reaction
            </Button>
          </CardContent>
        </Card>

        {/* Results panel */}
        <Card className="flex-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent" />
              Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!result ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Atom className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">Add reactants and hit Simulate to see results.</p>
              </div>
            ) : (
              <div className="space-y-5 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                {/* Outcome badge */}
                <div className="flex items-center gap-3 flex-wrap">
                  {outcomeBadge(result.outcome)}
                  {result.reaction_type !== "none" && (
                    <span className="text-xs px-2 py-0.5 rounded bg-secondary border border-border text-muted-foreground capitalize">
                      {result.reaction_type}
                    </span>
                  )}
                  <Badge variant={result.feasible ? "default" : "destructive"} className="text-[10px]">
                    {result.feasible ? "Feasible" : "Not Feasible"}
                  </Badge>
                </div>

                {/* Equation */}
                {result.balanced_equation && (
                  <div className="bg-secondary/50 rounded-lg px-4 py-3 border border-border">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Balanced Equation</p>
                    <p className="font-mono text-primary text-base tracking-wide">{result.balanced_equation}</p>
                  </div>
                )}

                {/* Products */}
                {result.products.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Products</p>
                    <div className="flex flex-wrap gap-2">
                      {result.products.map((p, i) => (
                        <Badge key={i} className="font-mono text-sm">{p}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reason / explanation */}
                <div className="bg-card rounded-lg px-4 py-3 border border-border">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Explanation</p>
                  <p className="text-sm text-foreground leading-relaxed">{result.reason}</p>
                </div>

                {/* Raw JSON (collapsible) */}
                <details className="group">
                  <summary className="text-[10px] uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                    Raw JSON response
                  </summary>
                  <pre className="mt-2 text-[11px] font-mono bg-secondary/30 rounded-lg p-3 border border-border overflow-x-auto text-muted-foreground whitespace-pre-wrap">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
