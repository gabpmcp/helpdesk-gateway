import React, { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { 
  setFilters, 
  selectTicketsFilters 
} from '@/store/slices/ticketsSlice';
import { Map as ImmutableMap } from 'immutable';
import { ZohoFilters } from '@/core/models/zoho.types';
import { toJS } from '@/core/logic/zohoLogic';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X, FilterIcon } from 'lucide-react';

// Opciones de filtrado basadas en Zoho
const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'Open', label: 'Open' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'On Hold', label: 'On Hold' },
  { value: 'Closed', label: 'Closed' }
];

const priorityOptions = [
  { value: '', label: 'All Priorities' },
  { value: 'High', label: 'High' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Low', label: 'Low' }
];

interface TicketFiltersProps {
  categories: Array<{ id: string; name: string }>;
  onFiltersChange?: (filters: ZohoFilters) => void;
}

const TicketFilters: React.FC<TicketFiltersProps> = ({ 
  categories = [],
  onFiltersChange
}) => {
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectTicketsFilters);
  
  // Función pura para actualizar los filtros (patrón FCIS)
  const updateFilters = useCallback((key: string, value: string) => {
    // Actualizar el filtro manteniendo la inmutabilidad
    const currentFilters = filters.toJS() as ZohoFilters;
    const newFilters: ZohoFilters = { ...currentFilters, [key]: value };
    
    // Dispatch para actualizar el estado
    dispatch(setFilters(newFilters));
    
    // Callback opcional para componentes padre
    if (onFiltersChange) {
      onFiltersChange(newFilters);
    }
  }, [dispatch, filters, onFiltersChange]);
  
  // Función pura para resetear los filtros
  const resetFilters = useCallback(() => {
    const emptyFilters: ZohoFilters = {};
    dispatch(setFilters(emptyFilters));
    
    if (onFiltersChange) {
      onFiltersChange(emptyFilters);
    }
  }, [dispatch, onFiltersChange]);
  
  // Determinar si los filtros están activos
  const hasActiveFilters = !filters.isEmpty();
  
  // Extraer valores actuales de los filtros
  const currentFilters = toJS(filters) as ZohoFilters;
  const currentStatus = currentFilters.status || '';
  const currentPriority = currentFilters.priority || '';
  const currentDepartment = currentFilters.departmentId || '';
  
  return (
    <div className="bg-muted/30 rounded-md p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center">
          <FilterIcon className="h-4 w-4 mr-2" />
          Filter Tickets
        </h3>
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={resetFilters}
            className="h-8 px-2 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear filters
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Status filter */}
        <div>
          <Select
            value={currentStatus}
            onValueChange={(value) => updateFilters('status', value)}
          >
            <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map(option => (
                <SelectItem key={option.value || 'empty'} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Priority filter */}
        <div>
          <Select
            value={currentPriority}
            onValueChange={(value) => updateFilters('priority', value)}
          >
            <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder="Filter by Priority" />
            </SelectTrigger>
            <SelectContent>
              {priorityOptions.map(option => (
                <SelectItem key={option.value || 'empty'} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Department/Category filter */}
        <div>
          <Select
            value={currentDepartment}
            onValueChange={(value) => updateFilters('departmentId', value)}
          >
            <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder="Filter by Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default TicketFilters;
