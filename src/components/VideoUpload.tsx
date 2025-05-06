import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


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
    <Card className="p-4 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-blue-800">Subir Video</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <div className="text-red-500 mb-2">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="file">Seleccionar archivo de video</Label>
            <Input
              id="file"
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              required
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="category">Seleccionar categoría existente</Label>
            <Select
              value={selectedCategory || ''}
              onValueChange={(value) => setSelectedCategory(value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="-- Ninguna --" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="newCategory">O crear nueva categoría</Label>
            <Input
              id="newCategory"
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              disabled={loading}
            />
          </div>

          <Button type="submit" disabled={loading || !file || isSubmitting} className="w-full">
            {loading ? "Subiendo..." : "Subir Video"}
          </Button>

          {loading && (
            <div className="mt-4">
              <Progress value={progress} />
              <span className="text-sm text-blue-700">{progress}%</span>
            </div>
          )}
        </form>

        {videoUrl && (
          <div className="mt-6">
            <h3 className="text-green-600 font-semibold mb-2">¡Video subido con éxito!</h3>
            <video controls width="100%" className="rounded-md shadow">
              <source src={videoUrl} />
              Tu navegador no soporta la reproducción de video.
            </video>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VideoUpload;
              
