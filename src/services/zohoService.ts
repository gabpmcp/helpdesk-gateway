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
  ZohoContact
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
    console.log('Enviando datos del ticket al backend:', JSON.stringify(ticketData));
    
    // Make the API request through the backend proxy
    const response = await apiClient.post('/api/zoho/tickets', ticketData);
    
    console.log('Respuesta completa del servidor:', response?.toString().substring(0, 500));
    
    // Verificar si tenemos una respuesta con la estructura esperada
    if (!response) {
      throw new Error('No se recibió respuesta del servidor');
    }
    
    // Si la respuesta tiene un campo ticket, extraerlo (formato de n8n)
    if (response.has('ticket')) {
      console.log('Encontrada estructura ticket en respuesta directa');
      const ticketData = response.get('ticket', Map());
      return toJS(ticketData) as ZohoTicket;
    }
    
    // Si la respuesta tiene datos dentro de data (formato API)
    if (response.has('data')) {
      console.log('Encontrada estructura data en respuesta');
      // Transform the ticket data
      const ticketData = response.get('data', Map());
      const immutableTicket = transformTicket(ticketData.toJS());
      
      // Return the ticket data
      return toJS(immutableTicket) as ZohoTicket;
    }
    
    // Si no encontramos ninguna estructura reconocible, devolver lo que tengamos
    console.warn('Estructura de respuesta no reconocida, intentando convertir toda la respuesta');
    return toJS(response) as ZohoTicket;
  } catch (error) {
    console.error('Error creating ticket:', error);
    console.error('Stack trace:', error.stack);
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
 * Get Zoho Departments/Categories
 * Uses backend proxy to avoid CORS issues
 * Note: These are returned as "categories" for backward compatibility with the UI
 */
const getCategories = async (): Promise<ZohoCategory[]> => {
  try {
    console.log('Fetching Zoho departments/categories...');
    
    // Make the API request through the backend proxy
    const response = await apiClient.get('/api/zoho/categories');
    
    console.log('Raw response structure:', response?.toString().substring(0, 300));
    
    // La respuesta puede tener las categorías bajo la clave 'categories' o 'data'
    let categoriesData;
    if (response && response.has('categories')) {
      categoriesData = response.get('categories', List());
      console.log('Found categories under "categories" key');
    } else if (response && response.has('data')) {
      categoriesData = response.get('data', List());
      console.log('Found categories under "data" key');
    } else {
      console.warn('Unexpected response structure - no categories found:', 
        response?.toString().substring(0, 200));
      return [];
    }
    
    console.log('Categories data:', categoriesData?.toString().substring(0, 200));
    
    if (!categoriesData || !List.isList(categoriesData) || categoriesData.isEmpty()) {
      console.warn('No valid categories data found');
      return [];
    }
    
    // Transform the data into categories format
    // Each category should have an id and name at minimum
    const immutableCategories = List<ImmutableCategory>(
      categoriesData
        .map((item: any) => {
          if (!Map.isMap(item)) {
            console.warn('Item is not a Map:', item);
            return null;
          }
          
          // Ensure we're getting the id and name fields
          const id = item.get('id') || '';
          const name = item.get('name') || '';
          
          console.log(`Processing category: ID=${id}, Name=${name}`);
          
          if (!id || !name) {
            console.warn('Missing required fields in category:', item.toString());
            return null;
          }
          
          return Map({
            id: id,
            name: name,
            // Store the original data for reference if needed
            departmentId: id
          });
        })
        .filter((item: any) => item !== null)
        .toArray()
    );
    
    console.log(`Processed ${immutableCategories.size} valid categories`);
    
    // Return the categories data
    return immutableCategories.toArray().map(category => toJS(category) as ZohoCategory);
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

/**
 * Get Zoho Contacts
 * Uses backend proxy to avoid CORS issues
 */
const getContacts = async (): Promise<ZohoContact[]> => {
  try {
    console.log('Fetching Zoho contacts...');
    
    // Make the API request through the backend proxy
    const response = await apiClient.get('/api/zoho/contacts');
    
    console.log('Raw contacts response:', response?.toString().substring(0, 300));
    
    // Check if we have valid data in the response
    if (!response) {
      console.warn('No response received from contacts API');
      return [];
    }
    
    // Verificamos si tenemos la estructura con validContacts (estructura de n8n)
    if (response.has('validContacts')) {
      console.log('Found validContacts in response');
      const contactsData = response.get('validContacts', List());
      
      if (!List.isList(contactsData) || contactsData.isEmpty()) {
        console.warn('No valid contacts found in validContacts');
        return [];
      }
      
      console.log(`Processing ${contactsData.size} contacts from validContacts...`);
      
      // Map each contact to proper structure
      const contacts = contactsData.map((item: any) => {
        if (!Map.isMap(item)) {
          console.warn('Contact item is not a Map:', item);
          return null;
        }
        
        const id = item.get('id', '') as string;
        const name = item.get('name', '') as string;
        const email = item.get('email', '') as string;
        const phone = item.get('phone', '') as string;
        
        return {
          id,
          name,
          email,
          phone
        };
      })
      .filter((contact: any) => contact !== null && contact.id)
      .toArray() as ZohoContact[];
      
      console.log(`Returned ${contacts.length} valid contacts from validContacts`);
      return contacts;
    }
    // Verificamos estructura alternativa con data
    else if (response.has('data')) {
      const contactsData = response.get('data', List());
      
      if (!List.isList(contactsData) || contactsData.isEmpty()) {
        console.warn('No valid contacts data found');
        return [];
      }
      
      console.log(`Processing ${contactsData.size} contacts from data...`);
      
      // Map each contact to proper structure
      const contacts = contactsData.map((item: any) => {
        if (!Map.isMap(item)) {
          console.warn('Contact item is not a Map:', item);
          return null;
        }
        
        const id = item.get('id', '') as string;
        const name = item.get('name', '') as string;
        const email = item.get('email', '') as string;
        const phone = item.get('phone', '') as string;
        
        return {
          id,
          name,
          email,
          phone
        };
      })
      .filter((contact: any) => contact !== null && contact.id)
      .toArray() as ZohoContact[];
      
      console.log(`Returned ${contacts.length} valid contacts from data`);
      return contacts;
    } 
    else {
      console.warn('Unexpected contacts response structure - no validContacts or data found:', 
        response?.toString().substring(0, 200));
      return [];
    }
  } catch (error) {
    console.error('Error fetching contacts:', error);
    throw error;
  }
};

// Export the service functions
export const zohoService = {
  authenticateUser,
  getTickets,
  getTicketById,
  addComment,
  createTicket,
  getDashboardStats,
  getCategories,
  getContacts
};
