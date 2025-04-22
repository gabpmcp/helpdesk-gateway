/**
 * Dashboard Projection Service
 * 
 * Consumes immutable projections from the backend API
 * following functional, composable, isolated, and stateless (FCIS) principles
 */
import { Map as ImmutableMap, List, fromJS } from 'immutable';
import { apiClient } from '../core/api/apiClient';
import { ImmutableTicket } from '../core/models/zoho.types';

// Configuración de URLs - solo para referencia, no la usamos directamente
const DASHBOARD_ENDPOINT = '/projections/overview';

/**
 * Verifica si una respuesta es HTML en lugar de JSON
 * @param text - Texto de la respuesta
 * @returns boolean - true si es HTML, false si no
 */
const isHtmlResponse = (text: string): boolean => {
  return text.trim().startsWith('<!DOCTYPE') || 
         text.trim().startsWith('<html') || 
         text.trim().includes('<?xml');
};

/**
 * Fetch data from projection endpoint with improved error handling
 * @param endpoint - The projection endpoint path
 * @returns Promise with the immutable data
 */
const fetchProjection = async <T = any>(endpoint: string): Promise<T> => {
  try {
    console.log(`[Dashboard Service] Fetching projection data from: ${endpoint}`);
    const response = await apiClient().get(endpoint);
    
    // Si la respuesta ya viene procesada como Immutable, devolverla directamente
    if (ImmutableMap.isMap(response)) {
      return response as unknown as T;
    }
    
    // Procesar respuesta como JSON y convertir a immutable
    if (typeof response === 'object') {
      console.log(`[Dashboard Service] Projection data successfully retrieved`);
      return fromJS(response) as unknown as T;
    }
    
    throw new Error('Invalid response format from projection');
  } catch (error) {
    console.error(`[Dashboard Service] Error fetching projection:`, error);
    
    // Devolver un mapa vacío en caso de error para evitar fallos en la UI
    return ImmutableMap({}) as unknown as T;
  }
};

/**
 * Normaliza los datos para asegurar que tienen la estructura esperada
 * Estructura esperada por el componente Dashboard:
 * {
 *   "ticketCount": 12,
 *   "openTicketCount": 5,
 *   "urgentTicketCount": 2,
 *   "responseTimeAvg": 3.4,
 *   "satisfactionScore": 87,
 *   "metrics": {
 *     "ticketsByPriority": {
 *       "Low": 2, "Medium": 5, "High": 3, "Urgent": 2
 *     },
 *     "ticketsByStatus": {
 *       "Open": 5, "In Progress": 3, "Closed": 3, "On Hold": 1
 *     }
 *   }
 * }
 * @param data Datos a normalizar
 * @returns Datos normalizados con la estructura esperada
 */
