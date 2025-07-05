import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthProvider';
import VideoUpload from '../components/VideoUpload';

const UploadVideoPage = () => {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  // Redirigir si no es administrador
  useEffect(() => {
    if (!loading && (!user || user.role !== 'administrador')) {
      navigate('/videos');
    }
  }, [user, loading, navigate]);

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-400/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300 font-medium">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Solo mostrar si es administrador
  if (!user || user.role !== 'administrador') {
    return null;
  }

  return <VideoUpload />;
};

export default UploadVideoPage;
