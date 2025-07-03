import { useState } from "react";
import SubsectionEditor from "./SubsectionEditor";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { backendAuthFetch } from "@/lib/utils";

// Define types
interface Subsection { id: string; title: string; blocks: any[] }
interface Section { id: string; title: string; subsections: Subsection[] }

interface SectionEditorProps {
  manualId: string;
  sections: Section[];
  setSections: React.Dispatch<React.SetStateAction<Section[]>>;
}

export default function SectionEditor({ manualId, sections, setSections }: SectionEditorProps) {
  const [sectionTitle, setSectionTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateSection = async () => {
    setLoading(true);
    try {
      const res = await backendAuthFetch("http://localhost:9999/api/v1/manuals/section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: sectionTitle, manualId }),
      });
      const data = await res.json();
      setSections([...sections, { ...data, subsections: [] }]);
      setSectionTitle("");
    } catch (err) {
      console.error("Error creando sección:", err);
    } finally {
      setLoading(false);
    }
  };

  // Función para actualizar subsecciones de una sección específica
  const handleUpdateSubsections = (sectionId: string, newSubsections: Subsection[]) => {
    setSections(sections.map(section =>
      section.id === sectionId
        ? { ...section, subsections: newSubsections }
        : section
    ));
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
          {sections.map((section) => (
            <Card key={section.id} className="bg-white border-blue-100">
              <CardHeader>
                <Input
                  value={section.title}
                  readOnly
                  className="font-bold text-blue-800"
                />
              </CardHeader>
              <CardContent>
                <SubsectionEditor
                  sectionId={section.id}
                  subsections={section.subsections || []}
                  setSubsections={(newSubsections: Subsection[]) =>
                    handleUpdateSubsections(section.id, newSubsections)
                  }
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
