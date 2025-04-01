import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Componente para la navegación del módulo de tickets
 * Muestra enlaces a las diferentes secciones de tickets (mis tickets, abiertos, historial)
 */
const TicketNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determinar la ruta activa
  const isActive = (path: string): boolean => {
    return location.pathname.includes(path);
  };
  
  return (
    <div className="ticket-navigation">
      <h3 className="section-title">Tickets</h3>
      <ul className="nav-list">
        <li 
          className={`nav-item ${isActive('/tickets/my-tickets') ? 'active' : ''}`}
          onClick={() => navigate('/tickets/my-tickets')}
        >
          <span className="nav-icon">📋</span>
          <span className="nav-text">Mis Tickets</span>
        </li>
        <li 
          className={`nav-item ${isActive('/tickets/open') ? 'active' : ''}`}
          onClick={() => navigate('/tickets/open')}
        >
          <span className="nav-icon">📂</span>
          <span className="nav-text">Tickets Abiertos</span>
        </li>
        <li 
          className={`nav-item ${isActive('/tickets/history') ? 'active' : ''}`}
          onClick={() => navigate('/tickets/history')}
        >
          <span className="nav-icon">📚</span>
          <span className="nav-text">Historial</span>
        </li>
        <li 
          className={`nav-item ${isActive('/tickets/create') ? 'active' : ''}`}
          onClick={() => navigate('/tickets/create')}
        >
          <span className="nav-icon">➕</span>
          <span className="nav-text">Crear Ticket</span>
        </li>
      </ul>
    </div>
  );
};

export default TicketNavigation;
