import { useState } from "react";

const useVideoSelection = () => {
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  const selectVideo = (videoId: string) => {
    setSelectedVideoId(videoId);
  };

  return {
    selectedVideoId,
    selectVideo,
  };
};

export default useVideoSelection;
