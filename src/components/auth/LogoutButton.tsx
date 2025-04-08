import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface LogoutButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showIcon?: boolean;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({
  variant = 'ghost',
  size = 'sm',
  className = '',
  showIcon = true
}) => {
  const { logout } = useAuth();

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={logout}
    >
      {showIcon && <LogOut className="mr-2 h-4 w-4" />}
      Cerrar sesión
    </Button>
  );
};

export default LogoutButton;
