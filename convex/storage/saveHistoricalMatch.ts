import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const saveHistoricalMatch = mutation({
  args: {
    match: v.any()
  },
  handler: async (ctx, args) => {
    const match = args.match;

    // Generar ID único: date + home_id + away_id
    const matchId = `${match.date}_${match.home.id}_${match.away.id}`;

    await ctx.db.insert("matchesHistory", {
      api_id: match.api_id,
      id: matchId,                  // DATE+HOME+AWAY
      league_id: match.league_id,
      date: match.date,
      home_id: match.home.id,
      away_id: match.away.id,
      home_score: match.home_score ?? match.score?.home ?? 0,
      away_score: match.away_score ?? match.score?.away ?? 0,
      goals: match.goals ?? "",
      stadium: match.stadium ?? match.stadium?.name ?? "",
      referee: match.referee ?? "",
      savedAt: Date.now(),
    });
  },
});