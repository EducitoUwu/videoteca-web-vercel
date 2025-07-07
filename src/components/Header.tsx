import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { AuthContext } from "@/contexts/AuthProvider";

// Utilidad para capitalizar solo la primera letra
function capitalize(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

// Extrae primer nombre y primer apellido
function getShortName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0] || "";
  const lastName = parts.length > 1 ? parts[1] : "";
  return `${capitalize(firstName)}${lastName ? " " + capitalize(lastName) : ""}`;
}




export default function Header() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  if (!user) return null;

  const welcomeMessage = "Bienvenido/a"; // Default message

  return (
    <header
      className="fixed top-2 sm:top-4 right-2 sm:right-4 z-50 flex items-center gap-2 sm:gap-4 bg-slate-900/80 backdrop-blur-lg shadow-2xl shadow-blue-500/20 rounded-lg sm:rounded-xl px-3 sm:px-6 py-2 sm:py-3 border border-blue-400/30 max-w-[calc(100vw-16px)] sm:max-w-none"
      style={{ minWidth: 0 }}
    >
      <span className="font-semibold text-blue-200 text-sm sm:text-base truncate max-w-[120px] sm:max-w-xs">
        {welcomeMessage}, {getShortName(user.fullName)}
      </span>
      <Button
        variant="outline"
        className="gap-1 sm:gap-2 bg-gradient-to-r from-red-500/20 to-red-600/20 border-red-400/30 text-red-200 hover:bg-red-500/30 hover:border-red-400/60 hover:text-white transition-all duration-200 backdrop-blur-sm text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
        onClick={async () => {
          await logout();
          navigate("/");
        }}
        title="Cerrar sesión"
      >
        <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
        <span className="hidden sm:inline">Cerrar sesión</span>
      </Button>
    </header>
  );
}