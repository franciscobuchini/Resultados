import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({

  gamesToday: defineTable({
    data: v.any(),
    updatedAt: v.number(),
  }),

  matchesHistory: defineTable({
    id: v.string(),          // ID único: DATE+HOME+AWAY
    api_id: v.string(),      // ID original que trae la API
    league_id: v.string(),   // ID de la liga
    date: v.string(),        // Fecha y hora del partido (ISO o YYYY-MM-DD HH:mm)
    home_id: v.string(),     // ID del equipo local
    away_id: v.string(),     // ID del equipo visitante
    home_score: v.any(),     // Goles del equipo local
    away_score: v.any(),     // Goles del equipo visitante
    goals: v.string(),       // Lista de goles detallada, ej: "12' Messi, 45' Ronaldo"
    stadium: v.any(),        // Estadio del partido
    referee: v.any(),        // Árbitro del partido
    savedAt: v.number(),     // Timestamp de guardado (Date.now())
  }),

  teams: defineTable({       // tabla de equipos
    api_id: v.string(),      // ID que trae la API
    id: v.string(),          // tu ID interno tipo AR001
    name: v.string(),        // nombre del equipo
    short_name: v.string(),  // nombre corto del equipo
    country_id: v.string(),  // país del equipo
    crest_url: v.string(),   // escudo
    founded: v.number(),     // año de fundación
    website: v.string(),     // sitio web del equipo
    stadium: v.any(),        // estadio del equipo

  }),

  leagues: defineTable({
    id: v.string(),          // tu ID interno de la liga (ej: AR01D)
    api_id: v.string(),      // ID que trae la API (ej: hc, ebj, etc.)
    name: v.string(),        // Nombre de la liga
    season: v.string(),      // Temporada de la liga
    country_id: v.string(),  // País de la liga
    logo_url: v.string(),    // Logo de la liga
    level: v.number(),       // Nivel de la liga (1, 2, 3… opcional)
    extra: v.any(),          // Info extra si querés (colores)
  }),
});