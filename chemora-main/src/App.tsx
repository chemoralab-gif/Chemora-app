import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { UIModeProvider } from "./hooks/use-ui-mode";

const Index = lazy(() => import("./pages/Index"));
const ReactionSimulator = lazy(() => import("./pages/ReactionSimulator"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="min-h-screen bg-background" />
);

const PageReady = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    window.requestAnimationFrame(() => window.__chemoraHideLoadingScreen?.());
  }, []);

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <UIModeProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/simulator" element={<PageReady><ReactionSimulator /></PageReady>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<PageReady><NotFound /></PageReady>} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </UIModeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
