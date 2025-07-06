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


export default { fetchAllVideos, fetchVideoById };
