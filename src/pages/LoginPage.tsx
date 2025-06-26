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
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (user) {
      navigate('/select');
    }
  }, [user, navigate]);

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
    { icon: Video, text: "Videos de procedimientos clínicos", color: "bg-blue-400 text-blue-700" },
    { icon: FileText, text: "Manuales digitales actualizados", color: "bg-green-400 text-green-700" },
    { icon: BookOpen, text: "Recursos de aprendizaje", color: "bg-purple-400 text-purple-700" },
    { icon: Users, text: "Colaboración estudiante-docente", color: "bg-orange-400 text-orange-700" }
  ];






  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 relative overflow-hidden">
      
      
      {/* Patrón de fondo */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Ccircle cx='7' cy='7' r='3'/%3E%3Ccircle cx='53' cy='7' r='3'/%3E%3Ccircle cx='30' cy='30' r='3'/%3E%3Ccircle cx='7' cy='53' r='3'/%3E%3Ccircle cx='53' cy='53' r='3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>

      <div className="relative z-10 w-full max-w-6xl mx-4 grid lg:grid-cols-2 gap-8 items-center">
        {/* Panel izquierdo - Información */}
        <div className="hidden lg:block text-white space-y-6">
          <div className="space-y-4">
            <Badge className="bg-white/20 text-white border-white/30 px-4 py-2 text-sm font-medium">
              <Sparkles className="w-4 h-4 mr-2" />
              Plataforma Educativa UCN
            </Badge>
            <h1 className="text-5xl font-bold leading-tight">
              Videoteca de
              <span className="block text-cyan-200">Enfermería UCN</span>
            </h1>
            <p className="text-xl text-blue-100 max-w-md">
              Tu plataforma integral de recursos educativos para la excelencia en enfermería
            </p>
          </div>

          {/* Características animadas */}
          <div className="space-y-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 transition-all duration-500 transform ${
                  showFeatures 
                    ? 'translate-x-0 opacity-100' 
                    : '-translate-x-10 opacity-0'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className={`p-2 rounded-lg ${feature.color} bg-opacity-20`}>
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-white font-medium">{feature.text}</span>
                <CheckCircle className="w-4 h-4 text-green-300 ml-auto" />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-cyan-200">
            <Shield className="w-5 h-5" />
            <span className="text-sm">Acceso seguro y verificado</span>
          </div>
        </div>





        {/*  Login */}


 




        <div className="w-full max-w-md mx-auto">
          <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-lg">
            <CardHeader className="text-center space-y-4">
              {/* Logo con efecto hover */}
              <div className="flex justify-center">
                <div className="relative group">
                  <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                  <img
                    src={ucnLogo}
                    
                    alt="Logo UCN"
                    className="relative h-20 w-20 rounded-full border-4 border-blue-200 bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg transform group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold text-gray-800">
                  ¡Bienvenido!
                </CardTitle>
                <p className="text-gray-600">
                  Accede a tu videoteca de enfermería
                </p>
              </div>

              
              <div className="flex items-center justify-center gap-2 text-sm text-blue-600 bg-blue-50 rounded-full px-4 py-2">
                <Shield className="w-4 h-4" />
                Solo correos institucionales UCN
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              

              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <Shield className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700 font-medium">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              
              {/* Boton de google */}
              <Button
                variant="outline"
                className="w-full h-14 border-2 border-blue-300 hover:border-blue-400 hover:bg-blue-50 group relative overflow-hidden transition-all duration-300"
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 opacity-0 group-hover:opacity-5 transition-opacity"></div>
                <div className="flex items-center justify-center gap-3 relative z-10">
                  {isLoading ? (
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <FcGoogle className="w-6 h-6" />
                  )}
                  <span className="text-lg font-semibold text-gray-700">
                    {isLoading ? 'Iniciando sesión...' : 'Continuar con Google UCN'}
                  </span>
                  {!isLoading && (
                    <ArrowRight className="w-5 h-5 text-blue-500 group-hover:translate-x-1 transition-transform" />
                  )}
                </div>
              </Button>

              
            </CardContent>
          </Card>

          {/* features animadasnn */}
          <div className="lg:hidden mt-6 space-y-3">
            {features.slice(0, 2).map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm text-white"
              >
                <feature.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;