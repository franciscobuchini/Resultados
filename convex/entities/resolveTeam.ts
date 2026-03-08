import { overrides } from "../mappings/overrides";

export function resolveTeam(id: string) {

  const mapped = overrides.teams[id];

  if (!mapped) {
    console.log("UNKNOWN team", id);
    return id;
  }

  return mapped;

}