import { zohoService } from '../../services/zohoService';
import { ZohoFilters, ZohoCommentInput } from '../../core/models/zoho.types';
import { configuredAuthTransition } from './auth.config';

// Configuración de servicios con funciones curried para inyección de dependencias
// Estas funciones se inyectarán en los thunks de Redux

// Dashboard
export const configuredFetchDashboardStats = () => 
  zohoService.getDashboardStats();

// Tickets
export const configuredFetchTickets = (filters: ZohoFilters) => 
  zohoService.getTickets(filters);

// Ticket Detail
export const configuredFetchTicketById = (id: string) => 
  zohoService.getTicketById(id);

export const configuredAddComment = (ticketId: string, commentData: ZohoCommentInput) => 
  zohoService.addComment(ticketId, commentData);

export const configuredCreateTicket = (ticketData: any) => 
  zohoService.createTicket(ticketData);

// Categories
export const configuredFetchCategories = () => 
  zohoService.getCategories();

// Authentication
export const configuredAuthenticateUser = (email: string, password: string) => 
  zohoService.authenticateUser(email, password);

// Event-sourced Authentication
export const eventSourcedAuthenticate = (email: string, password: string) => 
  configuredAuthTransition({ email, password });
