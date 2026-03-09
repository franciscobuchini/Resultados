import { resolveCountryHelper } from "../entities/resolveCountry";
import { resolveLeagueHelper } from "../entities/resolveLeague";

export async function normalizeApi(ctx: any, data: any) {

  // 1. cargar todos los equipos una sola vez
  const teams = await ctx.db.query("teams").collect();

  // 2. crear mapa api_id (string) → team
  const teamMap = new Map<string, any>();
  for (const team of teams) {
    teamMap.set(String(team.api_id), team);
  }

  return {
    ...data,

    leagues: await Promise.all(
      (data.leagues || []).map(async (league: any) => {

        const countryId = await resolveCountryHelper(ctx, {
          apiCountryId: league.country_id
        });

        const leagueId = await resolveLeagueHelper(ctx, {
          apiId: league.id
        });

        const games = (league.games || []).map((game: any) => {

          const normalizedTeams = (game.teams || []).map((team: any) => {
            const key = String(team.id);
            const teamData = teamMap.get(key);

            return {
              ...team,
              id: teamData?.id ?? String(team.id),
              name: teamData?.name ?? team.name,
              country_id: teamData?.country_id ?? team.country_id,
              crest_url: teamData?.crest_url ?? team.crest_url ?? ""
            };
          });

          const home = normalizedTeams[0] ?? null;
          const away = normalizedTeams[1] ?? null;

          return {
            ...game,
            teams: normalizedTeams,
            home,
            away,
            home_score: game.home_score ?? game.score?.home ?? null,
            away_score: game.away_score ?? game.score?.away ?? null,
            league_id: leagueId,
            country_id: countryId,
            api_id: game.id ?? game.api_id ?? null
          };
        });

        return {
          ...league,
          id: leagueId,
          country_id: countryId,
          games
        };

      })
    )
  };
}