import "./index.css";

function hideLoadingScreen() {
  const loadingScreen = document.getElementById("loading-screen");
  if (!loadingScreen) return;

  loadingScreen.style.opacity = "0";
  loadingScreen.style.pointerEvents = "none";
  window.setTimeout(() => {
    loadingScreen.style.display = "none";
  }, 500);
}

declare global {
  interface Window {
    __chemoraHideLoadingScreen?: () => void;
  }
}

window.__chemoraHideLoadingScreen = hideLoadingScreen;

async function bootstrap() {
  const rootElement = document.getElementById("root");
  if (!rootElement) return;

  const [{ createElement }, { createRoot }, { default: App }] = await Promise.all([
    import("react"),
    import("react-dom/client"),
    import("./App"),
  ]);

  createRoot(rootElement).render(createElement(App));
}

bootstrap().catch((error) => {
  console.error("Failed to load app:", error);
});
