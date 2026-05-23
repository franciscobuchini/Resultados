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
          <li>- Nombres de equipos muy largos (JAVI)</li>
          <li>- Teams Argentinos sin id de SM (JAVI)</li>
          <li>- Hacer el json para tournament_teams de cada torneo argentino (JAVI)</li>
          <li>- Info de contacto en el footer (JAVI) mail resultados.ar0@gmail.com y twitter @resultados_ar</li>
          <li>- Botón de donaciones (JAVI)</li>
          <br/>
          <li>- Asegurarme de que cuando se juegue un partido del mundial los puntos se sumen a la tabla de standings</li>
          <li>- Consultar qué es mejor para consultar bases de datos para crear una tabla, como distribuir las consultas</li>
          <li>- Simplificar columna: tournament_system en supabase (Claude Desktop)</li>
          <li>- Sidebar izquierda</li>
          <li>- IA Futbolera YT</li>
          <li>- @expediente.gol instagram</li>
          <li>- Filtro de situaciones del partido</li>
          <li>- Tabla de divisiones disputadas por año (ARG)</li>
          <li>- Tabla de mundiales disputados por pais (INT)</li>
          

          <p>Notas:</p>
          <li>- Los torneos con letras no pueden empezar con la misma letra, ej: CH = champions league, CL = copa libertadore. La logica lo toma como un mismo torneo pero distinta edicion </li>
        </ul>
      </div>
    </div>
  )
}
