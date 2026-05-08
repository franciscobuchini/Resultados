import { StandingsHeaderRow, StandingsRow, StatGroup, Stat } from '../ui/DataRow';
import DataBox from '../ui/DataBox';
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
 * StandingsTable - Tabla de posiciones.
 */
export default function StandingsTable({ title, standings, teamLookup }: StandingsTableProps) {
  const statColumns = (
    <StatGroup>
      <Stat value="PTS" />
      <Stat value="PJ" />
      <Stat value="PG" />
      <Stat value="PE" />
      <Stat value="PP" />
      <Stat value="+/-" />
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
          <StandingsRow
            key={team.team_id}
            position={idx + 1}
            logo={info?.team_crest_url}
            name={info?.team_name ?? team.team_name}
            stats={
              <StatGroup>
                <Stat value={team.points} prominent />
                <Stat value={team.played} />
                <Stat value={team.won} />
                <Stat value={team.drawn} />
                <Stat value={team.lost} />
                <Stat 
                  value={team.goal_difference > 0 ? `+${team.goal_difference}` : team.goal_difference}
                />
              </StatGroup>
            }
          />
        );
      })}
    </DataBox>
  );
}
