import React from "react";
import { SelectItem } from "./select";

/**
 * Un componente SelectItem seguro que garantiza que value siempre sea un string válido
 * y nunca sea una cadena vacía, lo cual no está permitido por Radix UI
 */
interface SafeSelectItemProps {
  value: any; // Acepta cualquier tipo de valor
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  key?: string;
}

export const SafeSelectItem: React.FC<SafeSelectItemProps> = ({
  value,
  children,
  disabled,
  className,
  ...props
}) => {
  // Asegurarse de que value siempre sea un string y nunca una cadena vacía
  // Si es nulo, undefined o cadena vacía, usamos un valor especial "_empty_"
  let safeValue = value === null || value === undefined ? "_empty_" : String(value);
  
  // Si después de la conversión es una cadena vacía, usamos un valor especial
  if (safeValue === "") {
    safeValue = "_empty_";
  }
  
  return (
    <SelectItem
      value={safeValue}
      disabled={disabled}
      className={className}
      {...props}
    >
      {children}
    </SelectItem>
  );
};
