import React from 'react';
import { List } from 'immutable';
import { useHelpdeskApi } from '../../hooks/use-helpdesk-api';
import { ImmutableTicket } from '../../core/models/zoho.types';

interface TicketListProps {
  userEmail: string;
  userToken: string;
  filterPriority?: string;
  filterStatus?: string;
}

/**
 * Functional component that displays a list of tickets
 * using immutable data structures and declarative patterns
 */
export const TicketList: React.FC<TicketListProps> = ({
  userEmail,
  userToken,
  filterPriority,
  filterStatus = 'Open',
}) => {
  // Initialize API hook with authentication
  const helpdesk = useHelpdeskApi(userToken, userEmail);
  
  // Fetch tickets using SWR
  const { 
    tickets, 
    isLoading, 
    error, 
    ticketsByPriority 
  } = helpdesk.useTickets();
  
  // Apply filters in a functional way using derived state
  const filteredTickets = React.useMemo(() => 
    tickets
      // Filter by status if provided
      .filter(ticket => 
        !filterStatus || ticket.get('status') === filterStatus
      )
      // Filter by priority if provided
      .filter(ticket => 
        !filterPriority || ticket.get('priority') === filterPriority
      )
      // Sort by timestamp descending
      .sort((a, b) => 
        (b.get('createdTimestamp') || 0) - (a.get('createdTimestamp') || 0)
      ),
    [tickets, filterStatus, filterPriority]
  );
  
  // Extract ticket IDs for rendering optimization
  const ticketIds = React.useMemo(() => 
    filteredTickets.map(ticket => ticket.get('id')),
    [filteredTickets]
  );
  
  // Status counts for UI stats display
  const statusCounts = React.useMemo(() => 
    tickets.reduce(
      (counts, ticket) => {
        const status = ticket.get('status');
        return counts.update(
          status, 
          (count = 0) => count + 1
        );
      },
      List(['Open', 'In Progress', 'Closed'])
        .reduce(
          (map, status) => map.set(status, 0),
          {}
        )
    ),
    [tickets]
  );
  
  // Render loading state
  if (isLoading) return <div>Loading tickets...</div>;
  
  // Render error state
  if (error) return <div>Error: {error.message}</div>;
  
  // Render empty state
  if (filteredTickets.size === 0) {
    return <div>No tickets found matching your criteria.</div>;
  }
  
  // Render ticket list
  return (
    <div className="ticket-list">
      <div className="ticket-stats">
        {List(Object.entries(statusCounts.toJS()))
          .map(([status, count]) => (
            <div key={status} className="stat-item">
              <span className="stat-label">{status}:</span>
              <span className="stat-value">{count}</span>
            </div>
          ))
        }
      </div>

      <ul className="tickets">
        {filteredTickets.map(ticket => (
          <TicketItem 
            key={ticket.get('id')} 
            ticket={ticket} 
          />
        ))}
      </ul>
    </div>
  );
};

// Sub-component for rendering individual tickets
const TicketItem: React.FC<{ ticket: ImmutableTicket }> = ({ ticket }) => {
  // Extract values once to avoid repeated get() calls
  const id = ticket.get('id');
  const subject = ticket.get('subject');
  const status = ticket.get('status');
  const priority = ticket.get('priority');
  const createdAt = new Date(ticket.get('createdTimestamp')).toLocaleString();
  
  // Different classes based on priority
  const priorityClass = React.useMemo(() => 
    priority === 'Urgent' ? 'priority-urgent' :
    priority === 'High' ? 'priority-high' :
    priority === 'Medium' ? 'priority-medium' :
    'priority-low',
    [priority]
  );
  
  return (
    <li className={`ticket-item ${priorityClass}`}>
      <div className="ticket-header">
        <h3 className="ticket-subject">{subject}</h3>
        <span className="ticket-status">{status}</span>
      </div>
      <div className="ticket-meta">
        <span className="ticket-id">ID: {id}</span>
        <span className="ticket-priority">Priority: {priority}</span>
        <span className="ticket-created">Created: {createdAt}</span>
      </div>
    </li>
  );
};

export default TicketList;
