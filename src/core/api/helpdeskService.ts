import { Map as ImmutableMap, List, fromJS } from 'immutable';
import { getApiClient } from './apiClient';
import { 
  ImmutableUser, 
  ImmutableTicket, 
  ImmutableComment,
  ZohoCommentInput
} from '../models/zoho.types';
import { getBaseUrl } from '../../config';

// Authentication types
export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: ImmutableUser;
  role: string;
  token?: string;
}

export interface AuthStatus {
  email: string;
  lastAuthenticated: string;
  status: 'authenticated' | 'unauthenticated';
}

// Dashboard data type
export interface DashboardData {
  tickets: List<ImmutableTicket>;
  stats: ImmutableMap<string, any>;
}

// Ticket creation payload
export interface TicketCreationPayload {
  subject: string;
  description: string;
  contactId: string;
  departmentId?: string;
  priority?: string;
}

// Command interface for event-sourcing architecture
export interface Command {
  type: string;
  email: string;
  timestamp?: number;
  [key: string]: any;
}

// State interface
export interface UserState {
  user: ImmutableUser | null;
  tickets: List<ImmutableTicket>;
  dashboard: ImmutableMap<string, any>;
}

// Pure function to create a command object
export const createCommand = (type: string, email: string, data: object = {}): Command => ({
  type,
  email,
  timestamp: Date.now(),
  ...data
});

