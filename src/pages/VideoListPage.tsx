
import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Skeleton } from '../components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { Search, Plus,  ArrowLeft } from 'lucide-react';
import { AuthContext } from '../contexts/AuthProvider';
import { Video } from '../types/video';
import videoService from '../services/video';
import Header from '../components/Header';
import VideoComments from '../components/VideoComments';

const VideoListPage = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const [search, setSearch] = useState<string>("");
  const [localLoading, setLocalLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedVideo, setExpandedVideo] = useState<Video | null>(null);
  const navigate = useNavigate();
  const { user, loading } = useContext(AuthContext);

  // Redirigir al login si no hay usuario y terminó de cargar
  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [user, loading, navigate]);
 

  useEffect(() => {
    const fetchVideos = async () => {
      setLocalLoading(true);
      try {
        const data = await videoService.fetchAllVideos();
        setVideos(data);
        const uniqueCategories = Array.from(
          new Set((data as any[]).map((video) => (video.category?.name || "Sin categoría") as string))
        );
        setCategories(["Todas", ...uniqueCategories]);
      } catch (err) {
        setError("No se pudieron cargar los videos.");
      } finally {
        setLocalLoading(false);
      }
    };
    fetchVideos();
  }, []);

  // Filtrado combinado por categoría y búsqueda
  const filteredVideos = videos.filter((video: any) => {
    const matchesCategory =
      selectedCategory === "Todas" ||
      (video.category?.name || "Sin categoría") === selectedCategory;
    const matchesSearch = video.title
      .toLowerCase()
      .includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 px-0 sm:px-8 relative overflow-hidden">
      
      {/* Efectos de fondo sutiles */}
      <div className="absolute inset-0">
        <div className="absolute top-20 -left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
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

      <Header />
      
      {/* Botón flotante para admins */}
      {user?.role === "administrador" && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button 
            onClick={() => navigate("/upload-video")}
            className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 hover:scale-110 border border-emerald-400/30 backdrop-blur-sm"
            title="Subir nuevo video"
          >
            <Plus className="w-7 h-7" />
          </Button>
        </div>
      )}
      
      {!expandedVideo && (
        <>
          <div className="flex flex-col sm:flex-row items-center justify-between pt-8 pb-6 px-4 sm:px-0 gap-4 relative z-10">
            <h1 className="text-4xl md:text-5xl font-black w-full sm:w-auto text-left mb-2 sm:mb-0 bg-gradient-to-r from-white via-blue-200 to-cyan-300 bg-clip-text text-transparent drop-shadow-lg">
              Videos Disponibles
            </h1>
            <div className="flex gap-2 items-center">
              
            </div>
          </div>

          {/* Buscador */}
          <div className="flex justify-center mb-6 px-4 relative z-10">
            <div className="relative w-full max-w-lg">
              <Input
                placeholder="Buscar video..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setExpandedVideo(null);
                }}
                className="pl-12 pr-4 py-4 text-base bg-slate-800/60 border-2 border-blue-400/30 focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/30 text-white placeholder:text-gray-400 backdrop-blur-md rounded-xl transition-all duration-300"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 w-5 h-5" />
            </div>
          </div>

          {/* Categorías estilo chips con Tooltip y Select para móviles */}
          <div className="flex flex-wrap gap-3 justify-center px-4 pb-8 relative z-10">
            <TooltipProvider>
              {categories.map((category) => (
                <Tooltip key={category}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={selectedCategory === category ? "default" : "outline"}
                      className={`rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300 backdrop-blur-md ${
                        selectedCategory === category
                          ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-blue-400/60 shadow-lg shadow-blue-500/30 scale-105"
                          : "bg-slate-800/60 text-gray-300 border-blue-400/30 hover:bg-blue-500/20 hover:border-blue-400/60 hover:text-white hover:scale-105"
                      }`}
                      onClick={() => {
                        setSelectedCategory(category);
                        setExpandedVideo(null);
                      }}
                    >
                      {category}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-gray-800 text-white border-gray-700">
                    Filtrar por {category}
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>
          
          {/* Select para categorías en móvil */}
          <div className="block sm:hidden px-4 mb-6 relative z-10">
            <Select
              value={selectedCategory}
              onValueChange={(value: string) => {
                setSelectedCategory(value);
                setExpandedVideo(null);
              }}
            >
              <SelectTrigger className="w-full bg-slate-800/60 border-blue-400/30 text-white backdrop-blur-md rounded-xl transition-all duration-300">
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800/95 border-gray-600 backdrop-blur-md">
                {categories.map((category) => (
                  <SelectItem key={category} value={category} className="text-white hover:bg-blue-500/20 focus:bg-blue-500/20">
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {(loading || localLoading) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 px-4 relative z-10">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl bg-slate-800/60 border border-blue-400/30 animate-pulse" />
          ))}
        </div>
      )}
      
      {error && <p className="text-red-400 text-center text-lg font-medium relative z-10">{error}</p>}

      {filteredVideos.length === 0 && !loading && !expandedVideo && (
        <p className="text-gray-400 text-center text-lg relative z-10">No hay videos disponibles en esta categoría o búsqueda.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 px-4 relative z-10">
        {!expandedVideo &&
          filteredVideos.map((video) => (
            <Card
              key={video.id}
              className="cursor-pointer transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 border-2 border-white/10 bg-slate-900/70 backdrop-blur-xl group hover:border-blue-400/60 hover:bg-slate-800/80 rounded-2xl overflow-hidden"
              onClick={() => setExpandedVideo(video)}
            >
              {/* Miniatura del video */}
              <div className="relative w-full h-48 bg-slate-800/50 overflow-hidden">
                <video
                  src={video.fileUrl}
                  preload="metadata"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  muted
                  playsInline
                  onMouseEnter={(e) => {
                    const video = e.target as HTMLVideoElement;
                    video.currentTime = 3; // Mostrar frame a los 3 segundos
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
                <div className="absolute top-3 left-3">
                  <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-1 rounded-full font-semibold shadow-lg">
                    {video.category?.name || "Sin categoría"}
                  </Badge>
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <div className="w-0 h-0 border-l-8 border-l-white border-y-6 border-y-transparent ml-1"></div>
                  </div>
                </div>
              </div>
              
              <CardHeader className="flex flex-col gap-3 p-6">
                <CardTitle className="text-xl font-bold text-gray-100 group-hover:text-white transition-colors duration-300 leading-tight">
                  {video.title}
                </CardTitle>
                {video.description && (
                  <p className="text-gray-400 text-sm leading-relaxed overflow-hidden" style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {video.description}
                  </p>
                )}
                <div className="w-full h-1 bg-blue-500/40 rounded-full group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-cyan-400 transition-all duration-500 group-hover:h-2"></div>
              </CardHeader>
            </Card>
          ))}

        {expandedVideo && (
          <div className="col-span-full max-w-4xl mx-auto relative z-10">
            {/* Botón volver */}
            <div className="mb-6">
              <Button
                variant="outline"
                onClick={() => setExpandedVideo(null)}
                className="gap-2 bg-slate-800/60 border-blue-400/30 text-gray-300 hover:bg-blue-500/20 hover:border-blue-400/60 hover:text-white backdrop-blur-md rounded-xl px-6 py-3 transition-all duration-300"
              >
                <ArrowLeft className="w-5 h-5" />
                Volver a la lista
              </Button>
            </div>
            
            <Card className="shadow-2xl border-2 border-blue-400/40 bg-slate-900/90 backdrop-blur-xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-slate-800/60 to-slate-700/60 p-8">
                <CardTitle className="text-3xl font-black text-white mb-4 drop-shadow-lg">
                  {expandedVideo.title}
                </CardTitle>
                <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-full font-semibold w-fit shadow-lg">
                  {expandedVideo.category?.name || "Sin categoría"}
                </Badge>
              </CardHeader>
              <CardContent className="p-8">
                <p className="text-gray-300 mb-6 text-lg leading-relaxed">
                  {expandedVideo.description || "Sin descripción"}
                </p>
                <small className="text-gray-400 block mb-8 text-base">
                  Publicado el {new Date(expandedVideo.createdAt).toLocaleDateString()}
                </small>
                <div className="flex gap-3 mb-8">
                  <Button
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-4 px-8 rounded-xl flex-1 text-lg shadow-lg hover:shadow-blue-500/30 transition-all duration-300 hover:scale-105"
                    onClick={() => window.open(expandedVideo.fileUrl, "_blank")}
                  >
                    Ver video
                  </Button>
                </div>
                
                {/* Sección de comentarios */}
                <VideoComments videoId={expandedVideo.id} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoListPage;