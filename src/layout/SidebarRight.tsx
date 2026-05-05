import React from 'react';

export default function SidebarRight() {
  return (
    <aside className="hidden lg:block w-80 shrink-0 border-l border-zinc-900 p-6 space-y-8 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar">
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-white font-bold text-sm">Próximos Destacados</h3>
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-zinc-950 border border-zinc-900 rounded-xl p-3 space-y-3">
              <div className="flex justify-between items-center text-[9px] text-zinc-500 uppercase tracking-widest font-black">
                <span>Champions League</span>
                <span className="text-green-500">20:45</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-4 h-4 bg-zinc-800 rounded-full"></div>
                  <span className="text-[10px] font-bold text-white truncate">Real Madrid</span>
                </div>
                <span className="text-[10px] text-zinc-600 font-bold">vs</span>
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <span className="text-[10px] font-bold text-white truncate">Man City</span>
                  <div className="w-4 h-4 bg-zinc-800 rounded-full"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors">
          Ver todo el calendario
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Tendencias</h3>
        <div className="space-y-4">
          {[
            { title: 'Messi vuelve a marcar con el Inter Miami', tag: 'MLS' },
            { title: 'Scaloni confirma la lista para las eliminatorias', tag: 'Selección' },
            { title: 'Bombazo en el mercado europeo', tag: 'Transferencias' }
          ].map((news, idx) => (
            <div key={idx} className="group cursor-pointer">
              <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">{news.tag}</span>
              <p className="text-xs text-zinc-400 group-hover:text-white transition-colors leading-snug">
                {news.title}
              </p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
