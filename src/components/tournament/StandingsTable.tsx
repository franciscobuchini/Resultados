import DataRow from '../ui/DataRow';
import type { TeamStanding } from '../../../shared/tournament/computeStandings';

interface TeamInfo {
  team_id: string;
  team_name: string | null;
  team_crest_url: string | null;
}

interface StandingsTableProps {
  /** Título del grupo (opcional) */
  title?: string;
  /** Array de posiciones calculado */
  standings: TeamStanding[];
  /** Diccionario de información de equipos (escudos, nombres reales) */
  teamLookup: Record<string, TeamInfo>;
}

/**
 * StandingsTable - Tabla de posiciones construida con el componente universal DataRow.
 */
export default function StandingsTable({ title, standings, teamLookup }: StandingsTableProps) {
  return (
    <div className="space-y-4">
      {/* Título del Grupo / Zona */}
      {title && (
        <div className="flex items-center gap-2 px-2">
          <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />
          <span className="text-zinc-100 font-black uppercase tracking-[0.2em] text-[10px]">
            {title}
          </span>
        </div>
      )}

      {/* Contenedor de la Tabla */}
      <div className="bg-neutral-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        
        {/* Cabecera (usando DataRow con isHeader) */}
        <DataRow
          isHeader
          left={<span className="w-8 text-center">#</span>}
          main="Equipo"
          right={
            <div className="flex items-center text-center font-mono">
              <div className="w-12 font-black">PTS</div>
              <div className="w-12">PJ</div>
              <div className="w-12 hidden sm:block">PG</div>
              <div className="w-12 hidden sm:block">PE</div>
              <div className="w-12 hidden sm:block">PP</div>
              <div className="w-16">+/-</div>
            </div>
          }
        />

        {/* Filas de Equipos */}
        {standings.map((team, idx) => {
          const info = teamLookup[team.team_id.trim()];
          
          return (
            <DataRow
              key={team.team_id}
              left={
                <span className="w-8 text-center text-zinc-600 font-black text-xs">
                  {idx + 1}
                </span>
              }
              main={
                <div className="flex items-center gap-3 overflow-hidden">
                  {info?.team_crest_url ? (
                    <img
                      src={info.team_crest_url}
                      className="w-6 h-6 object-contain flex-shrink-0"
                      alt=""
                    />
                  ) : (
                    <div className="w-6 h-6 bg-zinc-900 rounded-full flex-shrink-0" />
                  )}
                  <span className="text-zinc-100 font-bold truncate">
                    {info?.team_name ?? team.team_name}
                  </span>
                </div>
              }
              right={
                <div className="flex items-center text-center font-mono text-[11px]">
                  <div className="w-12 font-black text-white bg-white/5 h-14 flex items-center justify-center">
                    {team.points}
                  </div>
                  <div className="w-12 text-zinc-400">{team.played}</div>
                  <div className="w-12 text-zinc-500 hidden sm:block">{team.won}</div>
                  <div className="w-12 text-zinc-500 hidden sm:block">{team.drawn}</div>
                  <div className="w-12 text-zinc-500 hidden sm:block">{team.lost}</div>
                  <div className="w-16 font-bold text-zinc-500">
                    {team.goal_difference > 0 ? `+${team.goal_difference}` : team.goal_difference}
                  </div>
                </div>
              }
            />
          );
        })}
      </div>
    </div>
  );
}
