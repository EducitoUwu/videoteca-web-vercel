import { useState, useEffect, useCallback } from "react";
import SubsectionEditor from "./SubsectionEditor";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { backendAuthFetch } from "@/lib/utils";
import { Plus, FileText, Edit3, Trash2 } from "lucide-react";

// Define types
interface Subsection { id: string; title: string; blocks: any[]; tempId?: string; }
interface Section { id: string; title: string; subsections: Subsection[] }

interface SectionEditorProps {
  manualId: string;
  sections: Section[];
  setSections: React.Dispatch<React.SetStateAction<Section[]>>;
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

export default function SectionEditor({ manualId, sections, setSections }: SectionEditorProps) {
  const [sectionTitle, setSectionTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // localStorage para drafts
  const [, setSectionDrafts] = useLocalStorageDraft(`section-drafts-${manualId}`, {});
  
  // Debounce para auto-guardado de drafts
  const debouncedSections = useDebounce(sections, 1000);
  
  // Auto-guardar en localStorage cuando cambian las secciones
  useEffect(() => {
    if (debouncedSections && debouncedSections.length > 0) {
      setSectionDrafts({
        sections: debouncedSections,
        timestamp: Date.now()
      });
    }
  }, [debouncedSections, setSectionDrafts]);

  // Función para crear sección (solo en localStorage)
  const handleCreateSection = useCallback(() => {
    if (!sectionTitle.trim()) return;
    
    const tempId = `temp-${Date.now()}`;
    const newSection: Section = {
      id: tempId,
      title: sectionTitle,
      subsections: []
    };
    
    setSections([...sections, newSection]);
    setSectionTitle("");
  }, [sectionTitle, sections, setSections]);

  // Función para eliminar sección (solo en localStorage)
  const handleDeleteSection = useCallback((sectionId: string) => {
    if (!confirm("Estas seguro de que quieres eliminar esta seccion? Esta accion no se puede deshacer.")) {
      return;
    }
    setSections(sections.filter(s => s.id !== sectionId));
  }, [sections, setSections]);

  // Función para actualizar título de sección (solo en localStorage)
  const handleUpdateSectionTitle = useCallback((sectionId: string, newTitle: string) => {
    setSections(sections.map(section =>
      section.id === sectionId ? { ...section, title: newTitle } : section
    ));
  }, [sections, setSections]);

  // Función para actualizar subsecciones
  const handleUpdateSubsections = useCallback((sectionId: string, newSubsections: Subsection[]) => {
    setSections(sections.map(section =>
      section.id === sectionId
        ? { ...section, subsections: newSubsections }
        : section
    ));
  }, [sections, setSections]);

  // Función para guardar todo al backend (se llamará desde ManualBuilder)
  const saveToBackend = useCallback(async () => {
    try {
      console.log('=== INICIANDO GUARDADO ===');
      console.log('Secciones a guardar:', sections);
      
      // Crear/actualizar secciones y sus subsecciones/bloques
      for (const section of sections) {
        console.log(`Procesando sección: ${section.title} (ID: ${section.id})`);
        console.log(`Subsecciones en esta sección:`, section.subsections);
        
        let realSectionId = section.id;
        
        if (section.id.startsWith('temp-')) {
          // Crear nueva sección
          console.log(`Creando nueva sección: ${section.title}`);
          const res = await backendAuthFetch(`${import.meta.env.VITE_API_URL}/manuals/section`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: section.title, manualId }),
          });
          
          if (!res.ok) {
            const errorText = await res.text();
            console.error(`Error creating section: ${res.status} - ${res.statusText}`, errorText);
            throw new Error(`Error creating section: ${res.statusText}`);
          }
          
          const data = await res.json();
          console.log(`Respuesta completa del backend para sección:`, data);
          
          realSectionId = data.data?.id || data.id || data.sectionId || data.section?.id;
          
          console.log(`Sección creada con ID real: ${realSectionId}`);
          
          if (!realSectionId) {
            console.error('No se pudo obtener el ID de la sección creada. Estructura de respuesta:', data);
            throw new Error('No se pudo obtener el ID de la sección creada');
          }
          
          // Actualizar el ID temporal con el real
          section.id = realSectionId;
          
          // Delay para evitar rate limiting
          await delay(500);
        } else {
          // Actualizar sección existente
          console.log(`Actualizando sección existente: ${section.id}`);
          await backendAuthFetch(`${import.meta.env.VITE_API_URL}/manuals/section/${section.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: section.title }),
          });
          
          // Delay para evitar rate limiting
          await delay(300);
        }
        
        // Ahora guardar subsecciones y bloques para esta sección específica
        if (section.subsections && section.subsections.length > 0) {
          console.log(`Guardando ${section.subsections.length} subsecciones para sección ${realSectionId}`);
          
          for (const subsection of section.subsections) {
            console.log(`Procesando subsección: ${subsection.title}`, subsection);
            let currentSubsectionId = subsection.id;
            
            // Solo crear subsecciones que tienen tempId (son nuevas)
            if (subsection.tempId) {
              console.log(`Creando nueva subsección: ${subsection.title}`);
              const subsectionPayload = { title: subsection.title, sectionId: realSectionId };
              
              const subsectionRes = await backendAuthFetch(`${import.meta.env.VITE_API_URL}/manuals/subsection`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(subsectionPayload),
              });
              
              if (!subsectionRes.ok) {
                const errorText = await subsectionRes.text();
                console.error(`Error creating subsection: ${subsectionRes.status} - ${subsectionRes.statusText}`, errorText);
                throw new Error(`Error creating subsection: ${subsectionRes.statusText}`);
              }
              
              const subsectionData = await subsectionRes.json();
              console.log(`Respuesta completa del backend para subsección:`, subsectionData);
              
              // Intentar varias formas de obtener el ID
              currentSubsectionId = subsectionData.data?.id || subsectionData.id || subsectionData.subsectionId || subsectionData.subsection?.id;
              
              console.log(`Subsección creada con ID real: ${currentSubsectionId}`);
              
              if (!currentSubsectionId) {
                console.error('No se pudo obtener el ID de la subsección creada. Estructura de respuesta:', subsectionData);
                throw new Error('No se pudo obtener el ID de la subsección creada');
              }
              
              // Delay para evitar rate limiting
              await delay(400);
            } else {
              console.log(`Usando subsección existente: ${subsection.id}`);
            }
            
            // Guardar bloques para esta subsección (tanto nuevas como existentes pueden tener bloques nuevos)
            if (subsection.blocks && subsection.blocks.length > 0) {
              console.log(`Guardando ${subsection.blocks.length} bloques para subsección ${currentSubsectionId}`);
              
              for (let i = 0; i < subsection.blocks.length; i++) {
                const block = subsection.blocks[i];
                console.log(`Procesando bloque ${i}:`, block);
                
                if (block.tempId || block.id?.includes('temp_')) { // Solo crear bloques nuevos
                  console.log(`Creando nuevo bloque: ${block.type} - ${block.content?.substring(0, 50)}...`);
                  const blockPayload = {
                    type: block.type,
                    content: block.content,
                    subsectionId: currentSubsectionId,
                    order: i
                  };
                  
                  const blockRes = await backendAuthFetch(`${import.meta.env.VITE_API_URL}/manuals/block`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(blockPayload),
                  });
                  
                  if (!blockRes.ok) {
                    const errorText = await blockRes.text();
                    console.error(`Error creating block: ${blockRes.status} - ${blockRes.statusText}`, errorText);
                    console.error(`Block payload was:`, blockPayload);
                    throw new Error(`Error creating block: ${blockRes.statusText}`);
                  }                    const blockData = await blockRes.json();
                    console.log(`Bloque creado exitosamente:`, blockData);
                    
                    // Delay entre creación de bloques para evitar rate limiting
                    await delay(200);
                  } else {
                    console.log(`Saltando bloque existente: ${block.id}`);
                  }
                }
            } else {
              console.log(`No hay bloques para guardar en subsección ${subsection.title}`);
            }
          }
        } else {
          console.log(`No hay subsecciones para guardar en sección ${section.title}`);
        }
        
        // Agregar un delay entre secciones para evitar sobrecarga en el servidor
        await delay(100); // Delay de 100ms entre secciones
      }
      
      console.log('=== GUARDADO COMPLETADO ===');
      
      // Limpiar localStorage después de guardar exitosamente
      localStorage.removeItem(`section-drafts-${manualId}`);
      sections.forEach(section => {
        localStorage.removeItem(`subsection-drafts-${section.id}`);
      });
      
      return true;
    } catch (error) {
      console.error('Error saving sections:', error);
      
      // Mostrar error más específico al usuario
      if (error instanceof Error) {
        if (error.message.includes('Too Many Requests')) {
          alert('Error: Demasiadas peticiones al servidor. Por favor espera un momento e intenta nuevamente.');
        } else if (error.message.includes('subsection')) {
          alert('Error al crear subsección: ' + error.message);
        } else if (error.message.includes('block')) {
          alert('Error al crear bloque: ' + error.message);
        } else {
          alert('Error al guardar: ' + error.message);
        }
      } else {
        alert('Error desconocido al guardar el manual');
      }
      
      return false;
    }
  }, [sections, manualId]);

  // Exponer la función saveToBackend para que ManualBuilder pueda usarla
  useEffect(() => {
    (window as any)[`saveSections_${manualId}`] = saveToBackend;
    return () => {
      delete (window as any)[`saveSections_${manualId}`];
    };
  }, [saveToBackend, manualId]);

  return (
    <Card className="bg-black/20 backdrop-blur-xl border border-blue-500/30 shadow-xl">
      <CardHeader className="border-b border-blue-500/20 bg-gradient-to-r from-blue-600/10 to-purple-600/10 p-4 sm:p-6">
        <CardTitle className="text-lg sm:text-xl font-bold text-blue-300 flex items-center gap-2 sm:gap-3">
          <FileText className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
          <span className="min-w-0 break-words">Secciones del Manual</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-500/5 rounded-lg border border-blue-500/20">
          <Input
            value={sectionTitle}
            onChange={(e) => setSectionTitle(e.target.value)}
            placeholder="Titulo de la nueva seccion"
            className="flex-1 bg-black/20 border-blue-500/30 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 text-sm sm:text-base"
            onKeyDown={(e) => e.key === 'Enter' && handleCreateSection()}
          />
          <Button 
            onClick={handleCreateSection} 
            disabled={!sectionTitle.trim()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-4 sm:px-6 py-2 sm:py-3 transition-all duration-200 text-sm sm:text-base w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Agregar
          </Button>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {sections.length === 0 ? (
            <div className="text-center py-8 sm:py-12 text-gray-400">
              <FileText className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 opacity-50" />
              <p className="text-base sm:text-lg font-medium">No hay secciones todavia</p>
              <p className="text-xs sm:text-sm">Crea tu primera seccion para comenzar</p>
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
                        handleUpdateSectionTitle(section.id, newTitle);
                      }}
                      className="flex-1 bg-transparent border-none text-base sm:text-lg font-bold text-blue-200 focus:ring-0 focus:border-none p-0 min-w-0"
                      placeholder="Titulo de la seccion"
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
