import React from 'react';
import { Link } from 'react-router-dom';

export default function Error404() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
      <div className="relative mb-8">
        <h1 className="text-[12rem] md:text-[18rem] font-black text-white/5 leading-none select-none">
          404
        </h1>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-black text-4xl shadow-2xl mb-6 animate-bounce">
            ⚽
          </div>
          <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter">
            Fuera de Juego
          </h2>
        </div>
      </div>
      
      <p className="text-zinc-500 max-w-md mx-auto mb-10 text-sm md:text-base leading-relaxed">
        La página que buscas ha sido anulada por el VAR o nunca existió. 
        Vuelve al terreno de juego para seguir la acción.
      </p>

      <Link 
        to="/" 
        className="px-8 py-4 bg-white text-black font-black uppercase tracking-widest text-xs rounded-full hover:bg-zinc-200 transition-all shadow-xl shadow-white/10"
      >
        Volver al Inicio
      </Link>
    </div>
  );
}
