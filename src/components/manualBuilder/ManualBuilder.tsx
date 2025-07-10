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
    if (!manualId || !manualTitle.trim()) return;
    
    try {
      await backendAuthFetch(`${import.meta.env.VITE_API_URL}/manuals/${manualId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: manualTitle }),
      });
    } catch (err) {
      console.error("Error actualizando título del manual:", err);
      alert("Error al actualizar el título del manual.");
    }
  };


  // Función para guardar todo y volver al listado
  const handleSaveAndExit = async () => {
    if (!manualId) return;
    
    setLoading(true);
    try {
      // Actualizar título si hay cambios
      if (manualTitle.trim()) {
        await handleUpdateManualTitle();
        // Delay después de actualizar título
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Guardar secciones (que ahora también guarda subsecciones y bloques)
      const saveSections = (window as any)[`saveSections_${manualId}`];
      if (saveSections) {
        const sectionsSuccess = await saveSections();
        if (!sectionsSuccess) {
          alert("Error al guardar el manual");
          return;
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-2 sm:p-4">
      <Header />
      <div className="max-w-6xl mx-auto pt-16 sm:pt-20">
        {/* Botón de regresar */}
        <div className="mb-4 sm:mb-6">
          <Button
            onClick={handleBackToList}
            variant="outline"
            className="gap-2 bg-slate-800/60 border-blue-400/30 text-gray-300 hover:bg-blue-500/20 hover:border-blue-400/60 hover:text-white backdrop-blur-md rounded-xl px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden xs:inline">Volver a manuales</span>
            <span className="xs:hidden">Volver</span>
          </Button>
        </div>
        <Card className="bg-black/40 backdrop-blur-xl border border-blue-500/30 shadow-2xl shadow-blue-500/20">
          <CardHeader className="border-b border-blue-500/20 bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2 sm:gap-3">
              <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400 flex-shrink-0" />
              <span className="min-w-0 break-words">
                {loadingExisting 
                  ? "📥 Cargando manual..." 
                  : manualId 
                    ? editId 
                      ? "✏️ Editando Manual" 
                      : "🛠️ Constructor de Manual"
                    : "Crear nuevo manual"
                }
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-8">
            {loadingExisting ? (
              <div className="flex items-center justify-center py-8 sm:py-12">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-400"></div>
                <span className="ml-3 text-blue-300 text-sm sm:text-base">Cargando datos del manual...</span>
              </div>
            ) : !manualId ? (
              <div className="flex flex-col gap-4 sm:gap-6 max-w-lg mx-auto">
                <div className="space-y-2">
                  <label className="text-blue-300 font-medium text-sm sm:text-base">Título del manual</label>
                  <Input
                    type="text"
                    value={manualTitle}
                    placeholder="Ingresa el título del manual"
                    onChange={(e) => setManualTitle(e.target.value)}
                    className="bg-black/20 border-blue-500/30 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 text-sm sm:text-base py-2 sm:py-3"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateManual()}
                  />
                </div>
                <Button 
                  onClick={handleCreateManual} 
                  disabled={!manualTitle.trim() || loading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 sm:py-3 rounded-lg transition-all duration-200 disabled:opacity-50 text-sm sm:text-base"
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  {loading ? "Creando..." : "Crear Manual"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {/* Editor de título cuando estamos editando */}
                {editId && (
                  <Card className="bg-blue-500/5 border border-blue-500/20">
                    <CardContent className="p-3 sm:p-4">
                      <div className="space-y-2">
                        <label className="text-blue-300 font-medium text-xs sm:text-sm">Título del manual</label>
                        <Input
                          type="text"
                          value={manualTitle}
                          placeholder="Título del manual"
                          onChange={(e) => setManualTitle(e.target.value)}
                          onBlur={handleUpdateManualTitle}
                          className="bg-black/20 border-blue-500/30 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 text-sm sm:text-base"
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
                
                <div className="flex flex-wrap gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-blue-500/20">
                  <Button
                    onClick={handleSaveAndExit}
                    disabled={loading}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-lg transition-all duration-200 text-sm sm:text-base"
                  >
                    <Save className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    <span className="hidden sm:inline">{loading ? "Guardando..." : "Guardar manual y salir"}</span>
                    <span className="sm:hidden">{loading ? "Guardando..." : "Guardar y salir"}</span>
                  </Button>
                  
                  <Button
                    onClick={handleBackToList}
                    variant="outline"
                    className="border-gray-400/30 text-gray-300 hover:bg-gray-500/20 px-4 sm:px-6 py-2 sm:py-3 rounded-lg transition-all duration-200 text-sm sm:text-base"
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
