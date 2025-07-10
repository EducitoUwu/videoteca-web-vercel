import { backendAuthFetch } from "@/lib/utils";

const fetchAllVideos = async () => {
  const response = await backendAuthFetch(`${import.meta.env.VITE_API_URL}/videos`);
  const data = await response.json();
  return data.data || data; // Aseguramos que siempre retorne un array
};

const fetchVideoById = async ({ id }: { id: string }) => {
  const response = await backendAuthFetch(`${import.meta.env.VITE_API_URL}/videos/${id}`);
  const data = await response.json();
  return data.data || data;
};

const getVideoSignedUrl = async (videoId: string): Promise<string> => {
  const response = await backendAuthFetch(`${import.meta.env.VITE_API_URL}/videos/${videoId}/signed-url`);
  const data = await response.json();
  return data.data; // Retorna directamente la URL firmada
};

const deleteVideo = async (videoId: string): Promise<void> => {
  const response = await backendAuthFetch(`${import.meta.env.VITE_API_URL}/videos/${videoId}`, {
    method: 'DELETE'
  });
  
  if (!response.ok) {
    throw new Error('Error al eliminar el video');
  }
};

export default { fetchAllVideos, fetchVideoById, getVideoSignedUrl, deleteVideo };
