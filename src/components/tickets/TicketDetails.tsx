import React, { useEffect, useState } from 'react';
import { List, Map } from 'immutable';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchTicketById, 
  addTicketComment, 
  updateTicketStatus,
  selectSelectedTicket,
  selectTicketLoading,
  selectTicketError,
  selectTicketMessages
} from '../../store/slices/ticketSlice';
import { AppDispatch } from '../../store/store';

interface TicketDetailsProps {
  ticketId: string;
}

/**
 * Functional component that displays and allows interaction with a single ticket
 * using immutable data structures, Redux and declarative patterns
 */
export const TicketDetails: React.FC<TicketDetailsProps> = ({
  ticketId,
}) => {
  // Local state for new comment and file attachments
  const [newComment, setNewComment] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  
  // Redux hooks
  const dispatch = useDispatch<AppDispatch>();
  const ticket = useSelector(selectSelectedTicket);
  const messages = useSelector(selectTicketMessages);
  const isLoading = useSelector(selectTicketLoading);
  const error = useSelector(selectTicketError);
  
  // Fetch ticket data
  useEffect(() => {
    if (ticketId) {
      dispatch(fetchTicketById(ticketId));
    }
  }, [dispatch, ticketId]);
  
  // Derived ticket properties
  const status = ticket?.get('status', '');
  const priority = ticket?.get('priority', '');
  const isOpen = ['Open', 'In Progress', 'On Hold'].includes(status as string);
  const isUrgent = priority === 'Urgent';
  
  // Handle comment submission
  const handleAddComment = async () => {
    // Skip if comment is empty
    if (!newComment.trim() || !ticketId) return;
    
    try {
      // Submit comment and update local data
      await dispatch(
        addTicketComment({ 
          ticketId, 
          message: newComment,
          attachments 
        })
      );
      
      // Clear input field and attachments
      setNewComment('');
      setAttachments([]);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };
  
  // Handle ticket escalation
  const handleEscalate = async () => {
    if (!ticketId || isUrgent) return;
    
    try {
      await dispatch(
        updateTicketStatus({ 
          ticketId, 
          status: 'Urgent' 
        })
      );
    } catch (error) {
      console.error('Error escalating ticket:', error);
    }
  };
  
  // Handle status change
  const handleStatusChange = async (newStatus: string) => {
    if (!ticketId) return;
    
    try {
      await dispatch(
        updateTicketStatus({ 
          ticketId, 
          status: newStatus 
        })
      );
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };
  
  // Handle file attachment
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Convert FileList to array and add to state
      const fileArray = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...fileArray]);
    }
  };
  
  // Remove an attachment
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };
  
  // Format timestamp to readable date
  const formatDate = (timestamp?: number | string) => {
    if (!timestamp) return 'Fecha desconocida';
    
    const date = typeof timestamp === 'string' 
      ? new Date(timestamp) 
      : new Date(timestamp);
      
    return date.toLocaleString();
  };
  
  // Render loading state
  if (isLoading) return <div className="loading-container">Cargando detalles del ticket...</div>;
  
  // Render error state
  if (error) return <div className="error-container">Error: {error}</div>;
  
  // Render not found state
  if (!ticket || !ticket.size) return <div className="not-found">Ticket no encontrado</div>;
  
  // Derived data for rendering
  const subject = ticket.get('subject', 'Sin asunto');
  const description = ticket.get('description', '');
  const createdAt = formatDate(ticket.get('createdTimestamp'));
  const department = ticket.get('departmentName', 'General');
  
  // Render ticket details
  return (
    <div className="ticket-details">
      <header className="ticket-header">
        <h1 className="ticket-subject">{subject}</h1>
        <div className="ticket-meta">
          <span className={`ticket-status status-${(status as string)?.toLowerCase()}`}>
            {status}
          </span>
          <span className={`ticket-priority priority-${(priority as string)?.toLowerCase()}`}>
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
          <span className="label">Creado:</span>
          <span className="value">{createdAt}</span>
        </div>
        <div className="info-item">
          <span className="label">Departamento:</span>
          <span className="value">{department}</span>
        </div>
      </section>
      
      <section className="ticket-description">
        <h2>Descripción</h2>
        <div className="description-content">
          {description}
        </div>
      </section>
      
      {isOpen && (
        <section className="ticket-actions">
          <h3>Actualizar Estado</h3>
          <div className="status-actions">
            <button 
              className="status-btn status-open"
              onClick={() => handleStatusChange('Open')}
              disabled={status === 'Open'}
            >
              Abierto
            </button>
            <button 
              className="status-btn status-in-progress"
              onClick={() => handleStatusChange('In Progress')}
              disabled={status === 'In Progress'}
            >
              En Progreso
            </button>
            <button 
              className="status-btn status-on-hold"
              onClick={() => handleStatusChange('On Hold')}
              disabled={status === 'On Hold'}
            >
              En Espera
            </button>
            <button 
              className="status-btn status-closed"
              onClick={() => handleStatusChange('Closed')}
              disabled={status === 'Closed'}
            >
              Cerrado
            </button>
          </div>
          
          <button 
            className="action-escalate"
            onClick={handleEscalate}
            disabled={!isOpen || isUrgent}
          >
            Escalar Ticket a Urgente
          </button>
        </section>
      )}
      
      <section className="ticket-comments">
        <h2>Comentarios ({messages?.size || 0})</h2>
        
        {/* Comments list */}
        <ul className="comments-list">
          {(messages || List()).map((comment, index) => (
            <li key={index} className="comment-item">
              <div className="comment-header">
                <span className="comment-author">
                  {comment.get('author', 'Usuario')}
                </span>
                <span className="comment-date">
                  {formatDate(comment.get('timestamp'))}
                </span>
              </div>
              <div className="comment-content">
                {comment.get('content', '')}
              </div>
              {comment.get('attachments') && (
                <div className="comment-attachments">
                  {comment.get('attachments').map((attachment: Map<string, any>, i: number) => (
                    <div key={i} className="attachment">
                      <a 
                        href={attachment.get('url', '#')} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        {attachment.get('filename', 'Adjunto')}
                      </a>
                    </div>
                  ))}
                </div>
              )}
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
              placeholder="Añadir un comentario..."
              rows={3}
            />
            
            {/* File attachments */}
            <div className="attachments-section">
              <div className="attachment-list">
                {attachments.map((file, index) => (
                  <div key={index} className="attachment-item">
                    <span className="attachment-name">{file.name}</span>
                    <button 
                      className="remove-attachment"
                      onClick={() => removeAttachment(index)}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="attachment-controls">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="file-upload" className="file-upload-btn">
                  Adjuntar Archivos
                </label>
              </div>
            </div>
            
            <button
              className="submit-comment"
              onClick={handleAddComment}
              disabled={!newComment.trim()}
            >
              Añadir Comentario
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default TicketDetails;
