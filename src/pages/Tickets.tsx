
import React, { useEffect, useState } from 'react';
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
import { zohoService } from '@/services/zohoService';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

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
  const [tickets, setTickets] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    search: '',
    sortBy: 'modifiedTime',
    sortOrder: 'desc'
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesData = await zohoService.getCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      try {
        const result = await zohoService.getTickets(filters);
        setTickets(result.tickets);
      } catch (error) {
        toast({
          title: "Error loading tickets",
          description: "Could not load tickets. Please try again later.",
          variant: "destructive",
        });
        console.error("Ticket loading error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [filters, toast]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({
      ...filters,
      search: e.target.value
    });
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters({
      ...filters,
      [key]: value
    });
  };

  const toggleSort = (field: string) => {
    setFilters({
      ...filters,
      sortBy: field,
      sortOrder: filters.sortBy === field && filters.sortOrder === 'asc' ? 'desc' : 'asc'
    });
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (filters.sortBy !== field) return null;
    return filters.sortOrder === 'asc' ? 
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
                value={filters.search}
                onChange={handleSearch}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full md:flex-1">
              <Select 
                value={filters.status} 
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
                value={filters.priority} 
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
                value={filters.category} 
                onValueChange={(value) => handleFilterChange('category', value)}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Filter className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-medium">No tickets found</h3>
              <p>Try adjusting your filters or create a new ticket.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="w-[100px] cursor-pointer"
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
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => toggleSort('status')}
                    >
                      Status <SortIcon field="status" />
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => toggleSort('priority')}
                    >
                      Priority <SortIcon field="priority" />
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => toggleSort('category')}
                    >
                      Category <SortIcon field="category" />
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => toggleSort('createdTime')}
                    >
                      Created <SortIcon field="createdTime" />
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => toggleSort('modifiedTime')}
                    >
                      Updated <SortIcon field="modifiedTime" />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow 
                      key={ticket.id}
                      className="cursor-pointer hover:bg-secondary/50"
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                    >
                      <TableCell className="font-medium">#{ticket.id}</TableCell>
                      <TableCell className="max-w-[300px] truncate">{ticket.subject}</TableCell>
                      <TableCell>
                        <StatusBadge status={ticket.status} />
                      </TableCell>
                      <TableCell>
                        <PriorityIndicator priority={ticket.priority} />
                      </TableCell>
                      <TableCell>{ticket.category}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(ticket.createdTime), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(ticket.modifiedTime), 'MMM d, yyyy')}
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
