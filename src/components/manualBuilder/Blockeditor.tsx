import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

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
    fetch("http://localhost:9999/api/v1/videos")
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
    <div className="space-y-4">
      <div>
        <label className="font-semibold">Tipo de bloque:</label>
        <select
          value={type}
          onChange={e => setType(e.target.value as Block["type"])}
          className="ml-2 rounded border px-2 py-1"
        >
          <option value="text">Texto</option>
          <option value="video">Video</option>
        </select>
      </div>

      {type === "text" ? (
        <textarea
          className="w-full border rounded p-2"
          rows={4}
          placeholder="Escribe el contenido del bloque de texto"
          value={content}
          onChange={e => setContent(e.target.value)}
        />
      ) : (
        <div>
          <Button onClick={handleOpenVideoSelector}>
            {videoId ? "Cambiar video" : "Seleccionar video"}
          </Button>
          {videoId && (
            <div className="mt-2">
              <span className="text-sm">Video seleccionado: </span>
              {videos.find(v => v.id === videoId)?.title || videoId}
            </div>
          )}

          {/* Modal/Listado de videos */}
          {showVideoSelector && (
            <Dialog open={showVideoSelector} onOpenChange={setShowVideoSelector}>
              <DialogContent>
                <DialogTitle>Selecciona un video</DialogTitle>
                {loadingVideos ? (
                  <p>Cargando videos...</p>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {videos.length ? (
                      videos.map(video => (
                        <div key={video.id} className="flex items-center gap-2 border-b py-2">
                          <video src={video.url} width={100} controls className="rounded" />
                          <span className="flex-1">{video.title}</span>
                          <Button onClick={() => handleSelectVideo(video)}>
                            Usar este
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p>No hay videos disponibles.</p>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={handleSave}>Guardar bloque</Button>
      </div>
    </div>
  );
}
