import { resolveCountry } from "../entities/resolveCountry";
import { resolveTeam } from "../entities/resolveTeam";
import { resolveLeague } from "../entities/resolveLeague";
import { overrides } from "../mappings/overrides";

export function normalizeApi(data: any) {

  return {

    ...data,

    leagues: data.leagues.map((league: any) => ({

      ...league,

      country_id: resolveCountry(league.country_id),

      id: resolveLeague(league.id),

      games: league.games.map((game: any) => ({

        ...game,

        id: overrides.games[game.id] ?? game.id,

        teams: game.teams.map((team: any) => ({

          ...team,

          id: resolveTeam(team.id),

          country_id: resolveCountry(team.country_id)

        }))

      }))

    }))

  };

}