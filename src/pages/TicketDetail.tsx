import React, { useEffect, useState } from 'react';
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
  ChevronDown
} from 'lucide-react';
import { zohoService } from '@/services/zohoService';
import { toJS } from '@/core/logic/zohoLogic';

// Type definitions for immutable structures
type ImmutableTicket = Map<string, any>;
type ImmutableComment = Map<string, any>;

const TicketDetail: React.FC = () => {
  const [ticket, setTicket] = useState<ImmutableTicket | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showAllComments, setShowAllComments] = useState<boolean>(false);
  const [showDescription, setShowDescription] = useState(true);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Functional approach to fetch ticket data
    const fetchTicketData = () => {
      console.log(`Intentando obtener el ticket con ID: "${id}"`);
      
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
  }, [id, toast]);

  // Pure function to handle comment submission
  const handleCommentSubmit = () => {
    if (!id || !comment.trim()) return;

    setSubmitting(true);
    
    Promise.resolve(zohoService.addComment(id, { content: comment, isPublic: true }))
      .then(newComment => {
        // Convert new comment to immutable structure
        const immutableComment = fromJS(newComment);
        
        // Update ticket with new comment using immutable operations
        setTicket(prevTicket => 
          prevTicket ? prevTicket
            .update('comments', List(), comments => comments.push(immutableComment))
            .set('modifiedTime', new Date().toISOString())
            : prevTicket
        );
        
        // Reset comment input
        setComment('');
        
        toast({
          title: "Comment added",
          description: "Your comment has been added to the ticket.",
        });
      })
      .catch(error => {
        toast({
          title: "Error adding comment",
          description: "Could not add your comment. Please try again later.",
          variant: "destructive",
        });
        console.error("Comment submission error:", error);
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
  const getVisibleComments = (ticketData: ImmutableTicket | null): List<ImmutableComment> => {
    if (!ticketData) return List();
    
    const comments = ticketData.get('comments', List());
    return showAllComments 
      ? comments 
      : comments.size > 3 
        ? comments.slice(-3) 
        : comments;
  };

  // Get visible comments
  const visibleComments = getVisibleComments(ticket);
  const hasMoreComments = ticket ? ticket.get('comments', List()).size > 3 : false;

  // Render loading state
  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-4">
        <div className="flex items-center space-x-2 mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/tickets')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a tickets
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-secondary rounded w-3/4"></div>
              <div className="h-4 bg-secondary rounded w-1/2"></div>
              <div className="h-24 bg-secondary rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render error state - no ticket found
  if (!ticket) {
    return (
      <div className="container mx-auto py-6 space-y-4">
        <div className="flex items-center space-x-2 mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/tickets')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a tickets
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6 text-center">
            <h2 className="text-2xl font-bold text-destructive mb-2">Ticket no encontrado</h2>
            <p className="text-muted-foreground mb-4">
              El ticket con ID "{id}" no se pudo encontrar o no existe.
            </p>
            <Button onClick={() => navigate('/tickets')}>Ver todos los tickets</Button>
          </CardContent>
        </Card>
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
              {hasMoreComments && (
                <Button 
                  variant="ghost" 
                  className="w-full text-sm" 
                  onClick={() => setShowAllComments(!showAllComments)}
                >
                  {showAllComments ? (
                    <>Show Less <ChevronUp className="ml-2 h-4 w-4" /></>
                  ) : (
                    <>Show All Comments <ChevronDown className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
              )}

              {visibleComments.size > 0 ? (
                visibleComments.map((comment, index) => (
                  <div key={comment.get('id', index)} className="flex gap-4 pb-4 border-b last:border-0">
                    <Avatar>
                      <AvatarFallback>{(comment.getIn(['createdBy', 'name'], 'User') as string).charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{comment.getIn(['createdBy', 'name'], 'User') as string}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(comment.get('createdTime', '') as string)}
                        </span>
                      </div>
                      <p className="text-sm">{comment.get('content', '') as string}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">No comments yet</p>
              )}

              <div className="pt-4">
                <Textarea
                  placeholder="Add a comment..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex justify-end mt-2">
                  <Button 
                    onClick={handleCommentSubmit} 
                    disabled={!comment.trim() || submitting}
                  >
                    {submitting ? 'Sending...' : 'Send'}
                    <Send className="ml-2 h-4 w-4" />
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
                    <strong>{ticket.get('comments', List()).size}</strong> comments
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
