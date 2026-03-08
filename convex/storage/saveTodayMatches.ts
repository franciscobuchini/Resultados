import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const saveTodayMatches = mutation({

  args: { data: v.any() },

  handler: async (ctx, args) => {

    const existing = await ctx.db.query("gamesToday").first();

    if (existing) {

      await ctx.db.patch(existing._id, {
        data: args.data,
        updatedAt: Date.now(),
      });

    } else {

      await ctx.db.insert("gamesToday", {
        data: args.data,
        updatedAt: Date.now(),
      });

    }

  },

});