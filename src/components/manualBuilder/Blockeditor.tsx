import { useState } from "react";

export default function BlockEditor({ subsectionId }: { subsectionId: string }) {
  const [type, setType] = useState<"text" | "video">("text");
  const [content, setContent] = useState("");
  const [order, setOrder] = useState(1);

  const handleCreateBlock = async () => {
    try {
      const res = await fetch("http://localhost:9999/api/v1/manuals/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, content, order, subsectionId }),
      });
      const data = await res.json();
      console.log("Bloque creado:", data);
      setOrder(order + 1);
      setContent("");
    } catch (err) {
      console.error("Error creando bloque:", err);
    }
  };

  return (
    <div>
      <h5>Agregar bloque</h5>
      <select value={type} onChange={(e) => setType(e.target.value as "text" | "video")}>
        <option value="text">Texto</option>
        <option value="video">Video</option>
      </select>
      <textarea
        placeholder="Contenido"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <button onClick={handleCreateBlock}>Agregar bloque</button>
    </div>
  );
}
