import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { PlanillaDespacho, FormaPago } from '@/types';
import { mockPlanillas, getAsientosOcupados } from '@/data/mockData';
import { 
  Bus, User, MapPin, Clock, AlertTriangle, CheckCircle2,
  CreditCard, Banknote, Smartphone, QrCode, Mail, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { pasajerosService } from '@/services/pasajeroService';

interface TicketFormProps {
  onSubmit: (planilla: PlanillaDespacho, dto: any) => Promise<unknown>;
  loading: boolean;
}

const formasPago: { value: FormaPago; label: string; icon: React.ReactNode }[] = [
  { value: 'EFECTIVO', label: 'Efectivo', icon: <Banknote className="w-4 h-4" /> },
  { value: 'TARJETA', label: 'Tarjeta', icon: <CreditCard className="w-4 h-4" /> },
  { value: 'TRANSFERENCIA', label: 'Transferencia', icon: <Smartphone className="w-4 h-4" /> },
  { value: 'QR', label: 'Código QR', icon: <QrCode className="w-4 h-4" /> },
];

const INITIAL_FORM_STATE = {
  documento: '',
  nombres: '',
  apellidos: '',
  telefono: '',
  correo: '',
  asiento: undefined as number | undefined,
  formaPago: 'EFECTIVO' as FormaPago
};

export function TicketForm({ onSubmit, loading }: TicketFormProps) {
  const [selectedPlanilla, setSelectedPlanilla] = useState<PlanillaDespacho | null>(null);
  const [form, setForm] = useState(INITIAL_FORM_STATE);
  const [buscandoPasajero, setBuscandoPasajero] = useState(false);
  const [errorSeguridad, setErrorSeguridad] = useState<string | null>(null);
  
  // Referencia para saltar directamente al foco del selector de asientos
  const asientoSelectRef = useRef<HTMLButtonElement>(null);

  const handleInputChange = (key: keyof typeof INITIAL_FORM_STATE, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const asientosOcupados = selectedPlanilla ? getAsientosOcupados(selectedPlanilla.id) : [];

  // Función encargada de consultar el API al digitar la cédula
  const consultarPasajero = async () => {
    const documento = form.documento.trim();
    if (documento.length < 4) return;

    // SIMULACIÓN: Recuperar datos del usuario en sesión actual del sistema
    // En producción, reemplaza esto por tu hook de autenticación, ej: const { user } = useAuth();
    // const localSt = JSON.parse(localStorage.getItem('user')) || []
    // // console.log(localSt)
    // const usuarioEnSesion = {
    //   token: localSt.data.token || '',
    //   id_agencia: localSt.data.user.id_agencia, // Ejemplo: Agencia Terminal Salitre Bogotá
    //   rol: localSt.data.user.rol || null  // Rol que ejecuta la acción
    // };

    // setBuscandoPasajero(true);
    // setErrorSeguridad(null);

    try {
      // Invocamos el servicio pasando las 3 llaves de seguridad solicitadas
      const pasajero = await pasajerosService.buscarPorDocumento(
        documento,
        usuarioEnSesion.token,
        usuarioEnSesion.id_agencia,
        usuarioEnSesion.rol
      );

      console.log(pasajero)
      
      if (pasajero) {
        setForm(prev => ({
          ...prev,
          nombres: pasajero.nombres,
          apellidos: pasajero.apellidos,
          telefono: pasajero.telefono || '',
          correo: pasajero.email || ''
        }));

        // Foco inmediato al mapa de asientos
        setTimeout(() => {
          if (asientoSelectRef.current) {
            asientoSelectRef.current.focus();
            asientoSelectRef.current.click();
          }
        }, 100);
      }
    } catch (err: any) {
      // Capturamos si falló la validación del token, rol o agencia en el backend
      setErrorSeguridad(err.message);
      
      // Limpiamos los campos en caso de que hubiese datos anteriores por seguridad
      setForm(prev => ({ ...prev, nombres: '', apellidos: '', correo: '', telefono: '' }));
    } finally {
      setBuscandoPasajero(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanilla) return;

    const dto = {
      planillaDespachoId: selectedPlanilla.id,
      pasajeroDocumento: form.documento,
      pasajeroNombres: form.nombres,
      pasajeroApellidos: form.apellidos,
      pasajeroTelefono: form.telefono || undefined,
      pasajeroEmail: form.correo || undefined,
      numeroAsiento: form.asiento,
      formaPago: form.formaPago,
    };

    await onSubmit(selectedPlanilla, dto);
    setForm(INITIAL_FORM_STATE);
  };

  const canSellTicket = (planilla: PlanillaDespacho): { can: boolean; reason?: string } => {
    if (!planilla.bus.conductorAsignado) return { can: false, reason: 'Sin conductor asignado' };
    if (planilla.estado !== 'DESPACHADO') return { can: false, reason: 'Bus no despachado' };
    if (planilla.asientosOcupados >= planilla.bus.capacidad) return { can: false, reason: 'Bus lleno' };
    return { can: true };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Selección de Planilla */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bus className="w-5 h-5 text-primary" />
            Seleccionar Viaje
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[65vh] overflow-y-auto pr-2">
          {mockPlanillas.map(planilla => {
            const status = canSellTicket(planilla);
            const isSelected = selectedPlanilla?.id === planilla.id;

            return (
              <button
                key={planilla.id}
                type="button"
                onClick={() => status.can && setSelectedPlanilla(planilla)}
                disabled={!status.can}
                className={cn(
                  'w-full p-4 rounded-lg border-2 text-left transition-all',
                  isSelected ? 'border-primary bg-primary/5' : status.can ? 'border-border hover:border-primary/50 hover:bg-muted/50' : 'border-border bg-muted/30 opacity-60 cursor-not-allowed'
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono text-sm text-muted-foreground">{planilla.numeroPlanilla}</span>
                  <Badge variant={planilla.estado === 'DESPACHADO' ? 'default' : 'secondary'}>
                    {planilla.estado}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-secondary" />
                    <span className="font-medium">{planilla.ruta.municipioOrigen?.nombre} → {planilla.ruta.municipioDestino?.nombre}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t">
                    <span className="text-lg font-bold text-secondary">${planilla.ruta.valorTarifa.toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground">{planilla.asientosOcupados}/{planilla.bus.capacidad} s.</span>
                  </div>
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Formulario de Pasajero */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Datos de Facturación y Pasajero
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedPlanilla ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Input Cédula con Gatillo de Consulta */}
                <div className="space-y-1.5">
                  <Label htmlFor="documento">Documento de Identidad *</Label>
                  <div className="relative">
                    <Input
                      id="documento"
                      placeholder="Número de cédula o pasaporte"
                      value={form.documento}
                      onChange={e => handleInputChange('documento', e.target.value)}
                      onBlur={consultarPasajero} // Consulta al salir de la casilla
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), consultarPasajero())} // Consulta al presionar Enter
                      required
                      disabled={loading || buscandoPasajero}
                    />
                    {buscandoPasajero && (
                      <span className="absolute right-3 top-2.5">
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Selector de Asiento con Referencia enfocable */}
                <div className="space-y-1.5">
                  <Label htmlFor="asiento">Número de Asiento</Label>
                  <Select 
                    value={form.asiento?.toString() || ''} 
                    onValueChange={v => handleInputChange('asiento', v ? parseInt(v) : undefined)}
                    disabled={loading || buscandoPasajero}
                  >
                    <SelectTrigger ref={asientoSelectRef}>
                      <SelectValue placeholder="Seleccionar silla disponible" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: selectedPlanilla.bus.capacidad }, (_, i) => i + 1).map(num => {
                        const ocupado = asientosOcupados.includes(num);
                        return (
                          <SelectItem key={num} value={num.toString()} disabled={ocupado}>
                            Silla {num} {ocupado && '(Ocupada)'}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="nombres">Nombres *</Label>
                  <Input
                    id="nombres"
                    placeholder="Nombres del usuario"
                    value={form.nombres}
                    onChange={e => handleInputChange('nombres', e.target.value)}
                    required
                    disabled={loading || buscandoPasajero}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="apellidos">Apellidos *</Label>
                  <Input
                    id="apellidos"
                    placeholder="Apellidos del usuario"
                    value={form.apellidos}
                    onChange={e => handleInputChange('apellidos', e.target.value)}
                    required
                    disabled={loading || buscandoPasajero}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="telefono">Teléfono de Contacto</Label>
                  <Input
                    id="telefono"
                    placeholder="Ej. 3157778899"
                    value={form.telefono}
                    onChange={e => handleInputChange('telefono', e.target.value)}
                    disabled={loading || buscandoPasajero}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="correo" className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-muted-foreground" />
                    Correo Electrónico
                  </Label>
                  <Input
                    id="correo"
                    type="email"
                    placeholder="usuario@servidor.com"
                    value={form.correo}
                    onChange={e => handleInputChange('correo', e.target.value)}
                    disabled={loading || buscandoPasajero}
                  />
                </div>
              </div>

              {/* Métodos de Pago */}
              <div className="space-y-3">
                <Label>Método de Pago Autorizado</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {formasPago.map(fp => (
                    <button
                      key={fp.value}
                      type="button"
                      disabled={loading || buscandoPasajero}
                      onClick={() => handleInputChange('formaPago', fp.value)}
                      className={cn(
                        'p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all',
                        form.formaPago === fp.value ? 'border-secondary bg-secondary/10 text-secondary-foreground' : 'border-border hover:border-secondary/50 text-muted-foreground'
                      )}
                    >
                      {fp.icon}
                      <span className="text-xs font-semibold">{fp.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Button 
                type="submit" 
                size="lg" 
                className="w-full bg-secondary hover:bg-secondary/90 text-white font-bold"
                disabled={loading || buscandoPasajero || !form.documento || !form.nombres || !form.apellidos || !form.asiento}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Emitiendo tiquete legal ante la DIAN...
                  </>
                ) : (
                  'Generar Ticket e Imprimir'
                )}
              </Button>
            </form>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <Bus className="w-16 h-16 mx-auto mb-4 opacity-25 animate-pulse" />
              <p className="text-base font-medium">Por favor, selecciona una ruta activa del panel izquierdo</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}