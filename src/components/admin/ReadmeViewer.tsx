import { useThemeClasses } from '../../functions/themeStore';

export default function ReadmeViewer() {
  const { textMain, textMuted } = useThemeClasses();

  return (
    <div className={`max-w-4xl mx-auto px-6 py-10 ${textMain}`}>
      <div className="flex flex-col gap-4">
        <h3 className="text-xl font-semibold mb-2 opacity-80">Tareas pendientes</h3>
        <ul className={`space-y-2 ${textMuted}`}>
          <li>- Goles desde 2020 Liga Argentina (JAVI)</li>
          <li>- Sistema de inicio de sesión, perfiles, etc</li>
          <li>- Partidos únicos entre campeonatos (JAVI)</li>
          <li>- Resolver api en network para que no se vean los datos en texto plano</li>
          <li>- IA Futbolera YT</li>
          <li>- Asegurarme que los goles de partidos del mundial de ambas apis van a coincidir</li>
          <li>- teams sin id de SM (JAVI)</li>
          <li>- Orden de las ligas que aparecen en el homepage no tienen sentido, darle un tier de importancia (JAVI)</li>
          <li>- Hacer el json para tournament_teams de cada torneo (JAVI)</li>

          <p>Notas:</p>
          <li>- Los torneos con letras no pueden empezar con la misma letra, ej: CH = champions league, CL = copa libertadore. La logica lo toma como un mismo torneo pero distinta edicion </li>
          


        </ul>
      </div>
    </div>
  )
}
