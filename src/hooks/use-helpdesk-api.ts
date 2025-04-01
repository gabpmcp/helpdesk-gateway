import { useCallback, useState, useEffect, useMemo } from 'react';
import { 
  authService, 
  commandService, 
  ticketService, 
  dashboardService,
  createHelpdeskService,
  Command,
  AuthCredentials,
  UserState,
  TicketCreationPayload
} from '../core/api/helpdeskService';
import { ImmutableTicket, ImmutableUser } from '../core/models/zoho.types';
import { List, Map as ImmutableMap } from 'immutable';

// Custom simplified data fetching hook
interface DataFetchingState<T> {
  data?: T;
  error?: Error;
  isLoading: boolean;
  isValidating: boolean;
  mutate: (data?: T | Promise<T> | ((current?: T) => T | Promise<T>)) => Promise<T | undefined>;
}

// Key generator for data cache
const createCacheKey = (endpoint: string, params?: Record<string, any>): string => 
  `${endpoint}${params ? `/${JSON.stringify(params)}` : ''}`;

// Type for fetcher functions that return promises
type Fetcher<T> = (...args: any[]) => Promise<T>;

// Simple configuration for data fetching
interface FetchingConfig {
  refreshInterval?: number;
  revalidateOnFocus?: boolean;
}

// Base data fetching hook with automatic error handling
const useDataFetching = <T>(
  key: string | null,
  fetcher: Fetcher<T> | null,
  config?: FetchingConfig
): DataFetchingState<T> => {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(!!key);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  
  const fetchData = useCallback(async (newFetcher?: Fetcher<T>) => {
    if (!key) return undefined;
    
    const activeFetcher = newFetcher || fetcher;
    if (!activeFetcher) return undefined;
    
    setIsValidating(true);
    
    try {
      const result = await activeFetcher();
      setData(result);
      setError(undefined);
      return result;
    } catch (err) {
      const fetchError = err instanceof Error ? err : new Error(String(err));
      setError(fetchError);
      console.error(`Error fetching ${key}:`, fetchError);
      return undefined;
    } finally {
      setIsLoading(false);
      setIsValidating(false);
    }
  }, [key, fetcher]);
  
  // Initial fetch
  useEffect(() => {
    if (key && fetcher) {
      setIsLoading(true);
      fetchData();
    }
  }, [key, fetchData]);
  
  // Refresh interval
  useEffect(() => {
    if (!config?.refreshInterval || !key || !fetcher) return undefined;
    
    const intervalId = setInterval(() => {
      fetchData();
    }, config.refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [config?.refreshInterval, key, fetcher, fetchData]);
  
  // Focus revalidation
  useEffect(() => {
    if (!config?.revalidateOnFocus || !key || !fetcher) return undefined;
    
    const handleFocus = () => {
      fetchData();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [config?.revalidateOnFocus, key, fetcher, fetchData]);
  
  // Mutate function
  const mutate = useCallback(async (
    dataOrFn?: T | Promise<T> | ((current?: T) => T | Promise<T>)
  ): Promise<T | undefined> => {
    if (!dataOrFn) {
      return fetchData();
    }
    
    if (dataOrFn instanceof Promise) {
      try {
        const newData = await dataOrFn;
        setData(newData);
        return newData;
      } catch (err) {
        const mutateError = err instanceof Error ? err : new Error(String(err));
        setError(mutateError);
        console.error(`Error mutating ${key}:`, mutateError);
        return undefined;
      }
    } else if (typeof dataOrFn === 'function') {
      try {
        const fn = dataOrFn as ((current?: T) => T | Promise<T>);
        const newDataOrPromise = fn(data);
        
        if (newDataOrPromise instanceof Promise) {
          const newData = await newDataOrPromise;
          setData(newData);
          return newData;
        } else {
          setData(newDataOrPromise);
          return newDataOrPromise;
        }
      } catch (err) {
        const mutateError = err instanceof Error ? err : new Error(String(err));
        setError(mutateError);
        console.error(`Error mutating ${key}:`, mutateError);
        return undefined;
      }
    } else {
      setData(dataOrFn);
      return dataOrFn;
    }
  }, [key, fetchData, data]);
  
  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate
  };
};

// Main hook for API access with token management
export const useHelpdeskApi = (email?: string) => {
  // Create memoized helpdesk service with current token
  const helpdeskService = useMemo(() => {
    if (!email) return null;
    
    // Get the token from local storage or another source
    const token = localStorage.getItem(`token_${email}`) || '';
    
    return createHelpdeskService(email, token);
  }, [email]);
  
  // Authentication
  const login = useCallback(async (credentials: AuthCredentials) => {
    try {
      return await authService.login(credentials);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, []);
  
  const refreshToken = useCallback(async (refreshTokenValue: string) => {
    if (!email) throw new Error('Email is required for token refresh');
    
    try {
      return await authService.refreshToken(email, refreshTokenValue);
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }, [email]);
  
  // Auth status with data fetching
  const useAuthStatus = () => {
    return useDataFetching(
      email ? `auth/status/${email}` : null,
      email ? () => helpdeskService?.auth.getStatus() : null,
      { refreshInterval: 60000, revalidateOnFocus: true }
    );
  };
  
  // Tickets with data fetching
  const useTickets = () => {
    return useDataFetching(
      email ? `tickets/${email}` : null,
      email ? () => helpdeskService?.tickets.getAll() : null,
      { refreshInterval: 30000, revalidateOnFocus: true }
    );
  };
  
  const useTicketDetail = (ticketId?: string) => {
    return useDataFetching(
      ticketId && email ? `ticket/${ticketId}/${email}` : null,
      ticketId && email ? () => helpdeskService?.tickets.get(ticketId) : null,
      { revalidateOnFocus: true }
    );
  };
  
  const createTicket = useCallback(async (payload: TicketCreationPayload) => {
    if (!helpdeskService) throw new Error('Helpdesk service not initialized');
    
    try {
      return await helpdeskService.tickets.create(payload);
    } catch (error) {
      console.error('Create ticket error:', error);
      throw error;
    }
  }, [helpdeskService]);
  
  const addComment = useCallback(async (ticketId: string, comment: string) => {
    if (!helpdeskService) throw new Error('Helpdesk service not initialized');
    
    try {
      return await helpdeskService.tickets.addComment(ticketId, comment);
    } catch (error) {
      console.error('Add comment error:', error);
      throw error;
    }
  }, [helpdeskService]);
  
  // Dashboard with data fetching
  const useDashboard = () => {
    return useDataFetching(
      email ? `dashboard/${email}` : null,
      email ? () => helpdeskService?.dashboard.getData() : null,
      { refreshInterval: 60000, revalidateOnFocus: true }
    );
  };
  
  // Generic command sending
  const sendCommand = useCallback(async <T>(type: string, data: object = {}): Promise<T> => {
    if (!helpdeskService) throw new Error('Helpdesk service not initialized');
    
    try {
      return await helpdeskService.commands.send<T>(type, data);
    } catch (error) {
      console.error(`Command error (${type}):`, error);
      throw error;
    }
  }, [helpdeskService]);
  
  // User state with data fetching
  const useUserState = () => {
    return useDataFetching(
      email ? `state/${email}` : null,
      email ? () => helpdeskService?.commands.getState() : null,
      { refreshInterval: 60000, revalidateOnFocus: true }
    );
  };
  
  return {
    // Auth
    login,
    refreshToken,
    useAuthStatus,
    
    // Tickets
    useTickets,
    useTicketDetail,
    createTicket,
    addComment,
    
    // Dashboard
    useDashboard,
    
    // Commands
    sendCommand,
    useUserState
  };
};
