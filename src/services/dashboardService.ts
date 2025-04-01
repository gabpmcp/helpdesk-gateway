/**
 * Dashboard Service
 * 
 * Provides an interface to the unified dashboard API endpoint
 * following functional, composable, isolated, stateless (FCIS) principles
 */
import { Map as ImmutableMap, fromJS } from 'immutable';
import { ZohoDashboardStats } from '../core/models/zoho.types';
import { pipe } from '@/utils/functional';

// Base API URL - URL relativa al servidor actual
const API_BASE_URL = ''; 

// Valores por defecto para el dashboard
const DEFAULT_DASHBOARD_DATA: ZohoDashboardStats = {
  ticketCount: 0,
  openTicketCount: 0,
  urgentTicketCount: 0,
  responseTimeAvg: 0,
  satisfactionScore: 0,
  metrics: {
    ticketsByPriority: { Low: 0, Medium: 0, High: 0, Urgent: 0 },
    ticketsByStatus: { Open: 0, 'In Progress': 0, Closed: 0, 'On Hold': 0 }
  },
  timestamp: new Date().toISOString(),
  totalTickets: 0,
  openTickets: 0,
  resolvedTickets: 0,
  closedTickets: 0
};

// Validadores y transformadores
const validateResponse = (response: Response) => 
  response.ok 
    ? Promise.resolve(response) 
    : Promise.reject(new Error(`${response.status}: ${response.statusText}`));

const parseJSON = (response: Response) => 
  response.text().then(text => {
    // Verificar explícitamente si la respuesta comienza con un token HTML
    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
      return Promise.reject(new Error('Server returned HTML instead of JSON'));
    }
    // Si no hay contenido, devuelve un objeto vacío
    if (!text.trim()) {
      return Promise.resolve({});
    }
    // Intenta parsear como JSON
    return Promise.resolve(JSON.parse(text));
  });

const applyDefaults = (data: Partial<ZohoDashboardStats>): ZohoDashboardStats => ({
  ...DEFAULT_DASHBOARD_DATA,
  ...data,
  metrics: {
    ticketsByPriority: {
      Low: data.metrics?.ticketsByPriority?.Low || DEFAULT_DASHBOARD_DATA.metrics.ticketsByPriority.Low,
      Medium: data.metrics?.ticketsByPriority?.Medium || DEFAULT_DASHBOARD_DATA.metrics.ticketsByPriority.Medium,
      High: data.metrics?.ticketsByPriority?.High || DEFAULT_DASHBOARD_DATA.metrics.ticketsByPriority.High,
      Urgent: data.metrics?.ticketsByPriority?.Urgent || DEFAULT_DASHBOARD_DATA.metrics.ticketsByPriority.Urgent
    },
    ticketsByStatus: {
      Open: data.metrics?.ticketsByStatus?.Open || DEFAULT_DASHBOARD_DATA.metrics.ticketsByStatus.Open,
      'In Progress': data.metrics?.ticketsByStatus?.['In Progress'] || DEFAULT_DASHBOARD_DATA.metrics.ticketsByStatus['In Progress'],
      Closed: data.metrics?.ticketsByStatus?.Closed || DEFAULT_DASHBOARD_DATA.metrics.ticketsByStatus.Closed,
      'On Hold': data.metrics?.ticketsByStatus?.['On Hold'] || DEFAULT_DASHBOARD_DATA.metrics.ticketsByStatus['On Hold']
    }
  },
  // Para compatibilidad con tipos anteriores
  totalTickets: data.ticketCount || data.totalTickets || DEFAULT_DASHBOARD_DATA.totalTickets,
  openTickets: data.openTicketCount || data.openTickets || DEFAULT_DASHBOARD_DATA.openTickets,
  resolvedTickets: data.resolvedTickets || DEFAULT_DASHBOARD_DATA.resolvedTickets,
  closedTickets: data.closedTickets || DEFAULT_DASHBOARD_DATA.closedTickets,
  timestamp: data.timestamp || new Date().toISOString()
});

/**
 * Fetch unified dashboard data from the backend using functional composition
 * @returns Promise with dashboard data
 */
export const fetchDashboardData = (): Promise<ZohoDashboardStats> =>
  fetch(`${API_BASE_URL}/dashboard`)
    .then(validateResponse)
    .then(parseJSON)
    .then(applyDefaults)
    .catch(error => {
      console.error('[dashboardService]', error.message);
      return DEFAULT_DASHBOARD_DATA;
    });
