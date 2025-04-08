import React, { useEffect, useState } from 'react';
import { List, fromJS } from 'immutable';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { SafeSelectItem } from "@/components/ui/safe-select-item";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Filter, 
  Loader2, 
  Plus, 
  Search, 
  SortAsc, 
  SortDesc 
} from 'lucide-react';
import { zohoService } from '@/services/zohoService';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ZohoCategory, ZohoTicket, ZohoFilters } from '@/core/models/zoho.types';

// Type definitions for immutable structures
type ImmutableTicket = any;
type ImmutableTicketList = List<ImmutableTicket>;
type ImmutableCategory = any;
type ImmutableCategoryList = List<ImmutableCategory>;

// Status badge component
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

// Priority indicator component
const PriorityIndicator = ({ priority }: { priority: string }) => {
  const priorityClass = `priority-${priority}`;
  
  return (
    <div className="flex items-center">
      <div className={`h-2 w-2 rounded-full mr-2 ${priorityClass}`}></div>
      <span className="capitalize">{priority}</span>
    </div>
  );
};

const Tickets: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<ImmutableTicketList>(List([]));
  const [categories, setCategories] = useState<ImmutableCategoryList>(List([]));
  const [loading, setLoading] = useState<boolean>(true);
  // Tipo explícito y más estricto para los filtros
  const [filters, setFilters] = useState<ZohoFilters>({
    status: '',
    priority: '',
    category: '',
    search: '',
    sortBy: 'modifiedTime',
    sortOrder: 'desc' // tipo literal específico
  });

  useEffect(() => {
    // Functional approach to fetch categories
    const fetchCategories = () => {
      zohoService.getCategories()
        .then(categoriesData => {
          console.log('Categories received from zohoService:', categoriesData);
          setCategories(fromJS(categoriesData));
          return categoriesData;
        })
        .catch(error => {
          console.error('Failed to fetch categories:', error);
          toast({
            title: "Error al cargar categorías",
            description: error.message || "No se pudieron cargar las categorías. Por favor intente de nuevo.",
            variant: "destructive"
          });
          return [];
        });
    };

    fetchCategories();
  }, [toast]);

  useEffect(() => {
    // Functional approach to fetch tickets
    const fetchTickets = () => {
      setLoading(true);
      
      const filtersObj = filters;
      
      // Construir query string para los filtros (solo para logging)
      const queryParams = new URLSearchParams();
      Object.entries(filtersObj)
        .filter(([_, value]) => value !== undefined && value !== null && value !== '')
        .forEach(([key, value]) => queryParams.append(key, String(value)));
      
      const queryString = queryParams.toString();
      console.log('Fetching tickets with filters:', filtersObj, 'Query string:', queryString);
      
      zohoService.getTickets(filtersObj)
        .then(result => {
          console.log('===== DIAGNÓSTICO DE RESPUESTA =====');
          console.log('Respuesta completa de zohoService:', result);
          
          // Análisis de estructura
          console.log('Tipo de resultado:', typeof result);
          
          // Verificar si es un objeto con la estructura esperada
          if (result) {
            console.log('¿Tiene propiedad tickets?', 'tickets' in result ? 'Sí' : 'No');
            
            if ('tickets' in result) {
              const tickets = result.tickets;
              console.log('Tipo de tickets:', typeof tickets);
              console.log('¿Es array?', Array.isArray(tickets) ? 'Sí' : 'No');
              console.log('Cantidad de tickets:', Array.isArray(tickets) ? tickets.length : 'N/A');
              
              // Mostrar primer ticket si existe
              if (Array.isArray(tickets) && tickets.length > 0) {
                console.log('Primer ticket (muestra):', tickets[0]);
                console.log('Propiedades del primer ticket:', Object.keys(tickets[0]));
              } else {
                console.log('No hay tickets disponibles en la respuesta');
              }
            } else {
              console.log('La respuesta no contiene la propiedad "tickets"');
              console.log('Propiedades disponibles:', Object.keys(result));
            }
          } else {
            console.log('La respuesta es nula o indefinida');
          }
          
          console.log('===== FIN DIAGNÓSTICO =====');
          
          // Verificar si tenemos datos
          if (!result?.tickets || !Array.isArray(result.tickets)) {
            console.error('No se recibieron tickets válidos:', result);
            setTickets(List([]));
            setLoading(false);
            return result;
          }
          
          // Asegurar que cada ticket tiene un ID único
          const ticketsWithIds = result.tickets.map((ticket, index) => {
            if (!ticket.id) {
              return { ...ticket, id: `temp-${index}` };
            }
            return ticket;
          });
          
          // Convertir a estructura inmutable y aplicar filtros/ordenamiento
          const immutableTickets = fromJS(ticketsWithIds);
          setTickets(immutableTickets);
          setLoading(false);
          return result;
        })
        .catch(error => {
          console.error('Error al cargar tickets:', error);
          toast({
            title: "Error al cargar tickets",
            description: error.message || "No se pudieron cargar los tickets. Por favor intente de nuevo.",
            variant: "destructive"
          });
          setTickets(List([]));
          setLoading(false);
          return { tickets: [], error: error.message };
        });
    };

    fetchTickets();
  }, [filters, toast]);

  // Pure function to handle search input change
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      search: e.target.value
    }));
  };

  // Pure function to handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    // Si el valor es "_empty_", lo convertimos a cadena vacía
    const normalizedValue = value === "_empty_" ? "" : value;
    
    setFilters(prevFilters => ({
      ...prevFilters,
      [key]: normalizedValue
    }));
  };

  // Pure function to toggle sort order
  const toggleSort = (field: string) => {
    setFilters(prevFilters => {
      const currentSortBy = prevFilters.sortBy;
      const currentSortOrder = prevFilters.sortOrder || 'desc';
      
      return {
        ...prevFilters,
        sortBy: field,
        // Especificar que siempre será uno de los dos tipos literales
        sortOrder: (currentSortBy === field && currentSortOrder === 'asc' ? 'desc' : 'asc') as 'asc' | 'desc'
      };
    });
  };

  // Pure function for sort icon component
  const SortIcon = ({ field }: { field: string }) => {
    if (filters.sortBy !== field) return null;
    return filters.sortOrder === 'asc' ? 
      <SortAsc className="inline h-4 w-4 ml-1" /> : 
      <SortDesc className="inline h-4 w-4 ml-1" />;
  };

  // Función segura para formatear fechas
  const formatDateSafe = (dateValue: any): string => {
    if (!dateValue) return 'No disponible';
    
    try {
      // Intentar convertir a Date válido
      const date = new Date(dateValue);
      
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        console.warn('Fecha inválida en lista de tickets:', dateValue);
        return 'Fecha no disponible';
      }
      
      // Formatear usando date-fns
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      console.error('Error al formatear fecha en lista de tickets:', error);
      return 'Fecha no disponible';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold">Support Tickets</h1>
          <p className="text-muted-foreground">
            View and manage all your support requests
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button onClick={() => navigate('/tickets/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                type="search" 
                placeholder="Search tickets..." 
                className="pl-8"
                value={filters.search}
                onChange={handleSearch}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full md:flex-1">
              <Select 
                value={filters.status || "_empty_"} 
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SafeSelectItem value="_empty_">All Statuses</SafeSelectItem>
                  <SafeSelectItem value="new">New</SafeSelectItem>
                  <SafeSelectItem value="open">Open</SafeSelectItem>
                  <SafeSelectItem value="in-progress">In Progress</SafeSelectItem>
                  <SafeSelectItem value="on-hold">On Hold</SafeSelectItem>
                  <SafeSelectItem value="resolved">Resolved</SafeSelectItem>
                  <SafeSelectItem value="closed">Closed</SafeSelectItem>
                </SelectContent>
              </Select>
              
              <Select 
                value={filters.priority || "_empty_"} 
                onValueChange={(value) => handleFilterChange('priority', value)}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SafeSelectItem value="_empty_">All Priorities</SafeSelectItem>
                  <SafeSelectItem value="low">Low</SafeSelectItem>
                  <SafeSelectItem value="medium">Medium</SafeSelectItem>
                  <SafeSelectItem value="high">High</SafeSelectItem>
                  <SafeSelectItem value="urgent">Urgent</SafeSelectItem>
                </SelectContent>
              </Select>
              
              <Select 
                value={filters.category || "_empty_"} 
                onValueChange={(value) => handleFilterChange('category', value)}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SafeSelectItem value="_empty_">All Categories</SafeSelectItem>
                  {categories.map(category => {
                    // Asegurar que id y name son strings válidos
                    const id = String(category.get('id', ''));
                    const name = String(category.get('name', 'Unknown'));
                    return (
                      <SafeSelectItem key={id} value={id}>
                        {name}
                      </SafeSelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : tickets.size === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No tickets found</p>
              <Button className="mt-4" onClick={() => setFilters({
                status: '',
                priority: '',
                category: '',
                search: '',
                sortBy: 'modifiedTime',
                sortOrder: 'desc'
              })}>
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => toggleSort('id')}
                    >
                      ID <SortIcon field="id" />
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => toggleSort('subject')}
                    >
                      Subject <SortIcon field="subject" />
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => toggleSort('modifiedTime')}
                    >
                      Last Updated <SortIcon field="modifiedTime" />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket, index) => {
                    // Obtener un ID para la key - usar el ID del ticket o generar uno basado en el índice
                    const ticketId = ticket.get('id') || `ticket-${index}`;
                    
                    // Debug para ver qué contiene cada ticket
                    console.log(`Ticket ${index}:`, ticket.toJS());
                    
                    // Preparar navegación al detalle
                    const handleTicketClick = () => {
                      // Solo navegar si hay un ID para el ticket
                      if (ticketId) {
                        console.log(`Navegando al ticket: ${ticketId}`);
                        navigate(`/tickets/${ticketId}`);
                      } else {
                        toast({
                          title: "Error al abrir ticket",
                          description: "Este ticket no tiene un ID válido",
                          variant: "destructive"
                        });
                      }
                    };
                    
                    return (
                      <TableRow 
                        key={`row-${ticketId}`}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={handleTicketClick}
                      >
                        <TableCell className="font-medium">
                          {ticket.get('id') ? `#${ticket.get('id')}` : 'Nuevo'}
                        </TableCell>
                        <TableCell>
                          {ticket.get('subject') || 'Sin asunto'}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={ticket.get('status') || 'Unknown'} />
                        </TableCell>
                        <TableCell>
                          <PriorityIndicator priority={ticket.get('priority') || 'Medium'} />
                        </TableCell>
                        <TableCell>
                          {ticket.get('category') || ticket.get('departmentId') || 'General'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDateSafe(ticket.get('modifiedTime') || ticket.get('createdTime'))}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Tickets;
