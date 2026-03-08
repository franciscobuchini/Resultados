export async function fetchMatches() {

  const res = await fetch(
    "https://api.promiedos.com.ar/games/today?nocache=" + Date.now(),
    {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Referer": "https://www.promiedos.com.ar/",
        "Origin": "https://www.promiedos.com.ar",
        "x-ver": "1.11.7.5"
      }
    }
  );

  const data = await res.json();

  if (!data?.leagues) {
    throw new Error("Promiedos API returned empty data");
  }

  return data;
}