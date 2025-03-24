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
import zohoService from '@/services/zohoService';
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
    const fetchTicketData = () => 
      Promise.resolve(id ? zohoService.getTicketById(id) : null)
        .then(data => {
          if (data) {
            // Convert data to immutable structure
            setTicket(fromJS(data));
            return data;
          }
          return Promise.reject(new Error('Ticket not found'));
        })
        .catch(error => {
          toast({
            title: "Error loading ticket",
            description: "Could not load ticket details. Please try again later.",
            variant: "destructive",
          });
          console.error("Ticket data error:", error);
          return Promise.reject(error);
        })
        .finally(() => {
          setLoading(false);
        });

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
  const formatDate = (dateString: string): string => 
    new Date(dateString).toLocaleString();

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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">
          {loading ? 'Loading ticket...' : ticket?.get('subject', 'Ticket Details') as string}
        </h1>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p>Loading ticket details...</p>
          </div>
        </div>
      ) : ticket ? (
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
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Ticket not found</p>
          <Button className="mt-4" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
      )}
    </div>
  );
};

export default TicketDetail;
