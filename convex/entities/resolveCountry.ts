import { query } from "../_generated/server";
import { v } from "convex/values";

// Helper function for internal use
export async function resolveCountryHelper(ctx: any, args: { apiCountryId: string }) {
  // 1) Buscar en countries por api_id
  const countryByApi = await ctx.db
    .query("countries")
    .withIndex("by_api_id", (q: any) => q.eq("api_id", args.apiCountryId))
    .first();
  if (countryByApi) return countryByApi.id;

  // 2) Buscar en countries por id
  const countryById = await ctx.db
    .query("countries")
    .filter((q: any) => q.eq("id", args.apiCountryId))
    .first();
  if (countryById) return countryById.id;

  // 3) Buscar en leagues (por api_id)
  const league = await ctx.db
    .query("leagues")
    .withIndex("by_api_id", (q: any) => q.eq("api_id", args.apiCountryId))
    .first();
  if (league?.country_id) return league.country_id;

  // 4) Buscar en teams (por api_id)
  const team = await ctx.db
    .query("teams")
    .withIndex("by_api_id", (q: any) => q.eq("api_id", args.apiCountryId))
    .first();
  if (team?.country_id) return team.country_id;

  // 5) Fallback: devolver el mismo valor recibido como string
  return args.apiCountryId;
}

// Devuelve ID del país según tu tabla de equipos o ligas
export const resolveCountry = query({
  args: { apiCountryId: v.string() },
  handler: resolveCountryHelper,
});