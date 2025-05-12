import { useState } from "react";
import BlockEditor from "./Blockeditor";

export default function SubsectionEditor({ sectionId }: { sectionId: string }) {
  const [title, setTitle] = useState("");
  const [subsections, setSubsections] = useState<any[]>([]);

  const handleCreate = async () => {
    try {
      const res = await fetch("http://localhost:5555/api/v1/manuals/subsection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, sectionId }),
      });
      const data = await res.json();
      setSubsections([...subsections, data]);
      setTitle("");
    } catch (err) {
      console.error("Error creando subsección:", err);
    }
  };

  const handleEdit = (index: number, newTitle: string) => {
    const updated = [...subsections];
    updated[index].title = newTitle;
    setSubsections(updated);
  };

  return (
    <div style={{ marginLeft: "1rem" }}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Título subsección"
      />
      <button onClick={handleCreate}>Agregar subsección</button>

      {subsections.map((subsection, i) => (
        <div key={subsection.id} style={{ marginTop: "1rem" }}>
          <input
            value={subsection.title}
            onChange={(e) => handleEdit(i, e.target.value)}
          />
          <BlockEditor subsectionId={subsection.id} />
        </div>
      ))}
    </div>
  );
}
