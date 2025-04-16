import { useEffect, useState } from "react";
import videoService from "../services/video";
import { Video } from "../types/video";

const useVideoData = ({ videoId }: { videoId: string }) => {
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideo = async () => {
      if (!videoId) {
        setVideo(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await videoService.fetchVideoById({
          id: videoId,
        });

        setVideo(response);
      } catch (err) {
        setError("Error al cargar el video");
        console.error("Error fetching video:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [videoId]);

  return {
    video,
    loading,
    error,
    isSelected: !!videoId,
  };
};

export default useVideoData;
