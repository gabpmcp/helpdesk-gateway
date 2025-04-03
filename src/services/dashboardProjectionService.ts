/**
 * Dashboard Projection Service
 * 
 * Consumes immutable projections from the backend API
 * following functional, composable, isolated, and stateless (FCIS) principles
 */
import { Map as ImmutableMap, List, fromJS } from 'immutable';
import { createApiClient } from '../core/api/apiClient';
import { ImmutableTicket } from '../core/models/zoho.types';

// Crear un cliente API usando el mismo método que otros servicios
const apiClient = createApiClient();

// Configuración de URLs
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const DASHBOARD_ENDPOINT = `${API_BASE_URL}/api/zoho/reports-overview`;

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
    const response = await apiClient.get(endpoint);
    
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
    
    // Hacer la petición directamente al endpoint correcto
    const response = await fetch(DASHBOARD_ENDPOINT, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include'  // Incluir credenciales (cookies) para que withCors funcione correctamente
    });
    
    if (!response.ok) {
      console.error(`[Dashboard Service] Error HTTP: ${response.status} ${response.statusText}`);
      throw new Error(`Error fetching dashboard data: ${response.status} ${response.statusText}`);
    }
    
    // Procesar la respuesta
    const responseText = await response.text();
    
    // Verificar si la respuesta es válida
    if (!responseText || responseText.trim() === '') {
      throw new Error('Empty response received from backend');
    }
    
    if (isHtmlResponse(responseText)) {
      throw new Error('Received HTML instead of JSON from backend');
    }
    
    // Parsear como JSON
    const data = JSON.parse(responseText);
    console.log('[Dashboard Service] Dashboard data received:', data);
    
    // Normalizar los datos para asegurar la estructura correcta
    const normalizedData = normalizeData(data);
    
    // Convertir a estructura inmutable
    return fromJS(normalizedData);
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
      error: error instanceof Error ? error.message : 'Error fetching dashboard data'
    });
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
