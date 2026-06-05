import { Link } from 'react-router-dom';
import { StandingsHeaderRow, StandingsRow, StatGroup, Stat } from '../ui/DataRow';
import DataBox from '../ui/DataBox';
import { useThemeClasses } from '../../functions/themeStore';
import type { TeamStanding } from '../../functions/computeStandings';
import type { TournamentSystem } from '../../functions/computeStandings'

interface TeamInfo {
  team_id: string;
  team_name: string | null;
  team_crest_url: string | null;
}

interface StandingsTableProps {
  title?: string;
  standings: TeamStanding[];
  teamLookup: Record<string, TeamInfo>;
  tournamentSystem?: TournamentSystem | null;
}

// Mapeo de color string → clases Tailwind
const COLOR_MAP: Record<string, { border: string; dot: string }> = {
  blue:   { border: 'border-blue-500',    dot: 'bg-blue-500'    },
  yellow: { border: 'border-yellow-400',  dot: 'bg-yellow-400'  },
  green:  { border: 'border-green-500',   dot: 'bg-green-500'   },
  orange: { border: 'border-orange-500',  dot: 'bg-orange-500'  },
  red:    { border: 'border-red-500',     dot: 'bg-red-500'     },
  purple: { border: 'border-purple-500',  dot: 'bg-purple-500'  },
  gray:   { border: 'border-gray-400',    dot: 'bg-gray-400'    },
};

export default function StandingsTable({ title, standings, teamLookup, tournamentSystem }: StandingsTableProps) {
  const { textMuted } = useThemeClasses();
  const qualify = tournamentSystem?.groups?.qualify ?? null;

  // Leyenda: destinos únicos que aparecen en esta tabla, en orden de posición
  const legendItems: { color: string; label: string }[] = [];
  const seenLabels = new Set<string>();
  standings.forEach((_, idx) => {
    const slot = qualify?.[String(idx + 1)];
    if (slot && !seenLabels.has(slot.label)) {
      seenLabels.add(slot.label);
      legendItems.push({ color: slot.color, label: slot.label });
    }
  });

  const statColumns = (
    <StatGroup>
      <Stat value="PTS" />
      <Stat value="PJ" />
      <Stat value="PG" className="hidden xl:flex" />
      <Stat value="PE" className="hidden xl:flex" />
      <Stat value="PP" className="hidden xl:flex" />
      <Stat value="+/-" />
    </StatGroup>
  );

  return (
    <div className="flex flex-col gap-2">
      <DataBox>
        <StandingsHeaderRow
          title={title ? `Grupo ${title}` : 'Equipo'}
          stats={statColumns}
        />

        {standings.map((team, idx) => {
          const info     = teamLookup[team.team_id.trim()];
          const slot     = qualify?.[String(idx + 1)] ?? null;
          const colors   = slot ? (COLOR_MAP[slot.color] ?? null) : null;

          return (
            <Link
              key={team.team_id}
              to={`/team/${team.team_id}`}
              className="block transition-opacity hover:opacity-80 relative"
            >
              {colors && (
                <div className={`absolute left-0 top-0 bottom-0 w-0.5 border-l-2 ${colors.border}`} />
              )}

              <StandingsRow
                position={idx + 1}
                logo={info?.team_crest_url}
                name={team.team_name ?? info?.team_name}
                noBorder={idx === standings.length - 1}
                stats={
                  <StatGroup>
                    <Stat value={team.points} prominent />
                    <Stat value={team.played} />
                    <Stat value={team.won} className="hidden xl:flex" />
                    <Stat value={team.drawn} className="hidden xl:flex" />
                    <Stat value={team.lost} className="hidden xl:flex" />
                    <Stat
                      value={team.goal_difference > 0 ? `+${team.goal_difference}` : team.goal_difference}
                    />
                  </StatGroup>
                }
              />
            </Link>
          );
        })}
      </DataBox>

      {/* Leyenda */}
      {legendItems.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 px-2">
          {legendItems.map(({ color, label }) => {
            const dot = COLOR_MAP[color]?.dot ?? 'bg-gray-400';
            return (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${dot}`} />
                <span className={`text-xs ${textMuted}`}>{label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}