import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebaseConfig";

const LoginPage = () => {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("ucn-alert")) {
      setError("ERROR: Considere utilizar correo institucional.");
      localStorage.removeItem("ucn-alert");
    }
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/select');
    } catch (err) {
      setError('No se pudo iniciar sesión con Google');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-blue-300 to-blue-100 relative overflow-hidden">
      {/* Fondo animado */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-300 opacity-50 animate-pulse"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-400 to-cyan-200 opacity-30 blur-2xl"></div>

      <Card className="relative w-full max-w-md shadow-2xl border border-blue-300 bg-white/90 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-center text-blue-800 text-2xl font-bold">
            Bienvenido
          </CardTitle>
          <p className="text-center text-blue-600 text-sm">
            Inicia sesión con tu cuenta de Google para continuar
          </p>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 text-center text-red-600 font-semibold">
              {error}
            </div>
          )}
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2 border-blue-300 hover:bg-blue-100"
            type="button"
            onClick={handleGoogleLogin}
          >
            <FcGoogle className="w-5 h-5" />
            Iniciar sesión con Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
