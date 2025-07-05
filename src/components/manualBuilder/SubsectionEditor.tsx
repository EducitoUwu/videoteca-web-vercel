import { useState } from "react";
import BlockEditor from "./Blockeditor";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { backendAuthFetch } from "@/lib/utils";
import { Plus, Type, Video, Trash2, FileText } from "lucide-react";

interface Block {
  id?: string;
  type: string;
  content?: string;
  videoId?: string;
}
interface Subsection { id: string; title: string; blocks: Block[] }

interface SubsectionEditorProps {
  sectionId: string;
  subsections: Subsection[];
  setSubsections: (newSubsections: Subsection[]) => void;
}

export default function SubsectionEditor({
  sectionId,
  subsections,
  setSubsections
}: SubsectionEditorProps) {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [showBlockEditor, setShowBlockEditor] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) return;
    
    setLoading(true);
    try {
      const payload = { title, sectionId }; // Sin campo order
      
      const res = await backendAuthFetch("http://localhost:9999/api/v1/manuals/subsection", {
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
      const newSubsection = data.data || data; // Manejar diferentes formatos de respuesta
      setSubsections([...subsections, { ...newSubsection, blocks: [] }]);
      setTitle("");
    } catch (err) {
      console.error("Error creando subsección:", err);
      alert("Error al crear la subsección. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubsection = async (subsectionId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta subsección? Esta acción no se puede deshacer.")) {
      return;
    }
    
    try {
      await backendAuthFetch(`http://localhost:9999/api/v1/manuals/subsection/${subsectionId}`, {
        method: "DELETE",
      });
      setSubsections(subsections.filter(s => s.id !== subsectionId));
    } catch (err) {
      console.error("Error eliminando subsección:", err);
      alert("Error al eliminar la subsección.");
    }
  };

  const handleDeleteBlock = async (blockId: string, subsectionId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este bloque?")) {
      return;
    }
    
    try {
      await backendAuthFetch(`http://localhost:9999/api/v1/manuals/block/${blockId}`, {
        method: "DELETE",
      });
      
      // Actualizar la lista de bloques en la subsección
      setSubsections(subsections.map(sub =>
        sub.id === subsectionId
          ? { ...sub, blocks: sub.blocks.filter(b => b.id !== blockId) }
          : sub
      ));
    } catch (err) {
      console.error("Error eliminando bloque:", err);
      alert("Error al eliminar el bloque.");
    }
  };

  const handleAddBlock = (subId: string) => {
    setEditingSubId(subId);
    setShowBlockEditor(true);
  };

  const handleSaveBlock = async (block: Block) => {
    if (!editingSubId) return;

    const payload = {
      type: block.type,
      content: block.type === "text" ? block.content : block.videoId,
      subsectionId: editingSubId,
      // order es opcional - el backend lo calcula automáticamente
    };

    try {
      const res = await backendAuthFetch("http://localhost:9999/api/v1/manuals/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      const newBlock = data.data || data; // Manejar diferentes formatos de respuesta
      setSubsections(subsections.map(sub =>
        sub.id === editingSubId
          ? { ...sub, blocks: [...(sub.blocks || []), newBlock] }
          : sub
      ));
    } catch (err) {
      console.error("Error guardando bloque:", err);
      alert("Error al guardar el bloque. Intenta de nuevo.");
    }
    setShowBlockEditor(false);
    setEditingSubId(null);
  };

  const handleCancelBlock = () => {
    setShowBlockEditor(false);
    setEditingSubId(null);
  };

  const handleUpdateBlockContent = async (blockId: string, newContent: string) => {
    try {
      const res = await backendAuthFetch(`http://localhost:9999/api/v1/manuals/block/${blockId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent }),
      });
      
      if (!res.ok) {
        const errorData = await res.text();
        console.error("Error response:", errorData);
        throw new Error(`HTTP ${res.status}: ${errorData}`);
      }
    } catch (err) {
      console.error("Error actualizando bloque:", err);
      alert("Error al actualizar el bloque.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Formulario para crear nueva subsección */}
      <div className="flex gap-3 p-4 bg-slate-800/30 rounded-lg border border-slate-600/30">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título de la nueva subsección"
          disabled={loading}
          className="flex-1 bg-black/20 border-slate-600/30 text-white placeholder:text-gray-400 focus:border-purple-400 focus:ring-purple-400/20"
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
        />
        <Button 
          onClick={handleCreate} 
          disabled={!title.trim() || loading}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-6 transition-all duration-300"
        >
          <Plus className="h-4 w-4 mr-2" />
          {loading ? "Creando..." : "Agregar"}
        </Button>
      </div>

      {/* Lista de subsecciones */}
      <div className="space-y-3">
        {subsections.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No hay subsecciones todavía</p>
            <p className="text-sm">Agrega subsecciones para organizar el contenido</p>
          </div>
        ) : (
          subsections.map((subsection, subIndex) => (
            <Card key={subsection.id} className="bg-gradient-to-br from-slate-800/40 to-purple-900/20 backdrop-blur-xl border border-purple-500/20 shadow-lg">
              <CardHeader className="border-b border-purple-500/20 pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6 bg-purple-500/20 rounded-full">
                    <span className="text-purple-300 font-bold text-xs">{subIndex + 1}</span>
                  </div>                          <Input
                            value={subsection.title || ""}
                            readOnly
                            className="flex-1 bg-transparent border-none text-purple-200 font-semibold focus:ring-0 focus:border-none p-0"
                          />
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSubsection(subsection.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="p-4">
                {/* Lista de bloques */}
                <div className="space-y-3 mb-4">
                  {(subsection.blocks || []).map((block, idx) => (
                    <div key={block.id || idx} className="group p-3 bg-black/20 rounded-lg border border-slate-600/30 hover:border-purple-400/30 transition-all duration-300">
                      <div className="flex items-start gap-3">
                        {/* Icono del tipo de bloque */}
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-500/20 flex-shrink-0 mt-1">
                          {block.type === "text" ? (
                            <Type className="h-4 w-4 text-purple-300" />
                          ) : (
                            <Video className="h-4 w-4 text-purple-300" />
                          )}
                        </div>

                        {/* Contenido del bloque */}
                        <div className="flex-1 min-w-0">
                          {block.type === "text" ? (
                            <textarea
                              value={block.content || ""}
                              onChange={e => {
                                const newBlocks = subsection.blocks.map((b, bidx) =>
                                  bidx === idx ? { ...b, content: e.target.value } : b
                                );
                                setSubsections(subsections.map(s =>
                                  s.id === subsection.id ? { ...s, blocks: newBlocks } : s
                                ));
                              }}
                              onBlur={async (e) => {
                                if (block.id && e.target.value.trim()) {
                                  await handleUpdateBlockContent(block.id, e.target.value);
                                }
                              }}
                              className="w-full bg-transparent border-none text-white placeholder:text-gray-400 resize-none focus:ring-0 focus:outline-none"
                              placeholder="Escribe el contenido del bloque..."
                              rows={Math.max(2, Math.ceil((block.content?.length || 0) / 80))}
                            />
                          ) : (
                            <div className="text-purple-300">
                              {block.content ? (
                                <div className="flex items-center gap-2">
                                  <Video className="h-4 w-4" />
                                  <span>Video: {block.content}</span>
                                </div>
                              ) : (
                                <span className="text-red-400">Video no definido</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Botones de acción */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteBlock(block.id!, subsection.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Botón para agregar bloque */}
                <Button 
                  onClick={() => handleAddBlock(subsection.id)}
                  variant="outline"
                  className="w-full border-purple-500/30 text-purple-300 hover:bg-purple-500/10 hover:text-purple-200 transition-all duration-300"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar bloque
                </Button>

                {/* Editor de bloques */}
                {showBlockEditor && editingSubId === subsection.id && (
                  <div className="mt-4 p-4 bg-black/30 rounded-lg border border-purple-500/30">
                    <BlockEditor
                      onSave={handleSaveBlock}
                      onCancel={handleCancelBlock}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
