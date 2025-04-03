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
  ZohoContact,
  ZohoAccount
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
  timestamp: string;
}

/**
 * Get tickets with optional filters
 * Uses backend proxy to avoid CORS issues
 * @param filters - Filter parameters for tickets
 * @returns Promise with tickets response
 */
const getTickets = async (filters: ZohoFilters = {}): Promise<TicketsResponse> => {
  try {
    // Build query parameters from filters in a functional way
    const queryParams = Object.entries(filters)
      .filter(([_, value]) => value !== undefined && value !== null && value !== '')
      .reduce((acc, [key, value]) => {
        acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>);
    
    // Create URL with query string using URLSearchParams
    const queryString = new URLSearchParams(queryParams).toString();
    const url = `/api/zoho/tickets${queryString ? `?${queryString}` : ''}`;
    
    console.log(`Fetching tickets with filters: ${JSON.stringify(filters)}`);
    const response = await apiClient.get(url);
    
    // Adaptable parsing based on response structure
    let ticketsData;
    let metaData = Map({
      total: 0,
      from: 0,
      limit: 50
    });
    
    // Manejar diferentes estructuras de respuesta posibles
    if (response.has('success') && !response.get('success')) {
      // Si hay un campo success y es false, hay un error
      throw new Error(response.get('error', 'Unknown error occurred'));
    } else if (response.has('tickets')) {
      // Si la respuesta contiene un array de tickets directamente
      ticketsData = response.get('tickets');
      // Si hay metadatos disponibles, usarlos
      if (response.has('meta')) {
        metaData = response.get('meta');
      }
    } else if (response.has('data') && List.isList(response.get('data'))) {
      // Algunos endpoints devuelven los tickets dentro de un campo data
      ticketsData = response.get('data');
    } else if (List.isList(response)) {
      // Si la respuesta es directamente una lista
      ticketsData = response;
    } else {
      // En último caso, intentar con el campo 'items' o usar la respuesta completa
      ticketsData = response.get('items', response);
    }
    
    // Asegurar que ticketsData sea una List de Immutable
    const ticketsList = List.isList(ticketsData) ? ticketsData : List(ticketsData || []);
    
    // Transform tickets to immutable structure
    const tickets = ticketsList
      .map((ticket: any) => transformTicket(fromJS(ticket)))
      .toList();
    
    console.log(`Successfully fetched ${tickets.size} tickets`);
    
    // Return tickets and metadata
    return {
      tickets: tickets.toJS() as ZohoTicket[],
      total: metaData.get('total', tickets.size),
      page: Math.max(1, metaData.get('from', 0) / Math.max(1, metaData.get('limit', 50))),
      timestamp: response.get('timestamp', new Date().toISOString())
    };
  } catch (error) {
    console.error('Error fetching tickets:', error);
    throw error instanceof Error ? 
      error : 
      new Error('Failed to fetch tickets');
  }
};

/**
 * Get a ticket by ID
 * Uses backend proxy to avoid CORS issues
 * @param id - Ticket ID
 * @returns Promise with ticket data
 */
const getTicketById = async (id: string): Promise<ZohoTicket> => {
  try {
    // Make the API request through the backend proxy
    const response = await apiClient.get(`/api/zoho/tickets/${id}`);
    
    // Transform the ticket data
    const immutableTicket = transformTicket(fromJS(response.get('data', Map()).toJS()));
    
    // Return the ticket data
    return toJS(immutableTicket) as ZohoTicket;
  } catch (error) {
    console.error(`Error fetching ticket ${id}:`, error);
    throw error;
  }
};

/**
 * Get comments for a ticket
 * Uses backend proxy to avoid CORS issues
 * @param ticketId - Ticket ID
 * @returns Promise with comments data
 */
const getTicketComments = async (ticketId: string): Promise<ZohoComment[]> => {
  try {
    console.log(`Fetching comments for ticket: ${ticketId}`);
    
    // Make the API request through the backend proxy
    const response = await apiClient.get(`/api/zoho/tickets/${ticketId}/comments`);
    
    // Verify response structure
    if (!response.get('success')) {
      throw new Error('Failed to fetch comments: Invalid response format');
    }
    
    // Transform comments to immutable structure
    const comments = response.get('comments', List())
      .map((comment: any) => transformComment(fromJS(comment)))
      .toList();
    
    // Return converted to JS
    return comments.toJS() as ZohoComment[];
  } catch (error) {
    console.error(`Error fetching comments for ticket ${ticketId}:`, error);
    throw error;
  }
};

/**
 * Add a comment to a ticket
 * Uses backend proxy to avoid CORS issues
 * @param ticketId - Ticket ID
 * @param commentData - Comment data to add
 * @returns Promise with created comment data
 */
const addComment = async (ticketId: string, commentData: ZohoCommentInput): Promise<ZohoComment> => {
  try {
    console.log(`Adding comment to ticket: ${ticketId}`);
    
    // Make the API request through the backend proxy
    const response = await apiClient.post(`/api/zoho/tickets/${ticketId}/comments`, commentData);
    
    // Verify response structure
    if (!response.get('success')) {
      throw new Error('Failed to add comment: Invalid response format');
    }
    
    // Transform the comment data
    const immutableComment = transformComment(fromJS(response.toJS()));
    
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

/**
 * Get Zoho Accounts
 * Uses backend proxy to avoid CORS issues
 */
const getAccounts = async (): Promise<ZohoAccount[]> => {
  try {
    console.log('Fetching accounts from Zoho...');
    const apiClient = createApiClient();
    const response = await apiClient.get('/api/zoho/accounts');
    
    if (!response || typeof response !== 'object') {
      console.warn('Invalid accounts response:', response);
      return [];
    }
    
    const responseMap = fromJS(response);
    
    if (!Map.isMap(responseMap)) {
      console.warn('Response is not an Immutable Map:', response);
      return [];
    }
    
    // Verificamos estructura con validAccounts
    if (responseMap.has('validAccounts')) {
      const accountsData = responseMap.get('validAccounts', List());
      
      if (!List.isList(accountsData) || accountsData.isEmpty()) {
        console.warn('No valid accounts found');
        return [];
      }
      
      console.log(`Processing ${accountsData.size} accounts from validAccounts...`);
      
      // Map each account to proper structure
      const accounts = accountsData.map((item: any) => {
        if (!Map.isMap(item)) {
          console.warn('Account item is not a Map:', item);
          return null;
        }
        
        const id = item.get('id', '') as string;
        const name = item.get('name', '') as string;
        const domain = item.get('domain', '') as string;
        const isActive = item.get('isActive', true) as boolean;
        
        return {
          id,
          name,
          domain,
          isActive
        };
      })
      .filter((account: any) => account !== null && account.id)
      .toArray() as ZohoAccount[];
      
      console.log(`Returned ${accounts.length} valid accounts from validAccounts`);
      return accounts;
    }
    // Verificamos estructura alternativa con data
    else if (responseMap.has('data')) {
      const accountsData = responseMap.get('data', List());
      
      if (!List.isList(accountsData) || accountsData.isEmpty()) {
        console.warn('No valid accounts data found');
        return [];
      }
      
      console.log(`Processing ${accountsData.size} accounts from data...`);
      
      // Map each account to proper structure
      const accounts = accountsData.map((item: any) => {
        if (!Map.isMap(item)) {
          console.warn('Account item is not a Map:', item);
          return null;
        }
        
        const id = item.get('id', '') as string;
        const name = item.get('name', '') as string;
        const domain = item.get('domain', '') as string;
        const isActive = item.get('isActive', true) as boolean;
        
        return {
          id,
          name,
          domain,
          isActive
        };
      })
      .filter((account: any) => account !== null && account.id)
      .toArray() as ZohoAccount[];
      
      console.log(`Returned ${accounts.length} valid accounts from data`);
      return accounts;
    } 
    else {
      console.warn('Unexpected accounts response structure - no validAccounts or data found:', 
        responseMap?.toString().substring(0, 200));
      return [];
    }
  } catch (error) {
    console.error('Error fetching accounts:', error);
    throw error;
  }
};

// Export the service functions
export const zohoService = {
  authenticateUser,
  getTickets,
  getTicketById,
  getTicketComments,
  addComment,
  createTicket,
  getDashboardStats,
  getCategories,
  getContacts,
  getAccounts
};
