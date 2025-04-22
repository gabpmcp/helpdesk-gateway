import { Map as ImmutableMap, List, fromJS } from 'immutable';
import { apiClient } from '../core/api/apiClient';
import {
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
import { toImmutableComment, toImmutableCategory, toImmutableFilters } from '../core/models/zoho.types';

// Type guards y utilidades para reducir complejidad ciclomática
// ============================================================

/**
 * Type guard para verificar si un valor es un Map de Immutable
 * @param value - Valor a verificar
 * @returns true si es un Map de Immutable
 */
const isImmutableMap = (value: any): value is ImmutableMap<string, any> => 
  value && ImmutableMap.isMap(value);

/**
 * Obtiene un valor seguro de un Map inmutable o retorna un valor por defecto
 * @param map - Map de Immutable o cualquier valor
 * @param key - Clave a obtener
 * @param defaultValue - Valor por defecto si map no es un Map o key no existe
 * @returns El valor obtenido o el valor por defecto
 */
const safeGet = <T>(map: any, key: string, defaultValue: T): T =>
  isImmutableMap(map) ? map.get(key, defaultValue) : defaultValue;

/**
 * Intenta convertir un valor a JS de forma segura
 * @param value - Valor a convertir
 * @returns Versión JS del valor o el valor original
 */
const safeToJS = (value: any): any =>
  isImmutableMap(value) && typeof value.toJS === 'function' 
    ? value.toJS() 
    : value;

/**
 * Registra un objeto en consola de forma segura
 * @param message - Mensaje descriptivo
 * @param value - Valor a registrar
 */
const safeLog = (message: string, value: any): void =>
  console.log(message, safeToJS(value));

/**
 * Registra un error en consola de forma segura
 * @param message - Mensaje de error
 * @param value - Valor a registrar
 */
const safeErrorLog = (message: string, value: any): void =>
  console.error(message, safeToJS(value));

// Create the API client for backend proxy
// const apiClient = createApiClient();

/**
 * Transform ticket data from API to application format
 * This is a pure function that handles possible undefined values defensively
 * @param ticket - Ticket data from API
 * @returns Transformed ticket data
 */
const transformTicket = (ticket: ImmutableMap<string, any>): ImmutableMap<string, any> => {
  // Si el ticket es null o undefined, devolver un mapa vacío
  if (!ticket) return ImmutableMap({});
  
  // Log detallado para depuración
  safeLog('Transforming ticket data:', ticket);
  
  // Crear una estructura básica de ticket con valores por defecto usando safeGet
  return ImmutableMap({
    id: safeGet(ticket, 'id', ''),
    subject: safeGet(ticket, 'subject', 'Sin título'),
    description: safeGet(ticket, 'description', ''),
    status: safeGet(ticket, 'status', 'Open'),
    priority: safeGet(ticket, 'priority', 'Medium'),
    category: safeGet(ticket, 'category', safeGet(ticket, 'departmentId', 'General')),
    createdTime: safeGet(ticket, 'createdTime', new Date().toISOString()),
    modifiedTime: safeGet(ticket, 'modifiedTime', safeGet(ticket, 'createdTime', new Date().toISOString())),
    dueDate: safeGet(ticket, 'dueDate', ''),
    departmentId: safeGet(ticket, 'departmentId', ''),
    contactId: safeGet(ticket, 'contactId', ''),
    assigneeId: safeGet(ticket, 'assigneeId', ''),
    comments: safeGet(ticket, 'comments', List([])),
    isOverdue: safeGet(ticket, 'isOverdue', false),
    isEscalated: safeGet(ticket, 'isEscalated', false)
  });
};

// Interface for the response structure that includes tickets
interface TicketsResponse {
  tickets: ZohoTicket[];
  total: number;
  page: number;
  timestamp: string;
}

// Service functions that combine pure logic with API calls
const authenticateUser = async (email: string, password: string): Promise<string> => {
  try {
    const response = await apiClient().post('/api/auth/login', { email, password });
    
    // Usar safeGet para acceso seguro al token
    return safeGet(response, 'accessToken', '');
  } catch (error) {
    console.error('Authentication error:', error);
    return ''; // Valor por defecto en caso de error (programación defensiva)
  }
};

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
    
    // Log con parámetros de filtrado
    console.log(`Fetching tickets with filters: ${JSON.stringify(filters)}`);
    
    // Obtener respuesta del API
    const response = await apiClient().get(url);
    
    // Log seguro de respuesta
    safeLog('Tickets response:', response);
    
    // Procesamiento inmutable con pipeline funcional
    return processTicketsResponse(response);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    // Respuesta por defecto en caso de error (programación defensiva)
    return {
      tickets: [],
      total: 0,
      page: 1,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Función pura para procesar la respuesta de tickets
 * @param response - Respuesta del API
 * @returns Datos de tickets procesados
 */
const processTicketsResponse = (response: any): TicketsResponse => {
  // Convertir a Immutable si no lo es ya
  const immutableResponse = isImmutableMap(response) ? response : fromJS(response);
  
  console.log('Respuesta procesada como Immutable:', immutableResponse);
  
  // Extraer tickets según la estructura de la respuesta
  let ticketsData;
  
  // Caso 1: tickets en campo 'tickets'
  if (immutableResponse.has('tickets')) {
    ticketsData = safeGet(immutableResponse, 'tickets', List());
  }
  // Caso 2: tickets en campo 'data'
  else if (immutableResponse.has('data')) {
    ticketsData = safeGet(immutableResponse, 'data', List());
  }
  // Caso 3: la respuesta misma es la lista de tickets
  else if (List.isList(immutableResponse)) {
    ticketsData = immutableResponse;
  }
  // Si no se encuentra en ninguna estructura conocida, intentamos con la respuesta original
  else if (response && (response.tickets || response.data)) {
    // Intentamos extraer tickets de la respuesta original (objeto regular)
    const rawTickets = response.tickets || response.data || [];
    // Convertimos a Immutable List
    ticketsData = fromJS(rawTickets);
    console.log('Extrayendo tickets desde respuesta regular:', rawTickets.length);
  }
  // Ningún caso válido
  else {
    safeErrorLog('Unexpected tickets response format:', response);
    return defaultTicketsResponse();
  }
  
  // Transformar tickets de forma inmutable
  const transformedTickets = ticketsData
    .map((ticket: any) => transformTicket(fromJS(ticket)))
    .toList();
  
  // Extraer metadatos con valores por defecto
  const metaData = ImmutableMap({
    total: safeGet(immutableResponse, 'total', transformedTickets.size),
    page: safeGet(immutableResponse, 'page', 1),
    timestamp: safeGet(immutableResponse, 'timestamp', new Date().toISOString())
  });
  
  // Log de procesamiento
  console.log(`Successfully processed ${transformedTickets.size} tickets`);
  
  // Convertir a formato de respuesta esperado
  return {
    tickets: transformedTickets.toJS() as ZohoTicket[],
    total: metaData.get('total', 0),
    page: metaData.get('page', 1),
    timestamp: metaData.get('timestamp', '')
  };
};

/**
 * Función auxiliar para crear una respuesta por defecto
 * @returns Respuesta de tickets por defecto
 */
const defaultTicketsResponse = (): TicketsResponse => ({
  tickets: [],
  total: 0,
  page: 1,
  timestamp: new Date().toISOString()
});

/**
 * Get a specific ticket by ID
 * Uses backend proxy to avoid CORS issues
 * @param ticketId - ID of the ticket to fetch
 * @returns Promise with ticket data
 */
const getTicketById = async (ticketId: string): Promise<ZohoTicket | null> => {
  try {
    console.log(`Fetching ticket by ID: ${ticketId}`);
    
    // Obtener respuesta del API
    const response = await apiClient().get(`/api/zoho/tickets/${ticketId}`);
    
    // Pipeline de procesamiento funcional - sin variables mutables
    return processTicketResponse(response, ticketId);
  } catch (error) {
    console.error(`Error fetching ticket ${ticketId}:`, error);
    return null; // Valor por defecto seguro
  }
};

/**
 * Función pura para procesar la respuesta del API y extraer los datos del ticket
 * @param response - Respuesta del API
 * @param ticketId - ID del ticket (para logs)
 * @returns Datos del ticket procesados
 */
const processTicketResponse = (response: any, ticketId: string): ZohoTicket | null => {
  // Logs para depuración usando utilidad segura
  safeLog('Raw ticket response:', response);
  
  // Extraer datos del ticket usando programación funcional
  const ticketData = extractTicketData(response);
  
  if (!ticketData) {
    console.error(`No valid ticket data found for ticket ${ticketId}`);
    return null;
  }
  
  // Transformar inmutablemente con safeToJS
  const transformedTicket = transformTicket(fromJS(ticketData));
  
  // Convertir a objeto JavaScript para interfaz externa
  return transformedTicket.toJS() as ZohoTicket;
};

/**
 * Función pura para extraer datos del ticket de diferentes estructuras de respuesta
 * Maneja defensivamente diferentes casos (principio #2)
 * @param response - Respuesta del API
 * @returns Datos del ticket o null si no se encuentra
 */
const extractTicketData = (response: any): any => {
  // Verificar estructura básica con la utilidad isImmutableMap
  if (!isImmutableMap(response)) {
    console.warn('Response is not an Immutable Map');
    return null;
  }
  
  // Caso 1: Error explícito - usando safeGet para acceso seguro
  // Usamos una comparación que TypeScript puede validar correctamente
  const success = safeGet(response, 'success', null);
  if (success === false) {
    safeErrorLog('API returned error:', safeGet(response, 'error', 'Unknown error'));
    return null;
  }
  
  // Evaluación de casos en orden de prioridad usando pipeline funcional
  return (
    // Caso 2: Ticket en campo ticket
    safeGet(response, 'ticket', null) || 
    // Caso 3: Ticket en campo data (si data es un Map)
    (isImmutableMap(safeGet(response, 'data', null)) ? safeGet(response, 'data', null) : null) ||
    // Caso 4: La respuesta misma es el ticket (ya verificamos que es Map)
    response ||
    // Ningún caso válido
    (safeErrorLog('Unexpected response format:', response), null)
  );
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
    
    // Obtener respuesta del API
    const response = await apiClient().get(`/api/zoho/tickets/${ticketId}/comments`);
    
    // Procesar la respuesta de forma funcional
    return processCommentsResponse(response, ticketId);
  } catch (error) {
    console.error(`Error fetching comments for ticket ${ticketId}:`, error);
    return []; // Devolver array vacío en caso de error (programación defensiva)
  }
};

/**
 * Función pura para procesar la respuesta de comentarios
 * @param response - Respuesta del API
 * @param ticketId - ID del ticket (para logs)
 * @returns Array de comentarios procesados
 */
const processCommentsResponse = (response: any, ticketId: string): ZohoComment[] => {
  // Log para depuración usando utilidad segura
  safeLog('Raw comments response:', response);

  // Caso 1: La respuesta tiene estructura específica del workflow n8n
  // [{ comments: [ {...}, {...} ] }]
  if (response && Array.isArray(response) && response.length > 0 && response[0].comments) {
    console.log(`Se encontraron ${response[0].comments.length} comentarios en formato workflow n8n`);
    
    // Mantener los nombres de campos originales (comment, author) sin transformar
    return response[0].comments.map((comment: any) => ({
      id: comment.id || '',
      comment: comment.comment || '', // Mantener el campo 'comment' original
      author: comment.author || '',    // Mantener el campo 'author' original
      createdTime: comment.createdTime || '',
      createdTimestamp: comment.createdTimestamp || 0,
      ticketId: comment.ticketId || '',
      isPublic: comment.isPublic || false
    }));
  }
  
  // Caso 2: La respuesta tiene un array de comments directamente
  if (response && Array.isArray(response.comments)) {
    console.log(`Se encontraron ${response.comments.length} comentarios en formato directo`);
    
    // Mantener los nombres de campos originales (comment, author) sin transformar
    return response.comments.map((comment: any) => ({
      id: comment.id || '',
      comment: comment.comment || '', // Mantener el campo 'comment' original
      author: comment.author || '',    // Mantener el campo 'author' original
      createdTime: comment.createdTime || '',
      createdTimestamp: comment.createdTimestamp || 0,
      ticketId: comment.ticketId || '',
      isPublic: comment.isPublic || false
    }));
  }
  
  // Verificación esencial usando isImmutableMap para el formato anterior
  if (!isImmutableMap(response)) {
    console.warn('Comments response is not an Immutable Map');
    return [];
  }
  
  // Verificar éxito de la operación con acceso seguro
  const success = safeGet(response, 'success', null);
  if (success === false) {
    console.error('Failed to fetch comments: Invalid response format');
    return [];
  }
  
  // Extraer y transformar comentarios con acceso seguro
  const comments = safeGet(response, 'comments', List())
    .map((comment: any) => transformComment(fromJS(comment)))
    .toList();
  
  console.log(`Successfully processed ${comments.size} comments for ticket ${ticketId}`);
  
  // Conversión segura a formato JS
  return comments.toJS() as ZohoComment[];
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
    
    // Obtener respuesta del API
    const response = await apiClient().post(`/api/zoho/tickets/${ticketId}/comments`, commentData);
    
    // Procesar la respuesta de forma funcional
    return processAddCommentResponse(response);
  } catch (error) {
    console.error(`Error adding comment to ticket ${ticketId}:`, error);
    return {} as ZohoComment; // Valor por defecto en caso de error (programación defensiva)
  }
};

