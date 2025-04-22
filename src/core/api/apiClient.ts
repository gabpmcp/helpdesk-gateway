import { getRuntimeConfig } from '../../config/runtimeConfig';

// API configuration type
export interface ApiConfig {
  baseUrl: string;
  defaultHeaders: Record<string, string>;
}

// API client interface
export type ApiClient = {
  get: <T>(endpoint: string, customHeaders?: Record<string, string>) => Promise<T>;
  post: <T>(endpoint: string, data?: unknown, customHeaders?: Record<string, string>) => Promise<T>;
  put: <T>(endpoint: string, data?: unknown, customHeaders?: Record<string, string>) => Promise<T>;
  delete: <T>(endpoint: string, customHeaders?: Record<string, string>) => Promise<T>;
};

// Create API client with dependency injection
export function getApiClient(): ApiClient {
  const config = getRuntimeConfig();
  const baseUrl = config.api.baseUrl;
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  // Utility to get token from localStorage
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

  // Generic request function using fetch
  async function request<T>(endpoint: string, method: string, data?: unknown, customHeaders?: Record<string, string>): Promise<T> {
    const url = baseUrl + endpoint;
    const token = getToken();
    const headers: Record<string, string> = {
      ...defaultHeaders,
      ...(customHeaders || {}),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options: RequestInit = {
      method,
      headers,
      credentials: 'include',
    };
    if (data !== undefined) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    let responseData;
    try {
      responseData = await response.json();
    } catch (err) {
      responseData = null;
    }
    if (!response.ok) {
      throw new Error(responseData?.message || `API error: ${response.status}`);
    }
    return responseData as T;
  }

  // HTTP methods
  return {
    get: <T>(endpoint: string, customHeaders?: Record<string, string>) => request<T>(endpoint, 'GET', undefined, customHeaders),
    post: <T>(endpoint: string, data?: unknown, customHeaders?: Record<string, string>) => request<T>(endpoint, 'POST', data, customHeaders),
    put: <T>(endpoint: string, data?: unknown, customHeaders?: Record<string, string>) => request<T>(endpoint, 'PUT', data, customHeaders),
    delete: <T>(endpoint: string, customHeaders?: Record<string, string>) => request<T>(endpoint, 'DELETE', undefined, customHeaders),
  };
}

// Create a default API client instance
// Lazy initialization pattern to avoid creating the client before config is loaded
let _apiClient: ApiClient | null = null;

export function apiClient(): ApiClient {
  if (!_apiClient) {
    _apiClient = getApiClient();
  }
  return _apiClient;
}
