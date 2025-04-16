import { useEffect, useRef, useState } from "react";
import { Video } from "../types/video";

const VideoPlayer = ({ video }: { video: Video }) => {
  const [videoData, setVideoData] = useState<Video>(video);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Actualizar el estado local cuando cambia la prop
    setVideoData(video);

    // Acceder directamente al elemento de video mediante la ref
    if (videoRef.current) {
      // Cargar el nuevo video
      videoRef.current.load();
      // Si quieres reproducir automáticamente después de cargar:
      // videoRef.current.play();
    }
  }, [video]);

  return (
    <div>
      <h2>{videoData.title}</h2>
      <p>{videoData.description}</p>
      <video
        ref={videoRef}
        controls
        height={300}
        width={600}
        poster="/placeholder-thumbnail.jpg"
        preload="metadata"
      >
        <source src={videoData.fileUrl} type={videoData.contentType} />
        Tu navegador no soporta la reproducción de videos.
      </video>
      <p>Publicado: {new Date(videoData.createdAt).toLocaleDateString()}</p>
    </div>
  );
};

export default VideoPlayer;
