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
  // Verificamos si la respuesta es nula o indefinida
  if (!response) {
    console.warn('Response is null or undefined');
    return null;
  }
  
  // Determinamos si la respuesta es un objeto Immutable o un objeto JavaScript regular
  const isImmutableResponse = typeof response.has === 'function';
  console.log(`Processing ticket response (type: ${isImmutableResponse ? 'Immutable' : 'Regular JS'})`);
  
  // Extraer el ticket según la estructura de la respuesta
  let ticketData;
  
  if (isImmutableResponse) {
    // Caso 1: Verificar si hay una respuesta con éxito explícito (Immutable)
    const success = safeGet(response, 'success', null);
    if (success === false) {
      safeErrorLog('API returned error (Immutable):', safeGet(response, 'error', 'Unknown error'));
      return null;
    }
    
    // Evaluación de casos en orden de prioridad usando pipeline funcional
    return (
      // Caso 1.2: Ticket en campo ticket (Immutable)
      safeGet(response, 'ticket', null) || 
      // Caso 1.3: Ticket en campo data (Immutable)
      (isImmutableMap(safeGet(response, 'data', null)) ? safeGet(response, 'data', null) : null) ||
      // Caso 1.4: La respuesta misma es el ticket
      response ||
      // Ningún caso válido
      (safeErrorLog('Unexpected Immutable response format:', response), null)
    );
  }
  
  // Caso 2: Respuesta es un objeto JavaScript regular
  else {
    try {
      // Caso 2.1: Error explícito (JS Regular)
      if (response.success === false) {
        console.error('API returned error (JS Regular):', response.error || 'Unknown error');
        return null;
      }
      
      // Evaluación de casos en orden de prioridad para objetos regulares
      if ('ticket' in response && response.ticket) {
        // Caso 2.2: Ticket en campo ticket (JS Regular)
        console.log('Found ticket in "ticket" field (JS Regular)');
        return response.ticket;
      } else if ('data' in response && response.data) {
        // Caso 2.3: Ticket en campo data (JS Regular)
        console.log('Found ticket in "data" field (JS Regular)');
        return response.data;
      } else {
        // Caso 2.4: La respuesta misma es el ticket (JS Regular)
        console.log('Using full response as ticket (JS Regular)');
        return response;
      }
    } catch (error) {
      console.error('Error processing JS Regular response:', error);
      return null;
    }
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
  
  // Verificar si tenemos una respuesta
  if (!response) {
    console.warn('No comments response received');
    return [];
  }
  
  console.log('Procesando respuesta de comentarios. Tipo:', typeof response);
  
  // CASO 1: Respuesta es un array (formato común)
  if (Array.isArray(response)) {
    console.log(`Se recibió un array con ${response.length} elementos como respuesta de comentarios`);
    
    // CASO 1.1: Formato de workflow n8n [{ comments: [ {...}, {...} ] }]
    if (response.length > 0 && response[0] && response[0].comments && Array.isArray(response[0].comments)) {
      console.log(`Se encontraron ${response[0].comments.length} comentarios en formato workflow n8n`);
      
      return response[0].comments.map((comment: any) => procesarDatosComentario(comment));
    }
    
    // CASO 1.2: El array mismo contiene los comentarios directamente
    console.log('Procesando array como lista directa de comentarios');
    return response.map((comment: any) => procesarDatosComentario(comment));
  }
  
  // CASO 2: Respuesta es un objeto JS regular
  if (typeof response === 'object' && response !== null && !(typeof response.has === 'function')) {
    console.log('Procesando respuesta de comentarios como objeto JS regular');
    
    // CASO 2.1: Tiene un campo 'comments' con array
    if ('comments' in response && Array.isArray(response.comments)) {
      console.log(`Se encontraron ${response.comments.length} comentarios en campo comments (JS regular)`);
      return response.comments.map((comment: any) => procesarDatosComentario(comment));
    }
    
    // CASO 2.2: Tiene un campo 'data' con array
    if ('data' in response && Array.isArray(response.data)) {
      console.log(`Se encontraron ${response.data.length} comentarios en campo data (JS regular)`);
      return response.data.map((comment: any) => procesarDatosComentario(comment));
    }
    
    // CASO 2.3: El objeto mismo es un comentario único
    if ('id' in response || 'comment' in response) {
      console.log('La respuesta parece ser un comentario único (JS regular)');
      return [procesarDatosComentario(response)];
    }
  }
  
  // CASO 3: Respuesta es un objeto Immutable
  if (typeof response.has === 'function') {
    console.log('Procesando respuesta de comentarios como objeto Immutable');
    
    // CASO 3.1: Verificar error explícito
    const success = safeGet(response, 'success', null);
    if (success === false) {
      console.error('Failed to fetch comments (Immutable):', safeGet(response, 'error', 'Invalid response format'));
      return [];
    }
    
    // CASO 3.2: Comentarios en campo 'comments'
    if (response.has('comments')) {
      const commentsData = safeGet(response, 'comments', List());
      
      if (List.isList(commentsData)) {
        console.log(`Se encontraron ${commentsData.size} comentarios en campo comments (Immutable)`);
        return commentsData
          .map((comment: any) => transformComment(comment))
          .toJS() as ZohoComment[];
      }
    }
    
    // CASO 3.3: Comentarios en campo 'data'
    if (response.has('data')) {
      const commentsData = safeGet(response, 'data', List());
      
      if (List.isList(commentsData)) {
        console.log(`Se encontraron ${commentsData.size} comentarios en campo data (Immutable)`);
        return commentsData
          .map((comment: any) => transformComment(comment))
          .toJS() as ZohoComment[];
      }
    }
  }
  
  // Si no hemos podido procesar la respuesta hasta aquí, intentamos una conversión de último recurso
  console.warn('Formato de respuesta de comentarios no reconocido, intentando transformación genérica');
  try {
    if (typeof response.toJS === 'function') {
      const jsData = response.toJS();
      if (Array.isArray(jsData)) {
        return jsData.map(procesarDatosComentario);
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error al procesar comentarios:', error);
    return [];
  }
};

/**
 * Función auxiliar para procesar datos de un comentario individual
 * Asegura valores por defecto y campos completos
 */
const procesarDatosComentario = (comment: any): ZohoComment => {
  if (!comment) return {} as ZohoComment;
  
  // Leer valores seguros con valores por defecto
  const fecha = comment.createdTime || new Date().toISOString();
  const autor = comment.author || comment.authorName || comment.userName || 'Usuario';
  const contenido = comment.comment || comment.content || comment.text || '';
  const id = comment.id || `temp-${Date.now()}`;
  
  // Formato de fecha y timestamp para ordenamiento
  const createdTimestamp = comment.createdTimestamp || 
                         (fecha ? new Date(fecha).getTime() : Date.now());
  
  return {
    id,
    comment: contenido,
    author: autor,
    createdTime: fecha,
    createdTimestamp,
    ticketId: comment.ticketId || '',
    isPublic: comment.isPublic !== false // por defecto público
  };
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
    const processedComment = processAddCommentResponse(response);
    
    // Verificar que el comentario tiene información básica
    if (!processedComment || !processedComment.id) {
      console.error('Comment created but with incomplete data:', processedComment);
      throw new Error('No se pudo obtener la información del comentario creado');
    }
    
    return processedComment;
  } catch (error) {
    console.error(`Error adding comment to ticket ${ticketId}:`, error);
    // Propagar el error en lugar de devolver un objeto vacío
    throw error;
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
  
  // Verificar si tenemos una respuesta válida
  if (!response) {
    console.warn('No response received from add comment');
    throw new Error('No se recibió respuesta al añadir el comentario');
  }
  
  // Determinar si la respuesta es un objeto Immutable o un objeto JavaScript regular
  const isImmutableResponse = typeof response.has === 'function';
  console.log(`Processing add comment response (type: ${isImmutableResponse ? 'Immutable' : 'Regular JS'})`);
  
  // CASO 1: Respuesta es un objeto Immutable
  if (isImmutableResponse) {
    // Verificar éxito de la operación (Immutable)
    const success = safeGet(response, 'success', null);
    if (success === false) {
      console.error('Failed to add comment (Immutable):', safeGet(response, 'error', 'Invalid response format'));
      throw new Error(safeGet(response, 'error', 'Error al añadir el comentario'));
    }
    
    // CASO 1.1: Comentario en campo 'comment' (Immutable)
    if (response.has('comment')) {
      const commentData = safeGet(response, 'comment', ImmutableMap());
      return transformComment(commentData).toJS() as ZohoComment;
    }
    
    // CASO 1.2: Comentario en campo 'data' (Immutable)
    if (response.has('data')) {
      const commentData = safeGet(response, 'data', ImmutableMap());
      return transformComment(commentData).toJS() as ZohoComment;
    }
    
    // CASO 1.3: Toda la respuesta es el comentario (Immutable)
    console.log('Using full Immutable response as comment data');
    return transformComment(response).toJS() as ZohoComment;
  }
  
  // CASO 2: Respuesta es un objeto JavaScript regular
  else {
    try {
      // Verificar éxito de la operación (JS Regular)
      if (response.success === false) {
        console.error('Failed to add comment (JS Regular):', response.error || 'Invalid response format');
        throw new Error(response.error || 'Error al añadir el comentario');
      }
      
      // CASO 2.1: Comentario en campo 'comment' (JS Regular)
      if ('comment' in response && response.comment) {
        console.log('Found comment in "comment" field (JS Regular)');
        return transformComment(fromJS(response.comment)).toJS() as ZohoComment;
      }
      
      // CASO 2.2: Comentario en campo 'data' (JS Regular)
      if ('data' in response && response.data) {
        console.log('Found comment in "data" field (JS Regular)');
        return transformComment(fromJS(response.data)).toJS() as ZohoComment;
      }
      
      // CASO 2.3: Toda la respuesta es el comentario (JS Regular)
      console.log('Using full JS regular response as comment data');
      return transformComment(fromJS(response)).toJS() as ZohoComment;
    } catch (error) {
      console.error('Error processing JS Regular comment response:', error);
      throw new Error('Error al procesar la respuesta del comentario');
    }
  }
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
    const processedTicket = processCreatedTicketResponse(response);
    
    // Verificar que tenemos un ticket válido con ID antes de devolverlo
    if (!processedTicket || !processedTicket.id) {
      console.error('Ticket creado sin ID o incompleto:', processedTicket);
      throw new Error('No se pudo obtener la información del ticket creado');
    }
    
    return processedTicket;
  } catch (error) {
    console.error('Error creating ticket:', error);
    // En lugar de retornar un objeto vacío, lanzamos la excepción
    // para que el código que llama pueda manejarla adecuadamente
    throw error;
  }
};

/**
 * Función pura para procesar la respuesta de creación de ticket
 * @param response - Respuesta del API
 * @returns Ticket creado procesado
 */
const processCreatedTicketResponse = (response: any): ZohoTicket => {
  // Verificar si tenemos una respuesta válida
  if (!response) {
    console.warn('No response received from ticket creation');
    throw new Error('No se recibió respuesta del servidor');
  }
  
  // Verificar si la respuesta es un objeto Immutable o un objeto JavaScript regular
  const isImmutableResponse = typeof response.has === 'function';
  console.log(`Procesando respuesta de ticket (tipo: ${isImmutableResponse ? 'Immutable' : 'Regular JS'})`);
  
  // Extraer el ticket según la estructura de la respuesta
  let ticketData;
  
  if (isImmutableResponse) {
    // Caso 1: Verificar si hay una respuesta con éxito explícito (Immutable)
    const success = safeGet(response, 'success', null);
    if (success === false) {
      console.error('Error creating ticket:', safeGet(response, 'error', 'Unknown error'));
      throw new Error(safeGet(response, 'error', 'Error desconocido al crear el ticket'));
    }
    
    // Caso 2: Ticket en campo ticket (Immutable)
    if (response.has('ticket')) {
      ticketData = safeGet(response, 'ticket', ImmutableMap());
    } 
    // Caso 3: Ticket en campo data (Immutable)
    else if (response.has('data')) {
      ticketData = safeGet(response, 'data', ImmutableMap());
    }
    // Caso 4: La respuesta misma es el ticket (Immutable)
    else {
      console.warn('Estructura Immutable no reconocida, intentando usar toda la respuesta');
      ticketData = response;
    }
  } else {
    // Caso 1: Verificar si hay una respuesta con éxito explícito (JS Regular)
    if (response.success === false) {
      console.error('Error creating ticket:', response.error || 'Unknown error');
      throw new Error(response.error || 'Error desconocido al crear el ticket');
    }
    
    // Caso 2: Ticket en campo ticket (JS Regular)
    if ('ticket' in response) {
      ticketData = fromJS(response.ticket);
    } 
    // Caso 3: Ticket en campo data (JS Regular)
    else if ('data' in response) {
      ticketData = fromJS(response.data);
    }
    // Caso 4: La respuesta misma es el ticket (JS Regular)
    else {
      console.warn('Estructura JS Regular no reconocida, intentando usar toda la respuesta');
      ticketData = fromJS(response);
    }
  }
  
  // Si no pudimos extraer datos del ticket, lanzar un error
  if (!ticketData) {
    console.error('No se pudo extraer datos de ticket de la respuesta:', response);
    throw new Error('No se pudo extraer la información del ticket creado');
  }
  
  try {
    // Transformar el ticket según si es Immutable o no
    let transformedTicket;
    
    if (ImmutableMap.isMap(ticketData)) {
      // Ya es un objeto Immutable
      transformedTicket = transformTicket(ticketData as ImmutableMap<string, any>);
    } else {
      // Convertir a Immutable si no lo es ya
      const immutableData = fromJS(ticketData) as ImmutableMap<string, any>;
      transformedTicket = transformTicket(immutableData);
    }
    
    // Convertir el resultado a objeto JavaScript plano
    return transformedTicket.toJS() as ZohoTicket;
  } catch (error) {
    console.error('Error al transformar datos del ticket:', error);
    throw new Error('Error al procesar los datos del ticket creado');
  }
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
    
    // Manejar tanto objetos Immutable como objetos JavaScript regulares
    let categoriesData;
    
    // Si response es un objeto Immutable (tiene método has)
    if (response && typeof response.has === 'function') {
      if (response.has('categories')) {
        categoriesData = safeGet(response, 'categories', List());
        console.log('Found categories under "categories" key (Immutable)');
      } else if (response.has('data')) {
        categoriesData = safeGet(response, 'data', List());
        console.log('Found categories under "data" key (Immutable)');
      }
    } 
    // Si response es un objeto JavaScript regular
    else if (response && typeof response === 'object') {
      if ('categories' in response) {
        // Convertir a Immutable si es necesario
        categoriesData = fromJS(response.categories);
        console.log('Found categories under "categories" key (Plain JS)');
      } else if ('data' in response) {
        categoriesData = fromJS(response.data);
        console.log('Found categories under "data" key (Plain JS)');
      } else {
        // Intentar usar directamente la respuesta como un array de categorías
        categoriesData = fromJS(response);
        console.log('Using full response as categories (Plain JS)');
      }
    }
    
    // Ningún caso válido
    if (!categoriesData) {
      console.warn('Unexpected response structure - no categories found:', 
        response instanceof Object ? JSON.stringify(response).substring(0, 200) : String(response).substring(0, 200));
      return [];
    }
    
    console.log('Categories data:', categoriesData?.toString().substring(0, 200));
    
    // Verificar si categoriesData es una lista o convertirla si es necesario
    if (!List.isList(categoriesData)) {
      console.log('Converting categories data to List');
      categoriesData = List.isList(categoriesData) ? categoriesData : 
                       Array.isArray(categoriesData) ? List(categoriesData) : 
                       List([categoriesData]);
    }
    
    if (categoriesData.isEmpty()) {
      console.warn('No valid categories data found (empty list)');
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
  // Verificar si tenemos una respuesta válida
  if (!response) {
    console.warn('No contacts response received');
    return [];
  }
  
  // Extraer datos según la estructura de la respuesta
  let contactsData;
  
  // Caso 1: Respuesta es un objeto Immutable
  if (typeof response.has === 'function') {
    console.log('Processing Immutable contacts response');
    // Caso 1.1: Contactos en campo 'contacts'
    if (response.has('contacts')) {
      contactsData = safeGet(response, 'contacts', List());
    } 
    // Caso 1.2: Contactos en campo 'data'
    else if (response.has('data')) {
      contactsData = safeGet(response, 'data', List());
    }
    // Ningún caso Immutable válido
    else {
      safeErrorLog('Unexpected Immutable contacts response structure:', response);
      return [];
    }
  }
  // Caso 2: Respuesta es un objeto JavaScript regular
  else if (typeof response === 'object') {
    console.log('Processing regular JS contacts response');
    // Caso 2.1: Contactos en campo 'contacts'
    if ('contacts' in response) {
      contactsData = fromJS(response.contacts);
    } 
    // Caso 2.2: Contactos en campo 'data'
    else if ('data' in response) {
      contactsData = fromJS(response.data);
    }
    // Caso 2.3: La respuesta completa es la lista de contactos
    else {
      contactsData = fromJS(response);
    }
  }
  // Ningún caso válido
  else {
    console.warn('Invalid contacts response type:', typeof response);
    return [];
  }
  
  // Asegurar que contactsData sea una List
  if (!contactsData) {
    console.warn('No contacts data extracted from response');
    return [];
  }
  
  // Convertir a List si no lo es
  if (!List.isList(contactsData)) {
    console.log('Converting contacts data to List');
    contactsData = List.isList(contactsData) ? contactsData : 
                   Array.isArray(contactsData) ? List(contactsData) : 
                   List([contactsData]);
  }
  
  // Transformar contactos de forma inmutable
  const contacts = contactsData
    .map((contact: any) => {
      // Manejar tanto objetos Immutable como regulares
      const isImmutable = typeof contact.get === 'function';
      
      const id = isImmutable ? contact.get('id') : contact.id || '';
      const name = isImmutable ? contact.get('name') : contact.name || '';
      const email = isImmutable ? contact.get('email') : contact.email || '';
      const phone = isImmutable ? contact.get('phone') : contact.phone || '';
      
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
  // Verificar si tenemos una respuesta válida
  if (!response) {
    console.warn('No accounts response received');
    return [];
  }
  
  // Extraer datos según la estructura de la respuesta
  let accountsData;
  
  // Caso 1: Respuesta es un objeto Immutable
  if (typeof response.has === 'function') {
    console.log('Processing Immutable accounts response');
    // Caso 1.1: Cuentas en campo 'accounts'
    if (response.has('accounts')) {
      accountsData = safeGet(response, 'accounts', List());
    } 
    // Caso 1.2: Cuentas en campo 'data'
    else if (response.has('data')) {
      accountsData = safeGet(response, 'data', List());
    }
    // Ningún caso Immutable válido
    else {
      safeErrorLog('Unexpected Immutable accounts response structure:', response);
      return [];
    }
  }
  // Caso 2: Respuesta es un objeto JavaScript regular
  else if (typeof response === 'object') {
    console.log('Processing regular JS accounts response');
    // Caso 2.1: Cuentas en campo 'accounts'
    if ('accounts' in response) {
      accountsData = fromJS(response.accounts);
    } 
    // Caso 2.2: Cuentas en campo 'data'
    else if ('data' in response) {
      accountsData = fromJS(response.data);
    }
    // Caso 2.3: La respuesta completa es la lista de cuentas
    else {
      accountsData = fromJS(response);
    }
  }
  // Ningún caso válido
  else {
    console.warn('Invalid accounts response type:', typeof response);
    return [];
  }
  
  // Asegurar que accountsData sea una List
  if (!accountsData) {
    console.warn('No accounts data extracted from response');
    return [];
  }
  
  // Convertir a List si no lo es
  if (!List.isList(accountsData)) {
    console.log('Converting accounts data to List');
    accountsData = List.isList(accountsData) ? accountsData : 
                   Array.isArray(accountsData) ? List(accountsData) : 
                   List([accountsData]);
  }
  
  // Transformar cuentas de forma inmutable
  const accounts = accountsData
    .map((account: any) => {
      // Manejar tanto objetos Immutable como regulares
      const isImmutable = typeof account.get === 'function';
      
      const id = isImmutable ? account.get('id') : account.id || '';
      const name = isImmutable ? account.get('name') : account.name || '';
      const domain = isImmutable ? account.get('domain') : account.domain || '';
      const isActive = isImmutable ? account.get('isActive') : account.isActive !== false;
      
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
