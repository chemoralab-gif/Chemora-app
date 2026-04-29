import { X } from "lucide-react";

interface SwipeHintProps {
  show: boolean;
  onDismiss: () => void;
  panelPosition?: number; // -1: left, 0: center, 1: right
  stage?: number; // 0: chemicals, 1: desk, 2: thermal, 3: desk
}

type HintContent = {
  direction: "left" | "right";
  label: string;
  description: string;
};

export default function SwipeHint({
  show,
  onDismiss,
  panelPosition = 0,
  stage = 0,
}: SwipeHintProps) {
  if (!show) return null;

  const getHintContent = (): HintContent | null => {
    if (stage === 0 && panelPosition === 0) {
      return {
        direction: "right",
        label: "Chemicals & Tools",
        description: "Swipe right",
      };
    }

    if (stage === 0 && panelPosition === -1) {
      return {
        direction: "left",
        label: "Fusion Desk",
        description: "Swipe left",
      };
    }

    if (stage === 1 && panelPosition === -1) {
      return {
        direction: "left",
        label: "Fusion Desk",
        description: "Swipe left",
      };
    }

    if (stage === 2 && panelPosition === 0) {
      return {
        direction: "left",
        label: "Thermal Analysis",
        description: "Swipe left",
      };
    }

    if (stage === 3 && panelPosition === 1) {
      return {
        direction: "right",
        label: "Fusion Desk",
        description: "Swipe right",
      };
    }

    return null;
  };

  const content = getHintContent();
  if (!content) return null;

  const directionClass = content.direction === "right" ? "swipe-right" : "swipe-left";

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/35 pointer-events-auto"
        onClick={onDismiss}
      />

      <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
        <style>{`
          .swipe-gesture-stage {
            position: relative;
            width: min(82vw, 360px);
            height: 120px;
            overflow: visible;
            padding: 0;
            border: 0;
            background: transparent;
          }

          .swipe-gesture-stage::before {
            content: "";
            position: absolute;
            left: 50%;
            top: 50%;
            width: min(88vw, 330px);
            height: 92px;
            border-radius: 999px;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.46);
            box-shadow:
              inset 0 0 0 1px rgba(255, 255, 255, 0.12),
              0 18px 56px rgba(0, 0, 0, 0.4);
          }

          .swipe-comet {
            position: absolute;
            left: calc(50% - 98px);
            top: 31px;
            width: 196px;
            height: 58px;
            border-radius: 999px;
            filter:
              drop-shadow(0 0 16px rgba(255, 255, 255, 0.58))
              drop-shadow(0 0 34px rgba(255, 255, 255, 0.3))
              drop-shadow(0 12px 28px rgba(0, 0, 0, 0.35));
            opacity: 0;
            will-change: transform, opacity;
          }

          .swipe-gesture-stage.swipe-right .swipe-comet {
            animation: comet-swipe-right 2.7s cubic-bezier(.33, 0, .1, 1) infinite;
          }

          .swipe-gesture-stage.swipe-left .swipe-comet {
            animation: comet-swipe-left 2.7s cubic-bezier(.33, 0, .1, 1) infinite;
          }

          .swipe-comet-fill {
            position: absolute;
            inset: 0;
            border-radius: inherit;
          }

          .swipe-gesture-stage.swipe-right .swipe-comet-fill {
            background: linear-gradient(
              90deg,
              rgba(255, 255, 255, 0) 0%,
              rgba(255, 255, 255, 0.02) 14%,
              rgba(225, 239, 255, 0.12) 30%,
              rgba(211, 232, 255, 0.58) 55%,
              rgba(248, 252, 255, 0.96) 78%,
              #ffffff 100%
            );
          }

          .swipe-gesture-stage.swipe-left .swipe-comet-fill {
            background: linear-gradient(
              90deg,
              #ffffff 0%,
              rgba(248, 252, 255, 0.96) 22%,
              rgba(211, 232, 255, 0.58) 45%,
              rgba(225, 239, 255, 0.12) 70%,
              rgba(255, 255, 255, 0.02) 86%,
              rgba(255, 255, 255, 0) 100%
            );
          }

          .swipe-comet-head {
            position: absolute;
            top: 0;
            width: 58px;
            height: 58px;
            border-radius: 999px;
            background: #ffffff;
            box-shadow:
              0 0 0 1px rgba(255, 255, 255, 0.65),
              0 0 22px rgba(255, 255, 255, 0.75),
              0 0 48px rgba(255, 255, 255, 0.38),
              0 8px 24px rgba(255, 255, 255, 0.24);
          }

          .swipe-gesture-stage.swipe-right .swipe-comet-head {
            right: 0;
          }

          .swipe-gesture-stage.swipe-left .swipe-comet-head {
            left: 0;
          }

          @keyframes comet-swipe-right {
            0% { opacity: 0; transform: translateX(-96px); }
            8% { opacity: 1; transform: translateX(-78px); }
            34% { opacity: 1; transform: translateX(-18px); }
            70% { opacity: 1; transform: translateX(82px); }
            86% { opacity: 0; transform: translateX(110px); }
            100% { opacity: 0; transform: translateX(-96px); }
          }

          @keyframes comet-swipe-left {
            0% { opacity: 0; transform: translateX(96px); }
            8% { opacity: 1; transform: translateX(78px); }
            34% { opacity: 1; transform: translateX(18px); }
            70% { opacity: 1; transform: translateX(-82px); }
            86% { opacity: 0; transform: translateX(-110px); }
            100% { opacity: 0; transform: translateX(96px); }
          }
        `}</style>

        <div className="absolute inset-x-0 top-24 flex justify-center px-6">
          <div className="rounded-full border border-white/20 bg-black/55 px-4 py-2 text-center shadow-2xl">
            <p className="text-sm font-semibold text-white">{content.label}</p>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/60">{content.description}</p>
          </div>
        </div>

        <button
          key={`${stage}-${panelPosition}`}
          className={`swipe-gesture-stage ${directionClass}`}
          aria-label={content.description}
          type="button"
        >
          <span className="swipe-comet">
            <span className="swipe-comet-fill" />
            <span className="swipe-comet-head" />
          </span>
        </button>

        <button
          onClick={onDismiss}
          className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white shadow-lg transition-colors hover:bg-black/65 pointer-events-auto"
          aria-label="Dismiss swipe hint"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </>
  );
}
