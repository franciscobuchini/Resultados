import { StandingsHeaderRow, StandingsRow, StatGroup, Stat } from '../ui/DataRow';
import DataBox from '../ui/DataBox';
import type { TopScorer } from '../../functions/topScorers';

interface TeamInfo {
  team_id: string;
  team_name: string | null;
  team_crest_url: string | null;
}

interface TopScorersTableProps {
  scorers: TopScorer[];
  teamLookup: Record<string, TeamInfo>;
}

/**
 * TopScorersTable — Tabla de goleadores del torneo.
 * Muestra posición, bandera del país, nombre del jugador y cantidad de goles.
 */
export default function TopScorersTable({ scorers, teamLookup }: TopScorersTableProps) {

  // Ya vienen ordenados por goles (descendente), pero aseguramos
  const sorted = [...scorers].sort((a, b) => b.goles - a.goles);

  const statColumns = (
    <StatGroup>
      <Stat value="Goles" width="w-12" className="font-bold" />
    </StatGroup>
  );

  return (
    <DataBox>
      <StandingsHeaderRow
        title="Goleadores"
        stats={statColumns}
      />

      {sorted.map((scorer, idx) => {
        const team = teamLookup[scorer.country_id];

        return (
          <StandingsRow
            key={`${scorer.nombre}-${idx}`}
            position={idx + 1}
            logo={team?.team_crest_url}
            name={scorer.nombre}
            noBorder={idx === sorted.length - 1}
            stats={
              <StatGroup>
                <Stat
                  value={scorer.goles}
                  width="w-12"
                  prominent
                />
              </StatGroup>
            }
          />
        );
      })}
    </DataBox>
  );
}