/**
 * Función pura para procesar la respuesta de añadir comentario
 * @param response - Respuesta del API
 * @returns Comentario creado procesado
 */
const processAddCommentResponse = (response: any): ZohoComment => {
  // Log seguro de la respuesta
  safeLog('Add comment response:', response);
  
  // Verificación básica de la respuesta
  if (!isImmutableMap(response)) {
    console.warn('Add comment response is not an Immutable Map');
    return {} as ZohoComment;
  }
  
  // Verificar éxito de la operación
  const success = safeGet(response, 'success', null);
  if (success === false) {
    console.error('Failed to add comment:', safeGet(response, 'error', 'Invalid response format'));
    return {} as ZohoComment;
  }
  
  // Transformar el comentario
  const immutableComment = transformComment(fromJS(safeToJS(response)));
  
  // Devolver el comentario creado
  return immutableComment.toJS() as ZohoComment;
};

/**
 * Create a new ticket
 * Uses backend proxy to avoid CORS issues
 */
const createTicket = async (ticketData: ZohoTicketInput): Promise<ZohoTicket> => {
  try {
    console.log('Enviando datos del ticket al backend:', JSON.stringify(ticketData));
    
    // Obtener respuesta del API
    const response = await apiClient().post('/api/zoho/tickets', ticketData);
    
    // Log seguro de la respuesta
    safeLog('Respuesta completa del servidor:', response);
    
    // Procesar la respuesta de forma funcional
    return processCreatedTicketResponse(response);
  } catch (error) {
    console.error('Error creating ticket:', error);
    // Devolver un objeto vacío en caso de error (programación defensiva)
    return {} as ZohoTicket;
  }
};

