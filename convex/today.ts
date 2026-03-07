import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const fetchToday = action({
  args: {},
  handler: async () => {

    const res = await fetch(
      "https://api.promiedos.com.ar/games/today?nocache=" + Date.now(),
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "application/json",
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
          "Referer": "https://www.promiedos.com.ar/",
          "Origin": "https://www.promiedos.com.ar",
          "x-ver": "1.11.7.5"
        }
      }
    );

    const data = await res.json();

    if (!data?.leagues) {
      throw new Error("Promiedos API returned empty data");
    }

    return data;
  },
});

export const saveToday = mutation({
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

export const getToday = query({
  args: {},
  handler: async (ctx) => {

    const row = await ctx.db.query("gamesToday").first();

    return row?.data ?? {};
  },
});