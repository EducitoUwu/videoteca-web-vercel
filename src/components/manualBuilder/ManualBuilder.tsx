import { useState } from "react";
import SectionEditor from "./SectionEditor";
import ManualViewer from "./ManualViewer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { backendAuthFetch } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Plus, BookOpen, Eye, Save, ArrowLeft } from "lucide-react";

export default function ManualBuilder() {
  const [manualTitle, setManualTitle] = useState("");
  const [manualId, setManualId] = useState<string | null>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [mode, setMode] = useState<"builder" | "viewer">("builder");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
      setMode("builder");
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


  // Cambiar a viewer después de construir
  const handleViewManual = () => {
    setMode("viewer");
  };

  // Volver al listado después de guardar/salir
  const handleBackToList = () => {
    navigate("/manuals");
  };

  if (mode === "viewer" && manualId) {
    return (
      <ManualViewer
        manualId={manualId}
        onEdit={() => setMode("builder")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        <Card className="bg-black/40 backdrop-blur-xl border border-blue-500/30 shadow-2xl shadow-blue-500/20">
          <CardHeader className="border-b border-blue-500/20 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-blue-400" />
              {manualId ? "🛠️ Constructor de Manual" : "Crear nuevo manual"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            {!manualId ? (
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
                  
                  <Button
                    onClick={handleViewManual}
                    variant="outline"
                    className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10 hover:text-blue-200 font-semibold px-6 py-3 rounded-lg transition-all duration-300"
                  >
                    <Eye className="h-5 w-5 mr-2" />
                    Ver este manual
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
