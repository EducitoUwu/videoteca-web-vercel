import { useState, useEffect } from "react";
import videoService from "../services/video";

export interface Video {
  id: string;
  title: string;
  fileKey: string;
  fileUrl: string;
  contentType: string;
  fileSize: number;
  description: string;
  createdAt: string;
}

const VideoPlayer = ({ videoId }: { videoId: string }) => {
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setLoading(true);
        const response = await videoService.fetchAllVideos();
        setVideo(response.data.data);
      } catch (err) {
        setError("Error al cargar el video");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [videoId]);

  if (loading) return <div>Cargando video...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!video) return <div>No se encontró el video</div>;

  return (
    <div>
      <h2>{video.title}</h2>
      <p>{video.description}</p>
      <video
        controls
        width="100%"
        poster="/placeholder-thumbnail.jpg"
        preload="metadata"
      >
        <source src={video.fileUrl} type={video.contentType} />
        Tu navegador no soporta la reproducción de videos.
      </video>
      <p>Publicado: {new Date(video.createdAt).toLocaleDateString()}</p>
    </div>
  );
};

export default VideoPlayer;
