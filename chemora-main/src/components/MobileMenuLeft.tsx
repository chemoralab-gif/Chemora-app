import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import ChemicalPalette from "@/components/ChemicalPalette";
import type { SelectedItem } from "@/pages/Index";
import { Chemical, Apparatus } from "@/lib/reactions";

interface MobileMenuLeftProps {
  onDragStart: (chemical: Chemical) => void;
  onApparatusDragStart: (apparatus: Apparatus) => void;
  selectedItem: SelectedItem;
  onSelect: (item: SelectedItem) => void;
}

export default function MobileMenuLeft({
  onDragStart,
  onApparatusDragStart,
  selectedItem,
  onSelect,
}: MobileMenuLeftProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="flex items-center justify-center w-9 h-9 text-muted-foreground hover:text-primary transition-colors rounded-md border border-border hover:border-primary/30"
          title="Chemicals"
        >
          <Menu className="w-4 h-4" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full max-w-xs p-0">
        <SheetHeader className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Chemicals & Tools</h2>
        </SheetHeader>
        <div className="overflow-y-auto h-[calc(100vh-60px)]">
          <ChemicalPalette
            onDragStart={(c) => {
              onDragStart(c);
              setOpen(false);
            }}
            onApparatusDragStart={(a) => {
              onApparatusDragStart(a);
              setOpen(false);
            }}
            selectedItem={selectedItem}
            onSelect={(item) => {
              onSelect(item);
              setOpen(false);
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
