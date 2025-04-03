import React, { useEffect, useState } from 'react';
import { List, Map } from 'immutable';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { 
  fetchTickets,
  setFilters,
  selectFilteredTickets, 
  selectTicketsLoading, 
  selectTicketsError,
  selectTicketsFilters
} from '@/store/slices/ticketsSlice';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { AlertCircle, Loader2, MessageSquare, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ZohoFilters } from '@/core/models/zoho.types';
import { toJS } from '@/core/logic/zohoLogic';
import TicketFilters from './TicketFilters';
import { zohoService } from '@/services/zohoService';

interface TicketListProps {
  showFilters?: boolean;
  initialFilters?: ZohoFilters;
  categories?: Array<{ id: string; name: string }>;
  onSelectTicket?: (ticketId: string) => void;
}

/**
 * Functional component that displays a list of tickets
 * using immutable data structures, Redux and declarative patterns
 */
const TicketList: React.FC<TicketListProps> = ({
  showFilters = true,
  initialFilters = {},
  categories = [],
  onSelectTicket
}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  // Usar selectores del nuevo slice de tickets
  const tickets = useAppSelector(selectFilteredTickets);
  const isLoading = useAppSelector(selectTicketsLoading);
  const error = useAppSelector(selectTicketsError);
  const currentFilters = useAppSelector(selectTicketsFilters);
  
  // Estado para paginación
  const [page, setPage] = useState(1);
  
  // Efecto para cargar tickets cuando cambian los filtros (enfoque funcional)
  useEffect(() => {
    // Inicializar filtros si se proporcionan
    if (Object.keys(initialFilters).length > 0) {
      dispatch(setFilters(initialFilters));
    }
    
    // Composición funcional con promesas para cargar tickets
    dispatch(fetchTickets({
      fetchTickets: (filters) => zohoService.getTickets(filters),
      filters: currentFilters.toJS()
    }));
  }, [dispatch, currentFilters]);
  
  // Manejador para seleccionar un ticket (patrón funcional)
  const handleSelectTicket = (ticketId: string) => {
    if (onSelectTicket) {
      onSelectTicket(ticketId);
    } else {
      navigate(`/tickets/${ticketId}`);
    }
  };
  
  // Función pura para aplicar filtros
  const handleFiltersChange = (newFilters: ZohoFilters) => {
    dispatch(setFilters(newFilters));
  };
  
  // Determinar el mensaje cuando no hay tickets
  const getEmptyMessage = () => {
    if (!currentFilters.isEmpty()) {
      return "No tickets match your filters. Try adjusting your filter criteria.";
    }
    return "No tickets found. Check back later or create a new ticket.";
  };
  
  return (
    <div className="space-y-4">
      {/* Componente de filtros */}
      {showFilters && (
        <TicketFilters 
          categories={categories} 
          onFiltersChange={handleFiltersChange}
        />
      )}
      
      {/* Mostrar error si existe */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Lista de tickets */}
      <div className="space-y-3">
        {isLoading ? (
          // Skeletons para carga
          Array.from({ length: 3 }).map((_, index) => (
            <Card key={`skeleton-${index}`} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-2/3 mb-2" />
                <Skeleton className="h-3 w-1/3" />
              </CardHeader>
              <CardContent className="py-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5 mt-2" />
              </CardContent>
              <CardFooter className="pt-2 pb-4">
                <Skeleton className="h-3 w-1/6 mr-2" />
                <Skeleton className="h-3 w-1/6" />
              </CardFooter>
            </Card>
          ))
        ) : tickets.size === 0 ? (
          <div className="text-center py-12 border rounded-md bg-muted/20">
            <p className="text-muted-foreground">{getEmptyMessage()}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => navigate('/create-ticket')}
            >
              Create a New Ticket
            </Button>
          </div>
        ) : (
          // Mapear tickets inmutables a componentes React
          tickets.map(ticket => (
            <TicketItem 
              key={ticket.get('id', '')} 
              ticket={ticket}
              onClick={() => handleSelectTicket(ticket.get('id', ''))}
            />
          )).toArray()
        )}
      </div>
    </div>
  );
};

// Componente puro para renderizar cada ticket individual
interface TicketItemProps {
  ticket: any; // Usar any para compatibilidad con Immutable
  onClick: () => void;
}

const TicketItem: React.FC<TicketItemProps> = ({ ticket, onClick }) => {
  // Extraer valores del ticket inmutable
  const id = ticket.get('id', '');
  const subject = ticket.get('subject', 'Untitled Ticket');
  const status = ticket.get('status', 'Unknown');
  const priority = ticket.get('priority', 'Medium');
  const createdTimestamp = ticket.get('createdTimestamp', Date.now());
  const description = ticket.get('description', '').substring(0, 120) + (ticket.get('description', '').length > 120 ? '...' : '');
  
  // Funciones puras para determinar colores
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return 'bg-green-500/10 text-green-600';
      case 'in progress': return 'bg-blue-500/10 text-blue-600';
      case 'on hold': return 'bg-amber-500/10 text-amber-600';
      case 'closed': return 'bg-slate-500/10 text-slate-600';
      default: return 'bg-slate-500/10 text-slate-600';
    }
  };
  
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-500/10 text-red-600';
      case 'medium': return 'bg-amber-500/10 text-amber-600';
      case 'low': return 'bg-green-500/10 text-green-600';
      default: return 'bg-slate-500/10 text-slate-600';
    }
  };
  
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md cursor-pointer" onClick={onClick}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{subject}</CardTitle>
        <div className="text-xs text-muted-foreground">#{id}</div>
      </CardHeader>
      <CardContent className="py-2">
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
      <CardFooter className="pt-2 pb-4 flex justify-between items-center">
        <div className="flex gap-2 items-center">
          <Badge variant="outline" className={`${getStatusColor(status)} text-xs`}>
            {status}
          </Badge>
          <Badge variant="outline" className={`${getPriorityColor(priority)} text-xs`}>
            {priority}
          </Badge>
        </div>
        <div className="flex items-center text-xs text-muted-foreground">
          <Clock className="h-3 w-3 mr-1" />
          {formatDistanceToNow(new Date(createdTimestamp), { addSuffix: true })}
        </div>
      </CardFooter>
    </Card>
  );
};

export default TicketList;
