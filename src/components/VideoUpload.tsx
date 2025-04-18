import React, { useState } from "react";
import axios from "axios";

const VideoUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setVideoUrl(null); // Reset video URL when a new file is selected
      setError(null); // Reset error message
      setProgress(0); // Reset progress
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setLoading(true);
      setProgress(0);
      setError(null); // Reset error message

      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      formData.append("description", description);

      const response = await axios.post(
        "http://localhost:9999/api/v1/videos/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            // Authorization: `Bearer ${localStorage.getItem("token")}`, // Autenticación si la necesitas
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            setProgress(percentCompleted);
          },
        }
      );

      setVideoUrl(response.data.data.fileUrl);
    } catch (error) {
      console.error("Error uploading video:", error);
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h2>Subir Video</h2>
      {error && <div style={{ color: "red" }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>Título:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div>
          <label>Descripción:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
          />
        </div>

        <div>
          <label>Seleccionar Video:</label>
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            required
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !file || isSubmitting}
          style={{ opacity: loading || !file || isSubmitting ? 0.5 : 1 }}
        >
          {loading ? "Subiendo..." : "Subir Video"}
        </button>

        {loading && (
          <div>
            <progress value={progress} max="100" />
            <span>{progress}%</span>
          </div>
        )}
      </form>

      {videoUrl && (
        <div>
          <h3>Video subido correctamente</h3>
          <video controls width="500">
            <source src={videoUrl} type={file?.type} />
            Tu navegador no soporta la reproducción de videos.
          </video>
        </div>
      )}
    </div>
  );
};

export default VideoUpload;
