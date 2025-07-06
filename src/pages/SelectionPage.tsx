import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Video, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Header from "@/components/Header";


import { AuthContext } from '../contexts/AuthProvider';
const SelectionPage = () => {
  const [selected, setSelected] = useState<"manual" | "video" | null>(null);
  const navigate = useNavigate();
  const { user, loading } = useContext(AuthContext);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const handleContinue = () => {
    if (selected === "manual") navigate("/manuals");
    if (selected === "video") navigate("/videos");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-black flex flex-col items-center justify-center p-4 relative">
      
      {/* Efectos de fondo optimizados */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 -left-20 w-72 h-72 bg-blue-500/8 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 -right-20 w-72 h-72 bg-cyan-500/8 rounded-full blur-xl"></div>
      </div>
      
      <Header />
      <div className="w-full max-w-4xl mx-auto text-center mb-12 relative z-10">
        <h1 className="text-4xl md:text-5xl font-black mb-6 bg-gradient-to-r from-white via-blue-100 to-cyan-300 bg-clip-text text-transparent">
          ¿Qué deseas visualizar?
        </h1>
        <p className="text-gray-300 text-xl md:text-2xl max-w-2xl mx-auto leading-relaxed">
          Selecciona una opción para comenzar tu experiencia de aprendizaje
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl relative z-10">
        <SelectionCard
          title="Manuales"
          description="Explora guías escritas paso a paso sobre temas clínicos con videos incluidos."
          icon={<BookOpen className="h-12 w-12 text-blue-500" />}
          isSelected={selected === "manual"}
          onClick={() => setSelected("manual")}
        />
        <SelectionCard
          title="Videos"
          description="Aprende con videos que muestran cómo realizar los procedimientos correctamente."
          icon={<Video className="h-12 w-12 text-blue-500" />}
          isSelected={selected === "video"}
          onClick={() => setSelected("video")}
        />
      </div>

      {selected && (
        <div className="mt-12 flex justify-center relative z-10">
          <Button
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-10 py-6 text-xl font-bold rounded-xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 flex items-center gap-4 border border-blue-400/20"
            onClick={handleContinue}
          >
            Continuar con {selected === "manual" ? "Manuales" : "Videos"}
            <ArrowRight className="w-6 h-6" />
          </Button>
        </div>
      )}
    </div>
  );
};

interface SelectionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  isSelected: boolean;
  onClick: () => void;
}

function SelectionCard({
  title,
  description,
  icon,
  isSelected,
  onClick,
}: SelectionCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-500 transform hover:scale-105 border-2 backdrop-blur-lg",
        isSelected
          ? "border-blue-400/50 bg-gray-800/80 shadow-2xl shadow-blue-500/20 ring-1 ring-blue-400/30"
          : "border-white/10 bg-gray-900/60 hover:border-blue-400/30 hover:shadow-xl hover:bg-gray-800/70"
      )}
      onClick={onClick}
    >
      <CardContent className="p-8 flex flex-col items-center text-center">
        <div
          className={cn(
            "rounded-2xl p-6 mb-6 transition-all duration-300",
            isSelected 
              ? "bg-blue-500/20 border border-blue-400/30" 
              : "bg-blue-500/10 border border-blue-400/20 hover:bg-blue-500/15"
          )}
        >
          <div className={cn(
            "transition-colors duration-300",
            isSelected ? "text-cyan-300" : "text-blue-400"
          )}>
            {icon}
          </div>
        </div>
        <h2 className={cn(
          "text-3xl font-black mb-4 transition-colors duration-300",
          isSelected 
            ? "bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent" 
            : "text-gray-200"
        )}>
          {title}
        </h2>
        <p className={cn(
          "text-lg leading-relaxed transition-colors duration-300",
          isSelected ? "text-gray-300" : "text-gray-400"
        )}>
          {description}
        </p>
        <div
          className={cn(
            "w-full max-w-[140px] h-1 mt-8 rounded-full transition-all duration-500",
            isSelected 
              ? "bg-gradient-to-r from-blue-400 to-cyan-400 shadow-lg shadow-blue-400/50" 
              : "bg-blue-500/30"
          )}
        />
      </CardContent>
    </Card>
  );
}

export default SelectionPage;