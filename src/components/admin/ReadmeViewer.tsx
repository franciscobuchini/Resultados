

import { useThemeClasses } from '../../functions/themeStore';

export default function ReadmeViewer() {
  const { textMain, textMuted } = useThemeClasses();

  return (
    <div className={`max-w-4xl mx-auto px-6 ${textMain}`}>
      <h2 className="text-2xl font-bold mb-4">Tareas pendientes</h2>
      <ul className={`space-y-2 ${textMuted}`}>
        <li>- Goles desde 2020 Liga Argentina</li>
        <li>- Sistema de inicio de sesión, perfiles, etc</li>
        <li>- Partidos únicos entre campeonatos</li>
        <li>- Partidos del mundial dicen: fase regular en vez de octavos, cuartos, semis, final</li>
        <li>- Cambiar url de los escudos del futbol por https://www.thesportsdb.com/ ya que los escudos ahora mismo los toma de 365 y se ven al abrir la imagen en una nueva pestaña </li>
        <li>- Resolver goleadores por partido para el mundial</li>
        <li>- Resolver tabla general de goleadores por partido para el mundial</li>
        <li>- Menu de inicio mostrar todos los partidos del dia</li>
        <li>- Resolver api en network para que no se vean los datos en texto plano</li>
        <li>- Resolver problema de que esta tomando los teampage por "team_shortname" en vez de por "team_id"</li>
        <li>- IA Futbolera YT</li>
        <li>- Ver bien el tema de los goles fantasmas. </li>
        <li>- Asegurarme que los goles de partidos del mundial de ambas apis van a coincidir</li>
        <li>- teams sin id</li>
        
      </ul>
    </div>
  )
}
