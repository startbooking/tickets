import { useState } from 'react';
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
import { PlanillaDespacho, CreateTicketDTO, FormaPago } from '@/types';
import { mockPlanillas, getAsientosOcupados } from '@/data/mockData';
import { 
  Bus, 
  User, 
  MapPin, 
  Clock, 
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Banknote,
  Smartphone,
  QrCode
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface TicketFormProps {
  onSubmit: (planilla: PlanillaDespacho, dto: CreateTicketDTO) => Promise<unknown>;
  loading: boolean;
}

const formasPago: { value: FormaPago; label: string; icon: React.ReactNode }[] = [
  { value: 'EFECTIVO', label: 'Efectivo', icon: <Banknote className="w-4 h-4" /> },
  { value: 'TARJETA', label: 'Tarjeta', icon: <CreditCard className="w-4 h-4" /> },
  { value: 'TRANSFERENCIA', label: 'Transferencia', icon: <Smartphone className="w-4 h-4" /> },
  { value: 'QR', label: 'Código QR', icon: <QrCode className="w-4 h-4" /> },
];

export function TicketForm({ onSubmit, loading }: TicketFormProps) {
  const [selectedPlanilla, setSelectedPlanilla] = useState<PlanillaDespacho | null>(null);
  const [pasajeroDocumento, setPasajeroDocumento] = useState('');
  const [pasajeroNombre, setPasajeroNombre] = useState('');
  const [pasajeroTelefono, setPasajeroTelefono] = useState('');
  const [numeroAsiento, setNumeroAsiento] = useState<number | undefined>();
  const [formaPago, setFormaPago] = useState<FormaPago>('EFECTIVO');

  const planillasDisponibles = mockPlanillas.filter(
    p => p.estado === 'DESPACHADO' && p.bus.conductorAsignado
  );

  const asientosOcupados = selectedPlanilla 
    ? getAsientosOcupados(selectedPlanilla.id) 
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanilla) return;

    const dto: CreateTicketDTO = {
      planillaDespachoId: selectedPlanilla.id,
      pasajeroDocumento,
      pasajeroNombre,
      pasajeroTelefono: pasajeroTelefono || undefined,
      numeroAsiento,
      formaPago,
    };

    await onSubmit(selectedPlanilla, dto);
    
    // Reset form
    setPasajeroDocumento('');
    setPasajeroNombre('');
    setPasajeroTelefono('');
    setNumeroAsiento(undefined);
  };

  const canSellTicket = (planilla: PlanillaDespacho): { can: boolean; reason?: string } => {
    if (!planilla.bus.conductorAsignado) {
      return { can: false, reason: 'Sin conductor asignado' };
    }
    if (planilla.bus.estado !== 'DESPACHADO') {
      return { can: false, reason: 'Bus no despachado' };
    }
    if (planilla.asientosOcupados >= planilla.bus.capacidad) {
      return { can: false, reason: 'Bus lleno' };
    }
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
        <CardContent className="space-y-3 max-h-[60vh] overflow-y-auto">
          {mockPlanillas.map(planilla => {
            const status = canSellTicket(planilla);
            const isSelected = selectedPlanilla?.id === planilla.id;

            return (
              <button
                key={planilla.id}
                onClick={() => status.can && setSelectedPlanilla(planilla)}
                disabled={!status.can}
                className={cn(
                  'w-full p-4 rounded-lg border-2 text-left transition-all',
                  isSelected 
                    ? 'border-primary bg-primary/5' 
                    : status.can 
                      ? 'border-border hover:border-primary/50 hover:bg-muted/50' 
                      : 'border-border bg-muted/30 opacity-60 cursor-not-allowed'
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono text-sm text-muted-foreground">
                    {planilla.numeroPlanilla}
                  </span>
                  <Badge 
                    variant={planilla.estado === 'DESPACHADO' ? 'default' : 'secondary'}
                    className={cn(
                      planilla.estado === 'DESPACHADO' && 'bg-success text-success-foreground'
                    )}
                  >
                    {planilla.estado}
                  </Badge>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-secondary" />
                    <span className="font-medium">
                      {planilla.ruta.municipioOrigen?.nombre} → {planilla.ruta.municipioDestino?.nombre}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {planilla.horaProgramada}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bus className="w-3 h-3" />
                      {planilla.bus.placa}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t">
                    <span className="text-lg font-bold text-secondary">
                      ${planilla.ruta.valorTarifa.toLocaleString()}
                    </span>
                    <span className="text-sm">
                      {planilla.asientosOcupados}/{planilla.bus.capacidad} ocupados
                    </span>
                  </div>
                </div>

                {!status.can && (
                  <div className="mt-2 flex items-center gap-1 text-destructive text-xs">
                    <AlertTriangle className="w-3 h-3" />
                    {status.reason}
                  </div>
                )}
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
            Datos del Pasajero
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedPlanilla ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Info del viaje seleccionado */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <span className="font-medium">Viaje seleccionado</span>
                </div>
                <p className="text-lg font-bold">
                  {selectedPlanilla.ruta.municipioOrigen?.nombre} → {selectedPlanilla.ruta.municipioDestino?.nombre}
                </p>
                <p className="text-sm text-muted-foreground">
                  Bus {selectedPlanilla.bus.placa} • Conductor: {selectedPlanilla.conductor.nombreCompleto}
                </p>
                <p className="text-2xl font-bold text-secondary mt-2">
                  ${selectedPlanilla.ruta.valorTarifa.toLocaleString()}
                </p>
              </div>

              {/* Datos del pasajero */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="documento">Documento de Identidad *</Label>
                  <Input
                    id="documento"
                    placeholder="Número de documento"
                    value={pasajeroDocumento}
                    onChange={e => setPasajeroDocumento(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre Completo *</Label>
                  <Input
                    id="nombre"
                    placeholder="Nombre del pasajero"
                    value={pasajeroNombre}
                    onChange={e => setPasajeroNombre(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    placeholder="Número de teléfono"
                    value={pasajeroTelefono}
                    onChange={e => setPasajeroTelefono(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="asiento">Número de Asiento</Label>
                  <Select 
                    value={numeroAsiento?.toString() || ''} 
                    onValueChange={v => setNumeroAsiento(v ? parseInt(v) : undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar asiento" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: selectedPlanilla.bus.capacidad }, (_, i) => i + 1).map(num => {
                        const ocupado = asientosOcupados.includes(num);
                        return (
                          <SelectItem 
                            key={num} 
                            value={num.toString()}
                            disabled={ocupado}
                          >
                            Asiento {num} {ocupado && '(Ocupado)'}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Forma de pago */}
              <div className="space-y-3">
                <Label>Forma de Pago</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {formasPago.map(fp => (
                    <button
                      key={fp.value}
                      type="button"
                      onClick={() => setFormaPago(fp.value)}
                      className={cn(
                        'p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all',
                        formaPago === fp.value
                          ? 'border-secondary bg-secondary/10'
                          : 'border-border hover:border-secondary/50'
                      )}
                    >
                      {fp.icon}
                      <span className="text-sm font-medium">{fp.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Button 
                type="submit" 
                size="lg" 
                className="w-full bg-secondary hover:bg-secondary/90"
                disabled={loading || !pasajeroDocumento || !pasajeroNombre}
              >
                {loading ? 'Procesando...' : 'Generar Ticket'}
              </Button>
            </form>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Bus className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">Selecciona un viaje disponible para continuar</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
