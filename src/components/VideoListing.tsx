import { useEffect, useState } from "react";
import { Video } from "./VideoPlayer";
import videoService from "../services/video";

const VideoListing = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div>
      <h2>Video Listing</h2>

      {loading && <p>Loading videos...</p>}

      {error && <p style={{ color: "red" }}>{error}</p>}

      {videos.length === 0 && !loading && <p>No videos available.</p>}

      {videos.length > 0 && !loading && (
        <div style={{ marginTop: "20px" }}>
          <h3>Available Videos</h3>
          <ul>
            {videos.map((video) => (
              <li key={video.id}>
                <a
                  href={video.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {video.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default VideoListing;
