import * as React from "react";

const PHONE_UI_BREAKPOINT = 900;
const PHONE_SHORT_SIDE = 600;
const PORTRAIT_RATIO = 1.08;

function detectPhoneUI() {
  if (typeof window === "undefined") return false;

  const viewport = window.visualViewport;
  const width = Math.min(window.innerWidth, viewport?.width ?? window.innerWidth);
  const height = Math.min(window.innerHeight, viewport?.height ?? window.innerHeight);
  const shortSide = Math.min(width, height);
  const portraitLayout = height >= width * PORTRAIT_RATIO;
  const coarsePointer = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  const touchCapable = navigator.maxTouchPoints > 0;
  const mobileUserAgent = /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(navigator.userAgent);

  if (!portraitLayout) return false;

  return width <= PHONE_UI_BREAKPOINT ||
    shortSide <= PHONE_SHORT_SIDE ||
    (coarsePointer && touchCapable && width <= 1100) ||
    (mobileUserAgent && width <= 1200);
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const onChange = () => {
      setIsMobile(detectPhoneUI());
    };
    const widthQuery = window.matchMedia(`(max-width: ${PHONE_UI_BREAKPOINT}px)`);
    const pointerQuery = window.matchMedia("(pointer: coarse)");

    widthQuery.addEventListener("change", onChange);
    pointerQuery.addEventListener("change", onChange);
    window.addEventListener("resize", onChange);
    window.addEventListener("orientationchange", onChange);
    window.visualViewport?.addEventListener("resize", onChange);
    window.visualViewport?.addEventListener("scroll", onChange);
    onChange();

    return () => {
      widthQuery.removeEventListener("change", onChange);
      pointerQuery.removeEventListener("change", onChange);
      window.removeEventListener("resize", onChange);
      window.removeEventListener("orientationchange", onChange);
      window.visualViewport?.removeEventListener("resize", onChange);
      window.visualViewport?.removeEventListener("scroll", onChange);
    };
  }, []);

  return !!isMobile;
}
