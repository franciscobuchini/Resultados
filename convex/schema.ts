import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({

  gamesToday: defineTable({
    data: v.any(),
    updatedAt: v.number(),
  }),

  matchesHistory: defineTable({
    id: v.string(),            // ID único: DATE+HOME+AWAY
    api_id: v.string(),        // ID original de la API
    league_id: v.string(),     // ID de la liga
    date: v.string(),          // Fecha del partido
    home_id: v.string(),       // Equipo local
    away_id: v.string(),       // Equipo visitante
    home_score: v.optional(v.number()),
    away_score: v.optional(v.number()),
    stadium: v.optional(v.string()),
    referee: v.optional(v.string()),
    goals: v.optional(v.string()),
    savedAt: v.number(),
  })
    .index("by_id", ["id"])
    .index("by_api_id", ["api_id"])
    .index("by_league", ["league_id"])
    .index("by_home", ["home_id"])
    .index("by_away", ["away_id"])
    .index("by_date", ["date"]),

  teams: defineTable({
    api_id: v.string(),
    id: v.string(),
    name: v.string(),
    short_name: v.string(),
    country_id: v.string(),
    city: v.string(),
    crest_url: v.optional(v.string()),
    founded: v.optional(v.number()),
    stadium_id: v.optional(v.string()),
    colors: v.optional(v.array(v.string())),
  })
    .index("by_api_id", ["api_id"])
    .index("by_id", ["id"])
    .index("by_country", ["country_id"]),

  leagues: defineTable({
    id: v.string(),
    api_id: v.string(),
    name: v.string(),
    country_id: v.string(),
    logo_url: v.optional(v.string()),
    level: v.optional(v.number()),
    extra: v.optional(v.any()),
  })
    .index("by_api_id", ["api_id"])
    .index("by_id", ["id"])
    .index("by_country", ["country_id"]),

  stadiums: defineTable({
    id: v.string(),
    name: v.string(),
    city: v.string(),
    capacity: v.optional(v.number()),
    country_id: v.string(),
  })
    .index("by_id", ["id"])
    .index("by_country", ["country_id"]),
});