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
  Bus, User, MapPin, AlertTriangle,
  CreditCard, Banknote, Smartphone, QrCode, Mail, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { pasajerosService } from '@/services/pasajeroService';
import { toast } from '@/hooks/use-toast';
import GenerarTicket from './GenerarTicket';

// import { pasajerosService } from '@/services/pasajerosService'; // Ajustado a pasajerosService unificado

interface TicketFormProps {
  onSubmit: (planilla: PlanillaDespacho, dto: any) => Promise<unknown>;
  loading: boolean;
  authHeaders: {
    'x-user-id': string | number;
    'x-user-role': string;
  };
  idAgencia: number;
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

export function TicketForm({ onSubmit, loading, authHeaders, idAgencia }: TicketFormProps) {
  const [selectedPlanilla, setSelectedPlanilla] = useState<PlanillaDespacho | null>(null);
  const [form, setForm] = useState(INITIAL_FORM_STATE);
  const [buscandoPasajero, setBuscandoPasajero] = useState(false);
  const [errorSeguridad, setErrorSeguridad] = useState<string | null>(null);

  const asientoSelectRef = useRef<HTMLButtonElement>(null);

  const handleInputChange = (key: keyof typeof INITIAL_FORM_STATE, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const asientosOcupados = selectedPlanilla ? getAsientosOcupados(selectedPlanilla.id) : [];

  // 🧠 FUNCIÓN OPTIMIZADA Y CONECTADA AL CORE DE AUDITORÍA
  const consultarPasajero = async () => {
    const documento = form.documento.trim();
    if (documento.length < 4) return;

    setBuscandoPasajero(true);
    setErrorSeguridad(null);

    try {
      // Consumimos el servicio pasando las cabeceras unificadas del Dashboard y el ID de agencia operativo
      const pasajero = await pasajerosService.buscarPorDocumento(
        documento,
        authHeaders
      );

      if (pasajero.success) {
        setForm(prev => ({
          ...prev,
          nombres: pasajero.nombres,
          apellidos: pasajero.apellidos,
          telefono: pasajero.telefono || '',
          correo: pasajero.email || ''
        }));

        // Foco inmediato a la selección de asientos
          setTimeout(() => {
          if (asientoSelectRef.current) {
            asientoSelectRef.current.focus();
            asientoSelectRef.current.click();
          }
        }, 100);
      } else {
        toast({ title: 'Atención', description: 'El pasajero no existe en la plataforma.',variant: 'destructive', });
        setForm(prev => ({ ...prev, nombres: '', apellidos: '', correo: '', telefono: '' }));
      }
    } catch (err: any) {
      setErrorSeguridad(err.message || 'Error al validar el documento de identidad.');
      setForm(prev => ({ ...prev, nombres: '', apellidos: '', correo: '', telefono: '' }));
    } finally {
      setBuscandoPasajero(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanilla || !form.asiento) return;

    const dto = {
      planillaDespachoId: selectedPlanilla.id,
      pasajeroDocumento: form.documento.trim(),
      pasajeroNombres: form.nombres.trim(),
      pasajeroApellidos: form.apellidos.trim(),
      pasajeroTelefono: form.telefono || undefined,
      pasajeroEmail: form.correo || undefined,
      numeroAsiento: form.asiento,
      formaPago: form.formaPago,
    };

    try {
      await onSubmit(selectedPlanilla, dto);
      setForm(INITIAL_FORM_STATE);
    } catch (err) {
      console.error("Fallo al emitir el tiquete:", err);
    }
  };

  const canSellTicket = (planilla: PlanillaDespacho): { can: boolean; reason?: string } => {
    if (!planilla.bus.conductorAsignado) return { can: false, reason: 'Sin conductor asignado' };
    if (planilla.estado !== 'DESPACHADO' && planilla.estado !== 'EN_RUTA') return { can: false, reason: 'Bus no está en ruta' };
    if (planilla.asientosOcupados >= planilla.bus.capacidad) return { can: false, reason: 'Bus lleno' };
    return { can: true };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Selección de Planilla */}
      <Card className="lg:col-span-1 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bus className="w-5 h-5 text-primary" />
            Seleccionar Viaje
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
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
                  'w-full p-4 rounded-lg border-2 text-left transition-all duration-200',
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : status.can
                      ? 'border-border hover:border-primary/50 hover:bg-muted/50'
                      : 'border-border bg-muted/30 opacity-60 cursor-not-allowed'
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono text-sm font-semibold text-muted-foreground">{planilla.numeroPlanilla}</span>
                  <Badge variant={planilla.estado === 'DESPACHADO' ? 'default' : 'secondary'} className="font-semibold">
                    {planilla.estado}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-secondary" />
                    <span className="font-medium truncate">
                      {planilla.ruta.municipioOrigen?.nombre} → {planilla.ruta.municipioDestino?.nombre}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-dashed">
                    <span className="text-lg font-bold text-secondary">${planilla.ruta.valorTarifa.toLocaleString()}</span>
                    <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {planilla.asientosOcupados}/{planilla.bus.capacidad} Sillas
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Formulario de Pasajero */}
      <Card className="lg:col-span-2 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Datos de Facturación y Pasajero
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedPlanilla ? (
            <form onSubmit={handleSubmit} className="space-y-6">

              {errorSeguridad && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm flex items-center gap-2 animate-in fade-in duration-200">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <p className="font-medium">{errorSeguridad}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* 1. Identificación */}
                <div className="space-y-1.5">
                  <Label htmlFor="documento">Documento de Identidad *</Label>
                  <div className="relative">
                    <Input
                      id="documento"
                      placeholder="Número de cédula o pasaporte"
                      value={form.documento}
                      onChange={e => handleInputChange('documento', e.target.value)}
                      onBlur={consultarPasajero}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), consultarPasajero())}
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

                {/* 2. Correo Electrónico */}
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

                {/* 3. Apellidos */}
                <div className="space-y-1.5">
                  <Label htmlFor="apellidos">Apellidos *</Label>
                  <Input
                    id="apellidos"
                    placeholder="Apellidos completos"
                    value={form.apellidos}
                    onChange={e => handleInputChange('apellidos', e.target.value)}
                    required
                    disabled={loading || buscandoPasajero}
                  />
                </div>

                {/* 4. Nombres */}
                <div className="space-y-1.5">
                  <Label htmlFor="nombres">Nombres *</Label>
                  <Input
                    id="nombres"
                    placeholder="Nombres completos"
                    value={form.nombres}
                    onChange={e => handleInputChange('nombres', e.target.value)}
                    required
                    disabled={loading || buscandoPasajero}
                  />
                </div>

                {/* 5. Teléfono */}
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

                {/* 6. Silla (Número de Asiento al final de los inputs de texto) */}
                <div className="space-y-1.5">
                  <Label htmlFor="asiento">Número de Asiento *</Label>
                  <Select
                    value={form.asiento?.toString() || ''}
                    onValueChange={v => handleInputChange('asiento', v ? parseInt(v) : undefined)}
                    disabled={loading || buscandoPasajero}
                  >
                    <SelectTrigger ref={asientoSelectRef} className="w-full">
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

              </div>

              {/* Métodos de Pago */}
              <div className="space-y-3">
                <Label className="font-medium">Método de Pago Autorizado</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {formasPago.map(fp => (
                    <button
                      key={fp.value}
                      type="button"
                      disabled={loading || buscandoPasajero}
                      onClick={() => handleInputChange('formaPago', fp.value)}
                      className={cn(
                        'p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all duration-150',
                        form.formaPago === fp.value
                          ? 'border-secondary bg-secondary text-secondary-foreground font-semibold shadow-sm'
                          : 'border-border hover:border-secondary text-muted-foreground bg-card'
                      )}
                    >
                      {fp.icon}
                      <span className="text-xs">{fp.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-secondary hover:bg-secondary/90 text-white font-bold transition-all"
                disabled={loading || buscandoPasajero || !form.documento || !form.nombres || !form.apellidos || !form.asiento}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Emitiendo tiquete legal...
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
    </div >
  );
}