import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { backendAuthFetch } from "@/lib/utils";
import { Type, Video, Play, Save, X } from "lucide-react";



interface Block {
  id?: string;
  type: "text" | "video";
  content?: string;       // para texto
  videoId?: string;       // para video
}

interface Video {
  id: string;
  title: string;
  url: string;
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

  // Cargar videos al abrir el selector
  const handleOpenVideoSelector = () => {
    setShowVideoSelector(true);
    setLoadingVideos(true);
    backendAuthFetch("http://localhost:9999/api/v1/videos")
      .then(res => res.json())
      .then(data => setVideos(Array.isArray(data) ? data : data.data))
      .finally(() => setLoadingVideos(false));
  };

  const handleSelectVideo = (vid: Video) => {
    setVideoId(vid.id);
    setShowVideoSelector(false);
  };

  const handleSave = () => {
    if (type === "text") {
      onSave({ type, content });
    } else {
      const video = videos.find((v) => v.id === videoId);
      if (video) {
        onSave({ type, content: video.url, videoId: video.id });
      } else {
        alert("No se encontró la url del video seleccionado");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Selector de tipo de bloque */}
      <div className="space-y-2">
        <label className="text-purple-300 font-medium text-sm">Tipo de bloque:</label>
        <div className="flex gap-3">
          <Button
            variant={type === "text" ? "default" : "outline"}
            onClick={() => setType("text")}
            className={type === "text" 
              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" 
              : "border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
            }
          >
            <Type className="h-4 w-4 mr-2" />
            Texto
          </Button>
          <Button
            variant={type === "video" ? "default" : "outline"}
            onClick={() => setType("video")}
            className={type === "video" 
              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" 
              : "border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
            }
          >
            <Video className="h-4 w-4 mr-2" />
            Video
          </Button>
        </div>
      </div>

      {/* Contenido según el tipo */}
      {type === "text" ? (
        <div className="space-y-2">
          <label className="text-purple-300 font-medium text-sm">Contenido del texto:</label>
          <textarea
            className="w-full bg-black/20 border border-purple-500/30 text-white placeholder:text-gray-400 rounded-lg p-4 focus:border-purple-400 focus:ring-purple-400/20 focus:ring-2 resize-none transition-all duration-300"
            rows={6}
            placeholder="Escribe el contenido del bloque de texto..."
            value={content}
            onChange={e => setContent(e.target.value)}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <label className="text-purple-300 font-medium text-sm">Seleccionar video:</label>
          
          {videoId && (
            <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/30">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-purple-500/20 rounded-lg">
                  <Video className="h-5 w-5 text-purple-300" />
                </div>
                <div className="flex-1">
                  <p className="text-purple-200 font-medium">Video seleccionado:</p>
                  <p className="text-purple-300 text-sm">
                    {videos.find(v => v.id === videoId)?.title || videoId}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <Button 
            onClick={handleOpenVideoSelector}
            variant="outline"
            className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10 hover:text-purple-200 transition-all duration-300"
          >
            <Video className="h-4 w-4 mr-2" />
            {videoId ? "Cambiar video" : "Seleccionar video"}
          </Button>

          {/* Modal de selección de videos */}
          {showVideoSelector && (
            <Dialog open={showVideoSelector} onOpenChange={setShowVideoSelector}>
              <DialogContent className="max-w-4xl bg-black/90 backdrop-blur-xl border border-purple-500/30">
                <DialogTitle className="text-xl font-bold text-purple-300 flex items-center gap-3">
                  <Video className="h-6 w-6" />
                  Selecciona un video
                </DialogTitle>
                
                {loadingVideos ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
                    <span className="ml-3 text-purple-300">Cargando videos...</span>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto space-y-3">
                    {videos.length ? (
                      videos.map(video => (
                        <div key={video.id} className="flex items-center gap-4 p-4 bg-purple-500/5 rounded-lg border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300">
                          <video 
                            src={video.url} 
                            className="w-32 h-20 object-cover rounded-lg border border-purple-500/30" 
                            preload="metadata"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="text-purple-200 font-medium truncate">{video.title}</h3>
                            <p className="text-purple-400 text-sm truncate">{video.url}</p>
                          </div>
                          <Button 
                            onClick={() => handleSelectVideo(video)}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-6 transition-all duration-300"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Usar este
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 text-gray-400">
                        <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">No hay videos disponibles</p>
                        <p className="text-sm">Sube videos primero para poder usarlos en los manuales</p>
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
      <div className="flex gap-3 justify-end pt-4 border-t border-purple-500/20">
        <Button 
          variant="outline" 
          onClick={onCancel}
          className="border-gray-500/30 text-gray-400 hover:bg-gray-500/10 hover:text-gray-300 transition-all duration-300"
        >
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        <Button 
          onClick={handleSave}
          disabled={type === "text" ? !content.trim() : !videoId}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-6 transition-all duration-300 disabled:opacity-50"
        >
          <Save className="h-4 w-4 mr-2" />
          Guardar bloque
        </Button>
      </div>
    </div>
  );
}
