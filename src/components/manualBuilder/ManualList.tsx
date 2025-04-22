import { useEffect, useState } from "react";

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

  useEffect(() => {
    fetch("http://localhost:5555/api/v1/manuals")
      .then((res) => res.json())
      .then(setManuals)
      .catch((err) => console.error("Error cargando manuales:", err));
  }, []);

  return (
    <div style={{ padding: "1rem" }}>
      <h2>📚 Manuales disponibles</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {manuals.map((manual) => (
          <li key={manual.id} style={{ marginBottom: "0.5rem" }}>
            <button onClick={() => onSelect(manual.id)}>
              {manual.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
