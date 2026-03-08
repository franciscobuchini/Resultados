/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as entities_resolveCountry from "../entities/resolveCountry.js";
import type * as entities_resolveLeague from "../entities/resolveLeague.js";
import type * as entities_resolveTeam from "../entities/resolveTeam.js";
import type * as ingestion_fetchMatches from "../ingestion/fetchMatches.js";
import type * as mappings_overrides from "../mappings/overrides.js";
import type * as normalize_normalizeApi from "../normalize/normalizeApi.js";
import type * as storage_saveHistoricalMatch from "../storage/saveHistoricalMatch.js";
import type * as storage_saveTodayMatches from "../storage/saveTodayMatches.js";
import type * as today from "../today.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "entities/resolveCountry": typeof entities_resolveCountry;
  "entities/resolveLeague": typeof entities_resolveLeague;
  "entities/resolveTeam": typeof entities_resolveTeam;
  "ingestion/fetchMatches": typeof ingestion_fetchMatches;
  "mappings/overrides": typeof mappings_overrides;
  "normalize/normalizeApi": typeof normalize_normalizeApi;
  "storage/saveHistoricalMatch": typeof storage_saveHistoricalMatch;
  "storage/saveTodayMatches": typeof storage_saveTodayMatches;
  today: typeof today;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
