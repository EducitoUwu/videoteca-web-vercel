import { useState, useEffect, useContext } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { Trash2, MessageCircle, Send } from 'lucide-react';
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
      console.log('Comentarios recibidos:', data); // Para debug
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
      console.log('Comentario creado - objeto completo:', JSON.stringify(createdComment, null, 2));
      
      // Si el backend no devuelve la información del usuario, la agregamos manualmente
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

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-blue-900">
          Comentarios ({comments.length})
        </h3>
      </div>

      {/* Formulario para nuevo comentario */}
      {user && (
        <Card className="border-blue-200">
          <CardContent className="pt-4">
            <form onSubmit={handleSubmitComment} className="space-y-3">
              <Textarea
                placeholder="Escribe tu comentario..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[80px] resize-none"
                disabled={submitting}
                maxLength={1000}
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  {newComment.length}/1000 caracteres
                </span>
                <Button
                  type="submit"
                  disabled={!newComment.trim() || submitting}
                  className="gap-2"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? 'Enviando...' : 'Comentar'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de comentarios */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center text-gray-500 py-4">
            Cargando comentarios...
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>No hay comentarios aún</p>
            {user && <p className="text-sm">¡Sé el primero en comentar!</p>}
          </div>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id} className="border-gray-200">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-blue-900">
                      {comment.user?.fullName || 'Usuario desconocido'}
                    </span>
                    {comment.user?.role && (
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          comment.user.role === 'admin' 
                            ? 'border-red-300 text-red-600' 
                            : 'border-blue-300 text-blue-600'
                        }`}
                      >
                        {comment.user.role}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                    {canDeleteComment(comment) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {comment.comment}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default VideoComments;