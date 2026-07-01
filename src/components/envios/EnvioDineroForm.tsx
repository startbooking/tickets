import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreateEnvioDineroDTO, Municipio, Bus } from '@/types';
import { mockMunicipios, mockBuses, mockRutas, mockPlanillas } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  User, 
  MapPin, 
  DollarSign, 
  Bus as BusIcon,
  Phone,
  FileText,
  Clock
} from 'lucide-react';

const envioDineroSchema = z.object({
  remitenteDocumento: z.string().min(5, 'Documento requerido').max(20),
  remitenteTipoDocumento: z.enum(['CC', 'CE', 'TI', 'PA']),
  remitenteNombre: z.string().min(3, 'Nombre requerido').max(100),
  remitenteTelefono: z.string().optional(),
  destinatarioDocumento: z.string().min(5, 'Documento requerido').max(20),
  destinatarioNombre: z.string().min(3, 'Nombre requerido').max(100),
  destinatarioTelefono: z.string().optional(),
  monto: z.number().min(1000, 'Monto mínimo: $1,000'),
  busId: z.number().min(1, 'Seleccione un bus'),
  municipioDestinoId: z.number().min(1, 'Seleccione destino'),
  observaciones: z.string().optional(),
});

interface EnvioDineroFormProps {
  onSubmit: (dto: CreateEnvioDineroDTO, municipioOrigen: Municipio) => Promise<any>;
  loading: boolean;
  municipioOrigen: Municipio;
}

const COMISION_PORCENTAJE = 0.05;

