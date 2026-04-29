import { createContext, useContext, useState, ReactNode } from "react";

type UIModeType = "auto" | "phone" | "desktop";

interface UIModeContextType {
  uiMode: UIModeType;
  setUIMode: (mode: UIModeType) => void;
  isMobileUI: (actualMobile: boolean) => boolean;
}

const UIModeContext = createContext<UIModeContextType | undefined>(undefined);

export function UIModeProvider({ children }: { children: ReactNode }) {
  const [uiMode, setUIMode] = useState<UIModeType>("auto");

  const isMobileUI = (actualMobile: boolean) => {
    if (uiMode === "auto") return actualMobile;
    if (uiMode === "phone") return true;
    return false;
  };

  return (
    <UIModeContext.Provider value={{ uiMode, setUIMode, isMobileUI }}>
      {children}
    </UIModeContext.Provider>
  );
}

export function useUIMode() {
  const context = useContext(UIModeContext);
  if (!context) {
    throw new Error("useUIMode must be used within UIModeProvider");
  }
  return context;
}
