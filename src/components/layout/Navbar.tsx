import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavbarProps {
  onLoginClick: () => void;
}

export function Navbar({ onLoginClick }: NavbarProps) {
  return (
    <nav className="h-16 border-b border-border bg-card flex items-center justify-between px-6 shadow-sm">
      {/* Logo y nombre de la app */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-white flex items-center justify-center">
          <img src="/images/logo.png" alt="TravelSoft.plus" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold text-foreground leading-tight">TravelSoft.plus</span>
          <span className="text-xs text-muted-foreground">sistema de Tiquetes en linea</span>
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
