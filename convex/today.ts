import { query } from "./_generated/server";

export const getToday = query({
  handler: async (ctx) => {
    const today = await ctx.db.query("gamesToday").first();
    return today?.data || null;
  },
});