/**
 * Función pura para procesar la respuesta de creación de ticket
 * @param response - Respuesta del API
 * @returns Ticket creado procesado
 */
const processCreatedTicketResponse = (response: any): ZohoTicket => {
  // Verificación básica de la respuesta
  if (!isImmutableMap(response)) {
    console.warn('Ticket creation response is not an Immutable Map');
    return {} as ZohoTicket;
  }
  
  // Caso 1: Verificar si hay una respuesta con éxito explícito
  const success = safeGet(response, 'success', null);
  if (success === false) {
    console.error('Error creating ticket:', safeGet(response, 'error', 'Unknown error'));
    return {} as ZohoTicket;
  }
  
  // Caso 2: Ticket en campo ticket
  if (response.has('ticket')) {
    const ticketData = safeGet(response, 'ticket', ImmutableMap());
    // Usar cast explícito para asegurar compatibilidad de tipos
    const typedData = fromJS(ticketData) as ImmutableMap<string, any>;
    const transformedTicket = transformTicket(typedData);
    return transformedTicket.toJS() as ZohoTicket;
  }
  
  // Caso 3: Ticket en campo data
  if (response.has('data')) {
    const ticketData = safeGet(response, 'data', ImmutableMap());
    // Usar cast explícito para asegurar compatibilidad de tipos
    const typedData = fromJS(ticketData) as ImmutableMap<string, any>;
    const transformedTicket = transformTicket(typedData);
    return transformedTicket.toJS() as ZohoTicket;
  }
  
  // Caso 4: La respuesta misma es el ticket
  console.warn('Estructura de respuesta no reconocida, intentando convertir toda la respuesta');
  return safeToJS(response) as ZohoTicket;
};

