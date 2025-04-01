import React, { useEffect } from 'react';
import { List, Map } from 'immutable';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchTickets, 
  selectAllTickets, 
  selectTicketLoading, 
  selectTicketError,
  ImmutableTicket
} from '../../store/slices/ticketSlice';
import { AppDispatch } from '../../store/store';

interface TicketListProps {
  filterPriority?: string;
  filterStatus?: string;
  filterType?: 'my-tickets' | 'open' | 'history';
  onSelectTicket?: (ticketId: string) => void;
}

/**
 * Functional component that displays a list of tickets
 * using immutable data structures, Redux and declarative patterns
 */
export const TicketList: React.FC<TicketListProps> = ({
  filterPriority,
  filterStatus,
  filterType = 'open',
  onSelectTicket
}) => {
  // Redux hooks
  const dispatch = useDispatch<AppDispatch>();
  const tickets = useSelector(selectAllTickets);
  const isLoading = useSelector(selectTicketLoading);
  const error = useSelector(selectTicketError);

  // Fetch tickets based on filter type
  useEffect(() => {
    const filters: Record<string, any> = {};
    
    // Apply type-specific filtering
    switch (filterType) {
      case 'my-tickets':
        filters.isOwnedByCurrentUser = true;
        break;
      case 'open':
        filters.status = ['Open', 'In Progress'];
        break;
      case 'history':
        filters.status = 'Closed';
        break;
    }
    
    // Apply additional filters if provided
    if (filterStatus && filterType !== 'open' && filterType !== 'history') {
      filters.status = filterStatus;
    }
    
    if (filterPriority) {
      filters.priority = filterPriority;
    }
    
    dispatch(fetchTickets(filters));
  }, [dispatch, filterType, filterStatus, filterPriority]);
  
  // Apply client-side filtering for more complex cases
  const filteredTickets = React.useMemo(() => {
    if (!tickets) return List<ImmutableTicket>();
    
    return tickets
      // Apply additional filtering if needed
      .filter(ticket => 
        !filterPriority || ticket.get('priority') === filterPriority
      )
      // Sort by timestamp descending
      .sort((a, b) => 
        (b.get('createdTimestamp', 0) as number) - (a.get('createdTimestamp', 0) as number)
      );
  }, [tickets, filterPriority]);
  
  // Extract ticket IDs for rendering optimization
  const ticketIds = React.useMemo(() => 
    filteredTickets.map(ticket => ticket.get('id')),
    [filteredTickets]
  );
  
  // Status counts for UI stats display
  const statusCounts = React.useMemo(() => 
    tickets && tickets.reduce(
      (counts, ticket) => {
        const status = ticket.get('status', '');
        return counts.update(
          status, 
          (count = 0) => count + 1
        );
      },
      Map<string, number>().withMutations(map => {
        map.set('Open', 0);
        map.set('In Progress', 0);
        map.set('On Hold', 0);
        map.set('Closed', 0);
      })
    ) || Map<string, number>(),
    [tickets]
  );
  
  // Handle ticket selection
  const handleTicketSelect = (id: string) => {
    if (onSelectTicket) {
      onSelectTicket(id);
    }
  };
  
  // Render loading state
  if (isLoading) return <div className="loading-container">Cargando tickets...</div>;
  
  // Render error state
  if (error) return <div className="error-container">Error: {error}</div>;
  
  // Render empty state
  if (filteredTickets.size === 0) {
    return (
      <div className="empty-state">
        <p>No se encontraron tickets que coincidan con los criterios.</p>
      </div>
    );
  }
  
  // Render ticket list
  return (
    <div className="ticket-list">
      <div className="ticket-stats">
        {List(statusCounts.entrySeq().toArray())
          .map(([status, count]) => (
            <div key={status as string} className="stat-item">
              <span className="stat-label">{status}:</span>
              <span className="stat-value">{count}</span>
            </div>
          ))
        }
      </div>

      <ul className="tickets">
        {filteredTickets.map(ticket => (
          <TicketItem 
            key={ticket.get('id', '')} 
            ticket={ticket}
            onClick={() => handleTicketSelect(ticket.get('id', ''))}
          />
        ))}
      </ul>
    </div>
  );
};

// Sub-component for rendering individual tickets
interface TicketItemProps {
  ticket: ImmutableTicket;
  onClick: () => void;
}

const TicketItem: React.FC<TicketItemProps> = ({ ticket, onClick }) => {
  // Extract values once to avoid repeated get() calls
  const id = ticket.get('id', '');
  const subject = ticket.get('subject', 'Sin asunto');
  const status = ticket.get('status', 'Open');
  const priority = ticket.get('priority', 'Medium');
  const createdAt = new Date(ticket.get('createdTimestamp', Date.now())).toLocaleString();
  
  // Different classes based on priority
  const priorityClass = React.useMemo(() => 
    priority === 'Urgent' ? 'priority-urgent' :
    priority === 'High' ? 'priority-high' :
    priority === 'Medium' ? 'priority-medium' :
    'priority-low',
    [priority]
  );
  
  // Different classes based on status
  const statusClass = React.useMemo(() => 
    status === 'Open' ? 'status-open' :
    status === 'In Progress' ? 'status-in-progress' :
    status === 'On Hold' ? 'status-on-hold' :
    'status-closed',
    [status]
  );
  
  return (
    <li 
      className={`ticket-item ${priorityClass} ${statusClass}`}
      onClick={onClick}
    >
      <div className="ticket-header">
        <h3 className="ticket-subject">{subject}</h3>
        <span className="ticket-status">{status}</span>
      </div>
      <div className="ticket-meta">
        <span className="ticket-id">ID: {id}</span>
        <span className="ticket-priority">Prioridad: {priority}</span>
        <span className="ticket-created">Creado: {createdAt}</span>
      </div>
    </li>
  );
};

export default TicketList;
