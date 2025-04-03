/**
 * Componente TicketComments - FCIS compliant
 * Functional, Composable, Isolated, Stateless
 */
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { List, Map } from 'immutable';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChevronUp, ChevronDown, Send } from 'lucide-react';
import { addComment, selectCommentsByTicketId, selectCommentsLoading } from '@/store/slices/commentsSlice';
import { AppDispatch, RootState } from '@/store/store';

interface TicketCommentsProps {
  ticketId: string;
}

// Definición de tipos para las estructuras inmutables
type ImmutableComment = Map<string, any>;
type ImmutableCommentList = List<ImmutableComment>;

/**
 * Componente funcional puro que muestra y permite añadir comentarios a un ticket
 */
const TicketComments: React.FC<TicketCommentsProps> = ({ ticketId }) => {
  // Estado local inmutable - solo para UI
  const [comment, setComment] = useState<string>('');
  const [showAllComments, setShowAllComments] = useState<boolean>(false);
  
  // Acceso a Redux usando selectores funcionales
  const dispatch = useDispatch<AppDispatch>();
  const comments = useSelector((state: RootState) => selectCommentsByTicketId(state, ticketId)) as ImmutableCommentList;
  const isLoading = useSelector(selectCommentsLoading);
  
  // Filtrar los comentarios a mostrar de forma funcional
  const visibleComments = showAllComments ? 
    comments : 
    comments.size > 3 ? comments.slice(-3) : comments;
  
  // Handler funcional puro para enviar comentarios
  const handleSend = () => {
    // Validación funcional
    if (!comment.trim()) return;
    
    // Dispatch con pipeline de promesas explícito
    dispatch(addComment({ ticketId, comment }))
      .then(() => {
        // UI update como efecto secundario controlado
        setComment('');
      });
  };
  
  // Función pura para formatear fechas
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Fecha no disponible';
    
    try {
      const date = new Date(dateString);
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) return 'Fecha inválida';
      
      return new Intl.DateTimeFormat('es-ES', { 
        dateStyle: 'medium', 
        timeStyle: 'short' 
      }).format(date);
    } catch (e) {
      console.error('Error al formatear fecha:', e);
      return 'Error al formatear fecha';
    }
  };
  
  // Renderizado puro sin efectos secundarios
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Comentarios</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mostrar/ocultar todos los comentarios */}
        {comments.size > 3 && (
          <Button 
            variant="ghost" 
            className="w-full text-sm" 
            onClick={() => setShowAllComments(!showAllComments)}
          >
            {showAllComments ? (
              <>Mostrar menos <ChevronUp className="ml-2 h-4 w-4" /></>
            ) : (
              <>Ver todos los comentarios <ChevronDown className="ml-2 h-4 w-4" /></>
            )}
          </Button>
        )}

        {/* Lista de comentarios */}
        {visibleComments.size > 0 ? (
          visibleComments.map((comment: ImmutableComment, index: number) => (
            <div key={comment.get('id', `comment-${index}`)} className="flex gap-4 pb-4 border-b last:border-0">
              <Avatar>
                <AvatarFallback>
                  {(comment.getIn(['author'], 'U') as string).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{comment.get('author', 'Usuario')}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(comment.get('timestamp', '') as string)}
                  </span>
                </div>
                <p className="text-sm">{comment.get('message', comment.get('comment', '')) as string}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-muted-foreground py-4">No hay comentarios</p>
        )}

        {/* Formulario para añadir comentarios */}
        <div className="pt-4">
          <Textarea
            placeholder="Añadir un comentario..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            className="min-h-[100px]"
          />
          <div className="flex justify-end mt-2">
            <Button 
              onClick={handleSend} 
              disabled={!comment.trim() || isLoading}
            >
              {isLoading ? 'Enviando...' : 'Enviar'}
              <Send className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TicketComments;
