import React from 'react';
import { useHelpdeskApi } from '../../hooks/use-helpdesk-api';
import { List } from 'immutable';

interface TicketDetailsProps {
  ticketId: string;
  userEmail: string;
  userToken: string;
}

/**
 * Functional component that displays and allows interaction with a single ticket
 * using immutable data structures and declarative patterns
 */
export const TicketDetails: React.FC<TicketDetailsProps> = ({
  ticketId,
  userEmail,
  userToken,
}) => {
  // Local state for new comment
  const [newComment, setNewComment] = React.useState('');
  
  // Initialize API hook with authentication
  const helpdesk = useHelpdeskApi(userToken, userEmail);
  
  // Fetch ticket data using SWR
  const { 
    ticket,
    comments,
    status,
    priority,
    isLoading, 
    error,
    escalate,
    addComment,
    isOpen,
    isUrgent,
    mutate 
  } = helpdesk.useTicket(ticketId);
  
  // Handle comment submission
  const handleAddComment = React.useCallback(() => {
    // Skip if comment is empty
    if (!newComment.trim() || !addComment) return;
    
    // Submit comment and update local data
    addComment(newComment)
      .then(result => {
        if (result.isOk) {
          // Clear input field
          setNewComment('');
          // Trigger revalidation to get latest data
          mutate();
        }
      });
  }, [newComment, addComment, mutate]);
  
  // Handle ticket escalation
  const handleEscalate = React.useCallback(() => {
    if (!escalate) return;
    
    escalate()
      .then(result => {
        if (result.isOk) {
          // Trigger revalidation to get latest data
          mutate();
        }
      });
  }, [escalate, mutate]);
  
  // Format timestamp to readable date
  const formatDate = React.useCallback(
    (timestamp?: number) => timestamp 
      ? new Date(timestamp).toLocaleString() 
      : 'Unknown date',
    []
  );
  
  // Render loading state
  if (isLoading) return <div>Loading ticket details...</div>;
  
  // Render error state
  if (error) return <div>Error: {error.message}</div>;
  
  // Render not found state
  if (!ticket) return <div>Ticket not found</div>;
  
  // Derived data for rendering
  const subject = ticket.get('subject');
  const description = ticket.get('description');
  const createdAt = formatDate(ticket.get('createdTimestamp'));
  const department = ticket.get('departmentName') || 'General';
  
  // Render ticket details
  return (
    <div className="ticket-details">
      <header className="ticket-header">
        <h1 className="ticket-subject">{subject}</h1>
        <div className="ticket-meta">
          <span className={`ticket-status status-${status?.toLowerCase()}`}>
            {status}
          </span>
          <span className={`ticket-priority priority-${priority?.toLowerCase()}`}>
            {priority}
          </span>
        </div>
      </header>
      
      <section className="ticket-info">
        <div className="info-item">
          <span className="label">ID:</span>
          <span className="value">{ticketId}</span>
        </div>
        <div className="info-item">
          <span className="label">Created:</span>
          <span className="value">{createdAt}</span>
        </div>
        <div className="info-item">
          <span className="label">Department:</span>
          <span className="value">{department}</span>
        </div>
      </section>
      
      <section className="ticket-description">
        <h2>Description</h2>
        <div className="description-content">
          {description}
        </div>
      </section>
      
      <section className="ticket-actions">
        {isOpen && (
          <button 
            className="action-escalate"
            onClick={handleEscalate}
            disabled={!escalate || isUrgent}
          >
            Escalate Ticket
          </button>
        )}
      </section>
      
      <section className="ticket-comments">
        <h2>Comments ({comments?.size || 0})</h2>
        
        {/* Comments list */}
        <ul className="comments-list">
          {(comments || List()).map((comment, index) => (
            <li key={index} className="comment-item">
              <div className="comment-header">
                <span className="comment-author">
                  {comment.get('author')}
                </span>
                <span className="comment-date">
                  {formatDate(comment.get('timestamp'))}
                </span>
              </div>
              <div className="comment-content">
                {comment.get('content')}
              </div>
            </li>
          ))}
        </ul>
        
        {/* Add comment form */}
        {isOpen && (
          <div className="add-comment">
            <textarea
              className="comment-input"
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              rows={3}
            />
            <button
              className="submit-comment"
              onClick={handleAddComment}
              disabled={!newComment.trim() || !addComment}
            >
              Add Comment
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default TicketDetails;
