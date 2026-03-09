import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const saveHistoricalMatch = mutation({
  args: {
    match: v.any()
  },

  handler: async (ctx, args) => {

    const match = args.match;

    // Solo ligas argentinas
    if (match.country_id !== "ar") {
      return;
    }

    // Solo partidos finalizados
    if (match.status?.short_name !== "Final") {
      return;
    }

    // ID único: DATE + HOME + AWAY
    const matchId = `${match.date}_${match.home.id}_${match.away.id}`;

    // Evitar duplicados
    const existing = await ctx.db
      .query("matchesHistory")
      .withIndex("by_match_id", (q) => q.eq("id", matchId))
      .first();

    if (existing) {
      return;
    }

    await ctx.db.insert("matchesHistory", {
      id: matchId,
      api_id: match.api_id,
      league_id: match.league_id,
      date: match.date,
      home_id: match.home.id,
      away_id: match.away.id,
      home_score: match.home_score ?? match.score?.home,
      away_score: match.away_score ?? match.score?.away,
      goals: match.goals,
      stadium: match.stadium?.name ?? match.stadium,
      referee: match.referee,
      savedAt: Date.now(),
    });

  },
}); 