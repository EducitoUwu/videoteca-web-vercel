import { useState, useEffect, useCallback } from "react";
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
  const getSignedUrl = useCallback(async (videoId: string) => {
    if (signedUrls[videoId]) return signedUrls[videoId];
    if (loadingUrls[videoId]) return null;
    
    setLoadingUrls(prev => ({ ...prev, [videoId]: true }));
    try {
      const url = await manualService.getVideoSignedUrl(videoId);
      setSignedUrls(prev => ({ ...prev, [videoId]: url }));
      setLoadingUrls(prev => ({ ...prev, [videoId]: false }));
      return url;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      setLoadingUrls(prev => ({ ...prev, [videoId]: false }));
      
      // Fallback a la URL original si falla
      const video = videos.find(v => v.id === videoId);
      if (video) {
        setSignedUrls(prev => ({ ...prev, [videoId]: video.fileUrl }));
        return video.fileUrl;
      }
      return null;
    }
  }, [signedUrls, loadingUrls, videos]);

  // Cargar videos al abrir el selector
  const handleOpenVideoSelector = () => {
    setShowVideoSelector(true);
    if (videos.length === 0) {
      setLoadingVideos(true);
      backendAuthFetch(`${import.meta.env.VITE_API_URL}/videos`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }
          return res.json();
        })
        .then(data => {
          const videoList = Array.isArray(data) ? data : (data.data || []);
          setVideos(videoList);
        })
        .catch(error => {
          console.error('Error loading videos:', error);
          alert('Error al cargar los videos. Intenta de nuevo.');
          setVideos([]);
        })
        .finally(() => setLoadingVideos(false));
    }
  };

  // Componente auxiliar para miniatura de video con URL firmada
  const VideoThumbnail = ({ video }: { video: Video }) => {
    const [thumbnailUrl, setThumbnailUrl] = useState<string>(video.fileUrl);
    const [isLoading, setIsLoading] = useState(false);
    
    useEffect(() => {
      let mounted = true;
      
      const loadSignedUrl = async () => {
        if (isLoading) return;
        
        setIsLoading(true);
        try {
          const url = await getSignedUrl(video.id);
          if (url && mounted) {
            setThumbnailUrl(url);
          }
        } catch (error) {
          console.error('Error loading signed URL for video:', video.id, error);
        } finally {
          if (mounted) {
            setIsLoading(false);
          }
        }
      };
      
      loadSignedUrl();
      
      return () => {
        mounted = false;
      };
    }, [video.id, getSignedUrl]);

    return (
      <video 
        src={thumbnailUrl} 
        className="w-full sm:w-32 h-20 object-cover rounded-lg border border-slate-200 dark:border-slate-600 flex-shrink-0" 
        preload="metadata"
        onError={() => console.log(`Error loading video: ${video.id}`)}
      />
    );
  };

  const handleSelectVideo = (vid: Video) => {
    setVideoId(vid.id);
    setContent(vid.fileUrl); 
    setShowVideoSelector(false);
  };

  const handleSave = () => {
    if (type === "text") {
      if (!content.trim()) {
        alert("El contenido del texto no puede estar vacío");
        return;
      }
      onSave({ type, content: content.trim() });
    } else if (type === "video") {
      if (!videoId || !content) {
        alert("Debes seleccionar un video");
        return;
      }
      onSave({ type, content, videoId });
    }
  };

  return (
    <div className="space-y-6">
      {/* Selector de tipo de bloque */}
      <div className="space-y-3">
        <label className="text-slate-700 dark:text-slate-300 font-medium text-sm">Tipo de bloque:</label>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant={type === "text" ? "default" : "outline"}
            onClick={() => setType("text")}
            className={`${type === "text" 
              ? "bg-blue-600 hover:bg-blue-700 text-white" 
              : "border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            } text-sm py-3 w-full sm:w-auto`}
          >
            <Type className="h-4 w-4 mr-2" />
            Texto
          </Button>
          <Button
            variant={type === "video" ? "default" : "outline"}
            onClick={() => setType("video")}
            className={`${type === "video" 
              ? "bg-blue-600 hover:bg-blue-700 text-white" 
              : "border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            } text-sm py-3 w-full sm:w-auto`}
          >
            <Video className="h-4 w-4 mr-2" />
            Video
          </Button>
        </div>
      </div>

      {/* Contenido según el tipo */}
      {type === "text" ? (
        <div className="space-y-3">
          <label className="text-slate-700 dark:text-slate-300 font-medium text-sm">Contenido del texto:</label>
          <textarea
            className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 rounded-lg p-4 focus:border-blue-500 focus:ring-blue-500/20 focus:ring-2 resize-none transition-colors text-sm"
            rows={4}
            placeholder="Escribe el contenido del bloque de texto..."
            value={content}
            onChange={e => setContent(e.target.value)}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <label className="text-slate-700 dark:text-slate-300 font-medium text-sm">Seleccionar video:</label>
          
          {videoId && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-lg flex-shrink-0">
                  <Video className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-blue-700 dark:text-blue-300 font-medium text-sm">Video seleccionado:</p>
                  <p className="text-blue-600 dark:text-blue-400 text-sm break-words">
                    {videos.find(v => v.id === videoId)?.title || videoId}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs break-all">
                    URL: {content || 'No disponible'}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <Button 
            onClick={handleOpenVideoSelector}
            variant="outline"
            className="border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 w-full sm:w-auto text-sm py-3"
          >
            <Video className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">{videoId ? "Cambiar video" : "Seleccionar video"}</span>
            <span className="sm:hidden">{videoId ? "Cambiar" : "Seleccionar"}</span>
          </Button>

          {/* Modal de selección de videos */}
          {showVideoSelector && (
            <Dialog open={showVideoSelector} onOpenChange={setShowVideoSelector}>
              <DialogContent className="max-w-full sm:max-w-4xl mx-2 sm:mx-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 max-h-[90vh] overflow-hidden">
                <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-3 p-2 sm:p-0">
                  <Video className="h-5 w-5 flex-shrink-0" />
                  <span className="min-w-0 break-words">Selecciona un video</span>
                </DialogTitle>
                
                {loadingVideos ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-slate-600 dark:text-slate-300 text-sm">Cargando videos...</span>
                  </div>
                ) : (
                  <div className="max-h-64 sm:max-h-96 overflow-y-auto space-y-3 p-1">
                    {videos.length ? (
                      videos.map(video => (
                        <div key={video.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 transition-colors">
                          <VideoThumbnail video={video} />
                          <div className="flex-1 min-w-0 w-full sm:w-auto">
                            <h3 className="text-slate-900 dark:text-slate-100 font-medium text-sm break-words">{video.title}</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-xs break-all">ID: {video.id}</p>
                          </div>
                          <Button 
                            onClick={() => handleSelectVideo(video)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 transition-colors text-sm w-full sm:w-auto"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Usar este</span>
                            <span className="sm:hidden">Usar</span>
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                        <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">No hay videos disponibles</p>
                        <p className="text-sm px-4">Sube videos primero para poder usarlos en los manuales</p>
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
      <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-slate-200 dark:border-slate-600">
        <Button 
          variant="outline" 
          onClick={onCancel}
          className="border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm py-3 w-full sm:w-auto"
        >
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        <Button 
          onClick={handleSave}
          disabled={type === "text" ? !content.trim() : !videoId}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm py-3 w-full sm:w-auto"
        >
          <Save className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Guardar bloque</span>
          <span className="sm:hidden">Guardar</span>
        </Button>
      </div>
    </div>
  );
}
