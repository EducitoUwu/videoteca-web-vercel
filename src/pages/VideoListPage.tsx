import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthProvider';
import VideoListing from '../components/VideoListing';
import { Button } from '../components/ui/button';

const VideoListPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <div className="p-4">
      <h1 className="text-lg font-bold mb-4">Videos disponibles</h1>
      {user?.role === 'admin' && (
        <Button onClick={() => navigate('/upload-video')} className="mb-4">
          Subir nuevo video
        </Button>
      )}
      <VideoListing />
    </div>
  );
};

export default VideoListPage;