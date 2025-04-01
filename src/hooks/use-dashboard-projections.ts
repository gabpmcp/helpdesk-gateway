/**
 * Dashboard Projections Hook
 * 
 * Custom hook for fetching dashboard projections following FCIS principles
 * (Functional, Composable, Isolated, Stateless)
 */
import { useState, useEffect, useCallback } from 'react';
import { Map as ImmutableMap, List } from 'immutable';
import { 
  fetchDashboardOverview, 
  fetchDashboardTickets, 
  fetchDashboardContacts,
  fetchDashboardData
} from '../services/dashboardProjectionService';
import { ImmutableTicket } from '../core/models/zoho.types';

interface DashboardProjectionState {
  data: ImmutableMap<string, any> | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching dashboard projections
 * @returns Dashboard projection state
 */
export const useDashboardProjections = (): DashboardProjectionState => {
  const [data, setData] = useState<ImmutableMap<string, any> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const dashboardData = await fetchDashboardData();
      setData(dashboardData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      console.error('Error fetching dashboard projections:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  return {
    data,
    isLoading,
    error,
    refetch: fetchData
  };
};

/**
 * Custom hook for fetching only dashboard overview projection
 * @returns Dashboard overview projection state
 */
export const useDashboardOverview = (): DashboardProjectionState => {
  const [data, setData] = useState<ImmutableMap<string, any> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const overviewData = await fetchDashboardOverview();
      setData(overviewData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      console.error('Error fetching dashboard overview:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  return {
    data,
    isLoading,
    error,
    refetch: fetchData
  };
};

/**
 * Custom hook for fetching only dashboard tickets projection
 * @returns Dashboard tickets projection state
 */
export const useDashboardTickets = (): DashboardProjectionState => {
  const [data, setData] = useState<ImmutableMap<string, any> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const ticketsData = await fetchDashboardTickets();
      setData(ticketsData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      console.error('Error fetching dashboard tickets:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  return {
    data,
    isLoading,
    error,
    refetch: fetchData
  };
};
