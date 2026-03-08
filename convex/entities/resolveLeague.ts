import { query } from "../_generated/server";
import { v } from "convex/values";

// Helper function for internal use
export async function resolveLeagueHelper(ctx: any, args: { apiId: string }) {
  const league = await ctx.db.query("leagues")
    .filter((q: any) => q.eq("api_id", args.apiId))
    .first();
  return league?.id ?? args.apiId;
}

// Devuelve tu ID interno de liga según el api_id
export const resolveLeague = query({
  args: { apiId: v.string() },
  handler: resolveLeagueHelper,
});