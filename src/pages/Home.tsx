import { useEffect } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function Home() {

  const data = useQuery(api.today.getToday);

  const fetchToday = useAction(api.today.fetchToday);
  const saveToday = useMutation(api.today.saveToday);

  useEffect(() => {
    const load = async () => {
      const result = await fetchToday();
      await saveToday({ data: result });
    };

    load();
  }, []);

  if (!data) return <div>Cargando...</div>;

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}