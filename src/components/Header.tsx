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

  return (
    <header
      className="fixed top-4 right-4 z-50 flex items-center gap-4 bg-white/80 shadow-md rounded-xl px-4 py-2"
      style={{ minWidth: 0 }}
    >
      <span className="font-semibold text-blue-800 text-base truncate max-w-xs">
        Bienvenido, {getShortName(user.fullName)}
      </span>
      <Button
        variant="outline"
        className="gap-2"
        onClick={async () => {
          await logout();
          navigate("/");
        }}
        title="Cerrar sesión"
      >
        <LogOut className="w-4 h-4" />
        Cerrar sesión
      </Button>
    </header>
  );
}