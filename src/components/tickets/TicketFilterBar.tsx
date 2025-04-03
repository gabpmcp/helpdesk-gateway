/**
 * Componente TicketFilterBar
 * 
 * Proporciona interfaz para filtrar tickets según diversos criterios
 * siguiendo los patrones funcionales e inmutables
 */
import React, { useState, useEffect } from 'react';
import { fromJS } from 'immutable';
import { Search, Filter, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { TicketFilters } from '@/store/selectors/ticketSelectors';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

interface TicketFilterBarProps {
  onFiltersChange: (filters: TicketFilters) => void;
  categories: Array<{ id: string; name: string }>;
}

const TicketFilterBar: React.FC<TicketFilterBarProps> = ({
  onFiltersChange,
  categories,
}) => {
  // Estado local para los filtros
  const [filters, setFilters] = useState<TicketFilters>({
    status: '',
    priority: '',
    category: '',
    search: '',
    from: '',
    to: '',
  });
  
  // Estado para controlar la visibilidad del calendario
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Actualizar filtros externos cuando cambian los locales
  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  // Manejar cambios en los filtros
  const handleFilterChange = (key: keyof TicketFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Manejar cambios en la búsqueda
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFilterChange('search', e.target.value);
  };

  // Manejar cambios en la fecha desde
  const handleFromDateChange = (date: Date | undefined) => {
    setFilters((prev) => ({
      ...prev,
      from: date ? date.toISOString() : '',
    }));
  };

  // Manejar cambios en la fecha hasta
  const handleToDateChange = (date: Date | undefined) => {
    setFilters((prev) => ({
      ...prev,
      to: date ? date.toISOString() : '',
    }));
  };

  // Limpiar todos los filtros
  const handleClearFilters = () => {
    setFilters({
      status: '',
      priority: '',
      category: '',
      search: '',
      from: '',
      to: '',
    });
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row justify-between items-center p-4 bg-secondary/20 rounded-lg">
      {/* Barra de búsqueda */}
      <div className="relative w-full md:w-1/3">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar tickets..."
          className="pl-10"
          value={filters.search}
          onChange={handleSearchChange}
        />
      </div>

      <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
        {/* Filtro de estado */}
        <Select
          value={filters.status}
          onValueChange={(value) => handleFilterChange('status', value)}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            <SelectItem value="new">Nuevo</SelectItem>
            <SelectItem value="open">Abierto</SelectItem>
            <SelectItem value="in-progress">En progreso</SelectItem>
            <SelectItem value="on-hold">En espera</SelectItem>
            <SelectItem value="resolved">Resuelto</SelectItem>
            <SelectItem value="closed">Cerrado</SelectItem>
          </SelectContent>
        </Select>

        {/* Filtro de prioridad */}
        <Select
          value={filters.priority}
          onValueChange={(value) => handleFilterChange('priority', value)}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Prioridad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas</SelectItem>
            <SelectItem value="low">Baja</SelectItem>
            <SelectItem value="medium">Media</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="urgent">Urgente</SelectItem>
          </SelectContent>
        </Select>

        {/* Filtro de categoría */}
        <Select
          value={filters.category}
          onValueChange={(value) => handleFilterChange('category', value)}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filtro de fecha */}
        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span>Fechas</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="end">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Desde</Label>
                <CalendarComponent
                  mode="single"
                  selected={filters.from ? new Date(filters.from) : undefined}
                  onSelect={handleFromDateChange}
                  initialFocus
                />
              </div>
              <div className="space-y-2">
                <Label>Hasta</Label>
                <CalendarComponent
                  mode="single"
                  selected={filters.to ? new Date(filters.to) : undefined}
                  onSelect={handleToDateChange}
                  initialFocus
                />
              </div>
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    handleFromDateChange(undefined);
                    handleToDateChange(undefined);
                    setDatePickerOpen(false);
                  }}
                >
                  Limpiar fechas
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Botón para limpiar filtros */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="ml-2"
        >
          Limpiar filtros
        </Button>
      </div>
    </div>
  );
};

export default TicketFilterBar;
