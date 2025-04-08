import React, { useEffect, useState, useCallback } from 'react';
import { Map, List, fromJS } from 'immutable';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  ArrowLeft, 
  Clock, 
  MessageSquare, 
  MoreVertical, 
  Send,
  ChevronUp,
  ChevronDown,
  Loader2,
  Paperclip
} from 'lucide-react';
import { zohoService } from '@/services/zohoService';
import { toJS } from '@/core/logic/zohoLogic';

// Type definitions for immutable structures
type ImmutableTicket = Map<string, any>;
type ImmutableComment = Map<string, any>;

const TicketDetail: React.FC = () => {
  const [ticket, setTicket] = useState<ImmutableTicket | null>(null);
  const [comments, setComments] = useState<List<ImmutableComment>>(List());
  const [loading, setLoading] = useState<boolean>(true);
  const [commentsLoading, setCommentsLoading] = useState<boolean>(false);
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showAllComments, setShowAllComments] = useState<boolean>(false);
  const [showDescription, setShowDescription] = useState(true);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  /**
   * Función pura para cargar comentarios
   * @param ticketId - ID del ticket para cargar comentarios
   */
  const fetchComments = useCallback((ticketId: string) => {
    setCommentsLoading(true);
    console.log(`Iniciando carga de comentarios para ticket: ${ticketId}`);
    
    Promise.resolve(zohoService.getTicketComments(ticketId))
      .then(commentsData => {
        console.log('Comentarios recibidos:', commentsData);
        
        if (commentsData && Array.isArray(commentsData)) {
          // Convertir a estructura inmutable con programación defensiva
          const immutableComments = List(commentsData.map(comment => fromJS(comment)));
          console.log('Comentarios transformados a estructura inmutable:', immutableComments.toJS());
          setComments(immutableComments);
        } else {
          console.warn('No se recibieron comentarios válidos');
          setComments(List());
        }
      })
      .catch(error => {
        console.error(`Error al cargar comentarios para ticket ${ticketId}:`, error);
        setComments(List());
      })
      .finally(() => {
        setCommentsLoading(false);
      });
  }, []);

  useEffect(() => {
    const fetchTicketData = () => {
      if (!id) {
        console.error('ID de ticket no proporcionado');
        toast({
          title: "Error al cargar el ticket",
          description: "No se proporcionó un ID de ticket válido",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      setLoading(true);
      
      return Promise.resolve(zohoService.getTicketById(id))
        .then(data => {
          console.log('Datos del ticket recibidos:', data);
          
          if (data) {
            // Convert data to immutable structure
            setTicket(fromJS(data));
            
            // Fetch comments separately after getting the ticket
            fetchComments(id);
            
            return data;
          }
          
          console.error('No se encontró el ticket:', id);
          return Promise.reject(new Error(`No se encontró el ticket con ID: ${id}`));
        })
        .catch(error => {
          console.error(`Error al cargar el ticket ${id}:`, error);
          
          toast({
            title: "Error al cargar el ticket",
            description: "No se pudieron cargar los detalles del ticket. Intenta nuevamente más tarde.",
            variant: "destructive",
          });
          
          return Promise.reject(error);
        })
        .finally(() => {
          setLoading(false);
        });
    };

    fetchTicketData();
  }, [id, toast, fetchComments]);

  // Pure function to handle comment submission
  const handleCommentSubmit = () => {
    if (!id || !comment.trim()) return;

    setSubmitting(true);
    
    // Usando el campo comment en lugar de content, según la estructura actual
    Promise.resolve(zohoService.addComment(id, { comment: comment, isPublic: true }))
      .then(newComment => {
        // Convert new comment to immutable structure
        const immutableComment = fromJS(newComment);
        console.log('Nuevo comentario añadido:', newComment);
        
        // Add to the existing comments list (inmutable update)
        setComments(prevComments => prevComments.push(immutableComment));
        
        // Reset comment input
        setComment('');
        
        toast({
          title: "Comentario añadido",
          description: "Tu comentario ha sido añadido al ticket.",
        });
      })
      .catch(error => {
        toast({
          title: "Error al añadir comentario",
          description: "No se pudo añadir tu comentario. Inténtalo de nuevo más tarde.",
          variant: "destructive",
        });
        console.error("Error al enviar comentario:", error);
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  // Pure function to format date
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

  // Pure function to get visible comments
  const getVisibleComments = (): List<ImmutableComment> => {
    // Usar los comentarios cargados separadamente
    if (!comments || !comments.size) return List();
    
    return showAllComments 
      ? comments 
      : comments.size > 3 
        ? comments.slice(-3) 
        : comments;
  };
  
  // Determinar si hay más de 3 comentarios para mostrar el botón "Ver más"
  const hasMoreComments = comments.size > 3;

  // Render loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2">Cargando detalles del ticket...</p>
        </div>
      </div>
    );
  }

  // Return empty state if no ticket loaded
  if (!ticket) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl p-6 shadow-sm text-center">
          <h1 className="text-2xl font-semibold mb-4">No se encontró el ticket</h1>
          <p className="text-gray-500 mb-4">No se pudieron cargar los detalles del ticket solicitado.</p>
          <Button onClick={() => navigate('/tickets')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a tickets
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">
          {ticket.get('subject', 'Ticket Details') as string}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">Description</CardTitle>
              <div 
                className="flex items-center justify-between cursor-pointer border-b pb-2 mb-2"
                onClick={() => setShowDescription(!showDescription)}
              >
                <h3 className="font-medium">Description</h3>
                {showDescription ? 
                  <ChevronUp className="h-4 w-4" /> : 
                  <ChevronDown className="h-4 w-4" />
                }
              </div>
            </CardHeader>
            <CardContent>
              {showDescription && (
                <p className="whitespace-pre-wrap">{ticket.get('description', '') as string}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Comments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {commentsLoading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : (
                <>
                  {hasMoreComments && (
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
                
                  {getVisibleComments().size > 0 ? (
                    <div className="space-y-4">
                      {getVisibleComments().map((comment, index) => (
                        <div key={index} className="border-b pb-4 last:border-0">
                          <div className="flex justify-between items-start">
                            <div className="font-semibold">{comment.get('author', 'Usuario')}</div>
                            <div className="text-xs text-gray-500">
                              {formatDate(comment.get('createdTime', ''))}
                            </div>
                          </div>
                          <div className="mt-2 text-gray-700">{comment.get('comment', '')}</div>
                          {comment.get('isPublic') === false && (
                            <div className="mt-1 text-xs text-amber-600 font-medium">Comentario privado</div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      No hay comentarios para este ticket
                    </div>
                  )}
                </>
              )}

              <div className="pt-4">
                <Textarea
                  placeholder="Agregar un comentario..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="resize-none"
                  rows={3}
                />
                <div className="flex justify-between mt-2">
                  <Button variant="outline" className="text-sm" disabled>
                    <Paperclip className="mr-2 h-4 w-4" /> Adjuntar
                  </Button>
                  <Button 
                    onClick={handleCommentSubmit} 
                    disabled={!comment.trim() || submitting} 
                    className="text-sm"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Enviar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Ticket Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium">Status</div>
                <div>
                  <Badge variant="outline" className="capitalize">
                    {ticket.get('status', 'Unknown') as string}
                  </Badge>
                </div>
                
                <div className="text-sm font-medium">Priority</div>
                <div>
                  <Badge 
                    className={
                      (ticket.get('priority') as string) === 'high' ? 'bg-red-500' :
                      (ticket.get('priority') as string) === 'medium' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }
                  >
                    {ticket.get('priority', 'Unknown') as string}
                  </Badge>
                </div>
                
                <div className="text-sm font-medium">Category</div>
                <div className="capitalize">{ticket.get('category', 'Uncategorized') as string}</div>
                
                <div className="text-sm font-medium">Created</div>
                <div className="text-sm">{formatDate(ticket.get('createdTime', '') as string)}</div>
                
                <div className="text-sm font-medium">Last Updated</div>
                <div className="text-sm">{formatDate(ticket.get('modifiedTime', '') as string)}</div>
                
                <div className="text-sm font-medium">Due Date</div>
                <div className="text-sm">{ticket.get('dueDate') ? formatDate(ticket.get('dueDate') as string) : 'Not set'}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span>
                    <strong>{comments.size}</strong> comments
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Last activity <strong>{formatDate(ticket.get('modifiedTime', '') as string)}</strong>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;
