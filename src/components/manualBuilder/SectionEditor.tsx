import { useState } from "react";
import SubsectionEditor from "./SubsectionEditor";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { backendAuthFetch } from "@/lib/utils";
import { Plus, FileText, Edit3, Trash2 } from "lucide-react";

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
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleCreateSection = async () => {
    if (!sectionTitle.trim()) return;
    
    setLoading(true);
    try {
      const payload = { title: sectionTitle, manualId }; // Sin campo order
      
      const res = await backendAuthFetch(`${import.meta.env.VITE_API_URL}/manuals/section`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        const errorData = await res.text();
        console.error("Error response:", errorData);
        throw new Error(`HTTP ${res.status}: ${errorData}`);
      }
      
      const data = await res.json();
      const newSection = data.data || data; // Manejar diferentes formatos de respuesta
      setSections([...sections, { ...newSection, subsections: [] }]);
      setSectionTitle("");
    } catch (err) {
      console.error("Error creando sección:", err);
      alert("Error al crear la sección. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta sección? Esta acción no se puede deshacer.")) {
      return;
    }
    
    try {
      await backendAuthFetch(`${import.meta.env.VITE_API_URL}/manuals/section/${sectionId}`, {
        method: "DELETE",
      });
      setSections(sections.filter(s => s.id !== sectionId));
    } catch (err) {
      console.error("Error eliminando sección:", err);
      alert("Error al eliminar la sección.");
    }
  };

  const handleUpdateSectionTitle = async (sectionId: string, newTitle: string) => {
    try {
      await backendAuthFetch(`${import.meta.env.VITE_API_URL}/manuals/section/${sectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
    } catch (err) {
      console.error("Error actualizando sección:", err);
      alert("Error al actualizar el título de la sección.");
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
    <Card className="bg-black/20 backdrop-blur-xl border border-blue-500/30 shadow-xl">
      <CardHeader className="border-b border-blue-500/20 bg-gradient-to-r from-blue-600/10 to-purple-600/10 p-4 sm:p-6">
        <CardTitle className="text-lg sm:text-xl font-bold text-blue-300 flex items-center gap-2 sm:gap-3">
          <FileText className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
          <span className="min-w-0 break-words">Secciones del Manual</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        {/* Formulario para crear nueva sección */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-500/5 rounded-lg border border-blue-500/20">
          <Input
            value={sectionTitle}
            onChange={(e) => setSectionTitle(e.target.value)}
            placeholder="Título de la nueva sección"
            disabled={loading}
            className="flex-1 bg-black/20 border-blue-500/30 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 text-sm sm:text-base"
            onKeyDown={(e) => e.key === 'Enter' && handleCreateSection()}
          />
          <Button 
            onClick={handleCreateSection} 
            disabled={!sectionTitle.trim() || loading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-4 sm:px-6 py-2 sm:py-3 transition-all duration-200 text-sm sm:text-base w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            {loading ? "Creando..." : "Agregar"}
          </Button>
        </div>

        {/* Lista de secciones */}
        <div className="space-y-3 sm:space-y-4">
          {sections.length === 0 ? (
            <div className="text-center py-8 sm:py-12 text-gray-400">
              <FileText className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 opacity-50" />
              <p className="text-base sm:text-lg font-medium">No hay secciones todavía</p>
              <p className="text-xs sm:text-sm">Crea tu primera sección para comenzar</p>
            </div>
          ) : (
            sections.map((section, index) => (
              <Card key={section.id} className="bg-gradient-to-br from-slate-800/50 to-blue-900/30 backdrop-blur-xl border border-blue-500/20 shadow-lg hover:shadow-blue-500/10 transition-all duration-200">
                <CardHeader className="border-b border-blue-500/20 p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 bg-blue-500/20 rounded-full flex-shrink-0">
                      <span className="text-blue-300 font-bold text-xs sm:text-sm">{index + 1}</span>
                    </div>
                    
                    <Input
                      value={section.title || ""}
                      onChange={e => {
                        const newTitle = e.target.value;
                        setSections(sections.map(s =>
                          s.id === section.id ? { ...s, title: newTitle } : s
                        ));
                      }}
                      onBlur={async e => {
                        if (section.id && e.target.value.trim()) {
                          await handleUpdateSectionTitle(section.id, e.target.value);
                        }
                      }}
                      className="flex-1 bg-transparent border-none text-base sm:text-lg font-bold text-blue-200 focus:ring-0 focus:border-none p-0 min-w-0"
                      placeholder="Título de la sección"
                    />
                    
                    <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingId(editingId === section.id ? null : section.id)}
                        className="text-blue-300 hover:text-blue-200 hover:bg-blue-500/10 p-1 sm:p-2"
                      >
                        <Edit3 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSection(section.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1 sm:p-2"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  <SubsectionEditor
                    sectionId={section.id}
                    subsections={section.subsections || []}
                    setSubsections={(newSubsections: Subsection[]) =>
                      handleUpdateSubsections(section.id, newSubsections)
                    }
                  />
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
