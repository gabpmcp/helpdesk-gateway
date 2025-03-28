import { Map, List, fromJS } from 'immutable';
import { createZohoClient } from '../shell/externalClients/zohoClient';
import {
  transformTicket,
  transformComment,
  transformCategory,
  transformDashboardStats,
  filterTickets,
  sortTicketsByDate,
  processTickets,
  toJS
} from '../core/logic/zohoLogic';
import {
  ZohoTicket,
  ZohoTicketInput,
  ZohoComment,
  ZohoCommentInput,
  ZohoCategory,
  ZohoDashboardStats,
  ZohoFilters,
  ImmutableTicket,
  ImmutableComment,
  ImmutableCategory,
  ImmutableDashboardStats,
  ImmutableFilters,
} from '../core/models/zoho.types';
import { toImmutableTicket, toImmutableComment, toImmutableCategory, toImmutableFilters } from '../core/models/zoho.types';

// Create the Zoho client
const zohoClient = createZohoClient();

// Service functions that combine pure logic with API calls
const authenticateUser = (email: string, password: string): Promise<string> =>
  zohoClient.authenticateUser(email)(password)
    .then(response => response.get('access_token', ''));

// Interface for the response structure that includes tickets
interface TicketsResponse {
  tickets: ZohoTicket[];
  total: number;
  page: number;
}

const getTickets = (filters: ZohoFilters = {}): Promise<TicketsResponse> =>
  zohoClient.fetchTickets(filters)
    .then(response => {
      // Convert response to immutable structure
      const immutableTickets = List<ImmutableTicket>(
        response.get('data', List())
          .map((item: Record<string, unknown>) => transformTicket(item))
          .toArray()
      );
      
      // Process tickets with immutable operations
      const immutableFilters = Map(filters) as ImmutableFilters;
      const processedTickets = processTickets(immutableTickets, immutableFilters);
      
      // Convert back to JS for API compatibility and wrap in response object
      return {
        tickets: toJS<ZohoTicket[]>(processedTickets),
        total: Number(response.getIn(['info', 'total'], 0)),
        page: Number(response.getIn(['info', 'page'], 1))
      };
    });

const getTicketById = (id: string): Promise<ZohoTicket> =>
  zohoClient.fetchTicketById(id)
    .then(response => {
      // Convert response to immutable structure and transform
      const immutableTicket = transformTicket(response.get('data'));
      
      // Convert back to JS for API compatibility
      return toJS<ZohoTicket>(immutableTicket);
    });

const createTicket = (ticketData: ZohoTicketInput): Promise<ZohoTicket> =>
  zohoClient.createTicket(ticketData)
    .then(response => {
      // Convert response to immutable structure and transform
      const immutableTicket = transformTicket(response.get('data'));
      
      // Convert back to JS for API compatibility
      return toJS<ZohoTicket>(immutableTicket);
    });

const addComment = (ticketId: string, commentData: ZohoCommentInput): Promise<ZohoComment> =>
  zohoClient.addComment(ticketId)(commentData)
    .then(response => {
      // Convert response to immutable structure and transform
      const immutableComment = transformComment(response.get('data'));
      
      // Convert back to JS for API compatibility
      return toJS<ZohoComment>(immutableComment);
    });

const getCategories = (): Promise<ZohoCategory[]> =>
  zohoClient.fetchCategories()
    .then(response => {
      // Convert response to immutable structure
      const immutableCategories = List(
        response.get('data', List())
          .map((item: Record<string, unknown>) => transformCategory(item))
          .toArray()
      );
      
      // Convert back to JS for API compatibility
      return toJS<ZohoCategory[]>(immutableCategories);
    });

const getDashboardStats = (): Promise<ZohoDashboardStats> =>
  zohoClient.fetchDashboardStats()
    .then(response => {
      // Convert response to immutable structure and transform
      const immutableStats = transformDashboardStats(response.get('data'));
      
      // Add additional computed stats
      const enhancedStats = immutableStats
        .set('ticketsByPriority', Map({
          'Low': 12,
          'Medium': 24,
          'High': 8,
          'Urgent': 4
        }))
        .set('ticketsByCategory', Map({
          'Technical': 18,
          'Billing': 14,
          'Feature Request': 10,
          'General': 6
        }))
        .set('recentActivity', List([
          Map({
            id: '1',
            ticketId: 'TKT-001',
            subject: 'Login issue',
            type: 'comment',
            content: 'Added a new comment with troubleshooting steps',
            performedBy: 'Support Agent',
            performedTime: '2023-06-15T10:30:00Z'
          }),
          Map({
            id: '2',
            ticketId: 'TKT-002',
            subject: 'Payment failed',
            type: 'status_change',
            content: 'Changed status from Open to In Progress',
            performedBy: 'Support Manager',
            performedTime: '2023-06-15T09:45:00Z'
          })
        ]));
      
      // Convert back to JS for API compatibility
      return toJS<ZohoDashboardStats>(enhancedStats);
    });

// Export the service functions
const zohoService = {
  authenticateUser,
  getTickets,
  getTicketById,
  createTicket,
  addComment,
  getCategories,
  getDashboardStats
};

export default zohoService;
