import { useEffect, useState } from "react";
import useVideoSelection from "../hooks/useVideoSelection";
import videoService from "../services/video";
import VideoPlayer from "./VideoPlayer";
import { Video } from "../types/video";
import useVideoData from "../hooks/useVideoData";

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
    <div>
      <h1>Video Player</h1>
      {video && (
        <div style={{ marginBottom: "20px" }}>
          <h3>Selected Video</h3>
          <p>{video.title}</p>
          {video.description && <p>{video.description}</p>}
          <small>
            Created: {new Date(video.createdAt).toLocaleDateString()}
          </small>
          <VideoPlayer video={video} />
        </div>
      )}

      <h2>Video Selection</h2>
      <p>Select a video to play</p>

      <h2>Video Listing</h2>

      {loading && <p>Loading videos...</p>}

      {error && <p style={{ color: "red" }}>{error}</p>}

      {videos.length === 0 && !loading && <p>No videos available.</p>}

      {videos.length > 0 && !loading && (
        <div style={{ marginTop: "20px" }}>
          <h3>Available Videos</h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {videos.map((video) => (
              <li
                key={video.id}
                style={{
                  margin: "10px 0",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
                onClick={() => handleVideoSelect(video.id)}
              >
                <h4>{video.title}</h4>
                {video.description && <p>{video.description}</p>}
                <small>
                  Created: {new Date(video.createdAt).toLocaleDateString()}
                </small>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default VideoListing;
