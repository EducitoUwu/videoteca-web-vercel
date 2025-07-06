import { useEffect, useState, useContext } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { backendAuthFetch } from "@/lib/utils";
import { BookOpen, Plus, FileText, Eye, ArrowLeft } from "lucide-react";
import ManualViewer from "./ManualViewer";
import { AuthContext } from "@/contexts/AuthProvider";
import Header from "@/components/Header";

interface Manual {
  id: string;
  title: string;
}

interface ManualListProps {
  onSelect?: (id: string) => void;
}

export default function ManualList({ onSelect }: ManualListProps) {
  const [manuals, setManuals] = useState<Manual[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedManualId, setSelectedManualId] = useState<string | null>(null);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const isAdmin = user?.role === "administrador";

  useEffect(() => {
    setLoading(true);
    backendAuthFetch(`${import.meta.env.VITE_API_URL}/manuals`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setManuals(data);
        else setManuals(data.data); // por si backend responde {data: [...]}
      })
      .catch((err) => {
        console.error("Error cargando manuales:", err);
        setManuals([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleManualClick = (manualId: string) => {
    if (onSelect) {
      onSelect(manualId);
    } else {
      setSelectedManualId(manualId);
    }
  };

  // Si hay un manual seleccionado, mostrar el viewer
  if (selectedManualId) {
    return (
      <ManualViewer 
        manualId={selectedManualId} 
        onBack={() => setSelectedManualId(null)}
        onEdit={isAdmin ? () => {
          navigate(`/upload-manual?edit=${selectedManualId}`);
        } : undefined}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[60vh]">
          <div className="flex items-center gap-3 text-blue-300">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            <span className="text-lg">Cargando manuales...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <Header />
      <div className="max-w-4xl mx-auto pt-20">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              onClick={() => navigate("/select")}
              className="gap-2 bg-slate-800/60 border-blue-400/30 text-gray-300 hover:bg-blue-500/20 hover:border-blue-400/60 hover:text-white backdrop-blur-md rounded-xl px-4 py-2 transition-all duration-300"
              title="Volver a selección"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
          </div>
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2 flex items-center gap-3 leading-tight">
            <BookOpen className="h-10 w-10 text-blue-400 flex-shrink-0" />
            <span className="break-words">Manuales</span>
          </h1>
          <p className="text-blue-300/80">Gestiona y consulta la documentación del sistema</p>
        </div>

        {manuals.length > 0 ? (
          <div className="space-y-4 mb-8">
            {manuals.map((manual, index) => (
              <Card
                key={manual.id}
                className="group cursor-pointer bg-black/40 backdrop-blur-xl border border-blue-500/30 shadow-xl hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-200 hover:border-blue-400/50 hover:scale-[1.01]"
                onClick={() => handleManualClick(manual.id)}
              >
                <CardHeader className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl border border-blue-500/30">
                      <FileText className="h-6 w-6 text-blue-400" />
                    </div>
                    
                    <div className="flex-1">
                      <CardTitle className="text-xl font-bold text-blue-200 group-hover:text-blue-100 transition-colors duration-300">
                        {manual.title}
                      </CardTitle>
                      <p className="text-blue-400/60 text-sm mt-1">
                        Manual #{index + 1} • Haz clic para abrir
                      </p>
                    </div>
                    
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Eye className="h-5 w-5 text-blue-400" />
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="mb-6">
              <FileText className="h-24 w-24 mx-auto text-blue-400/30 mb-4" />
              <h3 className="text-2xl font-bold text-blue-300 mb-2">No hay manuales disponibles</h3>
              <p className="text-blue-400/60 max-w-md mx-auto">
                Comienza creando tu primer manual para documentar procesos y procedimientos
              </p>
            </div>
          </div>
        )}

        {/* Botón flotante para crear nuevo manual - Solo administradores */}
        {isAdmin && (
          <div className="fixed bottom-8 right-8">
            <Button
              onClick={() => navigate("/upload-manual")}
              className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-2xl hover:shadow-blue-500/25 transition-all duration-200 hover:scale-105 border border-blue-400/30 backdrop-blur-sm"
              title="Crear nuevo manual"
            >
              <Plus className="h-7 w-7" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
