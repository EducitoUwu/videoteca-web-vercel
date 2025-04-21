import React, { useState, useEffect } from 'react';
import axios from 'axios';

const VideoUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('http://localhost:9999/api/v1/categories');
        setCategories(response.data);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };

    fetchCategories();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setVideoUrl(null);
      setError(null);
      setProgress(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setLoading(true);
      setProgress(0);
      setError(null);

      // Crear categoría si se escribió una nueva
      let categoryId = selectedCategory;
      if (!selectedCategory && newCategory.trim() !== '') {
        const response = await axios.post('http://localhost:9999/api/v1/categories', {
          name: newCategory,
        });
        categoryId = response.data.id;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('description', description);
      if (categoryId) formData.append('categoryId', categoryId);

      const response = await axios.post(
        "http://localhost:9999/api/v1/videos/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
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
      console.error('Error uploading video:', error);
      setError('Failed to upload video');
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h2>Upload Video</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>Title:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div>
          <label>Description:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
          />
        </div>

        <div>
          <label>Choose video file:</label>
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            required
            disabled={loading}
          />
        </div>

        <div>
          <label>Select existing category:</label>
          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value)}
            disabled={loading}
          >
            <option value="">-- None --</option>
            {categories.map((cat: any) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Or create new category:</label>
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            disabled={loading}
          />
        </div>

        <button type="submit" disabled={loading || !file || isSubmitting}>
          {loading ? 'Uploading...' : 'Upload Video'}
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
          <h3>Video uploaded successfully</h3>
          <video controls width="500">
            <source src={videoUrl} />
            Your browser does not support video playback.
          </video>
        </div>
      )}
    </div>
  );
};

export default VideoUpload;
