import { useState } from "react";
import SubsectionEditor from "./SubsectionEditor";

export default function SectionEditor({ manualId }: { manualId: string }) {
  const [sectionTitle, setSectionTitle] = useState("");
  const [sections, setSections] = useState<any[]>([]);

  const handleCreateSection = async () => {
    try {
      const res = await fetch("http://localhost:9999/api/v1/manuals/section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: sectionTitle, manualId }),
      });
      const data = await res.json();
      setSections([...sections, data]);
      setSectionTitle("");
    } catch (err) {
      console.error("Error creando sección:", err);
    }
  };

  const handleEdit = (index: number, newTitle: string) => {
    const updated = [...sections];
    updated[index].title = newTitle;
    setSections(updated);
  };

  return (
    <div style={{ marginTop: "2rem" }}>
      <h3>Secciones</h3>
      <input
        value={sectionTitle}
        onChange={(e) => setSectionTitle(e.target.value)}
        placeholder="Título de sección"
      />
      <button onClick={handleCreateSection}>Agregar sección</button>

      <ul>
        {sections.map((section, i) => (
          <li key={section.id}>
            <input
              value={section.title}
              onChange={(e) => handleEdit(i, e.target.value)}
            />
            <SubsectionEditor sectionId={section.id} />
          </li>
        ))}
      </ul>
    </div>
  );
}
