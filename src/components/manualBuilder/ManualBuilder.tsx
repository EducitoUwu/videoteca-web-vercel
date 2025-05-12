import { useState } from "react";
import SectionEditor from "./SectionEditor";
import ManualList from "./ManualList";
import ManualViewer from "./ManualViewer";

export default function ManualBuilder() {
  const [manualTitle, setManualTitle] = useState("");
  const [manualId, setManualId] = useState<string | null>(null);
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
    return <ManualViewer manualId={manualId} />;
  }

  return (
    <div style={{ padding: "1rem" }}>
      {!manualId ? (
        <>
          <h2>Crear nuevo manual</h2>
          <input
            type="text"
            value={manualTitle}
            placeholder="Título del manual"
            onChange={(e) => setManualTitle(e.target.value)}
            style={{ padding: "0.5rem" }}
          />
          <button onClick={handleCreateManual}>Crear Manual</button>
        </>
      ) : (
        <>
          <h2>🛠️ Constructor de Manual</h2>
          <SectionEditor manualId={manualId} />
          <button style={{ marginTop: "1rem" }} onClick={() => setMode("viewer")}>
            👁️ Ver este manual
          </button>
        </>
      )}

      <button style={{ marginTop: "2rem" }} onClick={() => setMode("list")}>
        📚 Ver todos los manuales creados
      </button>
    </div>
  );
}
