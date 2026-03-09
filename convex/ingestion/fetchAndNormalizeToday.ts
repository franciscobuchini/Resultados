import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { fetchMatches } from "./fetchMatches";
import { normalizeApi } from "../normalize/normalizeApi";

export const fetchAndNormalizeToday = action({
  args: {},
  handler: async (ctx) => {

    const data = await fetchMatches();
    const normalized = await normalizeApi(ctx, data);  // async + ctx

    // Guardar cache del día
    await ctx.runMutation(api.storage.saveTodayMatches.saveTodayMatches, { data: normalized });

    // Recolectar partidos argentinos finalizados para historial
    const finishedArgMatches: any[] = [];

    for (const league of normalized.leagues || []) {
      for (const game of league.games || []) {
        const statusShort = game.status?.short_name ?? game.status?.state ?? null;

        // Validar finalizado y liga argentina (league.country_id normalizado)
        if (statusShort === "Final" && league.country_id === "ar") {
          // Construir match en el formato esperado por storage
          const match = {
            api_id: game.api_id ?? null,
            league_id: league.id,
            date: game.date ?? null,
            home: game.home ?? (game.teams?.[0] ?? null),
            away: game.away ?? (game.teams?.[1] ?? null),
            home_score: game.home_score,
            away_score: game.away_score,
            goals: game.goals ?? null,
            stadium: game.stadium?.name ?? game.stadium ?? null,
            referee: game.referee ?? null,
            country_id: league.country_id,
            status: game.status ?? null
          };
          finishedArgMatches.push(match);
        }
      }
    }

    if (finishedArgMatches.length > 0) {
      await ctx.runMutation(api.storage.saveHistoricalMatch.saveHistoricalMatches, { matches: finishedArgMatches });
    }

    return normalized;
  },
});