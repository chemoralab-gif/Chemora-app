import { useState, useMemo } from "react";
import type { Chemical } from "@/lib/schemas/chemical";
import { ALL_CHEMICALS as CHEMICALS } from "@/lib/data/chemicals";
import { CHEMICAL_CATEGORIES, type Apparatus, APPARATUSES, APPARATUS_CATEGORIES } from "@/lib/apparatus";
import { ELEMENT_SUBCATEGORIES } from "@/lib/elements";
import { Search, FlaskConical, Wrench, Atom, Beaker, RadioTower } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SelectedItem } from "@/pages/Index";

function StateShape({ state, color }: { state: string; color: string }) {
  if (state === "solid") {
    return (
      <svg width="12" height="12" viewBox="0 0 12 12" className="flex-shrink-0">
        <rect x="1" y="1" width="10" height="10" rx="1.5" fill={color} stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.2" />
      </svg>
    );
  }
  if (state === "liquid") {
    return (
      <svg width="12" height="12" viewBox="0 0 12 12" className="flex-shrink-0">
        <path d="M6 1 C6 1 2.5 5.5 2.5 7.5 C2.5 9.4 4 11 6 11 C8 11 9.5 9.4 9.5 7.5 C9.5 5.5 6 1 6 1Z" fill={color} stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.2" />
      </svg>
    );
  }
  return (
    <svg width="14" height="12" viewBox="0 0 14 12" className="flex-shrink-0">
      <circle cx="5" cy="6" r="3" fill={color} opacity="0.6" />
      <circle cx="9" cy="5" r="2.5" fill={color} opacity="0.4" />
      <circle cx="10" cy="8" r="2" fill={color} opacity="0.3" />
    </svg>
  );
}

function RatingDots({ value, max = 10, color }: { value: number; max?: number; color: string }) {
  return (
    <div className="flex gap-px">
      {Array.from({ length: max }).map((_, i) => (
        <div key={i} className="w-1 h-1 rounded-full" style={{ background: i < value ? color : "hsl(220, 14%, 20%)" }} />
      ))}
    </div>
  );
}

interface ChemicalPaletteProps {
  onDragStart: (chemical: Chemical) => void;
  onApparatusDragStart: (apparatus: Apparatus) => void;
  selectedItem: SelectedItem;
  onSelect: (item: SelectedItem) => void;
}

