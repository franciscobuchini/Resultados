import { overrides } from "../mappings/overrides";

export function resolveCountry(id: string) {

  const mapped = overrides.countries[id];

  if (!mapped) {
    console.log("UNKNOWN country", id);
    return id;
  }

  return mapped;

}