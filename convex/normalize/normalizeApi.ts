import { resolveCountryHelper } from "../entities/resolveCountry";
import { resolveLeagueHelper } from "../entities/resolveLeague";

export async function normalizeApi(ctx: any, data: any) {

  // 1. cargar todos los equipos una sola vez
  const teams = await ctx.db.query("teams").collect();

  // 2. crear mapa api_id → team
  const teamMap = new Map();
  for (const team of teams) {
    teamMap.set(team.api_id, team);
  }

  return {
    ...data,

    leagues: await Promise.all(
      data.leagues.map(async (league: any) => {

        const countryId = await resolveCountryHelper(ctx, {
          apiCountryId: league.country_id
        });

        const leagueId = await resolveLeagueHelper(ctx, {
          apiId: league.id
        });

        const games = league.games.map((game: any) => {

          const normalizedTeams = game.teams.map((team: any) => {

            const teamData = teamMap.get(team.id);

            if (!teamData) {
              console.log("UNKNOWN team", team.id);
            }

            return {
              ...team,
              id: teamData?.id ?? team.id,
              name: teamData?.name ?? team.name,
              country_id: teamData?.country_id ?? team.country_id,
              crest_url: teamData?.crest_url ?? ""
            };

          });

          return {
            ...game,
            teams: normalizedTeams
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