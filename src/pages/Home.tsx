import { useEffect } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function Home() {

  const data = useQuery(api.today.getToday);
  const fetchAndNormalizeToday = useAction(api.ingestion.fetchAndNormalizeToday.fetchAndNormalizeToday);

  useEffect(() => {
    const load = async () => {
      await fetchAndNormalizeToday();  // hace todo: fetch -> normalize -> save
    };
    load();
  }, []);

  if (!data) return <div>Cargando...</div>;

  return (
    <div className="min-h-screen p-8 bg-gray-500">
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}