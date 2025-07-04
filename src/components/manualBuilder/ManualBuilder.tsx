import { useState } from "react";
import SectionEditor from "./SectionEditor";
import ManualViewer from "./ManualViewer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { backendAuthFetch } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

export default function ManualBuilder() {
  const [manualTitle, setManualTitle] = useState("");
  const [manualId, setManualId] = useState<string | null>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [mode, setMode] = useState<"builder" | "viewer">("builder");
  const navigate = useNavigate();

  const handleCreateManual = async () => {
  try {
    const res = await backendAuthFetch("http://localhost:9999/api/v1/manuals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title: manualTitle }),
    });
    const data = await res.json();
    //  El id viene en data.data.id (tu backend devuelve { data: { id, ... } })
    const manualId = data.data?.id;
    if (!manualId) {
      alert("Error: El backend no devolvió el id del manual. Revisa la respuesta:\n" + JSON.stringify(data));
      return;
    }
    setManualId(manualId);
    setSections([]);
    setMode("builder");
    setManualTitle("");
    // Fetch estructura real del manual recién creado
    const getRes = await backendAuthFetch(`http://localhost:9999/api/v1/manuals/${manualId}`);
    const getData = await getRes.json();
    setSections(getData.data?.sections || []);
  } catch (err) {
    console.error("Error creando manual:", err);
  }
};


  // Cambiar a viewer después de construir
  const handleViewManual = () => {
    setMode("viewer");
  };

  // Volver al listado después de guardar/salir
  const handleBackToList = () => {
    navigate("/manuals");
  };

  if (mode === "viewer" && manualId) {
    return (
      <ManualViewer
        manualId={manualId}
        onEdit={() => setMode("builder")}
      />
    );
  }

  return (
    <Card className="p-6 bg-white/90 border-blue-200 shadow-lg">
      <CardHeader>
        <CardTitle className="text-blue-800 text-xl font-bold">
          {manualId ? "🛠️ Constructor de Manual" : "Crear nuevo manual"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!manualId ? (
          <div className="flex flex-col gap-4">
            <Input
              type="text"
              value={manualTitle}
              placeholder="Título del manual"
              onChange={(e) => setManualTitle(e.target.value)}
            />
            <Button onClick={handleCreateManual} disabled={!manualTitle}>
              Crear Manual
            </Button>
          </div>
        ) : (
          <>
            <SectionEditor
              manualId={manualId}
              sections={sections}
              setSections={setSections}
            />
            <Button
              variant="default"
              className="mb-4"
              onClick={handleBackToList}
            >
              Guardar manual y salir
            </Button>
            <Button
              className="mt-4"
              variant="outline"
              onClick={handleViewManual}
            >
              👁️ Ver este manual
            </Button>
          </>
        )}
        <Button
          className="mt-6"
          variant="ghost"
          onClick={handleBackToList}
        >
          📚 Ver todos los manuales creados
        </Button>
      </CardContent>
    </Card>
  );
}
