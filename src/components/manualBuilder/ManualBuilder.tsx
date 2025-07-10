import { useState, useEffect, useContext, useCallback } from "react";
import SectionEditor from "./SectionEditor";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { backendAuthFetch } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Plus, BookOpen, Save, ArrowLeft } from "lucide-react";
import { AuthContext } from "@/contexts/AuthProvider";
import Header from "@/components/Header";

interface ManualBuilderProps {
  editId?: string | null;
}

export default function ManualBuilder({ editId }: ManualBuilderProps) {
  const [manualTitle, setManualTitle] = useState("");
  const [manualId, setManualId] = useState<string | null>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const isAdmin = user?.role === "administrador";

  // Redirigir si no es administrador
  useEffect(() => {
    if (user && !isAdmin) {
      alert("No tienes permisos para acceder a esta página");
      navigate("/manuals");
    }
  }, [user, isAdmin, navigate]);

  // Función para cargar manual existente
  const loadExistingManual = useCallback(async (id: string) => {
    setLoadingExisting(true);
    try {
      const res = await backendAuthFetch(`${import.meta.env.VITE_API_URL}/manuals/${id}`);
      if (!res.ok) {
        throw new Error("Manual no encontrado");
      }
      const data = await res.json();
      const manual = data.data || data;
      
      setManualId(id);
      setManualTitle(manual.title || "");
      setSections(manual.sections || []);
    } catch (err) {
      console.error("Error cargando manual:", err);
      alert("Error al cargar el manual. Será redirigido al listado.");
      navigate("/manuals");
    } finally {
      setLoadingExisting(false);
    }
  }, [navigate]);

  // Cargar manual existente si se proporciona editId
  useEffect(() => {
    if (editId) {
      loadExistingManual(editId);
    }
  }, [editId, loadExistingManual]);

  const handleCreateManual = async () => {
    if (!manualTitle.trim()) return;
    
    setLoading(true);
    try {
      const res = await backendAuthFetch(`${import.meta.env.VITE_API_URL}/manuals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: manualTitle }),
      });
      const data = await res.json();
      const manualId = data.data?.id;
      
      if (!manualId) {
        alert("Error: El backend no devolvió el id del manual. Revisa la respuesta:\n" + JSON.stringify(data));
        return;
      }
      
      setManualId(manualId);
      setSections([]);
      setManualTitle("");
      
      // Fetch estructura real del manual recién creado
      const getRes = await backendAuthFetch(`${import.meta.env.VITE_API_URL}/manuals/${manualId}`);
      const getData = await getRes.json();
      setSections(getData.data?.sections || []);
    } catch (err) {
      console.error("Error creando manual:", err);
      alert("Error al crear el manual. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateManualTitle = async () => {
    if (!manualId || !manualTitle.trim()) return true; // Si no hay cambios, considerar exitoso
    
    try {
      // Intentar primero el endpoint /manuals/${manualId}
      let response = await backendAuthFetch(`${import.meta.env.VITE_API_URL}/manuals/${manualId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: manualTitle }),
      });
      
      // Si el endpoint no existe (404), intentar con /manuals/manual/${manualId}
      if (response.status === 404) {
        console.warn("Endpoint /manuals/${manualId} no encontrado, intentando ruta alternativa...");
        response = await backendAuthFetch(`${import.meta.env.VITE_API_URL}/manuals/manual/${manualId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title: manualTitle }),
        });
      }
      
      if (!response.ok) {
        console.warn(`Error ${response.status} al actualizar título del manual:`, response.statusText);
        // No mostrar alerta aquí para no interrumpir el flujo de guardado principal
        // Solo registrar el warning y continuar
        return false;
      }
      
      console.log("Título del manual actualizado exitosamente");
      return true;
    } catch (err) {
      console.error("Error actualizando título del manual:", err);
      // No mostrar alerta aquí para no interrumpir el flujo
      // El error del título no debe impedir guardar el contenido
      return false;
    }
  };


  // Función para guardar todo y volver al listado
  const handleSaveAndExit = async () => {
    if (!manualId) return;
    
    setLoading(true);
    try {
      // Actualizar título si hay cambios
      if (manualTitle.trim()) {
        const titleUpdated = await handleUpdateManualTitle();
        if (!titleUpdated) {
          console.warn("No se pudo actualizar el título del manual, pero continuando con el guardado del contenido...");
        }
        // Delay después de intentar actualizar título
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Guardar secciones (que ahora también guarda subsecciones y bloques)
      const saveSections = (window as any)[`saveSections_${manualId}`];
      if (saveSections) {
        const sectionsResult = await saveSections();
        if (!sectionsResult || sectionsResult === false) {
          alert("Error crítico al guardar el manual. No se han guardado los cambios.");
          return;
        } else if (sectionsResult === 'partial') {
          // El proceso ya mostró las alertas correspondientes
          console.log("Guardado parcial completado. Continuando con navegación...");
        } else {
          console.log("Guardado completamente exitoso.");
        }
      }
      
      // Limpiar localStorage después de guardar exitosamente
      localStorage.removeItem(`manual-title-draft-${manualId}`);
      localStorage.removeItem(`section-drafts-${manualId}`);
      sections.forEach(section => {
        localStorage.removeItem(`subsection-drafts-${section.id}`);
      });
      
      // Solo navegar después de guardar exitosamente
      navigate("/manuals");
    } catch (error) {
      console.error("Error saving manual:", error);
      
      // Manejo de errores más específico
      if (error instanceof Error) {
        if (error.message.includes('Too Many Requests')) {
          alert("Error: Demasiadas peticiones al servidor. Espera un momento e intenta nuevamente.");
        } else {
          alert("Error al guardar el manual: " + error.message);
        }
      } else {
        alert("Error desconocido al guardar el manual");
      }
    } finally {
      setLoading(false);
    }
  };

  // Volver sin guardar (con confirmación si hay cambios)
  const handleBackToList = () => {
    if (sections.length > 0 || manualTitle.trim()) {
      if (confirm("Tienes cambios sin guardar. Estas seguro de que quieres salir?")) {
        navigate("/manuals");
      }
    } else {
      navigate("/manuals");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="max-w-6xl mx-auto pt-24 px-4 sm:px-6 lg:px-8">
        {/* Botón de regresar */}
        <div className="mb-8">
          <Button
            onClick={handleBackToList}
            variant="outline"
            className="gap-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 rounded-lg px-4 py-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden xs:inline">Volver a manuales</span>
            <span className="xs:hidden">Volver</span>
          </Button>
        </div>
        
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-6">
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
              <BookOpen className="h-7 w-7 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span className="min-w-0 break-words">
                {loadingExisting 
                  ? "Cargando manual..." 
                  : manualId 
                    ? editId 
                      ? "Editando Manual" 
                      : "Constructor de Manual"
                    : "Crear nuevo manual"
                }
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {loadingExisting ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-300">Cargando datos del manual...</span>
              </div>
            ) : !manualId ? (
              <div className="flex flex-col gap-6 max-w-lg mx-auto">
                <div className="space-y-3">
                  <label className="text-gray-700 dark:text-gray-300 font-medium">Título del manual</label>
                  <Input
                    type="text"
                    value={manualTitle}
                    placeholder="Ingresa el título del manual"
                    onChange={(e) => setManualTitle(e.target.value)}
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20 py-3"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateManual()}
                  />
                </div>
                <Button 
                  onClick={handleCreateManual} 
                  disabled={!manualTitle.trim() || loading}
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors duration-200 disabled:opacity-50"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  {loading ? "Creando..." : "Crear Manual"}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Editor de título cuando estamos editando */}
                {editId && (
                  <Card className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <label className="text-blue-700 dark:text-blue-300 font-medium text-sm">Título del manual</label>
                        <Input
                          type="text"
                          value={manualTitle}
                          placeholder="Título del manual"
                          onChange={(e) => setManualTitle(e.target.value)}
                          onBlur={handleUpdateManualTitle}
                          className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                <SectionEditor
                  manualId={manualId}
                  sections={sections}
                  setSections={setSections}
                />
                
                <div className="flex flex-wrap gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    onClick={handleSaveAndExit}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200"
                  >
                    <Save className="h-5 w-5 mr-2" />
                    <span className="hidden sm:inline">{loading ? "Guardando..." : "Guardar manual y salir"}</span>
                    <span className="sm:hidden">{loading ? "Guardando..." : "Guardar y salir"}</span>
                  </Button>
                  
                  <Button
                    onClick={handleBackToList}
                    variant="outline"
                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-6 py-3 rounded-lg transition-colors duration-200"
                  >
                    <span className="hidden sm:inline">Salir sin guardar</span>
                    <span className="sm:hidden">Salir</span>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
