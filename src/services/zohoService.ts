import { Map, List, fromJS } from 'immutable';
import { createApiClient } from '../core/api/apiClient';
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

// Create the API client for backend proxy
const apiClient = createApiClient();

// Service functions that combine pure logic with API calls
const authenticateUser = async (email: string, password: string): Promise<string> => {
  try {
    const response = await apiClient.post('/api/auth/login', { email, password });
    return response.get('accessToken', '');
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
};

// Interface for the response structure that includes tickets
interface TicketsResponse {
  tickets: ZohoTicket[];
  total: number;
  page: number;
}

/**
 * Get tickets with optional filters
 * Uses backend proxy to avoid CORS issues
 */
const getTickets = async (filters: ZohoFilters = {}): Promise<TicketsResponse> => {
  try {
    // Create URL parameters from filters
    const params = new URLSearchParams();
    Object.entries(filters)
      .filter(([_, value]) => value !== undefined && value !== null && value !== '')
      .forEach(([key, value]) => params.append(key, String(value)));
    
    // Make the API request through the backend proxy
    const response = await apiClient.get(`/api/zoho/tickets?${params.toString()}`);
    
    // Convert response to immutable structure
    const immutableTickets = List<ImmutableTicket>(
      (response.get('data', List()) as List<any>)
        .map((item: any) => transformTicket(item))
        .toArray()
    );
    
    // Apply filtering and sorting
    const processedTickets = processTickets(immutableTickets, Map(filters) as ImmutableFilters);
    
    // Return the processed data
    return {
      tickets: processedTickets.toArray().map(ticket => toJS(ticket) as ZohoTicket),
      total: response.get('total', 0) as number,
      page: response.get('page', 1) as number
    };
  } catch (error) {
    console.error('Error fetching tickets:', error);
    throw error;
  }
};

/**
 * Get a ticket by ID
 * Uses backend proxy to avoid CORS issues
 */
const getTicketById = async (id: string): Promise<ZohoTicket> => {
  try {
    // Make the API request through the backend proxy
    const response = await apiClient.get(`/api/zoho/tickets/${id}`);
    
    // Transform the ticket data
    const immutableTicket = transformTicket(response.get('data', Map()).toJS());
    
    // Return the ticket data
    return toJS(immutableTicket) as ZohoTicket;
  } catch (error) {
    console.error(`Error fetching ticket ${id}:`, error);
    throw error;
  }
};

/**
 * Add a comment to a ticket
 * Uses backend proxy to avoid CORS issues
 */
const addComment = async (ticketId: string, commentData: ZohoCommentInput): Promise<ZohoComment> => {
  try {
    // Make the API request through the backend proxy
    const response = await apiClient.post(`/api/zoho/tickets/${ticketId}/comments`, commentData);
    
    // Transform the comment data
    const immutableComment = transformComment(response.get('data', Map()).toJS());
    
    // Return the comment data
    return toJS(immutableComment) as ZohoComment;
  } catch (error) {
    console.error(`Error adding comment to ticket ${ticketId}:`, error);
    throw error;
  }
};

/**
 * Create a new ticket
 * Uses backend proxy to avoid CORS issues
 */
const createTicket = async (ticketData: ZohoTicketInput): Promise<ZohoTicket> => {
  try {
    // Make the API request through the backend proxy
    const response = await apiClient.post('/api/zoho/tickets', ticketData);
    
    // Transform the ticket data
    const immutableTicket = transformTicket(response.get('data', Map()).toJS());
    
    // Return the ticket data
    return toJS(immutableTicket) as ZohoTicket;
  } catch (error) {
    console.error('Error creating ticket:', error);
    throw error;
  }
};

/**
 * Get dashboard statistics
 * Uses backend projection endpoint to avoid CORS issues
 */
const getDashboardStats = async (): Promise<ZohoDashboardStats> => {
  try {
    // Make the API request through the backend projection endpoint
    const response = await apiClient.get('/projections/dashboard/overview');
    
    // Transform the dashboard stats
    const immutableStats = transformDashboardStats(response.toJS());
    
    // Return the dashboard stats
    return toJS(immutableStats) as ZohoDashboardStats;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

/**
 * Get categories
 * Uses backend proxy to avoid CORS issues
 */
const getCategories = async (): Promise<ZohoCategory[]> => {
  try {
    // Make the API request through the backend proxy
    const response = await apiClient.get('/api/zoho/categories');
    
    // Acceder al array de categorías dentro de la estructura de respuesta
    // El backend devuelve { categories: [...] }
    const categoriesData = response.get('categories', List());
    
    console.log('Categorías recibidas (raw):', categoriesData.toJS());
    
    // Si no hay categorías, devolver un array vacío
    if (!categoriesData || !categoriesData.size) {
      console.warn('No se encontraron categorías');
      return [];
    }
    
    // Transform the categories data to ensure they have the correct format
    const categories = categoriesData.map((item) => {
      // Ensure we have valid id and name
      const id = item.get('id', '');
      const name = item.get('name', '');
      
      return {
        id: String(id),
        name: String(name),
        description: item.get('description', ''),
        isDefault: item.get('isDefault', false)
      };
    }).toArray();
    
    console.log('Categorías procesadas:', categories);
    
    // Return plain JavaScript objects, not Immutable structures
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

// Export the service functions
export default {
  authenticateUser,
  getTickets,
  getTicketById,
  addComment,
  createTicket,
  getDashboardStats,
  getCategories
};
