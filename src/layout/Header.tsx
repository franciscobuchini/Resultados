import { Link } from 'react-router-dom';
import UtcSelector from '../components/header/UtcSelector';
import SyncStatus from '../components/header/SyncStatus';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 z-50 flex items-center px-6 justify-between">
      <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
          <span className="text-black font-black text-xl italic">R</span>
        </div>
        <h1 className="text-white font-black uppercase tracking-tighter text-2xl hidden sm:block">
          Resultados<span className="text-zinc-500">AR</span>
        </h1>
      </Link>

      <nav className="hidden lg:flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest text-zinc-400">
        <Link to="/" className="hover:text-white transition-colors text-white">Partidos</Link>
        <a href="#" className="hover:text-white transition-colors">Torneos</a>
        <a href="#" className="hover:text-white transition-colors">Equipos</a>
        <a href="#" className="hover:text-white transition-colors">Noticias</a>
      </nav>

      <div className="flex items-center gap-6">
        <div className="hidden sm:flex items-center gap-4 border-r border-zinc-800 pr-6">
          <UtcSelector />
          <SyncStatus />
        </div>

        <div className="flex items-center gap-4">
          <Link 
            to="/admin"
            className="text-zinc-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors"
          >
            Admin
          </Link>
        </div>
      </div>
    </header>
  );
}
