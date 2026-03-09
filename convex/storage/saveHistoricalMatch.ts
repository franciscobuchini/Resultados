import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const saveHistoricalMatches = mutation({
  args: {
    matches: v.array(v.any())
  },

  handler: async (ctx, args) => {
    const matches = args.matches || [];

    for (const match of matches) {
      // Reusar la lógica de saveHistoricalMatch pero inline para evitar overhead de muchas mutations
      if (!match.league_id) continue;
      const leagueRec = await ctx.db.get("leagues", match.league_id);
      if (!leagueRec || leagueRec.country_id !== "ar") continue;

      const statusShort = match.status?.short_name ?? match.status?.state ?? null;
      if (statusShort !== "Final") continue;

      const uniqueId = match.api_id ? String(match.api_id) : `${match.date}_${match.home?.id ?? "home"}_${match.away?.id ?? "away"}`;

      let exists = null;
      if (match.api_id) {
        exists = await ctx.db
          .query("matchesHistory")
          .withIndex("by_api_id", (q: any) => q.eq("api_id", String(match.api_id)))
          .first();
      }
      if (!exists) {
        exists = await ctx.db
          .query("matchesHistory")
          .withIndex("by_match_id", (q: any) => q.eq("id", uniqueId))
          .first();
      }
      if (exists) continue;

      await ctx.db.insert("matchesHistory", {
        id: uniqueId,
        api_id: match.api_id ? String(match.api_id) : "",
        league_id: match.league_id,
        date: match.date,
        home_id: match.home?.id ?? null,
        away_id: match.away?.id ?? null,
        home_score: typeof match.home_score === "number" ? match.home_score : null,
        away_score: typeof match.away_score === "number" ? match.away_score : null,
        goals: match.goals ?? null,
        stadium: match.stadium ?? null,
        referee: match.referee ?? null,
        savedAt: Date.now(),
      });
    }
  },
});