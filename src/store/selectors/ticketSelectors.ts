/**
 * Selectores funcionales para tickets
 * 
 * Proporciona selectores inmutables para filtrar y transformar
 * datos de tickets almacenados en Redux
 */
import { createSelector } from '@reduxjs/toolkit';
import { Map, List } from 'immutable';

export interface TicketFilters {
  status?: string;
  priority?: string;
  category?: string;
  search?: string;
  from?: string;
  to?: string;
}

/**
 * Selector para obtener todos los tickets
 */
export const selectAllTickets = (state: any) => 
  state.getIn(['tickets', 'all'], List());

/**
 * Selector para obtener el estado de carga
 */
export const selectTicketsLoading = (state: any) => 
  state.getIn(['tickets', 'loading'], false);

/**
 * Selector para obtener errores
 */
export const selectTicketsError = (state: any) => 
  state.getIn(['tickets', 'error'], null);

/**
 * Selector para obtener la página actual
 */
export const selectTicketsPage = (state: any) => 
  state.getIn(['tickets', 'page'], 1);

/**
 * Selector para obtener el total de tickets
 */
export const selectTicketsTotal = (state: any) => 
  state.getIn(['tickets', 'total'], 0);

/**
 * Selector para tickets filtrados
 * Utiliza un enfoque funcional con Immutable.js
 */
export const selectFilteredTickets = createSelector(
  [selectAllTickets, (_: any, filters: TicketFilters) => filters],
  (tickets, filters) => {
    if (!filters || Object.keys(filters).length === 0) {
      return tickets;
    }

    return tickets.filter((ticket: Map<string, any>) => {
      // Filtro por estado
      if (filters.status && ticket.get('status') !== filters.status) {
        return false;
      }

      // Filtro por prioridad
      if (filters.priority && ticket.get('priority') !== filters.priority) {
        return false;
      }

      // Filtro por categoría
      if (filters.category && ticket.get('category') !== filters.category) {
        return false;
      }

      // Filtro por búsqueda de texto
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const subject = ticket.get('subject', '').toLowerCase();
        const description = ticket.get('description', '').toLowerCase();
        
        if (!subject.includes(searchLower) && !description.includes(searchLower)) {
          return false;
        }
      }

      // Filtro por fecha desde
      if (filters.from) {
        const fromDate = new Date(filters.from);
        const createdDate = new Date(ticket.get('createdTime', ''));
        
        if (createdDate < fromDate) {
          return false;
        }
      }

      // Filtro por fecha hasta
      if (filters.to) {
        const toDate = new Date(filters.to);
        const createdDate = new Date(ticket.get('createdTime', ''));
        
        if (createdDate > toDate) {
          return false;
        }
      }

      return true;
    });
  }
);

/**
 * Selector para ordenar tickets por fecha
 */
export const selectTicketsSortedByDate = createSelector(
  [selectFilteredTickets],
  (tickets) => {
    return tickets.sort((a: Map<string, any>, b: Map<string, any>) => {
      const dateA = new Date(a.get('createdTime', '')).getTime();
      const dateB = new Date(b.get('createdTime', '')).getTime();
      return dateB - dateA; // Orden descendente (más reciente primero)
    });
  }
);

/**
 * Selector para obtener tickets paginados
 */
export const selectPaginatedTickets = createSelector(
  [selectTicketsSortedByDate, (_: any, page: number) => page, (_: any, __: any, pageSize: number) => pageSize],
  (tickets, page, pageSize) => {
    const startIndex = (page - 1) * pageSize;
    return tickets.slice(startIndex, startIndex + pageSize);
  }
);

/**
 * Selector para obtener tickets agrupados por prioridad
 */
export const selectTicketsByPriority = createSelector(
  [selectAllTickets],
  (tickets) => {
    return tickets.groupBy(ticket => ticket.get('priority'));
  }
);

/**
 * Selector para obtener tickets agrupados por estado
 */
export const selectTicketsByStatus = createSelector(
  [selectAllTickets],
  (tickets) => {
    return tickets.groupBy(ticket => ticket.get('status'));
  }
);

/**
 * Selector para obtener tickets agrupados por categoría
 */
export const selectTicketsByCategory = createSelector(
  [selectAllTickets],
  (tickets) => {
    return tickets.groupBy(ticket => ticket.get('category'));
  }
);
