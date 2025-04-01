/**
 * Dashboard Projection Service
 * 
 * Consumes immutable projections from the backend API
 * following functional, composable, isolated, and stateless (FCIS) principles
 */
import { Map as ImmutableMap, List, fromJS } from 'immutable';
// Remove the pipe import since we're not using it
import { ImmutableTicket } from '../core/models/zoho.types';

// Base API URL - Usar el puerto correcto del backend (3000)
const API_BASE_URL = 'http://localhost:3000'; // URL del backend

// Configuración para fetch con credenciales
const fetchConfig: RequestInit = {
  credentials: 'include', // Incluir cookies y credenciales
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  mode: 'cors', // Asegurar que se use el modo CORS
  cache: 'no-store', // No almacenar en caché
  redirect: 'follow', // Seguir redirecciones
  referrerPolicy: 'no-referrer', // No enviar el encabezado Referer
};

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
 * Fetch data from a projection endpoint with improved error handling
 * @param endpoint - The projection endpoint path
 * @returns Promise with the immutable data
 */
const fetchProjection = async <T>(endpoint: string): Promise<T> => {
  try {
    // Usar la URL completa con el puerto correcto
    const response = await fetch(`${API_BASE_URL}/api/zoho${endpoint}`, fetchConfig);
    
    if (!response.ok) {
      console.error(`Error HTTP ${response.status}: ${response.statusText}`);
      throw new Error(`Failed to fetch projection: ${response.statusText}`);
    }
    
    // Obtener el texto de la respuesta primero para verificar si es HTML
    const text = await response.text();
    
    // Si la respuesta está vacía, devolver un objeto vacío
    if (!text.trim()) {
      console.warn('Received empty response, returning empty object');
      return fromJS({}) as T;
    }
    
    // Verificar si la respuesta es HTML en lugar de JSON
    if (isHtmlResponse(text)) {
      console.error('Received HTML instead of JSON:', text.substring(0, 100) + '...');
      // En lugar de lanzar un error, devolver un objeto vacío para que la aplicación siga funcionando
      return fromJS({}) as T;
    }
    
    // Parsear el texto a JSON
    try {
      const data = JSON.parse(text);
      return fromJS(data) as T;
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      // En lugar de lanzar un error, devolver un objeto vacío
      return fromJS({}) as T;
    }
  } catch (error) {
    console.error(`Error fetching from ${endpoint}:`, error);
    // En lugar de propagar el error, devolver un objeto vacío
    return fromJS({}) as T;
  }
};

/**
 * Fetch data from a webhook endpoint with improved error handling
 * @param endpoint - The webhook endpoint path
 * @returns Promise with the immutable data
 */
const fetchWebhook = async <T>(endpoint: string): Promise<T> => {
  try {
    // Usar la URL completa con el puerto correcto
    const response = await fetch(`${API_BASE_URL}${endpoint}`, fetchConfig);
    
    if (!response.ok) {
      console.error(`Error HTTP ${response.status}: ${response.statusText}`);
      throw new Error(`Failed to fetch webhook data: ${response.statusText}`);
    }
    
    // Obtener el texto de la respuesta primero para verificar si es HTML
    const text = await response.text();
    
    // Si la respuesta está vacía, devolver un objeto vacío
    if (!text.trim()) {
      console.warn('Received empty response, returning empty object');
      return fromJS({}) as T;
    }
    
    // Verificar si la respuesta es HTML en lugar de JSON
    if (isHtmlResponse(text)) {
      console.error('Received HTML instead of JSON:', text.substring(0, 100) + '...');
      // En lugar de lanzar un error, devolver un objeto vacío
      return fromJS({}) as T;
    }
    
    // Parsear el texto a JSON
    try {
      const data = JSON.parse(text);
      return fromJS(data) as T;
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      // En lugar de lanzar un error, devolver un objeto vacío
      return fromJS({}) as T;
    }
  } catch (error) {
    console.error(`Error fetching from webhook ${endpoint}:`, error);
    // En lugar de propagar el error, devolver un objeto vacío
    return fromJS({}) as T;
  }
};

