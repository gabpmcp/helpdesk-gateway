
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  AlertCircle, 
  ArrowLeft, 
  CheckCircle, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Loader2, 
  MoreHorizontal, 
  Paperclip, 
  Send, 
  User, 
  UserCircle
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { zohoService } from '@/services/zohoService';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistance } from 'date-fns';

const StatusBadge = ({ status }: { status: string }) => {
  const statusMap: Record<string, { className: string, label: string }> = {
    'new': { className: 'status-new', label: 'New' },
    'open': { className: 'status-open', label: 'Open' },
    'in-progress': { className: 'status-in-progress', label: 'In Progress' },
    'on-hold': { className: 'status-on-hold', label: 'On Hold' },
    'resolved': { className: 'status-resolved', label: 'Resolved' },
    'closed': { className: 'status-closed', label: 'Closed' }
  };

  const { className, label } = statusMap[status] || { className: '', label: status };

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
};

const PriorityIndicator = ({ priority }: { priority: string }) => {
  const priorityClass = `priority-${priority}`;
  
  return (
    <div className="flex items-center">
      <div className={`h-2 w-2 rounded-full mr-2 ${priorityClass}`}></div>
      <span className="capitalize">{priority}</span>
    </div>
  );
};

interface Comment {
  id: string;
  content: string;
  createdBy: string;
  createdTime: string;
  isPublic: boolean;
}

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  createdTime: string;
  modifiedTime: string;
  dueDate?: string;
  department: string;
  assignee: string | null;
  comments: Comment[];
  contact: {
    name: string;
    email: string;
  };
}

const TicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [showDescription, setShowDescription] = useState(true);

  useEffect(() => {
    const fetchTicket = async () => {
      if (!id) return;
      setLoading(true);
      
      try {
        const ticketData = await zohoService.getTicketById(id);
        setTicket(ticketData);
      } catch (error) {
        toast({
          title: "Error loading ticket",
          description: "Could not load ticket details. Please try again later.",
          variant: "destructive",
        });
        console.error("Ticket loading error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [id, toast]);

  const handleAddComment = async () => {
    if (!id || !comment.trim()) return;
    
    setSendingComment(true);
    try {
      const newComment = await zohoService.addComment(id, { content: comment });
      
      // Update the ticket object with the new comment
      if (ticket) {
        setTicket({
          ...ticket,
          comments: [...ticket.comments, newComment],
          modifiedTime: new Date().toISOString()
        });
      }
      
      setComment('');
      toast({
        title: "Comment added",
        description: "Your comment has been added to the ticket.",
      });
    } catch (error) {
      toast({
        title: "Error adding comment",
        description: "Could not add your comment. Please try again.",
        variant: "destructive",
      });
      console.error("Comment error:", error);
    } finally {
      setSendingComment(false);
    }
  };

  const handleEscalate = () => {
    toast({
      title: "Ticket escalated",
      description: "This ticket has been marked for escalation. Our team will review it shortly.",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
        <h2 className="text-2xl font-bold">Ticket not found</h2>
        <p className="text-muted-foreground mb-4">The ticket you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => navigate('/tickets')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tickets
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with navigation */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => navigate('/tickets')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-xl md:text-2xl font-bold">Ticket #{ticket.id}</h1>
      </div>

      {/* Ticket details */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <CardTitle className="text-xl font-bold">{ticket.subject}</CardTitle>
              <CardDescription>
                Created {format(new Date(ticket.createdTime), 'MMM d, yyyy')} · 
                Updated {formatDistance(new Date(ticket.modifiedTime), new Date(), { addSuffix: true })}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={ticket.status} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleEscalate}>
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Escalate Ticket
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Resolved
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Ticket metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded-md bg-secondary/30">
            <div>
              <p className="text-sm text-muted-foreground">Priority</p>
              <PriorityIndicator priority={ticket.priority} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Category</p>
              <p>{ticket.category}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Department</p>
              <p>{ticket.department}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Assignee</p>
              <p>{ticket.assignee || "Not assigned"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Requested By</p>
              <p>{ticket.contact.name}</p>
            </div>
            {ticket.dueDate && (
              <div>
                <p className="text-sm text-muted-foreground">Due Date</p>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                  <p>{format(new Date(ticket.dueDate), 'MMM d, yyyy')}</p>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
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
            {showDescription && (
              <div className="py-2 whitespace-pre-line">
                {ticket.description}
              </div>
            )}
          </div>

          {/* Comments section */}
          <div>
            <h3 className="font-medium border-b pb-2 mb-4">Conversation</h3>
            
            <div className="space-y-6">
              {ticket.comments.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No comments yet.
                </div>
              ) : (
                <>
                  {ticket.comments.map(comment => (
                    <div key={comment.id} className="flex gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="" alt={comment.createdBy} />
                        <AvatarFallback>
                          {comment.createdBy.split(' ').map(name => name[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{comment.createdBy}</span>
                          <span className="text-sm text-muted-foreground">
                            {formatDistance(new Date(comment.createdTime), new Date(), { addSuffix: true })}
                          </span>
                        </div>
                        <div className="mt-1 p-3 bg-secondary/30 rounded-md">
                          <p className="whitespace-pre-line">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Add comment form */}
              <div className="flex gap-4 mt-8">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="" alt="You" />
                  <AvatarFallback>
                    <UserCircle className="h-full w-full text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea 
                    placeholder="Add a comment..." 
                    className="mb-2 min-h-[100px]"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    disabled={sendingComment}
                  />
                  <div className="flex justify-between items-center">
                    <Button variant="outline" size="sm" disabled={sendingComment}>
                      <Paperclip className="h-4 w-4 mr-2" />
                      Attach File
                    </Button>
                    <Button 
                      onClick={handleAddComment} 
                      disabled={!comment.trim() || sendingComment}
                    >
                      {sendingComment ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TicketDetail;
