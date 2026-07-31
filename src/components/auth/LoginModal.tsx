import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';
import { useAuth } from '@/contexts/AuthContext'; // Descoméntalo si usas el contexto para actualizar el estado global
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
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailTrimmed = email.trim();
    
    // 1. Validaciones previas al envío (Ahorra pegarle a la API innecesariamente)
    if (!emailTrimmed || !password) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.login({ 
        email: emailTrimmed, 
        password 
      });

      // 2. Manejo de respuesta negativa del Backend
      if (!response || response.success === false) {
        setError(response?.message || 'Credenciales incorrectas.');
        setLoading(false);
        return;
      }

      // 3. Extraemos el objeto de usuario de forma segura
      // Se asume formato estándar: { success: true, data: { user: { rol: '...', ... }, token: '...' } }
      const sessionData = response.data || response;
      const user = sessionData.user;

      if (!user || !user.rol) {
        setError('El perfil de usuario no contiene un rol válido asignado.');
        setLoading(false);
        return;
      }

      // 4. Guardado y actualización del contexto de sesión (persiste en localStorage)
      loginStateUpdate(sessionData);

      // 5. Enrutamiento exacto por privilegios operativos de SACTel
      onOpenChange(false);
      
      const userRolNormalized = (user.rol || user.role || 'CAJERO').toUpperCase();
      const rutasPorRol: Record<string, string> = {
        'CAJERO': '/cajero/dashboard',
        'DESPACHADOR': '/despachador',
        'ADMIN_AGENCIA': '/agencia',
        'SUPERADMIN': '/superadmin/dashboard'
      };

      const rutaDestino = rutasPorRol[userRolNormalized] || '/';
      navigate(rutaDestino, { replace: true });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión con el Core de SACTel.');
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
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="usuario@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
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