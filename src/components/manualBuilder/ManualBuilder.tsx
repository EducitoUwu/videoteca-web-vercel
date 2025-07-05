import { useState, useEffect } from "react";
import SectionEditor from "./SectionEditor";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { backendAuthFetch } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Plus, BookOpen, Save, ArrowLeft } from "lucide-react";

interface ManualBuilderProps {
  editId?: string | null;
}

export default function ManualBuilder({ editId }: ManualBuilderProps) {
  const [manualTitle, setManualTitle] = useState("");
  const [manualId, setManualId] = useState<string | null>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const navigate = useNavigate();

  // Cargar manual existente si se proporciona editId
  useEffect(() => {
    if (editId) {
      loadExistingManual(editId);
    }
  }, [editId]);

  const loadExistingManual = async (id: string) => {
    setLoadingExisting(true);
    try {
      const res = await backendAuthFetch(`http://localhost:9999/api/v1/manuals/${id}`);
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
  };

  const handleCreateManual = async () => {
    if (!manualTitle.trim()) return;
    
    setLoading(true);
    try {
      const res = await backendAuthFetch("http://localhost:9999/api/v1/manuals", {
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
      const getRes = await backendAuthFetch(`http://localhost:9999/api/v1/manuals/${manualId}`);
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
      await backendAuthFetch(`http://localhost:9999/api/v1/manuals/${manualId}`, {
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


  // Volver al listado después de guardar/salir
  const handleBackToList = () => {
    navigate("/manuals");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        <Card className="bg-black/40 backdrop-blur-xl border border-blue-500/30 shadow-2xl shadow-blue-500/20">
          <CardHeader className="border-b border-blue-500/20 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-blue-400" />
              {loadingExisting 
                ? "📥 Cargando manual..." 
                : manualId 
                  ? editId 
                    ? "✏️ Editando Manual" 
                    : "🛠️ Constructor de Manual"
                  : "Crear nuevo manual"
              }
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            {loadingExisting ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                <span className="ml-3 text-blue-300">Cargando datos del manual...</span>
              </div>
            ) : !manualId ? (
              <div className="flex flex-col gap-6 max-w-lg mx-auto">
                <div className="space-y-2">
                  <label className="text-blue-300 font-medium">Título del manual</label>
                  <Input
                    type="text"
                    value={manualTitle}
                    placeholder="Ingresa el título del manual"
                    onChange={(e) => setManualTitle(e.target.value)}
                    className="bg-black/20 border-blue-500/30 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateManual()}
                  />
                </div>
                <Button 
                  onClick={handleCreateManual} 
                  disabled={!manualTitle.trim() || loading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 disabled:opacity-50"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  {loading ? "Creando..." : "Crear Manual"}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Editor de título cuando estamos editando */}
                {editId && (
                  <Card className="bg-blue-500/5 border border-blue-500/20">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <label className="text-blue-300 font-medium text-sm">Título del manual</label>
                        <Input
                          type="text"
                          value={manualTitle}
                          placeholder="Título del manual"
                          onChange={(e) => setManualTitle(e.target.value)}
                          onBlur={handleUpdateManualTitle}
                          className="bg-black/20 border-blue-500/30 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20"
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
                
                <div className="flex flex-wrap gap-4 pt-6 border-t border-blue-500/20">
                  <Button
                    onClick={handleBackToList}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300"
                  >
                    <Save className="h-5 w-5 mr-2" />
                    Guardar manual y salir
                  </Button>
                </div>
              </div>
            )}
            
            <div className="mt-8 pt-6 border-t border-blue-500/20">
              <Button
                onClick={handleBackToList}
                variant="ghost"
                className="text-gray-400 hover:text-blue-300 font-medium transition-colors duration-300"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                📚 Ver todos los manuales creados
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
