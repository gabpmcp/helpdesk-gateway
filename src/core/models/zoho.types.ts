import { Map, List, Record as ImmutableRecord } from 'immutable';
import { Map as ImmutableMap, List as ImmutableList } from 'immutable';

// Type definitions for primitive values
export type ZohoId = string;
export type ZohoStatus = 'new' | 'open' | 'in-progress' | 'on-hold' | 'resolved' | 'closed';
export type ZohoPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ZohoDateTime = string;

// Record factory types for immutable records
export interface ZohoTicketRecord {
  id: ZohoId;
  subject: string;
  description: string;
  status: ZohoStatus;
  priority: ZohoPriority;
  category: string;
  dueDate: ZohoDateTime;
  createdTime: ZohoDateTime;
  modifiedTime: ZohoDateTime;
  comments: List<ImmutableComment>;
}

export interface ZohoCommentRecord {
  id: ZohoId;
  comment: string;
  author: string;
  createdTime: ZohoDateTime;
  createdTimestamp?: number;
  ticketId?: string;
  isPublic: boolean;
}

export interface ZohoCategoryRecord {
  id: ZohoId;
  name: string;
  translationKey?: string;
  articleCount?: number;
}

export interface ZohoContactRecord {
  id: ZohoId;
  name: string;
  email?: string;
  phone?: string;
  type?: string;
}

export interface ZohoAccountRecord {
  id: ZohoId;
  name: string;
  domain?: string;
  isActive?: boolean;
}

export interface ZohoDashboardStatsRecord {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  ticketsByPriority?: Map<ZohoPriority, number>;
  ticketsByCategory?: Map<string, number>;
  recentActivity?: List<Map<string, unknown>>;
  avgResolutionTime?: string;
  slaCompliance?: string;
}

export interface ZohoFiltersRecord {
  status?: ZohoStatus;
  priority?: ZohoPriority;
  category?: string;
  from?: ZohoDateTime;
  to?: ZohoDateTime;
  search?: string;
  limit?: number;
  page?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ZohoAuthResponseRecord {
  success: boolean;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  accessToken?: string;
  error?: string;
}

export interface ZohoConfigRecord {
  organizationId: string;
  apiToken: string;
  baseUrl: string;
}

// Type aliases for Map-based immutable structures
export type ImmutableTicket = ImmutableMap<string, any>;
export type ImmutableComment = ImmutableMap<string, any>;
export type ImmutableCategory = ImmutableMap<string, any>;
export type ImmutableContact = ImmutableMap<string, any>;
export type ImmutableAccount = ImmutableMap<string, any>;
export type ImmutableDashboardStats = ImmutableMap<string, any>;
export type ImmutableFilters = ImmutableMap<string, any>;
export type ImmutableAuthResponse = ImmutableMap<string, any>;
export type ImmutableConfig = ImmutableMap<string, any>;
export type ImmutableUser = ImmutableMap<string, any>;

// Record factories for creating immutable records
export const TicketRecord = ImmutableRecord<ZohoTicketRecord>({
  id: '',
  subject: '',
  description: '',
  status: 'new' as ZohoStatus,
  priority: 'medium' as ZohoPriority,
  category: '',
  dueDate: '',
  createdTime: '',
  modifiedTime: '',
  comments: List<ImmutableComment>()
});

export const CommentRecord = ImmutableRecord<ZohoCommentRecord>({
  id: '',
  comment: '',
  author: '',
  createdTime: '',
  createdTimestamp: undefined,
  ticketId: undefined,
  isPublic: true
});

export const CategoryRecord = ImmutableRecord<ZohoCategoryRecord>({
  id: '',
  name: '',
  translationKey: undefined,
  articleCount: undefined
});

export const ContactRecord = ImmutableRecord<ZohoContactRecord>({
  id: '',
  name: '',
  email: undefined,
  phone: undefined,
  type: undefined
});

export const AccountRecord = ImmutableRecord<ZohoAccountRecord>({
  id: '',
  name: '',
  domain: undefined,
  isActive: undefined
});

export const DashboardStatsRecord = ImmutableRecord<ZohoDashboardStatsRecord>({
  totalTickets: 0,
  openTickets: 0,
  resolvedTickets: 0,
  closedTickets: 0,
  ticketsByPriority: Map<ZohoPriority, number>(),
  ticketsByCategory: Map<string, number>(),
  recentActivity: List<Map<string, unknown>>(),
  avgResolutionTime: 'N/A',
  slaCompliance: 'N/A'
});

export const FiltersRecord = ImmutableRecord<ZohoFiltersRecord>({
  status: undefined,
  priority: undefined,
  category: undefined,
  from: undefined,
  to: undefined,
  search: '',
  limit: 50,
  page: 1,
  sortBy: 'modifiedTime',
  sortOrder: 'desc'
});

export const AuthResponseRecord = ImmutableRecord<ZohoAuthResponseRecord>({
  success: false,
  userId: '',
  userName: '',
  userEmail: '',
  userRole: '',
  accessToken: undefined,
  error: undefined
});

export const ConfigRecord = ImmutableRecord<ZohoConfigRecord>({
  organizationId: '',
  apiToken: '',
  baseUrl: ''
});

// Flexible types for Zoho responses with improved typing
export type FlexibleZohoResponse<T = Record<string, unknown>> = {
  data?: T;
  info?: Record<string, unknown>;
  [key: string]: unknown;
};

// Legacy interfaces for backward compatibility
export interface ZohoConfig {
  organizationId: string;
  apiToken: string;
  baseUrl: string;
}

export interface ZohoUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface ZohoTicket {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  dueDate: string;
  createdTime: string;
  modifiedTime: string;
  ticketNumber?: string;
  comments: ZohoComment[];
}

export interface ZohoComment {
  id: string;
  comment: string;
  author: string;
  createdTime: string;
  createdTimestamp?: number;
  ticketId?: string;
  isPublic: boolean;
}

export interface ZohoCategory {
  id: string;
  name: string;
  translationKey?: string;
  articleCount?: number;
}

export interface ZohoContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  type?: string;
}