export function EnvioDineroForm({ onSubmit, loading, municipioOrigen }: EnvioDineroFormProps) {
  const [monto, setMonto] = useState<number>(0);
  const [selectedDestinoId, setSelectedDestinoId] = useState<number>(0);

  // Filter destinations (exclude origin)
  const municipiosDestino = useMemo(() => {
    return mockMunicipios.filter(m => m.id !== municipioOrigen.id && m.activo);
  }, [municipioOrigen]);

  // Get buses available for the selected destination route
  const busesDisponibles = useMemo(() => {
    if (!selectedDestinoId) return [];

    // Find planillas going to the selected destination
    const planillasDestino = mockPlanillas.filter(p => {
      // Check if route matches origin -> destination
      return (
        (p.estado === 'DESPACHADO' || p.estado === 'PROGRAMADO') &&
        p.ruta.municipioOrigenId === municipioOrigen.id &&
        p.ruta.municipioDestinoId === selectedDestinoId
      );
    });

    // Get buses from those planillas
    const busesFromPlanillas = planillasDestino.map(p => ({
      bus: p.bus,
      hora: p.horaProgramada,
      conductor: p.conductor,
      planilla: p
    }));

    // Also check buses with DESPACHADO status going to that destination
    const busesDespachados = mockBuses.filter(b => 
      b.estado === 'DESPACHADO' && 
      b.conductorAsignado
    );

    // Combine and deduplicate
    const allBuses: { bus: Bus; hora: string; conductorNombre: string }[] = [];
    
    busesFromPlanillas.forEach(item => {
      if (!allBuses.find(b => b.bus.id === item.bus.id)) {
        allBuses.push({
          bus: item.bus,
          hora: item.hora,
          conductorNombre: item.conductor.nombreCompleto
        });
      }
    });

    // Add buses without specific planilla (Directo route)
    busesDespachados.forEach(bus => {
      if (!allBuses.find(b => b.bus.id === bus.id)) {
        allBuses.push({
          bus,
          hora: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
          conductorNombre: bus.conductorAsignado?.nombreCompleto || 'Sin asignar'
        });
      }
    });

    return allBuses;
  }, [selectedDestinoId, municipioOrigen]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateEnvioDineroDTO>({
    resolver: zodResolver(envioDineroSchema),
    defaultValues: {
      remitenteTipoDocumento: 'CC',
      monto: 0,
      busId: 0,
      municipioDestinoId: 0,
    },
  });

  const watchMonto = watch('monto');
  const watchBusId = watch('busId');
  const comision = Math.round((watchMonto || 0) * COMISION_PORCENTAJE);
  const montoTotal = (watchMonto || 0) + comision;

  // Get selected bus info
  const selectedBusInfo = useMemo(() => {
    return busesDisponibles.find(b => b.bus.id === watchBusId);
  }, [busesDisponibles, watchBusId]);

  const handleFormSubmit = async (data: CreateEnvioDineroDTO) => {
    const result = await onSubmit(data, municipioOrigen);
    if (result) {
      reset();
      setMonto(0);
      setSelectedDestinoId(0);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Reset bus when destination changes
  useEffect(() => {
    setValue('busId', 0);
  }, [selectedDestinoId, setValue]);

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Remitente Card */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5 text-primary" />
              Datos del Remitente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <Label>Tipo Doc.</Label>
                <Select
                  defaultValue="CC"
                  onValueChange={(value) => setValue('remitenteTipoDocumento', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CC">CC</SelectItem>
                    <SelectItem value="CE">CE</SelectItem>
                    <SelectItem value="TI">TI</SelectItem>
                    <SelectItem value="PA">PA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Número Documento</Label>
                <Input
                  {...register('remitenteDocumento')}
                  placeholder="Ej: 1234567890"
                />
                {errors.remitenteDocumento && (
                  <p className="text-xs text-destructive mt-1">{errors.remitenteDocumento.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label>Nombre Completo</Label>
              <Input
                {...register('remitenteNombre')}
                placeholder="Nombre del remitente"
              />
              {errors.remitenteNombre && (
                <p className="text-xs text-destructive mt-1">{errors.remitenteNombre.message}</p>
              )}
            </div>

            <div>
              <Label className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                Teléfono (opcional)
              </Label>
              <Input
                {...register('remitenteTelefono')}
                placeholder="Ej: 3001234567"
              />
            </div>
          </CardContent>
        </Card>

        {/* Destinatario Card */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="w-5 h-5 text-secondary" />
              Datos del Destinatario
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Número Documento</Label>
              <Input
                {...register('destinatarioDocumento')}
                placeholder="Ej: 1234567890"
              />
              {errors.destinatarioDocumento && (
                <p className="text-xs text-destructive mt-1">{errors.destinatarioDocumento.message}</p>
              )}
            </div>

            <div>
              <Label>Nombre Completo</Label>
              <Input
                {...register('destinatarioNombre')}
                placeholder="Nombre del destinatario"
              />
              {errors.destinatarioNombre && (
                <p className="text-xs text-destructive mt-1">{errors.destinatarioNombre.message}</p>
              )}
            </div>

            <div>
              <Label className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                Teléfono (opcional)
              </Label>
              <Input
                {...register('destinatarioTelefono')}
                placeholder="Ej: 3001234567"
              />
            </div>

            <div>
              <Label>Ciudad Destino</Label>
              <Select
                onValueChange={(value) => {
                  const id = parseInt(value);
                  setSelectedDestinoId(id);
                  setValue('municipioDestinoId', id);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione destino" />
                </SelectTrigger>
                <SelectContent>
                  {municipiosDestino.map((m) => (
                    <SelectItem key={m.id} value={m.id.toString()}>
                      {m.nombre}, {m.departamento}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.municipioDestinoId && (
                <p className="text-xs text-destructive mt-1">{errors.municipioDestinoId.message}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monto y Bus */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="w-5 h-5 text-secondary" />
              Información del Envío
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Monto a Enviar</Label>
                <Input
                  type="number"
                  {...register('monto', { valueAsNumber: true })}
                  placeholder="0"
                  min={1000}
                  step={1000}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setMonto(value);
                    setValue('monto', value);
                  }}
                />
                {errors.monto && (
                  <p className="text-xs text-destructive mt-1">{errors.monto.message}</p>
                )}
              </div>

              <div>
                <Label className="flex items-center gap-1">
                  <BusIcon className="w-3 h-3" />
                  Bus (según ruta)
                </Label>
                <Select
                  onValueChange={(value) => setValue('busId', parseInt(value))}
                  disabled={!selectedDestinoId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedDestinoId ? "Seleccione bus" : "Primero seleccione destino"} />
                  </SelectTrigger>
                  <SelectContent>
                    {busesDisponibles.length === 0 ? (
                      <SelectItem value="0" disabled>
                        No hay buses disponibles para esta ruta
                      </SelectItem>
                    ) : (
                      busesDisponibles.map((item) => (
                        <SelectItem key={item.bus.id} value={item.bus.id.toString()}>
                          {item.bus.placa} - {item.hora} - {item.conductorNombre}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.busId && (
                  <p className="text-xs text-destructive mt-1">{errors.busId.message}</p>
                )}
              </div>
            </div>

            {/* Selected bus info */}
            {selectedBusInfo && (
              <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <BusIcon className="w-4 h-4 text-primary" />
                  <span className="font-medium">Placa: {selectedBusInfo.bus.placa}</span>
                  <span className="text-muted-foreground">({selectedBusInfo.bus.marca} {selectedBusInfo.bus.modelo})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>Hora despacho: {selectedBusInfo.hora}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span>Conduce: {selectedBusInfo.conductorNombre}</span>
                </div>
              </div>
            )}

            <div>
              <Label className="flex items-center gap-1">
                <FileText className="w-3 h-3" />
                Observaciones (opcional)
              </Label>
              <Textarea
                {...register('observaciones')}
                placeholder="Notas adicionales sobre el envío..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Resumen */}
        <Card className="bg-muted/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Resumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Monto:</span>
              <span className="font-medium">{formatCurrency(watchMonto || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Comisión (5%):</span>
              <span className="font-medium">{formatCurrency(comision)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total a Pagar:</span>
              <span className="text-primary">{formatCurrency(montoTotal)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Origen: {municipioOrigen.nombre}
            </p>
            {selectedBusInfo && (
              <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                <p>Placa: <span className="font-medium text-foreground">{selectedBusInfo.bus.placa}</span></p>
                <p>Hora: <span className="font-medium text-foreground">{selectedBusInfo.hora}</span></p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={loading || busesDisponibles.length === 0 || !watchBusId}
          className="gap-2 min-w-[200px]"
          size="lg"
        >
          <Send className="w-4 h-4" />
          {loading ? 'Registrando...' : 'Registrar Envío'}
        </Button>
      </div>
    </form>
  );
}
