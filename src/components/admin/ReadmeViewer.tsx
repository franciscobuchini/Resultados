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
          <li>- Orden de las ligas que aparecen en el homepage no tienen sentido, darle un tier de importancia (JAVI)</li>
          <li>- Hacer el json para tournament_teams de cada torneo (JAVI)</li>
          <br/>
          <li>- Sistema de inicio de sesión, perfiles, etc</li>
          <li>- Resolver "nombre de torneo" para usar de contenedor para cada liga/torneo y crear su funcion</li>
          <li>- IA Futbolera YT</li>
          <li>- Asegurarme que los goles de partidos del mundial de ambas apis van a coincidir</li>
          <li>- Admin puede seleccionar texto, resto de usuarios no puede.  </li>
          <li>- El login se va a solucionar cuando agreguemos el dominio oficial en supabase sino no va a funcionar</li>
          <li>- Simplificar columna: tournament_system</li>
          <li>- Animación de gol en el DataRow del partido cuando hay gol</li>
          <li>- Icons de partidos hacer nuevos</li>

          <p>Notas:</p>
          <li>- Los torneos con letras no pueden empezar con la misma letra, ej: CH = champions league, CL = copa libertadore. La logica lo toma como un mismo torneo pero distinta edicion </li>



        </ul>
      </div>
    </div>
  )
}