/**
 * Get dashboard statistics
 * Uses backend projection endpoint to avoid CORS issues
 */
const getDashboardStats = async (): Promise<ZohoDashboardStats> => {
  try {
    // Obtener respuesta del API
    const response = await apiClient().get('/projections/dashboard/overview');
    
    // Log seguro de la respuesta
    safeLog('Dashboard stats response:', response);
    
    // Verificación básica de la respuesta
    if (!isImmutableMap(response)) {
      console.warn('Dashboard stats response is not an Immutable Map');
      return {} as ZohoDashboardStats;
    }
    
    // Transformar los datos del dashboard usando cast explícito para garantizar compatibilidad de tipos
    const responseData = safeToJS(response) as Record<string, any>;
    const immutableStats = transformDashboardStats(responseData);
    
    // Devolver los datos transformados
    return immutableStats.toJS() as ZohoDashboardStats;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {} as ZohoDashboardStats;
  }
};

/**
 * Get available statuses for tickets
 * Uses backend proxy to avoid CORS issues
 */
const getStatuses = async (): Promise<any> => {
  try {
    // Obtener respuesta del API
    const response = await apiClient().get('/api/zoho/statuses');
    
    // Log seguro de la respuesta
    safeLog('Statuses response:', response);
    
    // Verificación y conversión segura
    if (!isImmutableMap(response)) {
      console.warn('Statuses response is not an Immutable Map');
      return [];
    }
    
    // Devolver los datos transformados
    return safeToJS(response);
  } catch (error) {
    console.error('Error fetching statuses:', error);
    return []; // Valor por defecto en caso de error
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
    const response = await apiClient().get<ImmutableMap<string, any>>('/api/zoho/categories');
    
    console.log('Raw response structure:', response?.toString().substring(0, 300));
    
    // La respuesta puede tener las categorías bajo la clave 'categories' o 'data'
    let categoriesData;
    if (response && response.has('categories')) {
      categoriesData = safeGet(response, 'categories', List());
      console.log('Found categories under "categories" key');
    } else if (response && response.has('data')) {
      categoriesData = safeGet(response, 'data', List());
      console.log('Found categories under "data" key');
    }
    // Ningún caso válido
    else {
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
          if (!ImmutableMap.isMap(item)) {
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
          
          return ImmutableMap({
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
    
    // Obtener respuesta del API
    const response = await apiClient().get('/api/zoho/contacts');
    
    // Log seguro de la respuesta
    safeLog('Raw contacts response:', response);
    
    // Procesamiento funcional de la respuesta
    return processContactsResponse(response);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return []; // Valor por defecto en caso de error
  }
};

/**
 * Función pura para procesar la respuesta de contactos
 * @param response - Respuesta del API
 * @returns Array de contactos procesados
 */
const processContactsResponse = (response: any): ZohoContact[] => {
  // Verificación básica de la respuesta
  if (!isImmutableMap(response)) {
    console.warn('Contacts response is not an Immutable Map');
    return [];
  }
  
  // Extraer datos según la estructura de la respuesta
  let contactsData;
  
  // Caso 1: Contactos en campo 'contacts'
  if (response.has('contacts')) {
    contactsData = safeGet(response, 'contacts', List());
  } 
  // Caso 2: Contactos en campo 'data'
  else if (response.has('data')) {
    contactsData = safeGet(response, 'data', List());
  }
  // Ningún caso válido
  else {
    safeErrorLog('Unexpected contacts response structure:', response);
    return [];
  }
  
  // Transformar contactos de forma inmutable
  const contacts = contactsData
    .map((contact: any) => {
      const id = safeGet(contact, 'id', '');
      const name = safeGet(contact, 'name', '');
      const email = safeGet(contact, 'email', '');
      const phone = safeGet(contact, 'phone', '');
      
      // Filtrar contactos inválidos
      if (!id) {
        return null;
      }
      
      return {
        id,
        name,
        email,
        phone
      };
    })
    .filter((contact: any) => contact !== null)
    .toArray() as ZohoContact[];
  
  console.log(`Processed ${contacts.length} valid contacts`);
  return contacts;
};

/**
 * Get Zoho Accounts
 * Uses backend proxy to avoid CORS issues
 */
const getAccounts = async (): Promise<ZohoAccount[]> => {
  try {
    console.log('Fetching accounts from Zoho...');
    
    // Obtener respuesta del API
    const response = await apiClient().get('/api/zoho/accounts');
    
    // Log seguro de la respuesta
    safeLog('Raw accounts response:', response);
    
    // Procesamiento funcional de la respuesta
    return processAccountsResponse(response);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return []; // Valor por defecto en caso de error
  }
};

/**
 * Función pura para procesar la respuesta de cuentas
 * @param response - Respuesta del API
 * @returns Array de cuentas procesadas
 */
const processAccountsResponse = (response: any): ZohoAccount[] => {
  // Verificación básica de la respuesta
  if (!isImmutableMap(response)) {
    console.warn('Accounts response is not an Immutable Map');
    return [];
  }
  
  // Extraer datos según la estructura de la respuesta
  let accountsData;
  
  // Caso 1: Cuentas en campo 'accounts'
  if (response.has('accounts')) {
    accountsData = safeGet(response, 'accounts', List());
  } 
  // Caso 2: Cuentas en campo 'data'
  else if (response.has('data')) {
    accountsData = safeGet(response, 'data', List());
  }
  // Ningún caso válido
  else {
    safeErrorLog('Unexpected accounts response structure:', response);
    return [];
  }
  
  // Transformar cuentas de forma inmutable
  const accounts = accountsData
    .map((account: any) => {
      const id = safeGet(account, 'id', '');
      const name = safeGet(account, 'name', '');
      const domain = safeGet(account, 'domain', '');
      const isActive = safeGet(account, 'isActive', true);
      
      // Filtrar cuentas inválidas
      if (!id) {
        return null;
      }
      
      return {
        id,
        name,
        domain,
        isActive
      };
    })
    .filter((account: any) => account !== null)
    .toArray() as ZohoAccount[];
  
  console.log(`Processed ${accounts.length} valid accounts`);
  return accounts;
};

/**
 * Export the service functions
 */
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
  getAccounts,
  getStatuses
};
