import { Game, Team } from "../types/liveMatches";

/* ===== STYLE CLASSES ===== */
const ROW_HEIGHT = "2rem";
const COLUMN_BASE = "flex items-center justify-center border border-gray-400 text-xs";

type Props = {
  game: Game;
  showDate?: boolean;
  leagueId?: string;
  countryId?: string;
};

/* ===== MATCH ROW ===== */
export function MatchRow({ game, showDate = false, leagueId, countryId }: Props) {
  if (!game) return null;

  const { isLive, isFinished, isNotStarted } = getStatus(game.status);

  if (!game.teams || !Array.isArray(game.teams) || game.teams.length < 2) return null;
  const [homeTeam, awayTeam] = game.teams;

  const homeScore = game.scoreHome ?? 0;
  const awayScore = game.scoreAway ?? 0;

  if (!homeTeam || !awayTeam) return null;

  return (
    <div className="w-full border border-gray-500 text-sm bg-white">
      <div className="grid grid-cols-[1fr_3fr_1fr_3fr] w-full" style={{ height: ROW_HEIGHT }}>
        <MatchRow.TimeColumn game={game} isLive={isLive} isFinished={isFinished} showDate={showDate} />
        <MatchRow.TeamColumn team={homeTeam} />
        <MatchRow.MatchScore 
          homeScore={homeScore} 
          awayScore={awayScore} 
          isNotStarted={isNotStarted} 
        />
        <MatchRow.TeamColumn team={awayTeam} isAway />
      </div>
      
      <MatchRow.GoalsRow homeTeam={homeTeam} awayTeam={awayTeam} />
      
      {import.meta.env.DEV && (
        <MatchRow.DebugRow 
          game={game} 
          homeTeam={homeTeam} 
          awayTeam={awayTeam} 
          leagueId={leagueId} 
          countryId={countryId} 
        />
      )}
    </div>
  );
}

/* ===== UTILS ===== */
const getStatus = (status: string) => ({
  isLive: status === "live",
  isFinished: status === "finished",
  isNotStarted: status === "scheduled",
});

const getTimeDisplay = (game: Game, showDate: boolean) => {
  if (game.status === "live") {
    return `${game.minute ?? 0}'`;
  }

  if (game.status === "finished") {
    return "FT";
  }

  const kickoff = typeof game.kickoff === "number" ? new Date(game.kickoff) : null;
  if (!kickoff || Number.isNaN(kickoff.getTime())) return "Prog";

  if (showDate) {
    return kickoff.toISOString().slice(0, 16).replace("T", " ");
  }

  return kickoff.toISOString().slice(11, 16);
};

/* ===== SUBCOMPONENTS ===== */
MatchRow.TimeColumn = function TimeColumn({ game, isLive, isFinished, showDate }: { game: Game; isLive: boolean; isFinished: boolean; showDate: boolean }) {
  return (
    <div className={`${COLUMN_BASE} font-medium flex-col ${
      isLive ? "bg-red-600 text-white" : isFinished ? "bg-gray-700 text-white" : "bg-white"
    }`}>
      <div>
        {getTimeDisplay(game, showDate)}
      </div>
    </div>
  );
};

MatchRow.TeamColumn = function TeamColumn({ team, isAway }: { team: Team; isAway?: boolean }) {
  return (
    <div className={`${COLUMN_BASE} px-2 gap-2 overflow-hidden ${
      isAway ? "justify-start" : "justify-end"
    }`}>
      {!isAway && (
        <>
          <span className="truncate block">{team.name}</span>
          <div className="w-4 h-3 bg-gray-300 rounded-sm flex-shrink-0" />
        </>
      )}
      <div className="w-6 h-6 bg-gray-300 rounded-sm flex-shrink-0" />
      {isAway && (
        <>
          <div className="w-4 h-3 bg-gray-300 rounded-sm flex-shrink-0" />
          
          <span className="truncate block">{team.name}</span>
        </>
      )}
    </div>
  );
};

MatchRow.MatchScore = function MatchScore({ homeScore, awayScore, isNotStarted }: { 
  homeScore: number; 
  awayScore: number; 
  isNotStarted: boolean;
}) {
  if (isNotStarted) {
    return (
      <div className={`${COLUMN_BASE} gap-1 text-lg`}>
        <span className="font-bold">-</span>
      </div>
    );
  }

  return (
    <div className={`${COLUMN_BASE} gap-1`}>
      <div className="text-lg font-bold">{homeScore}</div>
      <div className="text-lg font-bold">-</div>
      <div className="text-lg font-bold">{awayScore}</div>
    </div>
  );
};

MatchRow.GoalsRow = function GoalsRow({ homeTeam, awayTeam }: { homeTeam: Team; awayTeam: Team }) {
  void homeTeam;
  void awayTeam;
  return null;
};

MatchRow.DebugRow = function DebugRow({ game, homeTeam, awayTeam, leagueId, countryId }: { 
  game: Game; 
  homeTeam: Team; 
  awayTeam: Team; 
  leagueId?: string; 
  countryId?: string; 
}) {
  return (
    <div className="text-xs p-2 space-x-2">
      <span>GameID: {game.id}</span>
      <span>|</span>
      <span>HomeID: {homeTeam.id}</span>
      <span>|</span>
      <span>AwayID: {awayTeam.id}</span>
      <span>|</span>
      <span>LeagueID: {leagueId || 'N/A'} ({countryId || 'N/A'})</span>
      <span>|</span>
    </div>
  );
};
