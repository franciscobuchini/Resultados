

export default function Footer() {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-900 py-12 px-6 mt-auto">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
              <span className="text-black font-black text-sm italic">R</span>
            </div>
            <span className="text-white font-black uppercase tracking-tighter text-lg">
              ResultadosAR
            </span>
          </div>
          <p className="text-zinc-500 text-xs leading-relaxed max-w-xs">
            La plataforma definitiva para el seguimiento de resultados deportivos en tiempo real. Datos precisos, estadísticas avanzadas y cobertura global.
          </p>
        </div>

        <div>
          <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-6">Competiciones</h4>
          <ul className="space-y-3 text-zinc-500 text-xs">
            <li><a href="#" className="hover:text-white transition-colors">Liga Profesional</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Premier League</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Champions League</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Copa Libertadores</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-6">Soporte</h4>
          <ul className="space-y-3 text-zinc-500 text-xs">
            <li><a href="#" className="hover:text-white transition-colors">Ayuda</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Contacto</a></li>
            <li><a href="#" className="hover:text-white transition-colors">API</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Publicidad</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-6">Legal</h4>
          <ul className="space-y-3 text-zinc-500 text-xs">
            <li><a href="#" className="hover:text-white transition-colors">Privacidad</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Términos</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Cookies</a></li>
          </ul>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto mt-12 pt-8 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-4">
        <span className="text-zinc-600 text-[10px] uppercase tracking-widest">
          © 2026 ResultadosAR. Todos los derechos reservados.
        </span>
        <div className="flex items-center gap-6">
          {/* Aquí irían iconos de redes sociales */}
          <div className="w-5 h-5 bg-zinc-800 rounded-full cursor-pointer hover:bg-zinc-700 transition-colors"></div>
          <div className="w-5 h-5 bg-zinc-800 rounded-full cursor-pointer hover:bg-zinc-700 transition-colors"></div>
          <div className="w-5 h-5 bg-zinc-800 rounded-full cursor-pointer hover:bg-zinc-700 transition-colors"></div>
        </div>
      </div>
    </footer>
  );
}
