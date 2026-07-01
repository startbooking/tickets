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

function BusCard({ bus, onDespachar, onMarcarLlegada, showDespacharButton = false, showLlegadaButton = false }: BusCardProps) {
  return (
    <div className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold">{bus.placa}</h3>
          <p className="text-sm text-muted-foreground">
            {bus.marca} {bus.modelo}
          </p>
        </div>
        <Badge 
          variant="outline" 
          className={cn(estadoColors[bus.estado])}
        >
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
              <CheckCircle2 className="w-3 h-3" />
              <span className="font-medium truncate max-w-[120px]">
                {bus.conductorAsignado.nombreCompleto.split(' ')[0]}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-warning">
              <AlertTriangle className="w-3 h-3" />
              <span>Sin asignar</span>
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

        {bus.planilla && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Destino</span>
            <span className="font-medium text-primary">
              {bus.planilla.ruta.municipioDestino?.nombre || 'Directo'}
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

      {showDespacharButton && bus.estado === 'DISPONIBLE' && onDespachar && (
        <Button
          size="sm"
          className="w-full mt-3 gap-2"
          onClick={() => onDespachar(bus)}
        >
          <MapPin className="w-4 h-4" />
          Despachar
        </Button>
      )}

      {showDespacharButton && bus.estado === 'ARRIBADO' && onDespachar && (
        <Button
          size="sm"
          className="w-full mt-3 gap-2"
          onClick={() => onDespachar(bus)}
        >
          <MapPin className="w-4 h-4" />
          Despachar
        </Button>
      )}

      {showLlegadaButton && (bus.estado === 'DESPACHADO' || bus.estado === 'EN_RUTA') && onMarcarLlegada && (
        <Button
          size="sm"
          variant="outline"
          className="w-full mt-3 gap-2 border-success text-success hover:bg-success/10"
          onClick={() => onMarcarLlegada(bus)}
        >
          <CircleCheck className="w-4 h-4" />
          Marcar Llegada
        </Button>
      )}
    </div>
  );
}

export function BusList() {
  const { user } = useAuth();
  const municipioActualId = user?.municipio.id || 1; // Default a Bogotá si no hay usuario

  const [buses, setBuses] = useState<Bus[]>(mockBuses);
  const [planillas] = useState<PlanillaDespacho[]>(mockPlanillas);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [showDespachoModal, setShowDespachoModal] = useState(false);

  // Buses disponibles en el municipio actual (para despachar)
  const busesDisponibles = buses.filter(bus => bus.estado === 'DISPONIBLE');

  // Buses despachados HACIA el municipio actual (que vienen en camino)
  const busesDespachados: BusConDespacho[] = buses
    .filter(bus => bus.estado === 'DESPACHADO' || bus.estado === 'EN_RUTA')
    .map(bus => {
      const planilla = planillas.find(p => p.bus.id === bus.id);
      return {
        ...bus,
        planilla,
      };
    })
    .filter(bus => {
      // Mostrar solo buses cuyo destino es el municipio actual
      if (!bus.planilla) return false;
      return bus.planilla.ruta.municipioDestinoId === municipioActualId;
    });

  // Buses arribados al municipio (listos para nuevo despacho)
  const busesArribados: BusConDespacho[] = buses
    .filter(bus => bus.estado === 'ARRIBADO')
    .map(bus => {
      // El bus arribado guarda referencia al municipio de origen (de donde vino)
      return {
        ...bus,
        destinoMunicipio: mockMunicipios.find(m => m.id === municipioActualId),
      };
    });

  const handleOpenDespacho = (bus: Bus) => {
    if (bus.estado !== 'DISPONIBLE' && bus.estado !== 'ARRIBADO') {
      toast.error('Solo se pueden despachar buses disponibles o arribados');
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
    toast.success('Bus despachado exitosamente');
  };

  const handleMarcarLlegada = (bus: Bus) => {
    setBuses(prev =>
      prev.map(b =>
        b.id === bus.id
          ? { ...b, estado: 'ARRIBADO' as EstadoBus, conductorAsignado: undefined }
          : b
      )
    );
    toast.success(`Bus ${bus.placa} ha llegado a destino`);
  };

  const municipioNombre = user?.municipio.nombre || 'Bogotá';

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BusIcon className="w-5 h-5 text-primary" />
            Flota de Buses - {municipioNombre}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="disponibles" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="disponibles" className="gap-2">
                <Clock className="w-4 h-4" />
                Por Despachar ({busesDisponibles.length})
              </TabsTrigger>
              <TabsTrigger value="despachados" className="gap-2">
                <MapPin className="w-4 h-4" />
                En Camino ({busesDespachados.length})
              </TabsTrigger>
              <TabsTrigger value="arribados" className="gap-2">
                <CircleCheck className="w-4 h-4" />
                Arribados ({busesArribados.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="disponibles">
              {busesDisponibles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay buses disponibles para despachar
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

            <TabsContent value="despachados">
              {busesDespachados.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay buses en camino hacia {municipioNombre}
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

            <TabsContent value="arribados">
              {busesArribados.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay buses arribados listos para despachar
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
