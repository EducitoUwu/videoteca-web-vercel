import { useState } from "react";
import SubsectionEditor from "./SubsectionEditor";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SectionEditor({ manualId }: { manualId: string }) {
  const [sectionTitle, setSectionTitle] = useState("");
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleCreateSection = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (index: number, newTitle: string) => {
    const updated = [...sections];
    updated[index].title = newTitle;
    setSections(updated);
  };

  return (
    <Card className="mt-8 bg-blue-50 border-blue-200">
      <CardHeader>
        <CardTitle className="text-blue-700 text-lg">Secciones</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input
            value={sectionTitle}
            onChange={(e) => setSectionTitle(e.target.value)}
            placeholder="Título de sección"
            disabled={loading}
          />
          <Button onClick={handleCreateSection} disabled={!sectionTitle || loading}>
            Agregar sección
          </Button>
        </div>
        <div className="space-y-6">
          {sections.map((section, i) => (
            <Card key={section.id} className="bg-white border-blue-100">
              <CardHeader>
                <Input
                  value={section.title}
                  onChange={(e) => handleEdit(i, e.target.value)}
                  className="font-bold text-blue-800"
                />
              </CardHeader>
              <CardContent>
                <SubsectionEditor sectionId={section.id} />
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}