export default function ChemicalPalette({ onDragStart, onApparatusDragStart, selectedItem, onSelect }: ChemicalPaletteProps) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("chemicals");

  const query = search.toLowerCase().trim();

  const filteredChemicals = useMemo(() => {
    if (!query) return CHEMICALS;
    return CHEMICALS.filter(
      (c) => c.name.toLowerCase().includes(query) || c.formula.toLowerCase().includes(query)
    );
  }, [query]);

  const filteredApparatuses = useMemo(() => {
    if (!query) return APPARATUSES;
    return APPARATUSES.filter((a) => a.name.toLowerCase().includes(query));
  }, [query]);

  const groupedChemicals = useMemo(() => {
    const order = ["metal", "nonmetal", "noble-gas", "acid", "alkali", "water", "salt", "organic"];
    const grouped: Record<string, Record<string, Chemical[]>> = {};
    for (const c of filteredChemicals) {
      if (!grouped[c.category]) grouped[c.category] = {};
      const sub = c.subcategory || "_default";
      if (!grouped[c.category][sub]) grouped[c.category][sub] = [];
      grouped[c.category][sub].push(c);
    }
    return order.filter((k) => grouped[k]).map((k) => ({ category: k, subcategories: grouped[k] }));
  }, [filteredChemicals]);

  const groupedApparatuses = useMemo(() => {
    const order = ["container", "heating", "measuring", "mixing", "filtering", "safety"];
    const grouped: Record<string, Apparatus[]> = {};
    for (const a of filteredApparatuses) {
      if (!grouped[a.category]) grouped[a.category] = [];
      grouped[a.category].push(a);
    }
    return order.filter((k) => grouped[k]?.length).map((k) => [k, grouped[k]!] as const);
  }, [filteredApparatuses]);

  // read persisted water mass (g) from localStorage to show next to containers
  const persistedWater = (() => {
    try {
      const v = window.localStorage.getItem("sim_m_w");
      if (!v) return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    } catch (e) {
      return null;
    }
  })();

  const isChemicalSelected = (c: Chemical) =>
    selectedItem?.type === "chemical" && selectedItem.data.id === c.id;

  const isApparatusSelected = (a: Apparatus) =>
    selectedItem?.type === "apparatus" && selectedItem.data.id === a.id;

  const handleChemicalClick = (chemical: Chemical) => {
    if (isChemicalSelected(chemical)) {
      onSelect(null);
    } else {
      onSelect({ type: "chemical", data: chemical });
    }
  };

  const handleApparatusClick = (apparatus: Apparatus) => {
    if (isApparatusSelected(apparatus)) {
      onSelect(null);
    } else {
      onSelect({ type: "apparatus", data: apparatus });
    }
  };

  return (
    <div className="w-72 bg-card border-r border-border flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chemicals or apparatus…"
            className="pl-8 h-8 text-xs bg-secondary/50 border-border"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
        <TabsList className="mx-3 mt-2 bg-secondary/50">
          <TabsTrigger value="chemicals" className="text-xs gap-1.5 flex-1">
            <Atom className="w-3 h-3" /> Chemicals
          </TabsTrigger>
          <TabsTrigger value="apparatus" className="text-xs gap-1.5 flex-1">
            <FlaskConical className="w-3 h-3" /> Apparatus
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chemicals" className="flex-1 min-h-0 mt-0">
          <ScrollArea className="h-full">
            <div className="p-3 pr-4 space-y-3">
              {groupedChemicals.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No chemicals found</p>
              )}
              {groupedChemicals.map(({ category, subcategories }) => (
                <div key={category}>
                  <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    {category === "metal" || category === "noble-gas" ? <Atom className="w-3 h-3" /> : category === "acid" || category === "alkali" ? <FlaskConical className="w-3 h-3" /> : <Beaker className="w-3 h-3" />}
                    {CHEMICAL_CATEGORIES[category] || category}
                  </h3>
                  {Object.entries(subcategories).map(([sub, chemicals]) => (
                    <div key={sub} className="mb-1">
                      {sub !== "_default" && ELEMENT_SUBCATEGORIES[sub] && (
                        <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider ml-2 mb-0.5">
                          {ELEMENT_SUBCATEGORIES[sub]}
                        </p>
                      )}
                      <div className="space-y-0.5">
                        {chemicals.map((chemical) => (
                          <div
                            key={chemical.id}
                            draggable
                            onClick={() => handleChemicalClick(chemical)}
                            onDragStart={(e) => {
                              e.dataTransfer.setData("chemical", JSON.stringify(chemical));
                              e.dataTransfer.setData("type", "chemical");
                              onDragStart(chemical);
                            }}
                            className={`flex items-center gap-2 px-2 py-1 rounded-md bg-secondary/30 hover:bg-secondary cursor-pointer active:scale-[0.97] transition-all border ${
                              isChemicalSelected(chemical)
                                ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                                : "border-transparent hover:border-primary/20"
                            }`}
                          >
                            <StateShape state={chemical.state} color={chemical.color} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="text-[11px] text-foreground truncate">{chemical.name}</span>
                                {chemical.radioactive && <RadioTower className="w-2.5 h-2.5 text-destructive flex-shrink-0" />}
                              </div>
                              <div className="text-[9px] font-mono text-muted-foreground">{chemical.formula}</div>
                            </div>
                            <div className="flex flex-col items-end gap-0.5">
                              <RatingDots value={chemical.reactivity} color="hsl(var(--accent))" />
                              <RatingDots value={chemical.stability} color="hsl(var(--primary))" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              {/* Legend */}
              <div className="pt-2 border-t border-border space-y-1">
                <div className="flex items-center gap-2 text-[9px] text-muted-foreground/60">
                  <RatingDots value={5} max={5} color="hsl(var(--accent))" /> Reactivity
                </div>
                <div className="flex items-center gap-2 text-[9px] text-muted-foreground/60">
                  <RatingDots value={5} max={5} color="hsl(var(--primary))" /> Stability
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="apparatus" className="flex-1 min-h-0 mt-0">
          <ScrollArea className="h-full">
            <div className="p-3 pr-4 space-y-4">
              {groupedApparatuses.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No apparatus found</p>
              )}
              {groupedApparatuses.map(([category, apparatuses]) => (
                <div key={category}>
                  <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Wrench className="w-3 h-3" />
                    {APPARATUS_CATEGORIES[category] || category}
                  </h3>
                  <div className="space-y-0.5">
                    {apparatuses.map((apparatus) => (
                      <div
                        key={apparatus.id}
                        draggable
                        onClick={() => handleApparatusClick(apparatus)}
                        onDragStart={(e) => {
                          e.dataTransfer.setData("apparatus", JSON.stringify(apparatus));
                          e.dataTransfer.setData("type", "apparatus");
                          onApparatusDragStart(apparatus);
                        }}
                        className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md bg-secondary/30 hover:bg-secondary cursor-pointer active:scale-[0.97] transition-all border ${
                          isApparatusSelected(apparatus)
                            ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                            : "border-transparent hover:border-primary/20"
                        }`}
                      >
                        <span className="text-base flex-shrink-0">{apparatus.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-foreground truncate">{apparatus.name}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{apparatus.description}</div>
                          {/* Show current water amount next to container apparatus for convenience */}
                          {persistedWater !== null && apparatus.category === "container" && (
                            <div className="text-[10px] text-muted-foreground/80">Current liquid: {persistedWater} g</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
