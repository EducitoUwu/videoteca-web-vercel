import { useState } from "react";
import SectionEditor from "./SectionEditor";
import ManualList from "./ManualList";
import ManualViewer from "./ManualViewer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ManualBuilder() {
  const [manualTitle, setManualTitle] = useState("");
  const [manualId, setManualId] = useState<string | null>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [mode, setMode] = useState<"builder" | "viewer" | "list">("builder");

  const handleCreateManual = async () => {
    try {
      const res = await fetch("http://localhost:9999/api/v1/manuals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: manualTitle }),
      });
      const data = await res.json();
      setManualId(data.id);
    } catch (err) {
      console.error("Error creando manual:", err);
    }
  };

  const handleSelectManual = (id: string) => {
    setManualId(id);
    setMode("viewer");
  };

  if (mode === "list") {
    return <ManualList onSelect={handleSelectManual} />;
  }

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
              className="mt-4"
              variant="outline"
              onClick={() => setMode("viewer")}
            >
              👁️ Ver este manual
            </Button>
          </>
        )}
        <Button
          className="mt-6"
          variant="ghost"
          onClick={() => setMode("list")}
        >
          📚 Ver todos los manuales creados
        </Button>
      </CardContent>
    </Card>
  );
}