/**
 * Fetch dashboard overview projection
 * @returns Promise with dashboard overview data
 */
export const fetchDashboardOverview = () => 
  fetchProjection<ImmutableMap<string, any>>('/reports-overview');

/**
 * Fetch dashboard tickets projection
 * @returns Promise with dashboard tickets data
 */
export const fetchDashboardTickets = () => 
  fetchProjection<ImmutableMap<string, any>>('/tickets');

/**
 * Fetch dashboard contacts projection
 * @returns Promise with dashboard contacts data
 */
export const fetchDashboardContacts = () => 
  fetchProjection<ImmutableMap<string, any>>('/contacts');

/**
 * Fetch reports overview webhook data
 * @returns Promise with reports overview data
 */
export const fetchReportsOverview = () =>
  fetchWebhook<ImmutableMap<string, any>>('/api/zoho/reports-overview');

/**
 * Fetch all dashboard projections and combine them
 * @returns Promise with combined dashboard data
 */
export const fetchDashboardData = async (): Promise<ImmutableMap<string, any>> => {
  try {
    // Intentar obtener solo el overview primero, ya que puede tener toda la información necesaria
    const overview = await fetchDashboardOverview();
    
    // Si el overview está vacío o no tiene las propiedades necesarias, crear un objeto con valores por defecto
    if (!overview || 
        !overview.has('metrics') || 
        !overview.has('ticketCount') || 
        !overview.has('openTicketCount') || 
        !overview.has('urgentTicketCount')) {
      
      console.warn('Overview data is incomplete, using default values');
      
      // Crear un objeto con valores por defecto
      return ImmutableMap({
        metrics: ImmutableMap({
          ticketsByPriority: ImmutableMap({
            Low: 0,
            Medium: 0,
            High: 0,
            Urgent: 0
          }),
          ticketsByStatus: ImmutableMap({
            Open: 0,
            'In Progress': 0,
            Closed: 0,
            'On Hold': 0
          })
        }),
        ticketCount: 0,
        openTicketCount: 0,
        urgentTicketCount: 0,
        responseTimeAvg: 0,
        satisfactionScore: 0,
        tickets: List(),
        contacts: List(),
        lastUpdated: new Date().toISOString(),
        source: 'default-values'
      });
    }
    
    // Si tiene toda la información necesaria, intentar obtener los tickets y contactos
    // Fetch all projections in parallel
    const [tickets, contacts] = await Promise.all([
      fetchDashboardTickets().catch(error => {
        console.warn('Error fetching tickets, using empty data:', error);
        return ImmutableMap();
      }),
      fetchDashboardContacts().catch(error => {
        console.warn('Error fetching contacts, using empty data:', error);
        return ImmutableMap();
      })
    ]);
    
    // Combine all projections into a single immutable map
    return ImmutableMap({
      metrics: overview.get('metrics', ImmutableMap()),
      ticketCount: overview.get('ticketCount', 0),
      openTicketCount: overview.get('openTicketCount', 0),
      urgentTicketCount: overview.get('urgentTicketCount', 0),
      responseTimeAvg: overview.get('responseTimeAvg', 0),
      satisfactionScore: overview.get('satisfactionScore', 0),
      tickets: tickets.get('tickets'),
      contacts: contacts.get('contacts'),
      lastUpdated: overview.get('lastUpdated', new Date().toISOString()),
      source: 'zoho-projection'
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    
    // En caso de error, devolver un objeto con valores por defecto
    return ImmutableMap({
      metrics: ImmutableMap({
        ticketsByPriority: ImmutableMap({
          Low: 0,
          Medium: 0,
          High: 0,
          Urgent: 0
        }),
        ticketsByStatus: ImmutableMap({
          Open: 0,
          'In Progress': 0,
          Closed: 0,
          'On Hold': 0
        })
      }),
      ticketCount: 0,
      openTicketCount: 0,
      urgentTicketCount: 0,
      responseTimeAvg: 0,
      satisfactionScore: 0,
      tickets: List(),
      contacts: List(),
      lastUpdated: new Date().toISOString(),
      source: 'error-fallback'
    });
  }
};
