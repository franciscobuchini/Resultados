import { useThemeClasses } from '../../functions/themeStore';

export default function ReadmeViewer() {
  const { textMain, textMuted } = useThemeClasses();

  return (
    <div className={`max-w-4xl mx-auto px-6 py-10 ${textMain}`}>
      <div className="flex flex-col gap-4">
        <h3 className="text-xl font-semibold mb-2 opacity-80">Tareas pendientes</h3>
        <ul className={`space-y-2 ${textMuted}`}>
          <li>- Goles desde 2020 Liga Argentina (JAVI)</li>
          <li>- Partidos únicos entre campeonatos (JAVI)</li>
          <li>- Teams sin id de SM (JAVI)</li>
          <li>- Hacer el json para tournament_teams de cada torneo (JAVI)</li>
          <li>- Nombres de equipos muy largos (JAVI)</li>
          <br/>
          <li>- El login se va a solucionar cuando agreguemos el dominio oficial en supabase sino no va a funcionar...</li>
          <li>- Admin puede seleccionar texto, resto de usuarios no puede...  </li>
          <li>- Simplificar columna: tournament_system en supabase (Claude Desktop)</li>
          <li>- Reemplazo definitivo de API 365: usar solo SM (Claude Opus)</li>

          <li>- Animación de gol en el DataRow del partido cuando hay gol</li>
          <li>- Icons de partidos hacer nuevos</li>
          <li>- IA Futbolera YT</li>

          <p>Notas:</p>
          <li>- Los torneos con letras no pueden empezar con la misma letra, ej: CH = champions league, CL = copa libertadore. La logica lo toma como un mismo torneo pero distinta edicion </li>
        </ul>
      </div>
    </div>
  )
}
