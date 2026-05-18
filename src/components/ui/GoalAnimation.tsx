import { useEffect, useState, useRef } from 'react';
import { useThemeClasses } from '../../functions/themeStore';

interface GoalAnimationProps {
  homeScore?: number | string | null;
  awayScore?: number | string | null;
}

export default function GoalAnimation({ homeScore, awayScore }: GoalAnimationProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const prevHome = useRef(homeScore);
  const prevAway = useRef(awayScore);
  const isFirstRender = useRef(true);
  const { goalBg, goalRing, goalTextGradient, goalTextShadow } = useThemeClasses();

  useEffect(() => {
    // En la primera carga no animamos, solo guardamos el estado inicial
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevHome.current = homeScore;
      prevAway.current = awayScore;
      return;
    }

    const homeNum = Number(homeScore);
    const awayNum = Number(awayScore);
    const prevHomeNum = Number(prevHome.current);
    const prevAwayNum = Number(prevAway.current);

    // Detectar si alguno de los dos equipos sumó un gol
    const homeChanged = !isNaN(homeNum) && !isNaN(prevHomeNum) && homeNum > prevHomeNum;
    const awayChanged = !isNaN(awayNum) && !isNaN(prevAwayNum) && awayNum > prevAwayNum;

    if (homeChanged || awayChanged) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 4000);

      prevHome.current = homeScore;
      prevAway.current = awayScore;

      return () => clearTimeout(timer);
    }

    // Mantener los valores actualizados para la próxima comparación
    prevHome.current = homeScore;
    prevAway.current = awayScore;
  }, [homeScore, awayScore]);

  return (
    <>
      {isAnimating && (
        <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center overflow-hidden">
          <style>
            {`
              @keyframes goal-bg-opacity {
                0% { opacity: 0; backdrop-filter: blur(0px); }
                5% { opacity: 1; backdrop-filter: blur(4px); }
                15% { opacity: 0.8; backdrop-filter: blur(3px); }
                75% { opacity: 0.3; backdrop-filter: blur(1px); }
                100% { opacity: 0; backdrop-filter: blur(0px); }
              }
              @keyframes goal-shine {
                0% { transform: translateX(-150%) skewX(-25deg); }
                15% { transform: translateX(250%) skewX(-25deg); }
                100% { transform: translateX(250%) skewX(-25deg); }
              }
              @keyframes text-entrance {
                0% { transform: scale(4) translateY(20px); opacity: 0; filter: blur(12px); }
                10% { transform: scale(1) translateY(0); opacity: 1; filter: blur(0px); }
                15% { transform: scale(1.1); }
                20% { transform: scale(1); }
                80% { transform: scale(1); opacity: 1; filter: blur(0px); }
                90% { transform: scale(2.5); opacity: 0; filter: blur(8px); }
                100% { transform: scale(3); opacity: 0; filter: blur(15px); }
              }
              @keyframes text-vibrate {
                0% { transform: translate(0); }
                20% { transform: translate(-2px, 2px); }
                40% { transform: translate(-2px, -2px); }
                60% { transform: translate(2px, 2px); }
                80% { transform: translate(2px, -2px); }
                100% { transform: translate(0); }
              }
              @keyframes pulse-ring-border {
                0% { transform: scale(0.5); opacity: 0; border-width: 4px; }
                10% { opacity: 1; border-width: 6px; }
                40% { transform: scale(4); opacity: 0; border-width: 30px; }
                100% { transform: scale(4); opacity: 0; border-width: 0px; }
              }
              
              .animate-goal-bg { animation: goal-bg-opacity 4s ease-out forwards; }
              .animate-goal-shine { animation: goal-shine 4s ease-in-out forwards; }
              .animate-pulse-ring { animation: pulse-ring-border 4s cubic-bezier(0.165, 0.84, 0.44, 1) forwards; }
              .animate-text-entrance { animation: text-entrance 4s ease-in-out forwards; }
              .animate-text-vibrate { animation: text-vibrate 0.15s linear infinite; }
            `}
          </style>

          {/* Fondo principal reactivo usando el color del tema */}
          <div className={`absolute inset-0 ${goalBg} animate-goal-bg`} />

          {/* Anillo expansivo (Radar Pulse) usando el borde del tema */}
          <div className={`absolute w-10 h-10 rounded-full border-solid ${goalRing} animate-pulse-ring`} />

          {/* Barrido de luz metálica (Shine/Laser) */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-60 animate-goal-shine" />
          </div>

          {/* Contenedor del texto (Entrada y Salida) */}
          <div className="relative z-10 animate-text-entrance">
            {/* Contenedor vibratorio (Terremoto) */}
            <div className="inline-block animate-text-vibrate">
              <span className={`text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b ${goalTextGradient} ${goalTextShadow} uppercase italic tracking-[0.1em]`}>
                ¡GOL!
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
