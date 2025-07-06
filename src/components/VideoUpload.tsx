import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, CheckCircle, AlertCircle, Video, FileText, Tag, Plus } from 'lucide-react';
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
  const [dragActive, setDragActive] = useState(false);

  // Tamaño máximo permitido: 500MB
  const MAX_FILE_SIZE = 500 * 1024 * 1024;
  
  // Formatos de video permitidos
  const ALLOWED_FORMATS = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'];

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await backendAuthFetch('${import.meta.env.VITE_API_URL}/categories');
        const data = await response.json();
        setCategories(data.data || data);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };

    fetchCategories();
  }, []);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FORMATS.includes(file.type)) {
      return 'Formato de archivo no permitido. Solo se aceptan: MP4, AVI, MOV, WMV, WebM';
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return `El archivo es demasiado grande. Tamaño máximo: ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
    }
    
    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const validationError = validateFile(selectedFile);
      
      if (validationError) {
        setError(validationError);
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      setVideoUrl(null);
      setError(null);
      setProgress(0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      const validationError = validateFile(selectedFile);
      
      if (validationError) {
        setError(validationError);
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      setVideoUrl(null);
      setError(null);
      setProgress(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || isSubmitting) return;

    // Validaciones adicionales
    if (!title.trim()) {
      setError('El título es obligatorio');
      return;
    }

    if (!selectedCategory && !newCategory.trim()) {
      setError('Debes seleccionar una categoría existente o crear una nueva');
      return;
    }

    try {
      setIsSubmitting(true);
      setLoading(true);
      setProgress(0);
      setError(null);

      let categoryId = selectedCategory;
      
      // Crear nueva categoría si es necesario
      if (!selectedCategory && newCategory.trim() !== '') {
        try {
          const response = await backendAuthFetch('${import.meta.env.VITE_API_URL}/categories', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: newCategory.trim(),
            }),
          });
          
          if (!response.ok) {
            throw new Error('Error al crear la categoría');
          }
          
          const data = await response.json();
          categoryId = data.data?.id || data.id;
          
          // Actualizar lista de categorías
          setCategories(prev => [...prev, { id: categoryId, name: newCategory.trim() }] as any);
        } catch (categoryError) {
          throw new Error('No se pudo crear la categoría');
        }
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      if (categoryId) formData.append('categoryId', categoryId);

      // Usar XMLHttpRequest para trackear progreso
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
              reject(new Error('Error al procesar la respuesta del servidor'));
            }
          } else {
            reject(new Error(`Error del servidor: ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Error de conexión. Verifica tu conexión a internet.'));
        });

        xhr.addEventListener('timeout', () => {
          reject(new Error('La subida tardó demasiado tiempo. Intenta con un archivo más pequeño.'));
        });

        const token = localStorage.getItem("accessToken");
        xhr.open('POST', '${import.meta.env.VITE_API_URL}/videos/upload');
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.timeout = 300000; // 5 minutos de timeout
        xhr.send(formData);
      });

      const response: any = await uploadPromise;
      setVideoUrl(response.data.fileUrl);
      
      // Limpiar formulario después del éxito
      setTitle('');
      setDescription('');
      setFile(null);
      setSelectedCategory(null);
      setNewCategory('');
      setProgress(0);
      
    } catch (error: any) {
      console.error('Error uploading video:', error);
      setError(error.message || 'Error al subir el video. Intenta nuevamente.');
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4 sm:p-6">
      {/* Efectos de fondo */}
      <div className="absolute inset-0">
        <div className="absolute top-20 -left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="max-w-2xl mx-auto relative z-10">
        <Card className="border-2 border-blue-400/30 bg-slate-800/80 backdrop-blur-xl shadow-2xl shadow-blue-500/10 rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-800/60 to-slate-700/60 p-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Upload className="w-7 h-7 text-white" />
              </div>
              <div>
                <CardTitle className="text-3xl font-black bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  Subir Video
                </CardTitle>
                <p className="text-gray-300 mt-1">Comparte tu contenido con la comunidad</p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-400/30 rounded-xl backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <span className="text-red-300 font-medium">{error}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Título */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-white font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Título del video
                </Label>
                <Input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-slate-700/50 border-blue-400/30 focus:border-blue-400/60 text-white placeholder:text-gray-400 backdrop-blur-sm rounded-xl"
                  placeholder="Ingresa un título descriptivo..."
                />
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-white font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Descripción
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={loading}
                  className="min-h-[120px] bg-slate-700/50 border-blue-400/30 focus:border-blue-400/60 text-white placeholder:text-gray-400 backdrop-blur-sm rounded-xl resize-none"
                  placeholder="Describe el contenido del video..."
                />
              </div>

              {/* Archivo de video con drag & drop */}
              <div className="space-y-2">
                <Label htmlFor="file" className="text-white font-semibold flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Archivo de video
                </Label>
                <div 
                  className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 ${
                    dragActive 
                      ? 'border-blue-400 bg-blue-500/10' 
                      : 'border-blue-400/30 bg-slate-700/30'
                  } hover:border-blue-400/60 hover:bg-slate-700/50`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Input
                    id="file"
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    required
                    disabled={loading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  
                  {!file ? (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Upload className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-white font-semibold mb-2">
                        Arrastra tu video aquí o haz clic para seleccionar
                      </h3>
                      <p className="text-gray-400 text-sm mb-4">
                        Formatos soportados: MP4, AVI, MOV, WMV, WebM
                      </p>
                      <p className="text-gray-500 text-xs">
                        Tamaño máximo: 500MB
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-white font-semibold mb-2">{file.name}</h3>
                      <p className="text-green-300 text-sm mb-2">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                      <p className="text-gray-400 text-xs">
                        Haz clic para cambiar el archivo
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Categoría existente */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-white font-semibold flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Categoría existente
                </Label>
                <Select
                  value={selectedCategory || ''}
                  onValueChange={(value: string) => setSelectedCategory(value)}
                  disabled={loading}
                >
                  <SelectTrigger className="bg-slate-700/50 border-blue-400/30 text-white backdrop-blur-sm rounded-xl">
                    <SelectValue placeholder="Selecciona una categoría..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800/95 border-gray-600 backdrop-blur-md">
                    {categories.map((cat: any) => (
                      <SelectItem key={cat.id} value={cat.id} className="text-white hover:bg-blue-500/20 focus:bg-blue-500/20">
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Nueva categoría */}
              <div className="space-y-2">
                <Label htmlFor="newCategory" className="text-white font-semibold flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  O crear nueva categoría
                </Label>
                <Input
                  id="newCategory"
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  disabled={loading}
                  className="bg-slate-700/50 border-blue-400/30 focus:border-blue-400/60 text-white placeholder:text-gray-400 backdrop-blur-sm rounded-xl"
                  placeholder="Nombre de la nueva categoría..."
                />
              </div>

              {/* Botón de submit */}
              <Button 
                type="submit" 
                disabled={loading || !file || isSubmitting} 
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-blue-500/30 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Subiendo...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Subir Video
                  </div>
                )}
              </Button>

              {/* Barra de progreso */}
              {loading && (
                <div className="space-y-3 p-4 bg-slate-700/50 rounded-xl border border-blue-400/30">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-medium">Subiendo archivo...</span>
                    <span className="text-blue-300 font-bold">{progress}%</span>
                  </div>
                  <Progress 
                    value={progress} 
                    className="h-3 bg-slate-600/50"
                  />
                  <div className="text-xs text-gray-400 text-center">
                    Por favor, mantén esta página abierta hasta que termine la subida
                  </div>
                </div>
              )}
            </form>

            {/* Video subido con éxito */}
            {videoUrl && (
              <div className="mt-8 p-6 bg-green-500/20 border border-green-400/30 rounded-xl backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <h3 className="text-green-300 font-bold text-lg">¡Video subido con éxito!</h3>
                </div>
                <div className="bg-slate-800/50 rounded-xl overflow-hidden border border-green-400/20">
                  <video controls width="100%" className="w-full">
                    <source src={videoUrl} />
                    Tu navegador no soporta la reproducción de video.
                  </video>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-green-300 text-sm">
                    El video ya está disponible en la biblioteca de videos
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VideoUpload;
              
