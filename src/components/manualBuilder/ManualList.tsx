import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Manual {
  id: string;
  title: string;
}

export default function ManualList({
  onSelect,
}: {
  onSelect: (manualId: string) => void;
}) {
  const [manuals, setManuals] = useState<Manual[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("http://localhost:9999/api/v1/manuals")
      .then((res) => res.json())
      .then((data) => setManuals(data))
      .catch((err) => {
        setManuals([]);
        console.error("Error cargando manuales:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-blue-700">Cargando manuales...</p>;
  if (!manuals.length) return <p className="text-blue-700">No hay manuales disponibles.</p>;

  return (
    <div className="space-y-4">
      {manuals.map((manual) => (
        <Card
          key={manual.id}
          className="cursor-pointer hover:shadow-lg transition-shadow border-blue-200"
          onClick={() => onSelect(manual.id)}
        >
          <CardHeader>
            <CardTitle className="text-blue-800">{manual.title}</CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}