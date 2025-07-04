import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { backendAuthFetch } from "../lib/utils";


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
        const response = await backendAuthFetch('http://localhost:9999/api/v1/categories');
        const data = await response.json();
        setCategories(data.data || data);
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
        const response = await backendAuthFetch('http://localhost:9999/api/v1/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: newCategory,
          }),
        });
        const data = await response.json();
        categoryId = data.data?.id || data.id;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('description', description);
      if (categoryId) formData.append('categoryId', categoryId);

      // Usar XMLHttpRequest para poder trackear el progreso de upload
      const uploadPromise = new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e: ProgressEvent) => {
          if (e.lengthComputable) {
            const percentCompleted = Math.round((e.loaded * 100) / e.total);
            setProgress(percentCompleted);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (error) {
              reject(new Error('Error parsing response'));
            }
          } else {
            reject(new Error(`HTTP Error: ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error'));
        });

        const token = localStorage.getItem("accessToken");
        xhr.open('POST', 'http://localhost:9999/api/v1/videos/upload');
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
      });

      const response: any = await uploadPromise;
      setVideoUrl(response.data.fileUrl);
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
              
