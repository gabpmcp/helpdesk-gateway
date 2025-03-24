import React, { useEffect, useState } from 'react';
import { Map, List, fromJS } from 'immutable';
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
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
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
import zohoService from '@/services/zohoService';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ZohoCategory, ZohoTicket } from '@/core/models/zoho.types';

// Type definitions for immutable structures
type ImmutableTicket = Map<string, any>;
type ImmutableTicketList = List<ImmutableTicket>;
type ImmutableCategory = Map<string, any>;
type ImmutableCategoryList = List<ImmutableCategory>;
type ImmutableFilters = Map<string, string>;

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
  const [filters, setFilters] = useState<ImmutableFilters>(Map({
    status: '',
    priority: '',
    category: '',
    search: '',
    sortBy: 'modifiedTime',
    sortOrder: 'desc'
  }));

  useEffect(() => {
    // Functional approach to fetch categories
    const fetchCategories = () => 
      Promise.resolve(zohoService.getCategories())
        .then(categoriesData => {
          setCategories(fromJS(categoriesData));
          return categoriesData;
        })
        .catch(error => {
          console.error('Failed to fetch categories:', error);
          return Promise.reject(error);
        });

    fetchCategories();
  }, []);

  useEffect(() => {
    // Functional approach to fetch tickets
    const fetchTickets = () => {
      setLoading(true);
      
      // Convert immutable filters to regular object for API compatibility
      const filtersObj = filters.toJS();
      
      return Promise.resolve(zohoService.getTickets(filtersObj))
        .then(result => {
          setTickets(fromJS(result.tickets));
          return result;
        })
        .catch(error => {
          toast({
            title: "Error loading tickets",
            description: "Could not load tickets. Please try again later.",
            variant: "destructive",
          });
          console.error("Ticket loading error:", error);
          return Promise.reject(error);
        })
        .finally(() => {
          setLoading(false);
        });
    };

    fetchTickets();
  }, [filters, toast]);

  // Pure function to handle search input change
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prevFilters => prevFilters.set('search', e.target.value));
  };

  // Pure function to handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prevFilters => prevFilters.set(key, value));
  };

  // Pure function to toggle sort order
  const toggleSort = (field: string) => {
    setFilters(prevFilters => {
      const currentSortBy = prevFilters.get('sortBy', '');
      const currentSortOrder = prevFilters.get('sortOrder', 'asc');
      
      return prevFilters
        .set('sortBy', field)
        .set('sortOrder', currentSortBy === field && currentSortOrder === 'asc' ? 'desc' : 'asc');
    });
  };

  // Pure function for sort icon component
  const SortIcon = ({ field }: { field: string }) => {
    if (filters.get('sortBy') !== field) return null;
    return filters.get('sortOrder') === 'asc' ? 
      <SortAsc className="inline h-4 w-4 ml-1" /> : 
      <SortDesc className="inline h-4 w-4 ml-1" />;
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
                value={filters.get('search', '')}
                onChange={handleSearch}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full md:flex-1">
              <Select 
                value={filters.get('status', '')} 
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              
              <Select 
                value={filters.get('priority', '')} 
                onValueChange={(value) => handleFilterChange('priority', value)}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              
              <Select 
                value={filters.get('category', '')} 
                onValueChange={(value) => handleFilterChange('category', value)}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.get('id')} value={category.get('id')}>
                      {category.get('name')}
                    </SelectItem>
                  ))}
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
              <Button className="mt-4" onClick={() => setFilters(Map({
                status: '',
                priority: '',
                category: '',
                search: '',
                sortBy: 'modifiedTime',
                sortOrder: 'desc'
              }))}>
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
                  {tickets.map(ticket => (
                    <TableRow 
                      key={ticket.get('id')}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/tickets/${ticket.get('id')}`)}
                    >
                      <TableCell className="font-medium">#{ticket.get('id')}</TableCell>
                      <TableCell>{ticket.get('subject')}</TableCell>
                      <TableCell>
                        <StatusBadge status={ticket.get('status')} />
                      </TableCell>
                      <TableCell>
                        <PriorityIndicator priority={ticket.get('priority')} />
                      </TableCell>
                      <TableCell>{ticket.get('category')}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(ticket.get('modifiedTime')), 'MMM d, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))}
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
