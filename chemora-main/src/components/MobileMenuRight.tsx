import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTrigger } from "@/components/ui/sheet";
import { Settings, Zap } from "lucide-react";

interface MobileMenuRightProps {
  onShowReport: () => void;
  onShowTutorial: () => void;
  experimentStepsCount: number;
  selectedItemName?: string;
  onDeselectItem?: () => void;
}

export default function MobileMenuRight({
  onShowReport,
  onShowTutorial,
  experimentStepsCount,
  selectedItemName,
  onDeselectItem,
}: MobileMenuRightProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="flex items-center justify-center w-9 h-9 text-muted-foreground hover:text-primary transition-colors rounded-md border border-border hover:border-primary/30"
          title="Options"
        >
          <Settings className="w-4 h-4" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-xs p-0">
        <SheetHeader className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Options</h2>
        </SheetHeader>
        <div className="flex flex-col gap-3 p-4">
          {/* Selected Item Info */}
          {selectedItemName && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-xs font-medium text-primary mb-2">Selected Item</p>
              <p className="text-sm font-semibold text-foreground mb-2">{selectedItemName}</p>
              <button
                onClick={() => {
                  onDeselectItem?.();
                  setOpen(false);
                }}
                className="w-full px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors rounded border border-destructive/30 bg-destructive/5"
              >
                Deselect
              </button>
            </div>
          )}

          {/* Experiment Report */}
          <button
            onClick={() => {
              onShowReport();
              setOpen(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-primary hover:bg-primary/10 transition-colors rounded-lg border border-primary/30 hover:border-primary/50 bg-primary/5"
          >
            <Zap className="w-4 h-4" />
            <span>Experiment Report</span>
            {experimentStepsCount > 0 && (
              <span className="ml-auto bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {experimentStepsCount}
              </span>
            )}
          </button>

          {/* Help / Tutorial */}
          <button
            onClick={() => {
              onShowTutorial();
              setOpen(false);
            }}
            className="w-full px-4 py-3 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors rounded-lg border border-border hover:border-primary/30"
          >
            How to Use
          </button>

          {/* Additional Info */}
          <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Tip:</span> Drag items from the left menu to containers on the workspace.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
