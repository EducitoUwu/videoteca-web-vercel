import { useEffect, useRef, useState } from "react";
import { Video } from "../types/video";

const VideoPlayer = ({ video }: { video: Video }) => {
  const [videoData, setVideoData] = useState<Video>(video);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setVideoData(video);
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [video]);

  return (
    <div className="mt-3 sm:mt-4">
      <video
        ref={videoRef}
        controls
        className="w-full max-w-2xl mx-auto rounded-lg sm:rounded-xl shadow-lg"
        poster="/placeholder-thumbnail.jpg"
        preload="metadata"
      >
        <source src={videoData.fileUrl} type={videoData.contentType} />
        Tu navegador no soporta la reproducción de videos.
      </video>
      <p className="text-xs sm:text-sm text-gray-500 mt-2 text-center px-2">
        Publicado: {new Date(videoData.createdAt).toLocaleDateString()}
      </p>
    </div>
  );
};

export default VideoPlayer;
