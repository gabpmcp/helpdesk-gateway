import { Map, List, fromJS } from 'immutable';
import type {
  ZohoTicket,
  ZohoComment,
  ZohoCategory,
  ZohoDashboardStats,
  ZohoFilters
} from '../models/zoho.types';

// Type definitions for immutable structures
type ImmutableTicket = Map<string, any>;
type ImmutableComment = Map<string, any>;
type ImmutableCategory = Map<string, any>;
type ImmutableDashboardStats = Map<string, any>;
type ImmutableFilters = Map<string, any>;

// Pure function to transform raw API ticket data
export const transformTicket = (rawTicket: any): ImmutableTicket => 
  Map({
    id: rawTicket.id,
    subject: rawTicket.subject,
    description: rawTicket.description,
    status: rawTicket.status,
    priority: rawTicket.priority,
    category: rawTicket.category,
    dueDate: rawTicket.dueDate,
    createdTime: rawTicket.createdTime,
    modifiedTime: rawTicket.modifiedTime,
    comments: Array.isArray(rawTicket.comments) 
      ? List(rawTicket.comments.map(transformComment))
      : List(),
  });

// Pure function to transform raw API comment data
export const transformComment = (rawComment: any): ImmutableComment => {
  // Acceso defensivo para manejar diferentes estructuras de datos posibles
  const getField = (field: string, altField: string, defaultValue: any = undefined) => {
    // Primero intenta el campo nuevo (estructura n8n)
    if (rawComment[field] !== undefined) return rawComment[field];
    // Luego intenta el campo alternativo (estructura antigua)
    if (rawComment[altField] !== undefined) return rawComment[altField];
    // Verifica si es una estructura inmutable
    if (rawComment && rawComment.get) {
      if (rawComment.get(field) !== undefined) return rawComment.get(field);
      if (rawComment.get(altField) !== undefined) return rawComment.get(altField);
    }
    // Valor por defecto como último recurso
    return defaultValue;
  };

  // Crear un objeto inmutable con ambas nomenclaturas para compatibilidad
  return Map({
    id: getField('id', 'id', ''),
    // Nomenclatura nueva (n8n)
    comment: getField('comment', 'content', ''),
    author: getField('author', 'createdBy', ''),
    // Nomenclatura anterior (para compatibilidad)
    content: getField('comment', 'content', ''),
    createdBy: getField('author', 'createdBy', ''),
    // Campos comunes
    createdTime: getField('createdTime', 'createdTime', ''),
    createdTimestamp: getField('createdTimestamp', 'createdTimestamp', 0),
    ticketId: getField('ticketId', 'ticketId', ''),
    isPublic: getField('isPublic', 'isPublic', true),
  });
};

// Pure function to transform raw API category data
export const transformCategory = (rawCategory: any): ImmutableCategory => 
  Map({
    id: rawCategory.id,
    name: rawCategory.displayName || rawCategory.name,
    translationKey: rawCategory.translationKey,
  });

// Pure function to transform raw API dashboard stats
export const transformDashboardStats = (rawStats: any): ImmutableDashboardStats => 
  Map({
    totalTickets: Number(rawStats.totalTickets || 0),
    openTickets: Number(rawStats.openTickets || 0),
    resolvedTickets: Number(rawStats.resolvedTickets || 0),
    closedTickets: Number(rawStats.closedTickets || 0),
  });

// Curried function to filter tickets based on criteria
export const filterTickets = (tickets: List<ImmutableTicket>, filters: ImmutableFilters): List<ImmutableTicket> => 
  tickets.filter(ticket => 
    (!filters.get('status') || ticket.get('status') === filters.get('status')) &&
    (!filters.get('priority') || ticket.get('priority') === filters.get('priority')) &&
    (!filters.get('category') || ticket.get('category') === filters.get('category')) &&
    (!filters.get('search') || 
      ticket.get('subject', '').toLowerCase().includes(filters.get('search', '').toLowerCase()) ||
      ticket.get('description', '').toLowerCase().includes(filters.get('search', '').toLowerCase()))
  );

// Pure function to sort tickets by date
export const sortTicketsByDate = (tickets: List<ImmutableTicket>): List<ImmutableTicket> => 
  tickets.sort((a, b) => {
    const dateA = new Date(a.get('createdTime', '')).getTime();
    const dateB = new Date(b.get('createdTime', '')).getTime();
    return dateB - dateA; // Sort by descending date (newest first)
  });

// Compose filter and sort functions
export const processTickets = (tickets: List<ImmutableTicket>, filters: ImmutableFilters): List<ImmutableTicket> => 
  sortTicketsByDate(filterTickets(tickets, filters));

// Convert from Immutable to JS
export const toJS = <T>(immutableData: any): T => 
  immutableData.toJS ? immutableData.toJS() : immutableData;

/**
 * Pure authentication transition function that converts commands to events
 * Following Event Sourcing pattern
 * 
 * @param verifyZohoUser - Function to verify user against Zoho
 * @param storeEvent - Function to store events in the event store
 * @returns A function that takes a command and returns a Promise with the resulting event
 */
export const authTransition = (
  verifyZohoUser: (email: string, password: string) => Promise<any>,
  storeEvent: (userId: string, command: any, event: any) => Promise<any>
) => async (command: { email: string; password: string }): Promise<any> => {
  const { email, password } = command;
  
  // Create immutable command
  const immutableCommand = Map({
    type: 'AUTHENTICATE_USER',
    email,
    timestamp: Date.now()
  });
  
  return verifyZohoUser(email, password)
    .then(async userExists => {
      if (!userExists) {
        // Create failed authentication event
        const failedEvent = Map({
          type: 'AUTH_FAILED',
          user_id: email,
          timestamp: Date.now(),
          reason: 'User not found or invalid credentials'
        });
        
        // Store the event and return a rejection
        return storeEvent(email, toJS(immutableCommand), toJS(failedEvent))
          .then(() => Promise.reject(toJS(failedEvent)));
      }
      
      // Create successful authentication event
      const successEvent = Map({
        type: 'AUTH_SUCCESS',
        user_id: email,
        timestamp: Date.now(),
        user_data: userExists
      });
      
      // Store the event and return it
      return storeEvent(email, toJS(immutableCommand), toJS(successEvent))
        .then(() => toJS(successEvent));
    });
};

// Pure function to get ticket status counts
export const getTicketStatusCounts = (tickets: List<ImmutableTicket>): Map<string, number> =>
  tickets.reduce((counts, ticket) => {
    const status = ticket.get('status', '').toLowerCase();
    return counts.update(status, 0, count => count + 1);
  }, Map<string, number>());

// Pure function to get ticket priority counts
export const getTicketPriorityCounts = (tickets: List<ImmutableTicket>): Map<string, number> =>
  tickets.reduce((counts, ticket) => {
    const priority = ticket.get('priority', '').toLowerCase();
    return counts.update(priority, 0, count => count + 1);
  }, Map<string, number>());
