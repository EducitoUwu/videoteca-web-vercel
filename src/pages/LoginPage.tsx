import { useState, useEffect, useContext } from 'react';
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { FcGoogle } from "react-icons/fc";
import { Shield, BookOpen, Video, FileText, Users, CheckCircle, ArrowRight, Sparkles } from "lucide-react";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";
import ucnLogo from "../assets/Escudo-UCN-Full-Color.png";
import { AuthContext } from '../contexts/AuthProvider';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const LoginPage = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);
  const navigate = useNavigate();
  const { user, loading } = useContext(AuthContext);

useEffect(() => {
  if (!loading && user) {
    navigate('/select');
  } else if (!loading && !user) {
    // Si no hay usuario y ya terminó de cargar, forzar login
    navigate('/');
  }
}, [user, loading, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => setShowFeatures(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(auth, provider);
      const token = await credential.user.getIdToken();

      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
        });

      if (res.ok) {
        navigate('/select');
      } else {
        setError("ERROR: Considere utilizar correo institucional UCN.");
        await signOut(auth);
      }
    } catch (err) {
      setError('No se pudo iniciar sesión con Google');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: Video, text: "Videos de procedimientos clínicos", color: "bg-blue-500/20 text-blue-300" },
    { icon: FileText, text: "Manuales digitales actualizados", color: "bg-cyan-500/20 text-cyan-300" },
    { icon: BookOpen, text: "Recursos de aprendizaje", color: "bg-indigo-500/20 text-indigo-300" },
    { icon: Users, text: "Colaboración estudiante-docente", color: "bg-purple-500/20 text-purple-300" }
  ];






  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900 relative px-4 sm:px-0 transition-colors">
      
      {/* Toggle de tema en la esquina superior derecha */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      <div className="relative z-10 w-full max-w-6xl mx-4 grid lg:grid-cols-2 gap-8 items-center">
        {/* Panel izquierdo - Información */}
        <div className="hidden lg:block text-slate-800 dark:text-white space-y-8">
          <div className="space-y-6">
            <Badge className="bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-400/30 px-6 py-3 text-sm font-semibold">
              <Sparkles className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
              Plataforma Educativa UCN
            </Badge>
            <h1 className="text-6xl font-black leading-tight">
              <span className="text-slate-900 dark:text-white">
                Videoteca de
              </span>
              <span className="block text-blue-600 dark:text-blue-400">
                Procedimientos Clínicos UCN
              </span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-md leading-relaxed">
              excelencia en procedimientos clínicos
            </p>
          </div>

          {/* Características animadas con mejor diseño */}
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`flex items-center gap-4 p-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-blue-400/30 transition-all duration-500 transform hover:scale-105 ${
                  showFeatures 
                    ? 'translate-x-0 opacity-100' 
                    : '-translate-x-10 opacity-0'
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className={`p-3 rounded-xl ${feature.color} border border-slate-200 dark:border-white/10`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <span className="text-slate-700 dark:text-slate-200 font-medium text-lg flex-1">{feature.text}</span>
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-cyan-400" />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 text-blue-700 dark:text-cyan-300 bg-blue-50 dark:bg-blue-500/10 rounded-lg px-4 py-3 border border-blue-200 dark:border-blue-400/20">
            <Shield className="w-6 h-6" />
            <span className="font-medium">Acceso seguro y verificado</span>
          </div>
        </div>

        {/* Panel derecho - Login */}
        <div className="w-full max-w-md mx-auto">
          <Card className="shadow-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardHeader className="text-center space-y-6 pb-8">
              {/* Logo con efecto más sutil */}
              <div className="flex justify-center">
                <div className="relative group">
                  <div className="absolute inset-0 bg-blue-500/20 dark:bg-blue-500/30 rounded-full blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-300"></div>
                  <img
                    src={ucnLogo}
                    alt="Logo UCN"
                    className="relative h-24 w-24 rounded-full border-4 border-blue-300 dark:border-blue-400/50 bg-white shadow-xl transform group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <CardTitle className="text-3xl font-black text-slate-900 dark:text-white">
                  ¡Bienvenido!
                </CardTitle>
                <p className="text-slate-600 dark:text-slate-300 text-lg">
                  Accede a tu videoteca de procedimientos clínicos y recursos educativos.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 text-sm text-blue-700 dark:text-cyan-300 bg-blue-50 dark:bg-blue-500/10 rounded-xl px-6 py-3 border border-blue-200 dark:border-blue-400/20">
                <Shield className="w-5 h-5" />
                <span className="font-semibold">Solo correos institucionales UCN</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-0">
              {error && (
                <Alert className="border-red-200 dark:border-red-400/30 bg-red-50 dark:bg-red-500/10">
                  <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <AlertDescription className="text-red-700 dark:text-red-300 font-medium">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Botón de Google más limpio */}
              <Button
                variant="outline"
                className="w-full h-16 border-2 border-slate-200 dark:border-blue-400/30 bg-white dark:bg-slate-700/50 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-300 dark:hover:border-blue-400/50 group relative overflow-hidden transition-all duration-300"
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                <div className="flex items-center justify-center gap-4 relative z-10">
                  {isLoading ? (
                    <div className="w-7 h-7 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <FcGoogle className="w-7 h-7" />
                  )}
                  <span className="text-xl font-bold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                    {isLoading ? 'Iniciando sesión...' : 'Continuar con Google UCN'}
                  </span>
                  {!isLoading && (
                    <ArrowRight className="w-6 h-6 text-blue-500 dark:text-blue-400 group-hover:translate-x-1 group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-all duration-300" />
                  )}
                </div>
              </Button>
            </CardContent>
          </Card>

          {/* Features para móvil con nuevo diseño */}
          <div className="lg:hidden mt-8 space-y-4">
            {features.slice(0, 2).map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200"
              >
                <div className={`p-2 rounded-lg ${feature.color} border border-slate-200 dark:border-white/10`}>
                  <feature.icon className="w-5 h-5" />
                </div>
                <span className="font-medium">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;