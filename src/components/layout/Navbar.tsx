import { Bus, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavbarProps {
  onLoginClick: () => void;
}

export function Navbar({ onLoginClick }: NavbarProps) {
  return (
    <nav className="h-16 border-b border-border bg-card flex items-center justify-between px-6 shadow-sm">
      {/* Logo y nombre de la app */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 flex items-center justify-center">
          <img src="logo.png" alt="" />
          {/* <Bus className="w-6 h-6 text-primary-foreground" /> */}
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold text-foreground leading-tight">TransTicket</span>
          <span className="text-xs text-muted-foreground">Sistema de Boletería</span>
        </div>
      </div>

      {/* Botón de ingreso */}
      <Button onClick={onLoginClick} className="gap-2">
        <LogIn className="w-4 h-4" />
        Ingresar
      </Button>
    </nav>
  );
}
