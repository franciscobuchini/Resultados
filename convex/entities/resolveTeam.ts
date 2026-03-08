import { query } from "../_generated/server";
import { v } from "convex/values";

// Devuelve tu ID interno de equipo según el api_id
export const resolveTeam = query({
  args: { apiId: v.string() },

  handler: async (ctx, args) => {

    const team = await ctx.db
      .query("teams")
      .withIndex("by_api_id", (q) => q.eq("api_id", args.apiId))
      .first();

    return team?.id ?? args.apiId;

  },
});