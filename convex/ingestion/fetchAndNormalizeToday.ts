import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { fetchMatches } from "../ingestion/fetchMatches";
import { normalizeApi } from "../normalize/normalizeApi";

export const fetchAndNormalizeToday = action({
  args: {},
  handler: async (ctx) => {

    const data = await fetchMatches();
    const normalized = await normalizeApi(ctx, data);  // async + ctx
    await ctx.runMutation(api.storage.saveTodayMatches.saveTodayMatches, { data: normalized });
    return normalized;

  },
});