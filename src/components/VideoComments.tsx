import { useState, useEffect, useContext } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent} from './ui/card';
import { Badge } from './ui/badge';
import { Trash2, MessageCircle, Send, } from 'lucide-react';
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
    return user && (user.role === 'administrador' || user.id === comment.userId);
  };


  const getRoleBadgeStyleDark = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/20 text-red-300 border-red-400/30';
      case 'estudiante':
        return 'bg-green-500/20 text-green-300 border-green-400/30';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-400/30';
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
    <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-6">
      {/* Header de comentarios */}
      <div className="flex items-center gap-3 sm:gap-4 pb-4 sm:pb-6 border-b border-blue-400/30">
        <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
          <MessageCircle className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-xl sm:text-3xl font-black bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent break-words">
            Comentarios
          </h3>
          <p className="text-xs sm:text-sm text-gray-300 mt-1">
            {comments.length} {comments.length === 1 ? 'comentario' : 'comentarios'}
          </p>
        </div>
      </div>

      {/* Formulario para nuevo comentario */}
      {user && (
        <Card className="border-2 border-blue-400/30 bg-slate-800/70 backdrop-blur-xl shadow-2xl shadow-blue-500/10 rounded-xl sm:rounded-2xl">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {/* Avatar del usuario actual */}
              <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-lg ${getAvatarColor(user.role)} flex-shrink-0`}>
                {getInitials(user.fullName)}
              </div>
              
              <div className="flex-1 min-w-0">
                <form onSubmit={handleSubmitComment} className="space-y-3 sm:space-y-4">
                  <Textarea
                    placeholder="Comparte tu opinión sobre este video..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[100px] sm:min-h-[120px] resize-none border-2 border-blue-400/30 focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20 bg-slate-700/50 text-white placeholder:text-gray-300 backdrop-blur-md rounded-lg sm:rounded-xl text-sm sm:text-base"
                    disabled={submitting}
                    maxLength={1000}
                  />
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                    <span className="text-xs text-gray-300 bg-slate-700/50 px-2 sm:px-3 py-1 rounded-full border border-blue-400/20 text-center sm:text-left">
                      {newComment.length}/1000 caracteres
                    </span>
                    <Button
                      type="submit"
                      disabled={!newComment.trim() || submitting}
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all duration-200 disabled:opacity-50 hover:scale-105 text-sm sm:text-base w-full sm:w-auto"
                    >
                      {submitting ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span className="hidden sm:inline">Enviando...</span>
                          <span className="sm:hidden">...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">Publicar comentario</span>
                          <span className="sm:hidden">Publicar</span>
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
      <div className="space-y-3 sm:space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12 sm:py-16">
            <div className="text-center">
              <div className="w-8 h-8 sm:w-12 sm:h-12 border-4 border-blue-400/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3 sm:mb-4"></div>
              <p className="text-gray-300 font-medium text-sm sm:text-base">Cargando comentarios...</p>
            </div>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12 sm:py-20 bg-slate-800/50 backdrop-blur-md rounded-xl sm:rounded-2xl border-2 border-dashed border-blue-400/30">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-slate-700 to-slate-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <MessageCircle className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
            </div>
            <h4 className="text-lg sm:text-xl font-bold text-gray-200 mb-2 sm:mb-3">No hay comentarios aún</h4>
            {user ? (
              <p className="text-gray-400 text-base sm:text-lg px-4">¡Sé el primero en compartir tu opinión!</p>
            ) : (
              <p className="text-gray-400 text-base sm:text-lg px-4">Inicia sesión para poder comentar</p>
            )}
          </div>
        ) : (
          comments.map((comment) => (
            <Card 
              key={comment.id} 
              className="border-2 border-blue-400/20 hover:border-blue-400/40 shadow-lg hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-200 bg-slate-800/60 backdrop-blur-xl rounded-xl sm:rounded-2xl"
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  {/* Avatar del comentarista */}
                  <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-lg flex-shrink-0 ${getAvatarColor(comment.user?.role || 'user')}`}>
                    {getInitials(comment.user?.fullName || 'U')}
                  </div>
                  
                  {/* Contenido del comentario */}
                  <div className="flex-1 min-w-0">
                    {/* Header del comentario */}
                    <div className="flex flex-col sm:flex-row items-start justify-between mb-3 sm:mb-4 gap-2 sm:gap-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                        <h5 className="font-bold text-white text-base sm:text-lg break-words">
                          {comment.user?.fullName || 'Usuario desconocido'}
                        </h5>
                        {comment.user?.role && (
                          <Badge className={`text-xs px-2 sm:px-3 py-1 rounded-full font-medium border backdrop-blur-sm w-fit ${getRoleBadgeStyleDark(comment.user.role)}`}>
                            {comment.user.role === 'admin' ? '👑 Admin' : 
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
                          className="text-gray-400 hover:text-red-400 hover:bg-red-500/10 p-1 sm:p-2 rounded-lg sm:rounded-xl transition-colors duration-200 self-end sm:self-auto"
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </Button>
                      )}
                    </div>
                    
                    {/* Fecha del comentario */}
                    <div className="mb-3 sm:mb-4">
                      <span className="text-xs sm:text-sm text-gray-300 bg-slate-700/50 px-2 sm:px-3 py-1 rounded-full border border-blue-400/20">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    
                    {/* Texto del comentario */}
                    <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-slate-700/50 rounded-lg sm:rounded-xl border border-blue-400/20 backdrop-blur-sm">
                      <p className="text-gray-200 leading-relaxed whitespace-pre-wrap text-sm sm:text-base break-words">
                        {comment.comment}
                      </p>
                    </div>
                    
                    
                    <div className="flex items-center gap-2 sm:gap-4 pt-2 sm:pt-3 border-t border-blue-400/20">
                      
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