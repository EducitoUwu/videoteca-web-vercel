import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { backendAuthFetch } from "@/lib/utils";

interface Manual {
  id: string;
  title: string;
}

// Permite onSelect opcional, para máxima compatibilidad
interface ManualListProps {
  onSelect?: (id: string) => void;
}

export default function ManualList({ onSelect }: ManualListProps) {
  const [manuals, setManuals] = useState<Manual[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    backendAuthFetch("http://localhost:9999/api/v1/manuals")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setManuals(data);
        else setManuals(data.data); // por si backend responde {data: [...]}
      })
      .catch((err) => {
        console.error("Error cargando manuales:", err);
        setManuals([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleManualClick = (manualId: string) => {
    if (onSelect) {
      onSelect(manualId);
    } else {
      navigate(`/manuals/${manualId}`);
    }
  };

  if (loading)
    return <p className="text-blue-700 text-center mt-4">Cargando manuales...</p>;

  return (
    <div className="space-y-4">
      {manuals.length > 0 ? (
        manuals.map((manual) => (
          <Card
            key={manual.id}
            className="cursor-pointer hover:shadow-lg transition-shadow border-blue-200"
            onClick={() => handleManualClick(manual.id)}
          >
            <CardHeader>
              <CardTitle className="text-blue-800">{manual.title}</CardTitle>
            </CardHeader>
          </Card>
        ))
      ) : (
        <p className="text-blue-700 text-center mt-4">
          No hay manuales disponibles.
        </p>
      )}

      <div className="flex justify-center mt-6">
        <Button onClick={() => navigate("/upload-manual")} className="bg-blue-600 hover:bg-blue-700">
          + Subir Nuevo Manual
        </Button>
      </div>
    </div>
  );
}
