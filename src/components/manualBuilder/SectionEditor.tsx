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
    
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
    let hasErrors = false;
    let errorDetails: string[] = [];
    
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
            if (subsection.tempId && (subsection.id === subsection.tempId || subsection.id.startsWith('temp-'))) {
              console.log(`Creando nueva subsección: ${subsection.title}`);
              const subsectionPayload = { title: subsection.title, sectionId: realSectionId };
              
              try {
                const subsectionRes = await backendAuthFetch(`${import.meta.env.VITE_API_URL}/manuals/subsection`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(subsectionPayload),
                });
                
                if (!subsectionRes.ok) {
                  const errorText = await subsectionRes.text();
                  console.error(`Error creating subsection: ${subsectionRes.status} - ${subsectionRes.statusText}`, errorText);
                  
                  // Si el error es por llave duplicada, intentar buscar la subsección existente
                  if (errorText.includes('llave duplicada') || errorText.includes('duplicate key')) {
                    console.warn(`Subsección '${subsection.title}' posiblemente ya existe. Intentando continuar...`);
                    hasErrors = true;
                    errorDetails.push(`Subsección duplicada: ${subsection.title}`);
                    // Generar un ID falso para continuar (el backend debería manejar esto mejor)
                    currentSubsectionId = `fallback-${subsection.tempId}-${Date.now()}`;
                  } else {
                    hasErrors = true;
                    errorDetails.push(`Error en subsección ${subsection.title}: ${subsectionRes.statusText}`);
                    throw new Error(`Error creating subsection: ${subsectionRes.statusText}`);
                  }
                } else {
                  const subsectionData = await subsectionRes.json();
                  console.log(`Respuesta completa del backend para subsección:`, subsectionData);
                  
                  // Intentar varias formas de obtener el ID
                  currentSubsectionId = subsectionData.data?.id || subsectionData.id || subsectionData.subsectionId || subsectionData.subsection?.id;
                  
                  console.log(`Subsección creada con ID real: ${currentSubsectionId}`);
                  
                  if (!currentSubsectionId) {
                    console.error('No se pudo obtener el ID de la subsección creada. Estructura de respuesta:', subsectionData);
                    // En lugar de fallar completamente, usar un ID de respaldo
                    currentSubsectionId = `fallback-${subsection.tempId}-${Date.now()}`;
                    console.warn(`Usando ID de respaldo: ${currentSubsectionId}`);
                    hasErrors = true;
                    errorDetails.push(`No se pudo obtener ID para subsección: ${subsection.title}`);
                  }
                }
                
                // Delay para evitar rate limiting
                await delay(400);
              } catch (error) {
                console.error(`Error al crear subsección ${subsection.title}:`, error);
                hasErrors = true;
                errorDetails.push(`Error al crear subsección ${subsection.title}: ${error}`);
                // Usar un ID de respaldo para continuar el proceso
                currentSubsectionId = `error-${subsection.tempId}-${Date.now()}`;
                console.warn(`Error recuperable. Continuando con ID de respaldo: ${currentSubsectionId}`);
              }
            } else {
              console.log(`Usando subsección existente: ${subsection.id}`);
            }
            
            // Guardar bloques para esta subsección (tanto nuevas como existentes pueden tener bloques nuevos)
            if (subsection.blocks && subsection.blocks.length > 0) {
              console.log(`Guardando ${subsection.blocks.length} bloques para subsección ${currentSubsectionId}`);
              
              for (let i = 0; i < subsection.blocks.length; i++) {
                const block = subsection.blocks[i];
                console.log(`Procesando bloque ${i}:`, block);
                
                if (block.tempId || block.id?.includes('temp') || block.id?.startsWith('temp-')) { // Solo crear bloques nuevos
                  console.log(`Creando nuevo bloque: ${block.type} - ${block.content?.substring(0, 50)}...`);
                  const blockPayload = {
                    type: block.type,
                    content: block.content,
                    subsectionId: currentSubsectionId,
                    order: i
                  };
                  
                  try {
                    const blockRes = await backendAuthFetch(`${import.meta.env.VITE_API_URL}/manuals/block`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(blockPayload),
                    });
                    
                    if (!blockRes.ok) {
                      const errorText = await blockRes.text();
                      console.error(`Error creating block: ${blockRes.status} - ${blockRes.statusText}`, errorText);
                      console.error(`Block payload was:`, blockPayload);
                      console.warn(`Error al crear bloque ${i}, pero continuando...`);
                      hasErrors = true;
                      errorDetails.push(`Error en bloque ${i} de subsección ${subsection.title}`);
                    } else {
                      const blockData = await blockRes.json();
                      console.log(`Bloque creado exitosamente:`, blockData);
                    }
                    
                    // Delay entre creación de bloques para evitar rate limiting
                    await delay(200);
                  } catch (error) {
                    console.error(`Error al crear bloque ${i}:`, error);
                    console.warn(`Error recuperable en bloque ${i}. Continuando...`);
                    hasErrors = true;
                    errorDetails.push(`Error en bloque ${i} de subsección ${subsection.title}: ${error}`);
                  }
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
      
      // Limpiar localStorage después de guardar (exitosamente o con errores parciales)
      localStorage.removeItem(`section-drafts-${manualId}`);
      sections.forEach(section => {
        localStorage.removeItem(`subsection-drafts-${section.id}`);
      });
      
      // Reportar el resultado al usuario
      if (hasErrors) {
        console.warn('El guardado se completó con algunos errores:', errorDetails);
        const errorSummary = errorDetails.length > 3 
          ? `${errorDetails.slice(0, 3).join('\n')}\n... y ${errorDetails.length - 3} errores más.`
          : errorDetails.join('\n');
        
        alert(`Guardado completado con advertencias:\n\n${errorSummary}\n\nRecomendamos revisar el manual y volver a guardarlo si es necesario.`);
        return 'partial'; // Indica guardado parcial
      }
      
      return true; // Indica guardado completamente exitoso
    } catch (error) {
      console.error('Error crítico saving sections:', error);
      
      // Mostrar error más específico al usuario
      if (error instanceof Error) {
        if (error.message.includes('Too Many Requests')) {
          alert('Error: Demasiadas peticiones al servidor. Por favor espera un momento e intenta nuevamente.');
        } else if (error.message.includes('subsection')) {
          alert('Error crítico al crear subsección: ' + error.message + '\n\nEl proceso se ha detenido para evitar corrupciones.');
        } else if (error.message.includes('section')) {
          alert('Error crítico al crear sección: ' + error.message + '\n\nPor favor revisa la configuración del manual.');
        } else if (error.message.includes('block')) {
          alert('Error crítico al crear bloque: ' + error.message);
        } else {
          alert('Error crítico al guardar: ' + error.message + '\n\nPor favor intenta nuevamente o contacta soporte.');
        }
      } else {
        alert('Error desconocido al guardar el manual. Por favor intenta nuevamente.');
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
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl">
      <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-6">
        <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-3">
          <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <span className="min-w-0 break-words">Secciones del Manual</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800/50">
          <Input
            value={sectionTitle}
            onChange={(e) => setSectionTitle(e.target.value)}
            placeholder="Título de la nueva sección"
            className="flex-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20"
            onKeyDown={(e) => e.key === 'Enter' && handleCreateSection()}
          />
          <Button 
            onClick={handleCreateSection} 
            disabled={!sectionTitle.trim()}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold px-6 py-2 transition-colors duration-200 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar
          </Button>
        </div>

        <div className="space-y-4">
          {sections.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No hay secciones todavía</p>
              <p className="text-sm">Crea tu primera sección para comenzar</p>
            </div>
          ) : (
            sections.map((section, index) => (
              <Card key={section.id} className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg hover:shadow-md transition-shadow duration-200">
                <CardHeader className="border-b border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">{index + 1}</span>
                    </div>
                    
                    <Input
                      value={section.title || ""}
                      onChange={e => {
                        const newTitle = e.target.value;
                        handleUpdateSectionTitle(section.id, newTitle);
                      }}
                      className="flex-1 bg-transparent border-none text-lg font-semibold text-gray-900 dark:text-gray-100 focus:ring-0 focus:border-none p-0 min-w-0"
                      placeholder="Título de la sección"
                    />
                    
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingId(editingId === section.id ? null : section.id)}
                        className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSection(section.id)}
                        className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 p-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
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
