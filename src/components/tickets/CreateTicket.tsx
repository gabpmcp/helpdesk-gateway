import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  createTicket,
  selectTicketLoading,
  selectTicketError
} from '../../store/slices/ticketSlice';
import { AppDispatch } from '../../store/store';

/**
 * Componente para crear un nuevo ticket en el sistema
 * Con soporte para campos básicos y archivos adjuntos
 */
const CreateTicket: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const isLoading = useSelector(selectTicketLoading);
  const error = useSelector(selectTicketError);
  
  // Estado del formulario
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [category, setCategory] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim() || !description.trim()) {
      return;
    }
    
    try {
      // Crear ticket data
      const ticketData = {
        subject,
        description,
        priority,
        category,
        timestamp: new Date().toISOString()
      };

      // Enviar petición de creación
      const resultAction = await dispatch(createTicket(ticketData));
      
      if (createTicket.fulfilled.match(resultAction)) {
        // Si hay archivos adjuntos, añadirlos como primer comentario
        const newTicketId = resultAction.payload?.id;
        
        // Navegar a la pantalla de detalles del ticket
        navigate(`/tickets/${newTicketId}`);
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
    }
  };

  // Manejar archivos adjuntos
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Convertir FileList a array
      const fileArray = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...fileArray]);
    }
  };

  // Eliminar un archivo adjunto
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="create-ticket-container">
      <h1>Crear Nuevo Ticket</h1>
      
      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="ticket-form">
        <div className="form-group">
          <label htmlFor="subject">Asunto *</label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Breve descripción del problema"
            required
            className="form-control"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Descripción *</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describa su problema o solicitud con detalle"
            required
            rows={5}
            className="form-control"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="priority">Prioridad</label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="form-control"
          >
            <option value="Low">Baja</option>
            <option value="Medium">Media</option>
            <option value="High">Alta</option>
            <option value="Urgent">Urgente</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="category">Categoría</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="form-control"
          >
            <option value="">Seleccionar categoría</option>
            <option value="technical">Soporte Técnico</option>
            <option value="billing">Facturación</option>
            <option value="account">Cuenta</option>
            <option value="other">Otro</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Archivos Adjuntos</label>
          <div className="attachments-section">
            <div className="attachment-list">
              {attachments.map((file, index) => (
                <div key={index} className="attachment-item">
                  <span className="attachment-name">{file.name}</span>
                  <button 
                    type="button"
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
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="cancel-btn"
            onClick={() => navigate('/tickets/my-tickets')}
          >
            Cancelar
          </button>
          
          <button 
            type="submit" 
            className="submit-btn"
            disabled={isLoading || !subject.trim() || !description.trim()}
          >
            {isLoading ? 'Creando...' : 'Crear Ticket'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTicket;
