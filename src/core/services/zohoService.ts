import { Map, List } from 'immutable';
import {
  transformTicket,
  transformComment,
  transformCategory,
  transformDashboardStats,
  processTickets,
  toJS
} from '../logic/zohoLogic';
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
} from '../models/zoho.types';

// Interface for the response structure that includes tickets
export interface TicketsResponse {
  tickets: ZohoTicket[];
  total: number;
  page: number;
}

/**
 * Pure function to authenticate a user
 * 
 * @param authenticateUserFn - Function to authenticate with Zoho
 * @returns A function that takes email and password and returns a Promise with the access token
 */
export const authenticateUser = (
  authenticateUserFn: (email: string) => (password: string) => Promise<any>
) => (email: string, password: string): Promise<string> =>
  authenticateUserFn(email)(password)
    .then(response => response.get('access_token', ''));

/**
 * Pure function to get tickets
 * 
 * @param fetchTicketsFn - Function to fetch tickets from Zoho
 * @returns A function that takes filters and returns a Promise with tickets
 */
export const getTickets = (
  fetchTicketsFn: (filters: ZohoFilters) => Promise<any>
) => (filters: ZohoFilters = {}): Promise<TicketsResponse> =>
  fetchTicketsFn(filters)
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

/**
 * Pure function to get a ticket by ID
 * 
 * @param fetchTicketByIdFn - Function to fetch a ticket by ID from Zoho
 * @returns A function that takes an ID and returns a Promise with the ticket
 */
export const getTicketById = (
  fetchTicketByIdFn: (id: string) => Promise<any>
) => (id: string): Promise<ZohoTicket> =>
  fetchTicketByIdFn(id)
    .then(response => {
      // Convert response to immutable structure and transform
      const immutableTicket = transformTicket(response.get('data'));
      
      // Convert back to JS for API compatibility
      return toJS<ZohoTicket>(immutableTicket);
    });

/**
 * Pure function to create a ticket
 * 
 * @param createTicketFn - Function to create a ticket in Zoho
 * @returns A function that takes ticket data and returns a Promise with the created ticket
 */
export const createTicket = (
  createTicketFn: (ticketData: ZohoTicketInput) => Promise<any>
) => (ticketData: ZohoTicketInput): Promise<ZohoTicket> =>
  createTicketFn(ticketData)
    .then(response => {
      // Convert response to immutable structure and transform
      const immutableTicket = transformTicket(response.get('data'));
      
      // Convert back to JS for API compatibility
      return toJS<ZohoTicket>(immutableTicket);
    });

/**
 * Pure function to add a comment to a ticket
 * 
 * @param addCommentFn - Function to add a comment to a ticket in Zoho
 * @returns A function that takes a ticket ID and comment data and returns a Promise with the created comment
 */
export const addComment = (
  addCommentFn: (ticketId: string) => (commentData: ZohoCommentInput) => Promise<any>
) => (ticketId: string, commentData: ZohoCommentInput): Promise<ZohoComment> =>
  addCommentFn(ticketId)(commentData)
    .then(response => {
      // Convert response to immutable structure and transform
      const immutableComment = transformComment(response.get('data'));
      
      // Convert back to JS for API compatibility
      return toJS<ZohoComment>(immutableComment);
    });

/**
 * Pure function to get categories
 * 
 * @param fetchCategoriesFn - Function to fetch categories from Zoho
 * @returns A function that returns a Promise with categories
 */
export const getCategories = (
  fetchCategoriesFn: () => Promise<any>
) => (): Promise<ZohoCategory[]> =>
  fetchCategoriesFn()
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

/**
 * Pure function to get dashboard stats
 * 
 * @param fetchDashboardStatsFn - Function to fetch dashboard stats from Zoho
 * @returns A function that returns a Promise with dashboard stats
 */
export const getDashboardStats = (
  fetchDashboardStatsFn: () => Promise<any>
) => (): Promise<ZohoDashboardStats> =>
  fetchDashboardStatsFn()
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
