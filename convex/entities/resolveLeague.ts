import { overrides } from "../mappings/overrides";

export function resolveLeague(id: string) {

  const mapped = overrides.leagues[id];

  if (!mapped) {
    console.log("UNKNOWN league", id);
    return id;
  }

  return mapped;

}