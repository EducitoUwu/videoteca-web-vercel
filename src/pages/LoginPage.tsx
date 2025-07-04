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

      const res = await fetch("http://localhost:9999/api/v1/auth/login", {
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-slate-800 to-black relative overflow-hidden">
      
      {/* Efectos de fondo más sutiles */}
      <div className="absolute inset-0">
        {/* Gradiente circular sutil */}
        <div className="absolute top-20 -left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
      </div>
      
      {/* Patrón de puntos */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3Ccircle cx='53' cy='7' r='1'/%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3Ccircle cx='7' cy='53' r='1'/%3E%3Ccircle cx='53' cy='53' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>

      {/* Grid de líneas */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }}></div>

      <div className="relative z-10 w-full max-w-6xl mx-4 grid lg:grid-cols-2 gap-8 items-center">
        {/* Panel izquierdo - Información */}
        <div className="hidden lg:block text-white space-y-8">
          <div className="space-y-6">
            <Badge className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-cyan-300 border-blue-400/30 px-6 py-3 text-sm font-semibold backdrop-blur-sm">
              <Sparkles className="w-5 h-5 mr-2 text-cyan-400" />
              Plataforma Educativa UCN
            </Badge>
            <h1 className="text-6xl font-black leading-tight">
              <span className="bg-gradient-to-r from-white via-blue-100 to-cyan-300 bg-clip-text text-transparent">
                Videoteca de
              </span>
              <span className="block bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 bg-clip-text text-transparent">
                Enfermería UCN
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-md leading-relaxed">
              Tu plataforma integral de recursos educativos para la 
              <span className="text-cyan-300 font-semibold"> excelencia en enfermería</span>
            </p>
          </div>

          {/* Características animadas con mejor diseño */}
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`flex items-center gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:border-blue-400/30 transition-all duration-500 transform hover:scale-105 ${
                  showFeatures 
                    ? 'translate-x-0 opacity-100' 
                    : '-translate-x-10 opacity-0'
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className={`p-3 rounded-xl ${feature.color} backdrop-blur-sm border border-white/10`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <span className="text-gray-200 font-medium text-lg flex-1">{feature.text}</span>
                <CheckCircle className="w-5 h-5 text-cyan-400" />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 text-cyan-300 bg-blue-500/10 backdrop-blur-sm rounded-lg px-4 py-3 border border-blue-400/20">
            <Shield className="w-6 h-6" />
            <span className="font-medium">Acceso seguro y verificado</span>
          </div>
        </div>





        {/*  Login */}


 




        <div className="w-full max-w-md mx-auto">
          <Card className="shadow-2xl border-0 bg-gray-900/90 backdrop-blur-2xl ring-1 ring-white/10">
            <CardHeader className="text-center space-y-6 pb-8">
              {/* Logo con efecto más sutil */}
              <div className="flex justify-center">
                <div className="relative group">
                  <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-300"></div>
                  <img
                    src={ucnLogo}
                    alt="Logo UCN"
                    className="relative h-24 w-24 rounded-full border-4 border-blue-400/50 bg-gradient-to-br from-blue-500 to-cyan-600 shadow-2xl transform group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <CardTitle className="text-3xl font-black bg-gradient-to-r from-white via-blue-100 to-cyan-300 bg-clip-text text-transparent">
                  ¡Bienvenido!
                </CardTitle>
                <p className="text-gray-300 text-lg">
                  Accede a tu videoteca de enfermería
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 text-sm text-cyan-300 bg-blue-500/10 backdrop-blur-sm rounded-xl px-6 py-3 border border-blue-400/20">
                <Shield className="w-5 h-5" />
                <span className="font-semibold">Solo correos institucionales UCN</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-0">
              {error && (
                <Alert className="border-red-400/30 bg-red-500/10 backdrop-blur-sm">
                  <Shield className="h-5 w-5 text-red-400" />
                  <AlertDescription className="text-red-300 font-medium">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Botón de Google más limpio */}
              <Button
                variant="outline"
                className="w-full h-16 border-2 border-blue-400/30 bg-gray-800/50 hover:bg-blue-500/10 hover:border-blue-400/50 group relative overflow-hidden transition-all duration-300 backdrop-blur-sm"
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                <div className="flex items-center justify-center gap-4 relative z-10">
                  {isLoading ? (
                    <div className="w-7 h-7 border-3 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <FcGoogle className="w-7 h-7" />
                  )}
                  <span className="text-xl font-bold text-gray-200 group-hover:text-white transition-colors">
                    {isLoading ? 'Iniciando sesión...' : 'Continuar con Google UCN'}
                  </span>
                  {!isLoading && (
                    <ArrowRight className="w-6 h-6 text-blue-400 group-hover:translate-x-1 group-hover:text-cyan-400 transition-all duration-300" />
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
                className="flex items-center gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 text-gray-200"
              >
                <div className={`p-2 rounded-lg ${feature.color} backdrop-blur-sm border border-white/10`}>
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