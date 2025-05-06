import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Video } from "@/types/video";
import videoService from "@/services/video";

const VideoListPage = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      try {
        const data = await videoService.fetchAllVideos();
        setVideos(data);
      } catch (err) {
        setError("No se pudieron cargar los videos.");
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  return (
    <div className="p-6 bg-blue-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-800">Videos Disponibles</h1>
        <Button onClick={() => navigate("/upload-video")}>Subir nuevo video</Button>
      </div>

      {loading && <p className="text-blue-600">Cargando videos...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {videos.length === 0 && !loading && (
        <p className="text-gray-600">No hay videos disponibles.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {videos.map((video) => (
          <Card key={video.id} className="hover:shadow-xl transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-blue-700">{video.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-2">
                {video.description?.slice(0, 100) || "Sin descripción"}...
              </p>
              <small className="text-gray-500 block">
                Publicado el {new Date(video.createdAt).toLocaleDateString()}
              </small>
              <Button
                className="mt-3 w-full"
                onClick={() => window.open(video.fileUrl, "_blank")}
              >
                Ver video
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default VideoListPage;
