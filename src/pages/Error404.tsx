
import { Link } from 'react-router-dom';
import { useThemeClasses } from '../functions/themeStore';

export default function Error404() {
  const { textMain, textMuted, bgSurfaceHover, border } = useThemeClasses();
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
      <div className="relative mb-8">
        <h1 className={`text-[12rem] md:text-[18rem] font-black ${textMain} opacity-5 leading-none select-none`}>
          404
        </h1>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`w-20 h-20 ${bgSurfaceHover} flex items-center justify-center ${textMain} text-4xl shadow-2xl mb-6 animate-bounce`}>
            ⚽
          </div>
          <h2 className={`text-2xl md:text-4xl font-black ${textMain}`}>
            Fuera de Juego
          </h2>
        </div>
      </div>
      
      <p className={`${textMuted} max-w-md mx-auto mb-10 text-sm`}>
        La página que buscas ha sido anulada por el VAR o nunca existió. 
        Vuelve al terreno de juego para seguir la acción.
      </p>

      <Link 
        to="/" 
        className={`px-8 py-4 ${bgSurfaceHover} ${textMain} border ${border} font-black text-xs rounded-full hover:opacity-80 transition-all shadow-xl`}
      >
        Volver al Inicio
      </Link>
    </div>
  );
}