// Authentication service
export const authService = {
  // Login using command pattern
  async login(credentials: AuthCredentials): Promise<AuthResponse> {
    try {
      const response = await getApiClient().post<ImmutableMap<string, any>>('/api/auth/login', credentials);
      return {
        user: response.get('user', ImmutableMap()) as ImmutableUser,
        role: response.get('role', 'user') as string,
        token: response.get('token', '') as string
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Refresh token
  async refreshToken(email: string, refreshToken: string): Promise<AuthResponse> {
    try {
      const response = await getApiClient().post<ImmutableMap<string, any>>('/api/auth/refresh', { email, refreshToken });
      return {
        user: response.get('user', ImmutableMap()) as ImmutableUser,
        role: response.get('role', 'user') as string,
        token: response.get('token', '') as string
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  },

  // Get authentication status
  async getStatus(email: string): Promise<AuthStatus> {
    try {
      const response = await getApiClient().get<ImmutableMap<string, any>>(`/api/auth/status/${email}`);
      return {
        email: response.get('email', '') as string,
        lastAuthenticated: response.get('lastAuthenticated', '') as string,
        status: response.get('status', 'unauthenticated') as 'authenticated' | 'unauthenticated'
      };
    } catch (error) {
      console.error('Auth status error:', error);
      throw error;
    }
  }
};

// Command service - centralized for event-sourcing architecture
export const commandService = {
  // Send any command to the backend
  async sendCommand<T>(command: Command): Promise<T> {
    try {
      const response = await getApiClient().post<ImmutableMap<string, any>>('/api/commands', command);
      return response.toJS() as T;
    } catch (error) {
      console.error('Command error:', error);
      throw error;
    }
  },

  // Get user state
  async getUserState(email: string): Promise<UserState> {
    try {
      const response = await getApiClient().get<ImmutableMap<string, any>>(`/api/state/${email}`);
      return {
        user: response.get('user', ImmutableMap()) as ImmutableUser,
        tickets: response.get('tickets', List()) as List<ImmutableTicket>,
        dashboard: response.get('dashboard', ImmutableMap()) as ImmutableMap<string, any>
      };
    } catch (error) {
      console.error('Get user state error:', error);
      throw error;
    }
  }
};

// Ticket service - using command pattern
export const ticketService = {
  // Get a specific ticket
  async getTicket(id: string, email: string): Promise<{ ticket: ImmutableTicket }> {
    try {
      const command = createCommand('GET_TICKET', email, { ticketId: id });
      return commandService.sendCommand<{ ticket: ImmutableTicket }>(command);
    } catch (error) {
      console.error(`Get ticket ${id} error:`, error);
      throw error;
    }
  },

  // Create a new ticket
  async createTicket(payload: TicketCreationPayload, email: string): Promise<{ ticketCreated: ImmutableTicket }> {
    try {
      const command = createCommand('CREATE_TICKET', email, {
        subject: payload.subject,
        description: payload.description,
        contactId: payload.contactId,
        departmentId: payload.departmentId,
        priority: payload.priority
      });
      
      return commandService.sendCommand<{ ticketCreated: ImmutableTicket }>(command);
    } catch (error) {
      console.error('Create ticket error:', error);
      throw error;
    }
  },

  // Add a comment to a ticket
  async addComment(ticketId: string, comment: string, email: string): Promise<{ commentAdded: boolean }> {
    try {
      const command = createCommand('ADD_COMMENT', email, { ticketId, comment });
      return commandService.sendCommand<{ commentAdded: boolean }>(command);
    } catch (error) {
      console.error(`Add comment to ticket ${ticketId} error:`, error);
      throw error;
    }
  },

  // Escalate a ticket
  async escalateTicket(ticketId: string, email: string): Promise<{ escalated: boolean }> {
    try {
      const command = createCommand('ESCALATE_TICKET', email, { ticketId });
      return commandService.sendCommand<{ escalated: boolean }>(command);
    } catch (error) {
      console.error(`Escalate ticket ${ticketId} error:`, error);
      throw error;
    }
  },

  // Get all tickets for a user
  async getTickets(email: string): Promise<{ tickets: List<ImmutableTicket> }> {
    try {
      const command = createCommand('GET_TICKETS', email);
      return commandService.sendCommand<{ tickets: List<ImmutableTicket> }>(command);
    } catch (error) {
      console.error('Get tickets error:', error);
      throw error;
    }
  }
};

// Dashboard service - using command pattern
export const dashboardService = {
  // Get dashboard data
  async getDashboardData(email: string): Promise<DashboardData> {
    try {
      // Obtener datos de reportes desde el endpoint de Zoho
      const reportsResponse = await fetch(`${getBaseUrl()}/api/zoho/reports-overview`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
        cache: 'no-store',
        redirect: 'follow',
        referrerPolicy: 'no-referrer'
      });

      // Obtener los datos del dashboard usando el comando existente
      const command = createCommand('GET_DASHBOARD', email);
      const commandResponse = await commandService.sendCommand<{
        tickets: List<ImmutableTicket>;
        stats: ImmutableMap<string, any>;
      }>(command);
      
      // Combinar datos de ambas fuentes
      let stats = commandResponse.stats || ImmutableMap();
      
      // Si la respuesta de reportes es exitosa, integrar esos datos
      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json();
        console.log('Reports data from API:', reportsData);
        
        // Convertir a estructura inmutable y combinar con los datos existentes
        const reportsStats = fromJS(reportsData);
        
        // Combinar métricas de ambas fuentes, priorizando los datos de Zoho
        stats = stats.merge(reportsStats);
      } else {
        console.error(`Error HTTP ${reportsResponse.status}: ${reportsResponse.statusText}`);
        // Intentar leer el cuerpo del error para más información
        try {
          const errorText = await reportsResponse.text();
          console.error('Error response body:', errorText);
        } catch (readError) {
          console.error('Could not read error response:', readError);
        }
      }
      
      return {
        tickets: commandResponse.tickets || List(),
        stats: stats
      };
    } catch (error) {
      console.error('Get dashboard data error:', error);
      throw error;
    }
  }
};

// Ticket API Methods
export const getTickets = async (filters: Record<string, any> = {}): Promise<any> => {
  try {
    // Construir parámetros de consulta
    const queryParams = new URLSearchParams();
    
    Object.entries(filters)
      .filter(([_, value]) => value !== undefined && value !== null)
      .forEach(([key, value]) => queryParams.append(key, String(value)));
    
    const queryString = queryParams.toString();
    
    const response = await fetch(`${getBaseUrl()}/api/tickets${queryString ? `?${queryString}` : ''}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      mode: 'cors'
    });
    
    if (!response.ok) {
      throw new Error(`Error al obtener tickets: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error en getTickets:', error);
    throw error;
  }
};

export const getTicketById = async (ticketId: string): Promise<any> => {
  try {
    const response = await fetch(`${getBaseUrl()}/api/tickets/${ticketId}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      mode: 'cors'
    });
    
    if (!response.ok) {
      throw new Error(`Error al obtener detalles del ticket: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error en getTicketById:', error);
    throw error;
  }
};

export const createTicket = async (ticketData: Record<string, any>): Promise<any> => {
  try {
    const response = await fetch(`${getBaseUrl()}/api/tickets`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      mode: 'cors',
      body: JSON.stringify(ticketData)
    });
    
    if (!response.ok) {
      throw new Error(`Error al crear ticket: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error en createTicket:', error);
    throw error;
  }
};

export const updateTicketStatus = async (ticketId: string, status: string): Promise<any> => {
  try {
    const response = await fetch(`${getBaseUrl()}/api/tickets/${ticketId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      mode: 'cors',
      body: JSON.stringify({ status })
    });
    
    if (!response.ok) {
      throw new Error(`Error al actualizar estado del ticket: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error en updateTicketStatus:', error);
    throw error;
  }
};

export const addTicketComment = async (
  ticketId: string, 
  message: string,
  attachments: File[] = []
): Promise<any> => {
  try {
    let response;
    
    if (attachments.length > 0) {
      // Si hay archivos adjuntos, enviar como FormData
      const formData = new FormData();
      formData.append('message', message);
      
      attachments.forEach(file => {
        formData.append('attachments', file);
      });
      
      response = await fetch(`${getBaseUrl()}/api/tickets/${ticketId}/comments`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
        mode: 'cors',
        body: formData
      });
    } else {
      // Sin archivos adjuntos, enviar como JSON
      response = await fetch(`${getBaseUrl()}/api/tickets/${ticketId}/comments`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify({ message })
      });
    }
    
    if (!response.ok) {
      throw new Error(`Error al añadir comentario: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error en addTicketComment:', error);
    throw error;
  }
};

// Factory function to create service with email injection
export const createHelpdeskService = (email: string, token: string) => {
  return {
    auth: {
      login: (credentials: AuthCredentials) => authService.login(credentials),
      refreshToken: (refreshToken: string) => authService.refreshToken(email, refreshToken),
      getStatus: () => authService.getStatus(email)
    },
    tickets: {
      get: (id: string) => ticketService.getTicket(id, email),
      create: (payload: TicketCreationPayload) => ticketService.createTicket(payload, email),
      addComment: (ticketId: string, comment: string) => ticketService.addComment(ticketId, comment, email),
      escalate: (ticketId: string) => ticketService.escalateTicket(ticketId, email),
      getAll: () => ticketService.getTickets(email),
      getTickets: (filters: Record<string, any>) => getTickets(filters),
      getTicketById: (ticketId: string) => getTicketById(ticketId),
      createTicket: (ticketData: Record<string, any>) => createTicket(ticketData),
      updateTicketStatus: (ticketId: string, status: string) => updateTicketStatus(ticketId, status),
      addTicketComment: (ticketId: string, message: string, attachments: File[] = []) => addTicketComment(ticketId, message, attachments)
    },
    dashboard: {
      getData: () => dashboardService.getDashboardData(email)
    },
    commands: {
      send: <T>(type: string, data: object = {}) => 
        commandService.sendCommand<T>(createCommand(type, email, data)),
      getState: () => commandService.getUserState(email)
    }
  };
};
