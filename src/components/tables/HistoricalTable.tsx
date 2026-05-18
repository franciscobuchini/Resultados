import { Link } from 'react-router-dom';
import { StandingsHeaderRow, StandingsRow, StatGroup, Stat } from '../ui/DataRow';
import DataBox from '../ui/DataBox';
import type { TeamStanding } from '../../../shared/tournament/computeStandings';

export interface HistoricalTeamStanding extends TeamStanding {
  tj: number;
  titles: number;
  rend: number;
}

interface TeamInfo {
  team_id: string;
  team_name: string | null;
  team_crest_url: string | null;
}

interface HistoricalTableProps {
  /** Título de la tabla (opcional) */
  title?: string;
  /** Array de posiciones calculado */
  standings: HistoricalTeamStanding[];
  /** Diccionario de información de equipos (escudos, nombres reales) */
  teamLookup: Record<string, TeamInfo>;
}

/**
 * HistoricalTable - Tabla de posiciones histórica.
 */
export default function HistoricalTable({ title, standings, teamLookup }: HistoricalTableProps) {
  const statColumns = (
    <StatGroup>
      <Stat value="TJ" className="hidden sm:flex" title="Torneos Jugados" />
      <Stat value="PTS" title="Puntos" />
      <Stat value="PJ" title="Partidos Jugados" />
      <Stat value="PG" className="hidden xl:flex" title="Partidos Ganados" />
      <Stat value="PE" className="hidden xl:flex" title="Partidos Empatados" />
      <Stat value="PP" className="hidden xl:flex" title="Partidos Perdidos" />
      <Stat value="+/-" title="Diferencia de Goles" />
      <Stat value="T" className="text-yellow-500 font-black" title="Títulos" />
      <Stat value="%" className="hidden sm:flex" title="Rendimiento" />
    </StatGroup>
  );

  return (
    <DataBox>
      <StandingsHeaderRow
        title={title ? `Grupo ${title}` : "Equipo"}
        stats={statColumns}
      />

      {standings.map((team, idx) => {
        const info = teamLookup[team.team_id.trim()];

        return (
          <Link key={team.team_id} to={`/team/${team.team_id}`} className="block transition-opacity hover:opacity-80">
            <StandingsRow
              position={idx + 1}
              logo={info?.team_crest_url}
              name={info?.team_name ?? team.team_name}
              noBorder={idx === standings.length - 1}
              stats={
                <StatGroup>
                  <Stat value={team.tj} className="hidden sm:flex" />
                  <Stat value={team.points} prominent />
                  <Stat value={team.played} />
                  <Stat value={team.won} className="hidden xl:flex" />
                  <Stat value={team.drawn} className="hidden xl:flex" />
                  <Stat value={team.lost} className="hidden xl:flex" />
                  <Stat
                    value={team.goal_difference > 0 ? `+${team.goal_difference}` : team.goal_difference}
                  />
                  <Stat value={team.titles > 0 ? team.titles : '-'} className="text-yellow-500 font-black" />
                  <Stat value={`${team.rend.toFixed(1)}%`} className="hidden sm:flex text-xs" />
                </StatGroup>
              }
            />
          </Link>
        );
      })}
    </DataBox>
  );
}
