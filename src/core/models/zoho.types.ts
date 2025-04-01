import { Map, List, Record as ImmutableRecord } from 'immutable';

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
  content: string;
  createdBy: string;
  createdTime: ZohoDateTime;
  isPublic: boolean;
}

export interface ZohoCategoryRecord {
  id: ZohoId;
  name: string;
  translationKey?: string;
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
export type ImmutableTicket = Map<string, any>;
export type ImmutableComment = Map<string, any>;
export type ImmutableCategory = Map<string, any>;
export type ImmutableDashboardStats = Map<string, any>;
export type ImmutableFilters = Map<string, any>;
export type ImmutableAuthResponse = Map<string, any>;
export type ImmutableConfig = Map<string, any>;
export type ImmutableUser = Map<string, any>;

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
  content: '',
  createdBy: '',
  createdTime: '',
  isPublic: true
});

export const CategoryRecord = ImmutableRecord<ZohoCategoryRecord>({
  id: '',
  name: '',
  translationKey: undefined
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
  comments: ZohoComment[];
}

export interface ZohoComment {
  id: string;
  content: string;
  createdBy: string;
  createdTime: string;
  isPublic: boolean;
}

export interface ZohoCategory {
  id: string;
  name: string;
  translationKey?: string;
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

export type ZohoTicketInput = Omit<ZohoTicket, 'id' | 'createdTime' | 'modifiedTime' | 'comments'> & {
  dueDate?: string;
};

export type ZohoCommentInput = Omit<ZohoComment, 'id' | 'createdTime' | 'createdBy'>;

// Conversion utilities
export const toImmutableTicket = (ticket: ZohoTicket): ImmutableTicket => 
  Map({
    ...ticket,
    comments: List(ticket.comments.map(comment => toImmutableComment(comment)))
  });

export const toImmutableComment = (comment: ZohoComment): ImmutableComment => 
  Map(comment);

export const toImmutableCategory = (category: ZohoCategory): ImmutableCategory => 
  Map(category);

export const toImmutableFilters = (filters: ZohoFilters): ImmutableFilters => 
  Map(filters);

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
  comments: ticket.get('comments', List()).toArray().map(fromImmutableComment)
});

export const fromImmutableComment = (comment: ImmutableComment): ZohoComment => ({
  id: comment.get('id'),
  content: comment.get('content'),
  createdBy: comment.get('createdBy'),
  createdTime: comment.get('createdTime'),
  isPublic: comment.get('isPublic')
});
