import { useEffect, useRef, useState } from "react";
import { Video } from "../types/video";
import videoService from "../services/video";

const VideoPlayer = ({ video }: { video: Video }) => {
  const [videoData, setVideoData] = useState<Video>(video);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setVideoData(video);
    
    const getSignedUrl = async () => {
      if (!video?.id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const url = await videoService.getVideoSignedUrl(video.id);
        setSignedUrl(url);
      } catch (err) {
        console.error('Error getting signed URL:', err);
        setError('Error al cargar el video');
        // Fallback a la URL original si falla
        setSignedUrl(video.fileUrl);
      } finally {
        setLoading(false);
      }
    };

    getSignedUrl();
  }, [video]);

  useEffect(() => {
    if (videoRef.current && signedUrl) {
      videoRef.current.load();
    }
  }, [signedUrl]);

  if (loading) {
    return (
      <div className="mt-3 sm:mt-4">
        <div className="w-full max-w-2xl mx-auto rounded-lg sm:rounded-xl shadow-lg bg-gray-200 h-64 flex items-center justify-center">
          <p className="text-gray-600">Cargando video...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-3 sm:mt-4">
        <div className="w-full max-w-2xl mx-auto rounded-lg sm:rounded-xl shadow-lg bg-red-100 h-64 flex items-center justify-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 sm:mt-4">
      <video
        ref={videoRef}
        controls
        className="w-full max-w-2xl mx-auto rounded-lg sm:rounded-xl shadow-lg"
        poster="/placeholder-thumbnail.jpg"
        preload="metadata"
        key={signedUrl} // Force re-render when URL changes
      >
        <source src={signedUrl || videoData.fileUrl} type={videoData.contentType} />
        Tu navegador no soporta la reproducción de videos.
      </video>
      <p className="text-xs sm:text-sm text-gray-500 mt-2 text-center px-2">
        Publicado: {new Date(videoData.createdAt).toLocaleDateString()}
      </p>
    </div>
  );
};

export default VideoPlayer;
