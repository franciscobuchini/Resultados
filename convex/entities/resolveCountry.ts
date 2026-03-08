import { query } from "../_generated/server";
import { v } from "convex/values";

// Helper function for internal use
export async function resolveCountryHelper(ctx: any, args: { apiCountryId: string }) {
  // Primero busca en equipos
  const team = await ctx.db.query("teams")
    .filter((q: any) => q.eq("api_id", args.apiCountryId))
    .first();
  if (team?.country_id) return team.country_id;

  // Si no está, busca en ligas
  const league = await ctx.db.query("leagues")
    .filter((q: any) => q.eq("api_id", args.apiCountryId))
    .first();
  if (league?.country_id) return league.country_id;

  // Sino devuelve el mismo ID de la API
  return args.apiCountryId;
}

// Devuelve ID del país según tu tabla de equipos o ligas
export const resolveCountry = query({
  args: { apiCountryId: v.string() },
  handler: resolveCountryHelper,
});