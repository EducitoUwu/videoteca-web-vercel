import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Video, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-300 to-blue-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-blue-800 mb-4">
          ¿Qué deseas visualizar?
        </h1>
        <p className="text-blue-600 text-lg md:text-xl max-w-2xl mx-auto">
          Selecciona una opción 
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
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
        <div className="mt-10 flex justify-center">
          <Button
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-3"
            onClick={handleContinue}
          >
            Continuar con {selected === "manual" ? "Manuales" : "Videos"}
            <ArrowRight className="w-5 h-5" />
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
        "cursor-pointer transition-all duration-300 transform hover:scale-105 border-2",
        isSelected
          ? "border-blue-500 bg-blue-50 shadow-lg shadow-blue-200"
          : "border-transparent hover:border-blue-300 hover:shadow-md"
      )}
      onClick={onClick}
    >
      <CardContent className="p-6 flex flex-col items-center text-center">
        <div
          className={cn(
            "rounded-full p-4 mb-4 transition-colors",
            isSelected ? "bg-blue-100" : "bg-blue-50"
          )}
        >
          {icon}
        </div>
        <h2 className="text-2xl font-bold text-blue-800 mb-2">{title}</h2>
        <p className="text-blue-600">{description}</p>
        <div
          className={cn(
            "w-full max-w-[120px] h-1 mt-6 rounded-full transition-all duration-300",
            isSelected ? "bg-blue-500" : "bg-blue-200"
          )}
        />
      </CardContent>
    </Card>
  );
}

export default SelectionPage;