import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bus as BusIcon, AlertTriangle, CheckCircle2, MapPin, Users, Clock, CircleCheck } from 'lucide-react';
import { mockBuses, mockPlanillas, mockMunicipios } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Bus, EstadoBus, CreateDespachoDTO, PlanillaDespacho, Municipio } from '@/types';
import { DespachoModal } from './DespachoModal';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const estadoColors: Record<EstadoBus, string> = {
  DISPONIBLE: 'bg-muted text-muted-foreground',
  DESPACHADO: 'bg-success/10 text-success border-success/20',
  EN_RUTA: 'bg-primary/10 text-primary border-primary/20',
  ARRIBADO: 'bg-accent/80 text-accent-foreground border-accent',
  MANTENIMIENTO: 'bg-warning/10 text-warning border-warning/20',
  INACTIVO: 'bg-destructive/10 text-destructive border-destructive/20',
};

interface BusConDespacho extends Bus {
  planilla?: PlanillaDespacho;
  destinoMunicipio?: Municipio;
}

interface BusCardProps {
  bus: BusConDespacho;
  onDespachar?: (bus: Bus) => void;
  onMarcarLlegada?: (bus: Bus) => void;
  showDespacharButton?: boolean;
  showLlegadaButton?: boolean;
}

// 🚌 Subcomponente optimizado para evitar re-renders innecesarios
function BusCard({ 
  bus, 
  onDespachar, 
  onMarcarLlegada, 
  showDespacharButton = false, 
  showLlegadaButton = false 
}: BusCardProps) {
  
  const puedeDespacharse = showDespacharButton && (bus.estado === 'DISPONIBLE' || bus.estado === 'ARRIBADO');
  const puedeMarcarLlegada = showLlegadaButton && (bus.estado === 'DESPACHADO' || bus.estado === 'EN_RUTA');

  return (
    <div className="p-4 rounded-lg border bg-card hover:shadow-md transition-all duration-200">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold tracking-tight">{bus.placa}</h3>
          <p className="text-sm text-muted-foreground">
            {bus.marca} {bus.modelo}
          </p>
        </div>
        <Badge variant="outline" className={cn("font-semibold", estadoColors[bus.estado])}>
          {bus.estado}
        </Badge>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Capacidad</span>
          <span className="font-medium">{bus.capacidad} pasajeros</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Conductor</span>
          {bus.conductorAsignado ? (
            <div className="flex items-center gap-1 text-success">
              <CheckCircle2 className="w-3. h-3" />
              <span className="font-medium truncate max-w-[140px]">
                {bus.conductorAsignado.nombreCompleto.split(' ')[0]}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-warning">
              <AlertTriangle className="w-3 h-3" />
              <span className="font-medium">Sin asignar</span>
            </div>
          )}
        </div>

        {bus.conductoresAsociados && bus.conductoresAsociados.length > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Conductores</span>
            <div className="flex items-center gap-1 text-primary">
              <Users className="w-3 h-3" />
              <span className="font-medium">{bus.conductoresAsociados.length} asignados</span>
            </div>
          </div>
        )}

        {bus.planilla?.ruta?.municipioDestino && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Destino</span>
            <span className="font-medium text-primary">
              {bus.planilla.ruta.municipioDestino.nombre}
            </span>
          </div>
        )}

        {bus.destinoMunicipio && bus.estado === 'ARRIBADO' && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Procedencia</span>
            <span className="font-medium text-accent-foreground">
              {bus.destinoMunicipio.nombre}
            </span>
          </div>
        )}
      </div>

      {puedeDespacharse && onDespachar && (
        <Button
          size="sm"
          className="w-full mt-3 gap-2"
          onClick={() => onDespachar(bus)}
        >
          <MapPin className="w-4 h-4" />
          Despachar Vehículo
        </Button>
      )}

      {puedeMarcarLlegada && onMarcarLlegada && (
        <Button
          size="sm"
          variant="outline"
          className="w-full mt-3 gap-2 border-success text-success hover:bg-success/10 transition-colors"
          onClick={() => onMarcarLlegada(bus)}
        >
          <CircleCheck className="w-4 h-4" />
          Registrar Arribo
        </Button>
      )}
    </div>
  );
}

interface BusListProps {
  authHeaders?: { 'x-user-id': string | number; 'x-user-role': string };
  idAgencia?: number;
}

