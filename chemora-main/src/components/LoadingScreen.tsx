import { useEffect, useState } from "react";

const messages = [
  "Initiating Molecular Synthesis...",
  "Calibrating Chemical Reactions...",
  "Loading Atomic Structures...",
  "Processing Thermal Data...",
  "Preparing Experiment Environment...",
];

export default function LoadingScreen() {
  const [isVisible, setIsVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Wait for app to load, then show loader for 1 second
    const showLoaderAtEnd = setTimeout(() => {
      setIsVisible(true);
      // Show for 1 second then fade out
      const hideTimer = setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => setIsVisible(false), 500);
      }, 1000);
      return () => clearTimeout(hideTimer);
    }, 100); // Small delay to ensure app is ready

    return () => clearTimeout(showLoaderAtEnd);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`flex flex-col items-center justify-center w-full h-screen bg-background transition-opacity duration-500 ${
      fadeOut ? "opacity-0" : "opacity-100"
    }`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Dosis:wght@200;400;500;600;700;800&display=swap');
        
        .loading-title {
          font-family: 'Dosis', sans-serif !important;
          font-weight: 700;
          font-size: 1.5rem;
          letter-spacing: 0.03em;
          color: #ffffff;
          margin-top: 2rem;
          text-align: center;
        }

        /* Atomic Loader */
        .loader {
          height: 20rem;
          width: 20rem;
          display: flex;
          justify-content: center;
          align-items: center;
          perspective: 1000px;
        }

        .react-star {
          position: relative;
          width: 12rem;
          height: 12rem;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        /* Nucleus - pulsing center */
        .nucleus {
          position: absolute;
          width: 1.5rem;
          height: 1.5rem;
          background: radial-gradient(circle at 30% 30%, #ffffff, #b0b0b0);
          border-radius: 50%;
          box-shadow: 0 0 1rem #ffffff, inset -1px -1px 1rem rgba(0,0,0,0.3);
          animation: nucleusPulse 2s ease-in-out infinite;
          z-index: 10;
        }

        @keyframes nucleusPulse {
          0%, 100% {
            box-shadow: 0 0 1rem #ffffff, inset -1px -1px 1rem rgba(0,0,0,0.3);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 2rem #00ffff, inset -1px -1px 1rem rgba(0,0,0,0.3);
            transform: scale(1.1);
          }
        }

        /* Orbital paths */
        .orbital {
          position: absolute;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        .orbital-1 {
          width: 6rem;
          height: 6rem;
        }

        .orbital-2 {
          width: 8rem;
          height: 8rem;
          transform: translate(-50%, -50%) rotateX(60deg);
        }

        .orbital-3 {
          width: 10rem;
          height: 10rem;
          transform: translate(-50%, -50%) rotateX(30deg);
        }

        /* Electrons */
        .electron {
          position: absolute;
          width: 0.6rem;
          height: 0.6rem;
          background-color: #00ffff;
          border-radius: 50%;
          box-shadow: 0 0 0.8rem #00ffff, 0 0 1.5rem rgba(0, 255, 255, 0.4);
          top: 50%;
          left: 50%;
          margin-top: -0.3rem;
          margin-left: -0.3rem;
        }

        .electron1 {
          animation: orbit1 4s linear infinite;
        }

        .electron2 {
          animation: orbit2 5s linear infinite;
          animation-delay: -2s;
        }

        .electron3 {
          animation: orbit3 6s linear infinite;
          animation-delay: -3s;
        }

        @keyframes orbit1 {
          0% {
            transform: translate(0, -3rem) rotateZ(0deg);
          }
          100% {
            transform: translate(0, -3rem) rotateZ(360deg);
          }
        }

        @keyframes orbit2 {
          0% {
            transform: rotateX(60deg) translate(0, -4rem) rotateZ(0deg);
          }
          100% {
            transform: rotateX(60deg) translate(0, -4rem) rotateZ(360deg);
          }
        }

        @keyframes orbit3 {
          0% {
            transform: rotateX(30deg) translate(0, -5rem) rotateZ(0deg);
          }
          100% {
            transform: rotateX(30deg) translate(0, -5rem) rotateZ(360deg);
          }
        }
      `}</style>
      
      {/* Atomic Loader */}
      <div className="loader">
        <div className="react-star">
          <div className="orbital orbital-1"></div>
          <div className="orbital orbital-2"></div>
          <div className="orbital orbital-3"></div>
          <div className="nucleus"></div>
          <div className="electron electron1"></div>
          <div className="electron electron2"></div>
          <div className="electron electron3"></div>
        </div>
      </div>

      {/* Loading Title */}
      <p className="loading-title">
        Preparing Experiment Environment
      </p>
    </div>
  );
}
