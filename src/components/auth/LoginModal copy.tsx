import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/authService';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Mock de municipios disponibles
const municipios = [
  { id: 1, nombre: 'Bogotá' },
  { id: 2, nombre: 'Medellín' },
  { id: 3, nombre: 'Cali' },
  { id: 4, nombre: 'Barranquilla' },
];

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const navigate = useNavigate();
  // const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email || !password ) {
      setError('Todos los campos son obligatorios');
      setLoading(false);
      return;
    }

    try {
      // await login(email, password, parseInt(municipio));
      
      const userData = await authService.login({ 
        email, 
        password // Se envía al endpoint de validación
      });

      console.log(userData);

      // const { data, data:{user} } = userData

      if(!userData.success ){
        setError(userData.message)
        return 
      }

      localStorage.setItem('user', JSON.stringify(userData));

      // Tu lógica de redirección por roles que hicimos antes
      if (user.rol === 'CAJERO') navigate('/vender');
      if (user.rol === 'DESPACHADOR') navigate('/despacho');
      if (user.rol === 'ADMIN_AGENCIA') navigate('/agencia');
      if (user.rol === 'SUPERADMIN') navigate('/dashboard');

      onOpenChange(false);
      // navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
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

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <Alert variant="destructive">
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
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* <div className="space-y-2">
            <Label htmlFor="municipio">Municipio</Label>
            <Select value={municipio} onValueChange={setMunicipio} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el municipio" />
              </SelectTrigger>
              <SelectContent>
                {municipios.map((mun) => (
                  <SelectItem key={mun.id} value={mun.id.toString()}>
                    {mun.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              El municipio debe coincidir con el asignado a este dispositivo
            </p>
          </div> */}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validando...
              </>
            ) : (
              'Ingresar'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
