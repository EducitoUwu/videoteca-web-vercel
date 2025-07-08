import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { backendAuthFetch } from "@/lib/utils";
import { Type, Video, Play, Save, X } from "lucide-react";
import manualService from "@/services/manual";



interface Block {
  id?: string;
  type: "text" | "video";
  content?: string;       // para texto
  videoId?: string;       // para video
}

interface Video {
  id: string;
  title: string;
  fileUrl: string; // Cambiar de 'url' a 'fileUrl'
}

export default function BlockEditor({
  block,
  onSave,
  onCancel,
}: {
  block?: Block;
  onSave: (block: Block) => void;
  onCancel: () => void;
}) {
  // Estado local
  const [type, setType] = useState<Block["type"]>(block?.type || "text");
  const [content, setContent] = useState(block?.content || "");
  const [videoId, setVideoId] = useState(block?.videoId || "");
  const [showVideoSelector, setShowVideoSelector] = useState(false);

  // Para cargar videos al abrir el selector
  const [videos, setVideos] = useState<Video[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [loadingUrls, setLoadingUrls] = useState<Record<string, boolean>>({});

  // Función para obtener URL firmada
  const getSignedUrl = async (videoId: string) => {
    if (signedUrls[videoId] || loadingUrls[videoId]) return signedUrls[videoId];
    
    setLoadingUrls(prev => ({ ...prev, [videoId]: true }));
    try {
      const url = await manualService.getVideoSignedUrl(videoId);
      setSignedUrls(prev => ({ ...prev, [videoId]: url }));
      return url;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      // Fallback a la URL original si falla
      const video = videos.find(v => v.id === videoId);
      if (video) {
        setSignedUrls(prev => ({ ...prev, [videoId]: video.fileUrl }));
        return video.fileUrl;
      }
    } finally {
      setLoadingUrls(prev => ({ ...prev, [videoId]: false }));
    }
  };

  // Cargar videos al abrir el selector
  const handleOpenVideoSelector = () => {
    setShowVideoSelector(true);
    setLoadingVideos(true);
    backendAuthFetch(`${import.meta.env.VITE_API_URL}/videos`)
      .then(res => res.json())
      .then(data => setVideos(Array.isArray(data) ? data : data.data))
      .finally(() => setLoadingVideos(false));
  };

  // Componente auxiliar para miniatura de video con URL firmada
  const VideoThumbnail = ({ video }: { video: Video }) => {
    const [thumbnailUrl, setThumbnailUrl] = useState<string>(video.fileUrl);
    
    useEffect(() => {
      const loadSignedUrl = async () => {
        const url = await getSignedUrl(video.id);
        if (url) {
          setThumbnailUrl(url);
        }
      };
      loadSignedUrl();
    }, [video.id]);

    return (
      <video 
        src={thumbnailUrl} 
        className="w-full sm:w-32 h-20 object-cover rounded-lg border border-purple-500/30 flex-shrink-0" 
        preload="metadata"
      />
    );
  };

  const handleSelectVideo = (vid: Video) => {
    console.log('Video seleccionado:', vid);
    setVideoId(vid.id);
    // Para compatibilidad con el sistema actual, seguimos guardando la URL en content
    // pero ahora usaremos el videoId para obtener URLs firmadas cuando sea necesario
    setContent(vid.fileUrl); 
    console.log('Estableciendo content a:', vid.fileUrl);
    setShowVideoSelector(false);
  };

  const handleSave = () => {
    console.log('Estado actual:', { type, content, videoId });
    
    if (type === "text") {
      if (!content.trim()) {
        alert("El contenido del texto no puede estar vacío");
        return;
      }
      onSave({ type, content: content.trim() });
    } else if (type === "video") {
      if (!videoId || !content) {
        console.log('Validación fallida:', { videoId, content });
        alert("Debes seleccionar un video");
        return;
      }
      // Para bloques de video, content ya contiene la URL del video
      console.log('Guardando bloque de video:', { type, content, videoId });
      onSave({ type, content, videoId });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Selector de tipo de bloque */}
      <div className="space-y-2">
        <label className="text-purple-300 font-medium text-xs sm:text-sm">Tipo de bloque:</label>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            variant={type === "text" ? "default" : "outline"}
            onClick={() => setType("text")}
            className={`${type === "text" 
              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" 
              : "border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
            } text-sm sm:text-base py-2 sm:py-3 w-full sm:w-auto`}
          >
            <Type className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
            Texto
          </Button>
          <Button
            variant={type === "video" ? "default" : "outline"}
            onClick={() => setType("video")}
            className={`${type === "video" 
              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" 
              : "border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
            } text-sm sm:text-base py-2 sm:py-3 w-full sm:w-auto`}
          >
            <Video className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
            Video
          </Button>
        </div>
      </div>

      {/* Contenido según el tipo */}
      {type === "text" ? (
        <div className="space-y-2">
          <label className="text-purple-300 font-medium text-xs sm:text-sm">Contenido del texto:</label>
          <textarea
            className="w-full bg-black/20 border border-purple-500/30 text-white placeholder:text-gray-400 rounded-lg p-3 sm:p-4 focus:border-purple-400 focus:ring-purple-400/20 focus:ring-2 resize-none transition-all duration-200 text-sm sm:text-base"
            rows={4}
            placeholder="Escribe el contenido del bloque de texto..."
            value={content}
            onChange={e => setContent(e.target.value)}
          />
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          <label className="text-purple-300 font-medium text-xs sm:text-sm">Seleccionar video:</label>
          
          {videoId && (
            <div className="p-3 sm:p-4 bg-purple-500/10 rounded-lg border border-purple-500/30">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-purple-500/20 rounded-lg flex-shrink-0">
                  <Video className="h-4 w-4 sm:h-5 sm:w-5 text-purple-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-purple-200 font-medium text-sm sm:text-base">Video seleccionado:</p>
                  <p className="text-purple-300 text-xs sm:text-sm break-words">
                    {videos.find(v => v.id === videoId)?.title || videoId}
                  </p>
                  <p className="text-purple-400 text-xs break-all">
                    URL: {content || 'No disponible'}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <Button 
            onClick={handleOpenVideoSelector}
            variant="outline"
            className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10 hover:text-purple-200 transition-all duration-200 w-full sm:w-auto text-sm sm:text-base py-2 sm:py-3"
          >
            <Video className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
            <span className="hidden sm:inline">{videoId ? "Cambiar video" : "Seleccionar video"}</span>
            <span className="sm:hidden">{videoId ? "Cambiar" : "Seleccionar"}</span>
          </Button>

          {/* Modal de selección de videos */}
          {showVideoSelector && (
            <Dialog open={showVideoSelector} onOpenChange={setShowVideoSelector}>
              <DialogContent className="max-w-full sm:max-w-4xl mx-2 sm:mx-auto bg-black/90 backdrop-blur-xl border border-purple-500/30 max-h-[90vh] overflow-hidden">
                <DialogTitle className="text-lg sm:text-xl font-bold text-purple-300 flex items-center gap-2 sm:gap-3 p-2 sm:p-0">
                  <Video className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                  <span className="min-w-0 break-words">Selecciona un video</span>
                </DialogTitle>
                
                {loadingVideos ? (
                  <div className="flex items-center justify-center py-8 sm:py-12">
                    <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-purple-400"></div>
                    <span className="ml-3 text-purple-300 text-sm sm:text-base">Cargando videos...</span>
                  </div>
                ) : (
                  <div className="max-h-64 sm:max-h-96 overflow-y-auto space-y-2 sm:space-y-3 p-1">
                    {videos.length ? (
                      videos.map(video => (
                        <div key={video.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-purple-500/5 rounded-lg border border-purple-500/20 hover:border-purple-400/40 transition-all duration-200">
                          <VideoThumbnail video={video} />
                          <div className="flex-1 min-w-0 w-full sm:w-auto">
                            <h3 className="text-purple-200 font-medium text-sm sm:text-base break-words">{video.title}</h3>
                            <p className="text-purple-400 text-xs sm:text-sm break-all">ID: {video.id}</p>
                          </div>
                          <Button 
                            onClick={() => handleSelectVideo(video)}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-4 sm:px-6 transition-all duration-200 text-sm sm:text-base w-full sm:w-auto"
                          >
                            <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                            <span className="hidden sm:inline">Usar este</span>
                            <span className="sm:hidden">Usar</span>
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 sm:py-12 text-gray-400">
                        <Video className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 opacity-50" />
                        <p className="text-base sm:text-lg font-medium">No hay videos disponibles</p>
                        <p className="text-xs sm:text-sm px-4">Sube videos primero para poder usarlos en los manuales</p>
                      </div>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end pt-3 sm:pt-4 border-t border-purple-500/20">
        <Button 
          variant="outline" 
          onClick={onCancel}
          className="border-gray-500/30 text-gray-400 hover:bg-gray-500/10 hover:text-gray-300 transition-all duration-200 text-sm sm:text-base py-2 sm:py-3 w-full sm:w-auto"
        >
          <X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
          Cancelar
        </Button>
        <Button 
          onClick={handleSave}
          disabled={type === "text" ? !content.trim() : !videoId}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-4 sm:px-6 transition-all duration-200 disabled:opacity-50 text-sm sm:text-base py-2 sm:py-3 w-full sm:w-auto"
        >
          <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
          <span className="hidden sm:inline">Guardar bloque</span>
          <span className="sm:hidden">Guardar</span>
        </Button>
      </div>
    </div>
  );
}