export function BusList(_props: BusListProps) {
  const { user } = useAuth();
  
  // 📍 Consistencia de datos geográficos basados en tu sesión centralizada
  const municipioActualId = user?.municipio?.id || user?.id_agencia || 1;
  const municipioNombre = user?.municipio?.nombre || 'Bogotá';

  const [buses, setBuses] = useState<Bus[]>(mockBuses);
  const [planillas] = useState<PlanillaDespacho[]>(mockPlanillas);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [showDespachoModal, setShowDespachoModal] = useState(false);

  // 1. Filtrado Eficiente: Buses en terminal listos para salir
  const busesDisponibles = buses.filter(bus => bus.estado === 'DISPONIBLE');

  // 2. Filtrado Eficiente: Buses en ruta hacia esta terminal específica
  const busesDespachados: BusConDespacho[] = buses
    .filter(bus => bus.estado === 'DESPACHADO' || bus.estado === 'EN_RUTA')
    .map(bus => ({
      ...bus,
      planilla: planillas.find(p => p.bus.id === bus.id),
    }))
    .filter(bus => bus.planilla?.ruta?.municipioDestinoId === municipioActualId);

  // 3. Filtrado Eficiente: Buses que ya completaron el viaje en esta terminal
  const busesArribados: BusConDespacho[] = buses
    .filter(bus => bus.estado === 'ARRIBADO')
    .map(bus => ({
      ...bus,
      destinoMunicipio: mockMunicipios.find(m => m.id === municipioActualId),
    }));

  const handleOpenDespacho = (bus: Bus) => {
    if (bus.estado !== 'DISPONIBLE' && bus.estado !== 'ARRIBADO') {
      toast.error('Operación inválida: El vehículo debe estar disponible o arribado.');
      return;
    }
    setSelectedBus(bus);
    setShowDespachoModal(true);
  };

  const handleDespachar = (despacho: CreateDespachoDTO) => {
    setBuses(prev => 
      prev.map(bus => 
        bus.id === despacho.busId 
          ? { ...bus, estado: 'DESPACHADO' as EstadoBus }
          : bus
      )
    );
    toast.success(`Planilla generada. Bus ${selectedBus?.placa} en tránsito.`);
    setShowDespachoModal(false);
  };

  const handleMarcarLlegada = (bus: Bus) => {
    setBuses(prev =>
      prev.map(b =>
        b.id === bus.id
          ? { ...b, estado: 'ARRIBADO' as EstadoBus, conductorAsignado: undefined }
          : b
      )
    );
    toast.success(`Arribo confirmado: El bus con placas ${bus.placa} ingresó a los patios.`);
  };

  return (
    <>
      <Card className="w-full shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <BusIcon className="w-5 h-5 text-primary" />
            Flota Operativa — Terminal {municipioNombre}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="disponibles" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-5">
              <TabsTrigger value="disponibles" className="gap-2 py-2.5">
                <Clock className="w-4 h-4" />
                Por Despachar ({busesDisponibles.length})
              </TabsTrigger>
              <TabsTrigger value="despachados" className="gap-2 py-2.5">
                <MapPin className="w-4 h-4" />
                En Camino ({busesDespachados.length})
              </TabsTrigger>
              <TabsTrigger value="arribados" className="gap-2 py-2.5">
                <CircleCheck className="w-4 h-4" />
                Arribados ({busesArribados.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="disponibles" className="focus-visible:outline-none">
              {busesDisponibles.length === 0 ? (
                <div className="text-center py-12 border rounded-lg border-dashed text-muted-foreground bg-muted/20">
                  No se registran unidades listas para despacho en este patio.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {busesDisponibles.map(bus => (
                    <BusCard 
                      key={bus.id} 
                      bus={bus} 
                      onDespachar={handleOpenDespacho}
                      showDespacharButton
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="despachados" className="focus-visible:outline-none">
              {busesDespachados.length === 0 ? (
                <div className="text-center py-12 border rounded-lg border-dashed text-muted-foreground bg-muted/20">
                  No hay transportes en tránsito con destino a {municipioNombre}.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {busesDespachados.map(bus => (
                    <BusCard 
                      key={bus.id} 
                      bus={bus} 
                      onMarcarLlegada={handleMarcarLlegada}
                      showLlegadaButton
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="arribados" className="focus-visible:outline-none">
              {busesArribados.length === 0 ? (
                <div className="text-center py-12 border rounded-lg border-dashed text-muted-foreground bg-muted/20">
                  No se encuentran unidades estacionadas en la zona de desembarque.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {busesArribados.map(bus => (
                    <BusCard 
                      key={bus.id} 
                      bus={bus} 
                      onDespachar={handleOpenDespacho}
                      showDespacharButton
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <DespachoModal
        open={showDespachoModal}
        onOpenChange={setShowDespachoModal}
        bus={selectedBus}
        onDespachar={handleDespachar}
      />
    </>
  );
}