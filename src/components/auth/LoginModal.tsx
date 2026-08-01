import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { travelsoftService, getDashboardPorNivel } from '@/services/travelsoftService';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const navigate = useNavigate();
  const { loginStateUpdate } = useAuth(); 
  
  const [cedula, setCedula] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cedulaTrimmed = cedula.trim();
    
    // 1. Validaciones previas al envío (Ahorra pegarle a la API innecesariamente)
    if (!cedulaTrimmed || !password) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    setLoading(true);

    try {
      // 2. Login contra travelsoft.backend.lan
      const result = await travelsoftService.login(cedulaTrimmed, password);

      // 3. Persistimos la sesión (usuario + token) y actualizamos el contexto
      loginStateUpdate({ user: { ...result.user, token: result.token } });

      // 4. Enrutamiento por nivel del usuario a su dashboard
      onOpenChange(false);
      navigate(getDashboardPorNivel(result.user), { replace: true });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión con el backend TravelSoft.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            Iniciar Sesión
          </DialogTitle>
          <DialogDescription className="text-center">
            Ingresa tus credenciales para acceder al sistema
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {error && (
            <Alert variant="destructive" className="animate-in fade-in-50 duration-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="cedula">Número de documento</Label>
            <Input
              id="cedula"
              placeholder="Cédula de ciudadanía"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              disabled={loading}
              autoComplete="username"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
              required
            />
          </div>

          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validando credenciales...
              </>
            ) : (
              'Ingresar al Sistema'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}