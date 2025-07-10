import { useState, useEffect, useCallback } from "react";
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
  tempId?: string;
}
interface Subsection { id: string; title: string; blocks: Block[]; tempId?: string; }

interface SubsectionEditorProps {
  sectionId: string;
  subsections: Subsection[];
  setSubsections: (newSubsections: Subsection[]) => void;
}

// Helper function para delay entre peticiones
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Hook para localStorage
const useLocalStorageDraft = (key: string, initialValue: any) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: any) => {
    try {
      setStoredValue((prevValue: any) => {
        const valueToStore = value instanceof Function ? value(prevValue) : value;
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        return valueToStore;
      });
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [key]);

  return [storedValue, setValue];
};

// Hook para debounce
const useDebounce = (value: any, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default function SubsectionEditor({
  sectionId,
  subsections,
  setSubsections
}: SubsectionEditorProps) {
  const [title, setTitle] = useState("");
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [showBlockEditor, setShowBlockEditor] = useState(false);
  
  // localStorage para drafts de subsecciones
  const [, setSubsectionDrafts] = useLocalStorageDraft(`subsection-drafts-${sectionId}`, {});
  
  // Debounce para auto-guardado
  const debouncedSubsections = useDebounce(subsections, 1000);
  
  // Auto-guardar en localStorage cuando cambien las subsecciones
  useEffect(() => {
    if (debouncedSubsections.length > 0) {
      setSubsectionDrafts(debouncedSubsections);
    }
  }, [debouncedSubsections, setSubsectionDrafts]);

  // Función para generar ID temporal único
  const generateTempId = () => `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const handleCreate = () => {
    if (!title.trim()) return;
    
    const tempId = generateTempId();
    const newSubsection: Subsection = {
      id: tempId,
      tempId: tempId, // Usar el mismo ID para evitar conflictos
      title: title.trim(),
      blocks: []
    };
    
    setSubsections([...subsections, newSubsection]);
    setTitle("");
  };

  const handleDeleteSubsection = (subsectionId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta subsección? Esta acción no se puede deshacer.")) {
      return;
    }
    
    setSubsections(subsections.filter(s => s.id !== subsectionId));
  };

  const handleDeleteBlock = (blockId: string, subsectionId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este bloque?")) {
      return;
    }
    
    setSubsections(subsections.map(sub =>
      sub.id === subsectionId
        ? { ...sub, blocks: sub.blocks.filter(b => (b.id || b.tempId) !== blockId) }
        : sub
    ));
  };

  const handleAddBlock = (subId: string) => {
    setEditingSubId(subId);
    setShowBlockEditor(true);
  };

  const handleSaveBlock = (block: Block) => {
    if (!editingSubId) return;

    // Validar que el contenido no esté vacío
    if (!block.content || block.content.trim() === "") {
      if (block.type === "video") {
        alert("Error: No se pudo obtener la URL del video seleccionado. Intenta seleccionar el video nuevamente.");
      } else {
        alert("El contenido del bloque no puede estar vacío");
      }
      return;
    }

    const tempId = generateTempId();
    const newBlock: Block = {
      ...block,
      id: tempId,
      tempId: tempId, // Usar exactamente el mismo ID
      content: block.content.trim()
    };

    setSubsections(subsections.map(sub =>
      sub.id === editingSubId
        ? { ...sub, blocks: [...(sub.blocks || []), newBlock] }
        : sub
    ));

    setShowBlockEditor(false);
    setEditingSubId(null);
  };

  const handleCancelBlock = () => {
    setShowBlockEditor(false);
    setEditingSubId(null);
  };

  const handleUpdateBlockContent = (blockId: string, newContent: string, subsectionId: string) => {
    setSubsections(subsections.map(sub =>
      sub.id === subsectionId
        ? {
            ...sub,
            blocks: sub.blocks.map(block =>
              (block.id || block.tempId) === blockId
                ? { ...block, content: newContent }
                : block
            )
          }
        : sub
    ));
  };

  // Función para guardar al backend - será llamada desde ManualBuilder
  const saveToBackend = async () => {
    const results = [];
    
    for (const subsection of subsections) {
      try {
        // Solo crear subsecciones que tienen tempId (son nuevas)
        if (subsection.tempId && !subsection.id.includes('temp_')) {
          // Esta es una subsección que ya existe pero se modificó
          continue;
        }
        
        if (subsection.tempId) {
          const payload = { title: subsection.title, sectionId };
          
          const res = await backendAuthFetch(`${import.meta.env.VITE_API_URL}/manuals/subsection`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          
          if (!res.ok) {
            throw new Error(`Error creating subsection: ${res.statusText}`);
          }
          
          const data = await res.json();
          const createdSubsection = data.data || data;
          
          // Delay después de crear subsección
          await delay(400);
          
          // Guardar bloques para esta subsección
          for (let i = 0; i < subsection.blocks.length; i++) {
            const block = subsection.blocks[i];
            
            if (block.tempId) { // Solo crear bloques nuevos
              const blockPayload = {
                type: block.type,
                content: block.content,
                subsectionId: createdSubsection.id,
                order: i
              };
              
              const blockRes = await backendAuthFetch(`${import.meta.env.VITE_API_URL}/manuals/block`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(blockPayload),
              });
              
              if (!blockRes.ok) {
                throw new Error(`Error creating block: ${blockRes.statusText}`);
              }
              
              // Delay entre creación de bloques
              await delay(200);
            }
          }
          
          results.push(createdSubsection);
        }
      } catch (error) {
        console.error('Error saving subsection:', error);
        throw error;
      }
    }
    
    return results;
  };

  // Exponer la función saveToBackend para que ManualBuilder pueda llamarla
  useEffect(() => {
    (window as any)[`saveSubsections_${sectionId}`] = saveToBackend;
    return () => {
      delete (window as any)[`saveSubsections_${sectionId}`];
    };
  }, [saveToBackend, sectionId]);

  return (
    <div className="space-y-4">
      {/* Formulario para crear nueva subsección */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800/50">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título de la nueva subsección"
          className="flex-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-purple-500 focus:ring-purple-500/20"
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
        />
        <Button 
          onClick={handleCreate} 
          disabled={!title.trim()}
          className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white font-semibold px-6 py-2 transition-colors duration-200 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar
        </Button>
      </div>

      {/* Lista de subsecciones */}
      <div className="space-y-3">
        {subsections.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No hay subsecciones todavía</p>
            <p className="text-sm">Agrega subsecciones para organizar el contenido</p>
          </div>
        ) : (
          subsections.map((subsection, subIndex) => (
            <Card key={subsection.id || subsection.tempId} className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg">
              <CardHeader className="border-b border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex-shrink-0">
                    <span className="text-purple-600 dark:text-purple-400 font-semibold text-xs">{subIndex + 1}</span>
                  </div>
                  <Input
                    value={subsection.title || ""}
                    readOnly
                    className="flex-1 bg-transparent border-none text-purple-700 dark:text-purple-300 font-semibold focus:ring-0 focus:border-none p-0 min-w-0"
                  />
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSubsection(subsection.id)}
                    className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {/* Lista de bloques */}
                <div className="space-y-3 mb-4">
                  {(subsection.blocks || []).map((block, idx) => (
                    <div key={block.id || block.tempId || idx} className="group p-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 transition-colors duration-200">
                      <div className="flex items-start gap-3">
                        {/* Icono del tipo de bloque */}
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex-shrink-0 mt-1">
                          {block.type === "text" ? (
                            <Type className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          ) : (
                            <Video className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          )}
                        </div>

                        {/* Contenido del bloque */}
                        <div className="flex-1 min-w-0">
                          {block.type === "text" ? (
                            <textarea
                              value={block.content || ""}
                              onChange={e => handleUpdateBlockContent(block.id || block.tempId!, e.target.value, subsection.id)}
                              className="w-full bg-transparent border-none text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 resize-none focus:ring-0 focus:outline-none text-sm"
                              placeholder="Escribe el contenido del bloque..."
                              rows={Math.max(2, Math.ceil((block.content?.length || 0) / 80))}
                            />
                          ) : (
                            <div className="text-purple-600 dark:text-purple-400 text-sm">
                              {block.content ? (
                                <div className="flex items-center gap-2">
                                  <Video className="h-4 w-4 flex-shrink-0" />
                                  <span className="break-all">Video: {block.content}</span>
                                </div>
                              ) : (
                                <span className="text-red-500 dark:text-red-400">Video no definido</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Botones de acción */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteBlock(block.id || block.tempId!, subsection.id)}
                            className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 w-8 p-0"
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
                  className="w-full border-purple-300 dark:border-purple-600 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-300 transition-colors duration-200 py-3"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  <span className="hidden sm:inline">Agregar bloque</span>
                  <span className="sm:hidden">Agregar</span>
                </Button>

                {/* Editor de bloques */}
                {showBlockEditor && editingSubId === subsection.id && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-purple-200 dark:border-purple-700">
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
