import axios from "axios";
import { backendAuthFetch } from "@/lib/utils";

const fetchAllVideos = async () => {
  const response = await backendAuthFetch("http://localhost:9999/api/v1/videos");
  const data = await response.json();
  return data.data || data; // Aseguramos que siempre retorne un array
};

const fetchVideoById = async ({ id }: { id: string }) => {
  const response = await backendAuthFetch(`http://localhost:9999/api/v1/videos/${id}`);
  const data = await response.json();
  return data.data || data;
};


export default { fetchAllVideos, fetchVideoById };
