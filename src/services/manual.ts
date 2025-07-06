import { backendAuthFetch } from "@/lib/utils";

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