const normalizeData = (data: any): any => {
  // Si no hay datos, devolver estructura vacía
  if (!data) return {};
  
  // Si ya tiene la estructura correcta, devolverla tal cual
  if (data.ticketCount !== undefined && 
      data.metrics && 
      data.metrics.ticketsByPriority && 
      data.metrics.ticketsByStatus) {
    return data;
  }
  
  console.log('[Dashboard Service] Data requires normalization');
  
  // Crear objeto normalizado
  const normalized: any = {
    ticketCount: 0,
    openTicketCount: 0,
    urgentTicketCount: 0,
    responseTimeAvg: 0,
    satisfactionScore: 0,
    metrics: {
      ticketsByPriority: {
        Low: 0, Medium: 0, High: 0, Urgent: 0
      },
      ticketsByStatus: {
        Open: 0, "In Progress": 0, Closed: 0, "On Hold": 0
      }
    },
    timestamp: new Date().toISOString()
  };
  
  // Extraer datos con varios patrones posibles
  try {
    // Pattern 1: Esperado según estructura definida
    if (data.ticketCount !== undefined) {
      normalized.ticketCount = data.ticketCount;
      normalized.openTicketCount = data.openTicketCount || 0;
      normalized.urgentTicketCount = data.urgentTicketCount || 0;
      normalized.responseTimeAvg = data.responseTimeAvg || 0;
      normalized.satisfactionScore = data.satisfactionScore || 0;
      
      if (data.metrics) {
        if (data.metrics.ticketsByPriority) {
          normalized.metrics.ticketsByPriority = { ...data.metrics.ticketsByPriority };
        }
        if (data.metrics.ticketsByStatus) {
          normalized.metrics.ticketsByStatus = { ...data.metrics.ticketsByStatus };
        }
      }
    } 
    // Pattern 2: Estructura plana como en el servicio anterior
    else if (data.total !== undefined || data.stats?.total !== undefined) {
      normalized.ticketCount = data.total || data.stats?.total || 0;
      normalized.openTicketCount = data.open || data.stats?.open || 0;
      normalized.urgentTicketCount = data.urgent || data.stats?.urgent || 0;
      normalized.responseTimeAvg = data.responseTime || data.stats?.avgResponseTime || 0;
      normalized.satisfactionScore = data.satisfaction || data.stats?.satisfactionScore || 0;
      
      if (data.ticketsByPriority || data.distribution?.priority) {
        const priorityData = data.ticketsByPriority || data.distribution?.priority || {};
        normalized.metrics.ticketsByPriority = {
          Low: priorityData.low || 0,
          Medium: priorityData.medium || 0,
          High: priorityData.high || 0,
          Urgent: priorityData.urgent || 0
        };
      }
      
      if (data.ticketsByStatus || data.distribution?.status) {
        const statusData = data.ticketsByStatus || data.distribution?.status || {};
        normalized.metrics.ticketsByStatus = {
          Open: statusData.open || 0,
          "In Progress": statusData.inProgress || 0,
          Closed: statusData.closed || 0,
          "On Hold": statusData.onHold || 0
        };
      }
    } 
    // Pattern 3: Datos de un array (posiblemente desde n8n)
    else if (Array.isArray(data) && data.length > 0) {
      console.log('[Dashboard Service] Processing array data', data);
      
      // Si es un array, tomamos el primer elemento y lo procesamos
      return normalizeData(data[0]);
    }
    
    console.log('[Dashboard Service] Normalized result:', normalized);
    return normalized;
    
  } catch (error) {
    console.error('[Dashboard Service] Error normalizing data:', error);
    console.error('[Dashboard Service] Data that failed to normalize:', data);
    return normalized; // Devolver la estructura vacía en caso de error
  }
};

/**
 * Fetch dashboard overview using backend API
 * 
 * Usa el endpoint del backend que ya tiene configurado CORS correctamente
 * @returns Promise with dashboard overview data
 */
export const fetchDashboardOverview = async (): Promise<ImmutableMap<string, any>> => {
  try {
    console.log('[Dashboard Service] Fetching dashboard overview from backend API');
    
    // Hacer la petición a través del backend proxy
    const response = await apiClient().get(DASHBOARD_ENDPOINT);
    
    // Verificar si la respuesta es válida (puede ser un Map de Immutable)
    if (!response) {
      throw new Error('Failed to fetch dashboard data: Empty response');
    }
    
    // Si la respuesta es un Map de Immutable, devolverla directamente (cast explícito)
    if (ImmutableMap.isMap(response)) {
      console.log('[Dashboard Service] Successfully retrieved dashboard data');
      return response as ImmutableMap<string, any>;
    }
    
    // Si no es un Map, convertirla y castear
    console.log('[Dashboard Service] Converting response to Immutable Map');
    return fromJS(response) as ImmutableMap<string, any>;
  } catch (error) {
    console.error('[Dashboard Service] Error fetching dashboard overview:', error);
    
    // Devolver estructura básica para que la UI no falle
    return ImmutableMap({
      ticketCount: 0,
      openTicketCount: 0,
      urgentTicketCount: 0,
      responseTimeAvg: 0,
      satisfactionScore: 0,
      metrics: {
        ticketsByPriority: {
          Low: 0, Medium: 0, High: 0, Urgent: 0
        },
        ticketsByStatus: {
          Open: 0, "In Progress": 0, Closed: 0, "On Hold": 0
        }
      },
      timestamp: new Date().toISOString(),
    }) as ImmutableMap<string, any>;
  }
};

/**
 * Fetch dashboard tickets projection
 * @returns Promise with dashboard tickets data
 */
export const fetchDashboardTickets = (): Promise<ImmutableMap<string, any>> => 
  fetchProjection('/api/zoho/tickets');

/**
 * Fetch all dashboard projections and combine them
 * Ahora simplemente llama a fetchDashboardOverview que hace todo el trabajo
 * @returns Promise with combined dashboard data
 */
export const fetchDashboardData = async (): Promise<ImmutableMap<string, any>> => {
  return fetchDashboardOverview();
};
