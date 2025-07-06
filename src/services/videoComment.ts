const API_BASE_URL = `${import.meta.env.VITE_API_URL}`;

export interface VideoComment {
  id: string;
  comment: string;
  createdAt: string;
  updatedAt: string;
  videoId: string;
  userId: string;
  user?: { // Hacer opcional
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
}

export interface CreateVideoCommentDto {
  comment: string;
  videoId: string;
  userId: string;
}

class VideoCommentService {
  private getAuthHeaders() {
    const token = localStorage.getItem("accessToken");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getCommentsByVideoId(videoId: string): Promise<VideoComment[]> {
    const response = await fetch(`${API_BASE_URL}/video-comments/video/${videoId}`, {
      headers: this.getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error("Error al obtener comentarios");
    }
    
    const result = await response.json();
    console.log('Respuesta del servidor:', result);
    return result.data || [];
  }

  async createComment(commentData: CreateVideoCommentDto): Promise<VideoComment> {
    console.log('Enviando comentario:', commentData);
    const response = await fetch(`${API_BASE_URL}/video-comments`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(commentData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error del servidor:", errorData);
      throw new Error("Error al crear comentario");
    }
    
    const result = await response.json();
    console.log('Respuesta completa después de crear:', JSON.stringify(result, null, 2));
    return result.data;
  }

  async deleteComment(commentId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/video-comments/${commentId}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error("Error al eliminar comentario");
    }
  }
}

export default new VideoCommentService();