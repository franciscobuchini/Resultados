import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const saveHistoricalMatch = mutation({

  args: {
    match: v.any()
  },

  handler: async (ctx, args) => {

    await ctx.db.insert("matchesHistory", {
      match: args.match,
      savedAt: Date.now()
    });

  },

});