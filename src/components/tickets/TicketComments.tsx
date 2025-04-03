import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { 
  fetchTicketComments, 
  addTicketComment, 
  selectTicketComments,
  selectCommentsLoading,
  selectCommentsError
} from '@/store/slices/ticketsSlice';
import { fromJS, List } from 'immutable';
import { Loader2, Send, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toJS } from '@/core/logic/zohoLogic';
import { ZohoCommentInput } from '@/core/models/zoho.types';

interface TicketCommentsProps {
  ticketId: string;
}

const TicketComments: React.FC<TicketCommentsProps> = ({ ticketId }) => {
  const dispatch = useAppDispatch();
  const comments = useAppSelector(state => selectTicketComments(state, ticketId));
  const loading = useAppSelector(selectCommentsLoading);
  const error = useAppSelector(selectCommentsError);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Cargar comentarios cuando se monta el componente (enfoque funcional)
  useEffect(() => {
    if (ticketId) {
      dispatch(fetchTicketComments(ticketId));
    }
  }, [dispatch, ticketId]);

  // Función pura para manejar el envío de comentarios
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!comment.trim()) return;
    
    // Crear comentario con estructura inmutable
    const commentData: ZohoCommentInput = {
      comment: comment.trim(),
      isPublic: true
    };
    
    setSubmitting(true);
    
    // Patrón de composición funcional con promesas encadenadas
    dispatch(addTicketComment({ ticketId, comment: commentData }))
      .then(() => {
        // Limpiar el campo de comentario solo si la acción fue exitosa
        setComment('');
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  // Función pura para renderizar cada comentario
  const renderComment = (commentItem: any) => {
    const commentJS = toJS(commentItem);
    const author = commentJS.author || 'Anonymous';
    const content = commentJS.content || commentJS.comment || '';
    const createdTime = commentJS.createdTime || new Date().toISOString();
    const createdTimestamp = commentJS.createdTimestamp || new Date(createdTime).getTime();
    
    // Obtener iniciales para el avatar
    const initials = author
      .split(' ')
      .map(name => name[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
    
    return (
      <div key={commentJS.id || createdTimestamp} className="flex gap-3 mb-4">
        <Avatar className="h-8 w-8">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1">
          <div className="flex items-baseline gap-2">
            <span className="font-medium">{author}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(createdTimestamp), { addSuffix: true })}
            </span>
          </div>
          <div className="text-sm text-foreground">{content}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Comments</h3>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-4 max-h-[400px] overflow-y-auto p-2">
        {loading && !comments.size ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading comments...</span>
          </div>
        ) : comments.size === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          // Convertir comentarios de Immutable a React elements usando transformación funcional
          comments
            .sortBy(comment => -(comment.get('createdTimestamp', 0) as number))
            .map(comment => renderComment(comment))
            .toArray()
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          placeholder="Add your comment..."
          value={comment}
          onChange={e => setComment(e.target.value)}
          disabled={submitting}
          className="min-h-24 resize-none"
        />
        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={submitting || !comment.trim()}
            className="flex items-center"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TicketComments;
