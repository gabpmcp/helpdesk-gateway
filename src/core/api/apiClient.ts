import { Map, fromJS } from 'immutable';

// API configuration type
export interface ApiConfig {
  baseUrl: string;
  defaultHeaders: Record<string, string>;
}

// Default API configuration
const defaultConfig: ApiConfig = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  defaultHeaders: {
    'Content-Type': 'application/json',
  }
};

// Create API client with dependency injection
export const createApiClient = (config: ApiConfig = defaultConfig) => {
  // Get token from localStorage
  const getToken = (): string | null => {
    try {
      const authData = localStorage.getItem('auth');
      if (authData) {
        const parsedData = JSON.parse(authData);
        return parsedData.tokens?.accessToken || null;
      }
      return null;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  };

  // Check if the endpoint is a Zoho API endpoint that doesn't need auth
  const isZohoEndpoint = (endpoint: string): boolean => {
    return endpoint.startsWith('/api/zoho/');
  };

  // Generic request function
  const request = async <T>(
    endpoint: string,
    method: string,
    data?: unknown,
    customHeaders?: Record<string, string>
  ): Promise<Map<string, any>> => {
    const url = `${config.baseUrl}${endpoint}`;
    const token = getToken();
    
    // Only include Authorization header for non-Zoho endpoints
    const headers = {
      ...config.defaultHeaders,
      ...(!isZohoEndpoint(endpoint) && token ? { Authorization: `Bearer ${token}` } : {}),
      ...customHeaders
    };
    
    try {
      const response = await fetch(url, {
        method,
        headers,
        ...(data ? { body: JSON.stringify(data) } : {})
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `API error: ${response.status}`);
      }
      
      const jsonData = await response.json();
      return fromJS(jsonData);
    } catch (error) {
      console.error(`API error (${method} ${endpoint}):`, error);
      throw error;
    }
  };

  // HTTP methods
  const get = <T>(endpoint: string, customHeaders?: Record<string, string>): Promise<Map<string, any>> => 
    request<T>(endpoint, 'GET', undefined, customHeaders);
  
  const post = <T>(endpoint: string, data: unknown, customHeaders?: Record<string, string>): Promise<Map<string, any>> => 
    request<T>(endpoint, 'POST', data, customHeaders);
  
  const put = <T>(endpoint: string, data: unknown, customHeaders?: Record<string, string>): Promise<Map<string, any>> => 
    request<T>(endpoint, 'PUT', data, customHeaders);
  
  const del = <T>(endpoint: string, customHeaders?: Record<string, string>): Promise<Map<string, any>> => 
    request<T>(endpoint, 'DELETE', undefined, customHeaders);
  
  return {
    get,
    post,
    put,
    delete: del
  };
};

// Create a default API client instance
export const apiClient = createApiClient();