export interface ZohoAccount {
  id: string;
  name: string;
  domain?: string;
  isActive?: boolean;
}

export interface ZohoDashboardStats {
  ticketCount: number;
  openTicketCount: number;
  urgentTicketCount: number;
  responseTimeAvg: number;
  satisfactionScore: number;
  metrics: {
    ticketsByPriority: {
      Low: number;
      Medium: number;
      High: number;
      Urgent: number;
    };
    ticketsByStatus: {
      Open: number;
      'In Progress': number;
      Closed: number;
      'On Hold': number;
    };
  };
  timestamp: string;
  // Los siguientes campos son para compatibilidad con tipos anteriores
  totalTickets?: number;
  openTickets?: number;
  resolvedTickets?: number;
  closedTickets?: number;
  ticketsByCategory?: Record<string, number>;
  recentActivity?: Array<Record<string, unknown>>;
  avgResolutionTime?: string;
  slaCompliance?: string;
}

export interface ZohoFilters {
  status?: string;
  priority?: string;
  category?: string;
  departmentId?: string;
  from?: string;
  to?: string;
  search?: string;
  limit?: number;
  page?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ZohoAuthResponse {
  success: boolean;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  accessToken?: string;
  error?: string;
}

export interface ZohoTicketInput {
  subject: string;
  description: string;
  status?: string;
  priority?: string;
  category?: string;
  dueDate?: string;
  departmentId?: string;
  contactId?: string;
  accountId?: string;
  ticketNumber?: string;
}

export type ZohoCommentInput = {
  comment: string;
  isPublic: boolean;
  createdTime?: string;
  author?: string;
};

// Conversion utilities
export const toImmutableTicket = (ticket: ZohoTicket): ImmutableTicket => 
  ImmutableMap({
    ...ticket,
    comments: ImmutableList(ticket.comments.map(comment => toImmutableComment(comment)))
  });

export const toImmutableComment = (comment: ZohoComment): ImmutableComment => 
  ImmutableMap(comment);

export const toImmutableCategory = (category: ZohoCategory): ImmutableCategory => 
  ImmutableMap(category);

export const toImmutableContact = (contact: ZohoContact): ImmutableContact => 
  ImmutableMap(contact);

export const toImmutableAccount = (account: ZohoAccount): ImmutableAccount => 
  ImmutableMap(account);

export const toImmutableFilters = (filters: ZohoFilters): ImmutableFilters => 
  ImmutableMap(filters);

export const fromImmutableTicket = (ticket: ImmutableTicket): ZohoTicket => ({
  id: ticket.get('id'),
  subject: ticket.get('subject'),
  description: ticket.get('description'),
  status: ticket.get('status'),
  priority: ticket.get('priority'),
  category: ticket.get('category'),
  dueDate: ticket.get('dueDate'),
  createdTime: ticket.get('createdTime'),
  modifiedTime: ticket.get('modifiedTime'),
  ticketNumber: ticket.get('ticketNumber'),
  comments: ticket.get('comments', ImmutableList()).toArray().map(fromImmutableComment)
});

export const fromImmutableComment = (comment: ImmutableComment): ZohoComment => ({
  id: comment.get('id'),
  comment: comment.get('comment'),
  author: comment.get('author'),
  createdTime: comment.get('createdTime'),
  createdTimestamp: comment.get('createdTimestamp'),
  ticketId: comment.get('ticketId'),
  isPublic: comment.get('isPublic')
});

export const fromImmutableContact = (contact: ImmutableContact): ZohoContact => ({
  id: contact.get('id'),
  name: contact.get('name'),
  email: contact.get('email'),
  phone: contact.get('phone'),
  type: contact.get('type')
});

export const fromImmutableAccount = (account: ImmutableAccount): ZohoAccount => ({
  id: account.get('id'),
  name: account.get('name'),
  domain: account.get('domain'),
  isActive: account.get('isActive')
});
