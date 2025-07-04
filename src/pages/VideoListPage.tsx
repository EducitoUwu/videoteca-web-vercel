
import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Skeleton } from '../components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { Search, Plus, LogOut, ArrowLeft } from 'lucide-react';
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
  const { user, logout, loading } = useContext(AuthContext);

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
    <div className="bg-blue-50 min-h-screen px-0 sm:px-8">
      <Header />
      
      {!expandedVideo && (
        <>
          <div className="flex flex-col sm:flex-row items-center justify-between pt-8 pb-4 px-4 sm:px-0 gap-4">
            <h1 className="text-3xl font-bold text-blue-800 w-full sm:w-auto text-left mb-2 sm:mb-0">
              Videos Disponibles
            </h1>
            <div className="flex gap-2 items-center">
              {user?.role === "admin" && (
                <Button
                  onClick={() => navigate("/upload-video")}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Subir nuevo video
                </Button>
              )}
            </div>
          </div>

          {/* Buscador */}
          <div className="flex justify-center mb-4 px-4">
            <div className="relative w-full max-w-lg">
              <Input
                placeholder="Buscar video..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setExpandedVideo(null);
                }}
                className="pl-10 pr-4 py-2 text-base shadow-sm focus:ring-2 focus:ring-blue-300"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 w-5 h-5" />
            </div>
          </div>

          {/* Categorías estilo chips con Tooltip y Select para móviles */}
          <div className="flex flex-wrap gap-2 justify-center px-4 pb-6">
            <TooltipProvider>
              {categories.map((category) => (
                <Tooltip key={category}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={selectedCategory === category ? "default" : "outline"}
                      className={`rounded-full px-4 py-1 text-sm transition-all ${
                        selectedCategory === category
                          ? "bg-blue-700 text-white"
                          : "bg-white text-blue-700 border-blue-300 hover:bg-blue-100"
                      }`}
                      onClick={() => {
                        setSelectedCategory(category);
                        setExpandedVideo(null);
                      }}
                    >
                      {category}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Filtrar por {category}
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>
          
          {/* Select para categorías en móvil */}
          <div className="block sm:hidden px-4 mb-4">
            <Select
              value={selectedCategory}
              onValueChange={(value) => {
                setSelectedCategory(value);
                setExpandedVideo(null);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {(loading || localLoading) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 px-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      )}
      
      {error && <p className="text-red-500 text-center">{error}</p>}

      {filteredVideos.length === 0 && !loading && !expandedVideo && (
        <p className="text-gray-600 text-center">No hay videos disponibles en esta categoría o búsqueda.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 px-4">
        {!expandedVideo &&
          filteredVideos.map((video) => (
            <Card
              key={video.id}
              className="cursor-pointer transition-transform hover:scale-105 hover:shadow-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-100 to-cyan-100 group"
              onClick={() => setExpandedVideo(video)}
            >
              <CardHeader className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-600 text-white">{video.category?.name || "Sin categoría"}</Badge>
                </div>
                <CardTitle className="text-lg font-bold text-blue-800 group-hover:underline">{video.title}</CardTitle>
              </CardHeader>
            </Card>
          ))}

        {expandedVideo && (
          <div className="col-span-full max-w-4xl mx-auto">
            {/* Botón volver */}
            <div className="mb-4">
              <Button
                variant="outline"
                onClick={() => setExpandedVideo(null)}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver a la lista
              </Button>
            </div>
            
            <Card className="shadow-2xl border-2 border-blue-400 bg-white/95 backdrop-blur-md animate-fade-in">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-blue-900">{expandedVideo.title}</CardTitle>
                <Badge className="bg-blue-700 text-white mt-2 w-fit">
                  {expandedVideo.category?.name || "Sin categoría"}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">{expandedVideo.description || "Sin descripción"}</p>
                <small className="text-gray-500 block mb-4">
                  Publicado el {new Date(expandedVideo.createdAt).toLocaleDateString()}
                </small>
                <div className="flex gap-2 mb-6">
                  <Button
                    className="bg-gradient-to-r from-blue-700 to-cyan-500 text-white font-semibold py-2 rounded-lg flex-1"
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