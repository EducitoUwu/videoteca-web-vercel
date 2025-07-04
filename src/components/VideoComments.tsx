import { useState, useEffect, useContext } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { Trash2, MessageCircle, Send, Heart, User } from 'lucide-react';
import { AuthContext } from '../contexts/AuthProvider';
import videoCommentService, { VideoComment, CreateVideoCommentDto } from '../services/videoComment';

interface VideoCommentsProps {
  videoId: string;
}

const VideoComments = ({ videoId }: VideoCommentsProps) => {
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchComments();
  }, [videoId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const data = await videoCommentService.getCommentsByVideoId(videoId);
      setComments(data);
    } catch (error) {
      console.error('Error al cargar comentarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setSubmitting(true);
    try {
      const commentData: CreateVideoCommentDto = {
        comment: newComment.trim(),
        videoId: videoId,
        userId: user.id,
      };
      
      const createdComment = await videoCommentService.createComment(commentData);
      
      const commentWithUser = {
        ...createdComment,
        user: createdComment.user || {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role
        }
      };
      
      setComments(prev => [commentWithUser, ...prev]);
      setNewComment('');
    } catch (error) {
      console.error('Error al crear comentario:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await videoCommentService.deleteComment(commentId);
      setComments(prev => prev.filter(comment => comment.id !== commentId));
    } catch (error) {
      console.error('Error al eliminar comentario:', error);
    }
  };

  const canDeleteComment = (comment: VideoComment) => {
    return user && (user.role === 'admin' || user.id === comment.userId);
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'estudiante':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-gradient-to-br from-red-500 to-red-600';
      case 'estudiante':
        return 'bg-gradient-to-br from-green-500 to-green-600';
      default:
        return 'bg-gradient-to-br from-blue-500 to-blue-600';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 60) {
      return `Hace ${diffMinutes} min`;
    } else if (diffHours < 24) {
      return `Hace ${diffHours}h`;
    } else if (diffDays < 7) {
      return `Hace ${diffDays}d`;
    } else {
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  return (
    <div className="mt-8 space-y-6">
      {/* Header de comentarios */}
      <div className="flex items-center gap-4 pb-6 border-b border-gray-200">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
          <MessageCircle className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900">
            Comentarios
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {comments.length} {comments.length === 1 ? 'comentario' : 'comentarios'}
          </p>
        </div>
      </div>

      {/* Formulario para nuevo comentario */}
      {user && (
        <Card className="border-2 border-blue-100 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex gap-4">
              {/* Avatar del usuario actual */}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg ${getAvatarColor(user.role)}`}>
                {getInitials(user.fullName)}
              </div>
              
              <div className="flex-1">
                <form onSubmit={handleSubmitComment} className="space-y-4">
                  <Textarea
                    placeholder="Comparte tu opinión sobre este video..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[120px] resize-none border-2 border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 bg-white/80 text-gray-900 placeholder:text-gray-500"
                    disabled={submitting}
                    maxLength={1000}
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 bg-white/70 px-3 py-1 rounded-full border">
                      {newComment.length}/1000 caracteres
                    </span>
                    <Button
                      type="submit"
                      disabled={!newComment.trim() || submitting}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                    >
                      {submitting ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Enviando...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Send className="w-4 h-4" />
                          Publicar comentario
                        </div>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de comentarios */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Cargando comentarios...</p>
            </div>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-10 h-10 text-gray-400" />
            </div>
            <h4 className="text-xl font-bold text-gray-700 mb-3">No hay comentarios aún</h4>
            {user ? (
              <p className="text-gray-500 text-lg">¡Sé el primero en compartir tu opinión!</p>
            ) : (
              <p className="text-gray-500 text-lg">Inicia sesión para poder comentar</p>
            )}
          </div>
        ) : (
          comments.map((comment, index) => (
            <Card 
              key={comment.id} 
              className="border-2 border-gray-100 hover:border-blue-200 shadow-md hover:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm"
            >
              <CardContent className="p-6">
                <div className="flex gap-4">
                  {/* Avatar del comentarista */}
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg flex-shrink-0 ${getAvatarColor(comment.user?.role || 'user')}`}>
                    {getInitials(comment.user?.fullName || 'U')}
                  </div>
                  
                  {/* Contenido del comentario */}
                  <div className="flex-1 min-w-0">
                    {/* Header del comentario */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h5 className="font-bold text-gray-900 text-lg">
                          {comment.user?.fullName || 'Usuario desconocido'}
                        </h5>
                        {comment.user?.role && (
                          <Badge className={`text-xs px-3 py-1 rounded-full font-medium border ${getRoleBadgeStyle(comment.user.role)}`}>
                            {comment.user.role === 'admin' ? '👑 Administrador' : 
                             comment.user.role === 'estudiante' ? '🎓 Estudiante' : '👤 Usuario'}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Botón de eliminar */}
                      {canDeleteComment(comment) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-xl transition-colors duration-200"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      )}
                    </div>
                    
                    {/* Fecha del comentario */}
                    <div className="mb-4">
                      <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    
                    {/* Texto del comentario */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-base">
                        {comment.comment}
                      </p>
                    </div>
                    
                    
                    <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                      
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default VideoComments;