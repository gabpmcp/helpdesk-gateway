import { getZohoConfig } from '../config/zoho.config';
import { normalizeZohoError } from '../../errors/zohoErrors';
import { withRetry, rateLimit } from '../utils/apiUtils';
import { Map, fromJS } from 'immutable';
import type {
  ZohoTicketInput,
  ZohoCommentInput,
  ZohoFilters
} from '../../core/models/zoho.types';

// Type definitions for immutable structures
type ImmutableConfig = Map<string, string>;
type ImmutableHeaders = Map<string, string>;
type ImmutableResponse = Map<string, any>;
type ImmutableFilters = Map<string, string>;

// Pure function to create headers from config
const createHeaders = (config: ImmutableConfig): ImmutableHeaders =>
  Map({
    'Authorization': `Zoho-oauthtoken ${config.get('apiToken')}`,
    'orgId': config.get('organizationId'),
    'Content-Type': 'application/json',
  });

// Pure function to handle API response
const handleResponse = (response: Response): Promise<ImmutableResponse> =>
  response.ok
    ? response.json().then(data => fromJS(data))
    : response.json().then(error => Promise.reject(error));

// Curried function for API requests with retry and rate limiting
const createApiRequest = (config: ImmutableConfig) => (endpoint: string) => (options: RequestInit = {}) => {
  // Convert Immutable headers to plain object and merge with options.headers
  const immutableHeaders = createHeaders(config);
  const headersObject = immutableHeaders.toJS() as Record<string, string>;
  
  // Create a new headers object
  const mergedHeaders = new Headers(headersObject);
  
  // Add any additional headers from options
  if (options.headers) {
    const optionsHeaders = options.headers as Record<string, string>;
    Object.keys(optionsHeaders).forEach(key => {
      mergedHeaders.set(key, optionsHeaders[key]);
    });
  }
  
  return withRetry(
    () => rateLimit(
      () => fetch(`${config.get('baseUrl')}${endpoint}`, {
        ...options,
        headers: mergedHeaders,
      }).then(handleResponse),
      1000 // Rate limit of 1 request per second
    ),
    { maxRetries: 3 }
  ).catch(error => Promise.reject(normalizeZohoError(error)));
};

// Curried function to create URL params from filters
const createUrlParams = (filters: ImmutableFilters): string =>
  filters
    .filter((value) => !!value)
    .entrySeq()
    .reduce((params, [key, value]) => {
      params.append(key, value);
      return params;
    }, new URLSearchParams())
    .toString();

// Factory function for creating the Zoho client
export const createZohoClient = () => {
  const config = Map(getZohoConfig()) as ImmutableConfig;
  const apiRequest = createApiRequest(config);
  
  // Curried API methods
  const authenticateUser = (email: string) => (password: string) =>
    apiRequest('/oauth/v2/token')({
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

  const fetchTickets = (filters: ZohoFilters = {}) =>
    apiRequest(`/api/v1/tickets?${createUrlParams(Map(filters) as ImmutableFilters)}`)();

  const fetchTicketById = (id: string) =>
    apiRequest(`/api/v1/tickets/${id}`)();

  const createTicket = (ticketData: ZohoTicketInput) =>
    apiRequest('/api/v1/tickets')({
      method: 'POST',
      body: JSON.stringify(ticketData),
    });

  const addComment = (ticketId: string) => (commentData: ZohoCommentInput) =>
    apiRequest(`/api/v1/tickets/${ticketId}/comments`)({
      method: 'POST',
      body: JSON.stringify(commentData),
    });

  const fetchDashboardStats = () =>
    apiRequest('/api/v1/reports/overview')();

  const fetchCategories = () =>
    apiRequest('/api/v1/categories')();

  return {
    authenticateUser,
    fetchTickets,
    fetchTicketById,
    createTicket,
    addComment,
    fetchDashboardStats,
    fetchCategories,
  };
};

/**
 * Curried function to fetch and verify a user from Zoho
 * 
 * @param apiRequest - The API request function
 * @returns A function that takes email and password and returns a Promise with user data
 */
export const fetchZohoUser = (apiRequest: any) => (email: string, password: string): Promise<any> =>
  apiRequest('/oauth/v2/token')({
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }).then(response => {
    // Check if the response indicates a valid user
    if (response && response.get('access_token')) {
      return {
        email,
        token: response.get('access_token'),
        isValidUser: true
      };
    }
    return Promise.reject({ message: 'Invalid credentials' });
  });

export type ZohoClient = ReturnType<typeof createZohoClient>;
