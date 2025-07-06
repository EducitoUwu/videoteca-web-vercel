import { useEffect, useState } from "react";
import useVideoSelection from "../hooks/useVideoSelection";
import videoService from "../services/video";
import VideoPlayer from "./VideoPlayer";
import { Video } from "../types/video";
import useVideoData from "../hooks/useVideoData";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";


const VideoListing = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { selectVideo, selectedVideoId } = useVideoSelection();
  const { video } = useVideoData({
    videoId: selectedVideoId || "",
  });

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await videoService.fetchAllVideos();
        setVideos(data);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  const handleVideoSelect = (id: string) => {
    selectVideo(id);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-blue-800 mb-4">Reproductor de Videos</h1>
      {video && (
        <Card className="mb-6 bg-blue-50">
          <CardHeader>
            <CardTitle>{video.title}</CardTitle>
          </CardHeader>
          <CardContent>
            {video.description && <p>{video.description}</p>}
            <small>
              Creado: {new Date(video.createdAt).toLocaleDateString()}
            </small>
            <VideoPlayer video={video} />
          </CardContent>
        </Card>
      )}

      <h2 className="text-xl font-semibold text-blue-700 mb-2">Listado de Videos</h2>

      {loading && <p>Cargando videos...</p>}

      {error && <p className="text-red-500">{error}</p>}

      {videos.length === 0 && !loading && <p>No hay videos disponibles.</p>}

      {videos.length > 0 && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video) => (
            <Card
              key={video.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleVideoSelect(video.id)}
            >
              <CardHeader>
                <CardTitle>{video.title}</CardTitle>
              </CardHeader>
              <CardContent>
                {video.category && (
                  <p className="italic text-gray-600">
                    Categoría: {video.category.name}
                  </p>
                )}
                {video.description && <p>{video.description}</p>}
                <small>
                  Creado: {new Date(video.createdAt).toLocaleDateString()}
                </small>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoListing;
