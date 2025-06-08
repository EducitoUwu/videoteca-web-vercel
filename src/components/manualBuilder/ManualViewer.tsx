import { useEffect, useState } from "react";

export default function ManualViewer({ manualId }: { manualId: string }) {
  const [manual, setManual] = useState<any>(null);

  useEffect(() => {
    fetch(`http://localhost:9999/api/v1/manuals/${manualId}`)
      .then((res: Response) => res.json())
      .then(setManual)
      .catch((err) => console.error("Error cargando manual:", err));
  }, [manualId]);

  if (!manual) return <p>Cargando manual...</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h1>{manual.title}</h1>
      {manual.sections.map((section: any) => (
        <div key={section.id}>
          <h2>{section.title}</h2>
          {section.subsections.map((sub: any) => (
            <div key={sub.id} style={{ marginLeft: "1rem" }}>
              <h3>{sub.title}</h3>
              {sub.blocks
                .sort((a: any, b: any) => a.order - b.order)
                .map((block: any) => (
                  <div key={block.id} style={{ marginLeft: "1rem" }}>
                    {block.type === "text" ? (
                      <p>{block.content}</p>
                    ) : (
                      <video controls width="400" src={block.content} />
                    )}
                  </div>
                ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
