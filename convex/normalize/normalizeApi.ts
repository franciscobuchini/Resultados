import { resolveCountry } from "../entities/resolveCountry";
import { resolveLeague } from "../entities/resolveLeague";

// ahora normalizeApi es async porque consulta la BDD
export async function normalizeApi(ctx: any, data: any) {

  return {
    ...data,

    leagues: await Promise.all(data.leagues.map(async (league: any) => {

      return {
        ...league,
        country_id: resolveCountry(league.country_id),
        id: resolveLeague(league.id),

        games: await Promise.all(league.games.map(async (game: any) => {

          const teamsWithData = await Promise.all(game.teams.map(async (team: any) => {

            // buscar el equipo en la BDD por api_id
            const teamData = await ctx.db.query("teams")
              .filter((t: any) => t.api_id.eq(team.id))
              .first();

            if (!teamData) {
              console.log("UNKNOWN team", team.id);
            }

            return {
              ...team,
              id: teamData?.id ?? team.id,             // tu ID interno o el original
              name: teamData?.name ?? team.name,
              country_id: teamData?.country_id ?? team.country_id,
              crest_url: teamData?.crest_url ?? "",
              extra: teamData?.extra ?? {}
            };
          }));

          return {
            ...game,
            teams: teamsWithData
          };

        }))
      };

    }))
  };

}