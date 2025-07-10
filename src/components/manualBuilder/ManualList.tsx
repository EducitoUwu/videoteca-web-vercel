import { useEffect, useState, useContext, useCallback, useMemo, memo } from "react";
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

// Componente optimizado para tarjeta de manual
const ManualCard = memo(function ManualCard({ 
  manual, 
  index, 
  onClick 
}: { 
  manual: Manual; 
  index: number; 
  onClick: (id: string) => void; 
}) {
  const handleClick = useCallback(() => onClick(manual.id), [manual.id, onClick]);

  return (
    <Card
      className="group cursor-pointer bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-gray-200/60 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all duration-300 ease-out hover:border-blue-300/40 dark:hover:border-blue-400/40 rounded-xl"
      onClick={handleClick}
    >
      <CardHeader className="p-6">
        <div className="flex items-center gap-5">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl border border-blue-200/50 dark:border-blue-700/50">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-200 mb-1">
              {manual.title}
            </CardTitle>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Manual #{index + 1} • Haz clic para abrir
            </p>
          </div>
          
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Eye className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
        </div>
      </CardHeader>
    </Card>
  );
});

// Componente optimizado para estado de loading
const LoadingState = memo(function LoadingState() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500"></div>
          <span className="text-base font-medium">Cargando manuales...</span>
        </div>
      </div>
    </div>
  );
});

// Componente optimizado para estado vacío
const EmptyState = memo(function EmptyState() {
  return (
    <div className="text-center py-20">
      <div className="mb-8">
        <FileText className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No hay manuales disponibles</h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
          Comienza creando tu primer manual para documentar procesos y procedimientos
        </p>
      </div>
    </div>
  );
});

export default function ManualList({ onSelect }: ManualListProps) {
  const [manuals, setManuals] = useState<Manual[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedManualId, setSelectedManualId] = useState<string | null>(null);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const isAdmin = useMemo(() => user?.role === "administrador", [user?.role]);

  // Función optimizada para cargar manuales
  const loadManuals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await backendAuthFetch(`${import.meta.env.VITE_API_URL}/manuals`);
      const data = await res.json();
      setManuals(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error("Error cargando manuales:", err);
      setManuals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadManuals();
  }, [loadManuals]);

  // Handler optimizado para click en manual
  const handleManualClick = useCallback((manualId: string) => {
    if (onSelect) {
      onSelect(manualId);
    } else {
      setSelectedManualId(manualId);
    }
  }, [onSelect]);

  // Handler optimizado para navegación
  const handleBack = useCallback(() => setSelectedManualId(null), []);
  const handleEdit = useCallback(() => {
    if (selectedManualId) {
      navigate(`/upload-manual?edit=${selectedManualId}`);
    }
  }, [selectedManualId, navigate]);
  const handleCreateNew = useCallback(() => navigate("/upload-manual"), [navigate]);
  const handleGoToSelect = useCallback(() => navigate("/select"), [navigate]);

  // Si hay un manual seleccionado, mostrar el viewer
  if (selectedManualId) {
    return (
      <ManualViewer 
        manualId={selectedManualId} 
        onBack={handleBack}
        onEdit={isAdmin ? handleEdit : undefined}
      />
    );
  }

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="max-w-5xl mx-auto pt-24 px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              onClick={handleGoToSelect}
              className="gap-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 rounded-lg px-4 py-2"
              title="Volver a selección"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span className="break-words">Biblioteca de Manuales</span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Gestiona y consulta la documentación del sistema
            </p>
          </div>
        </div>

        {manuals.length > 0 ? (
          <div className="space-y-4 mb-12">
            {manuals.map((manual, index) => (
              <ManualCard
                key={manual.id}
                manual={manual}
                index={index}
                onClick={handleManualClick}
              />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}

        {/* Botón flotante para crear nuevo manual - Solo administradores */}
        {isAdmin && (
          <div className="fixed bottom-6 right-6">
            <Button
              onClick={handleCreateNew}
              className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0"
              title="Crear nuevo manual"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
