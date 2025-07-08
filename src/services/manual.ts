import { backendAuthFetch } from "@/lib/utils";

// Función para obtener URL firmada de video - reutilizada desde video service
const getVideoSignedUrl = async (videoId: string): Promise<string> => {
  const response = await backendAuthFetch(
    `${import.meta.env.VITE_API_URL}/videos/${videoId}/signed-url`
  );
  const data = await response.json();
  return data.data; // Retorna directamente la URL firmada
};

export const createManualSubsection = async (data: {
  section: string;
  subsection: string;
  description: string;
  position: 'before' | 'after';
}) => {
  const response = await backendAuthFetch(
    `${import.meta.env.VITE_API_URL}/manual/subsection`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );
  return await response.json();
};

export default { createManualSubsection, getVideoSignedUrl };