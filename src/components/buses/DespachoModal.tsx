import { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Bus, Ruta, Conductor, CreateDespachoDTO } from '@/types';
import { mockMunicipios, mockRutas, mockConductores } from '@/data/mockData';
import { AlertTriangle, MapPin, User, FileText, Clock, Users } from 'lucide-react';
import { toast } from 'sonner';

interface DespachoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bus: Bus | null;
  onDespachar: (despacho: CreateDespachoDTO) => void;
}

const DISTANCIA_SEGUNDO_CONDUCTOR = 500; // km

export function DespachoModal({ open, onOpenChange, bus, onDespachar }: DespachoModalProps) {
  const [origenId, setOrigenId] = useState<string>('');
  const [destinoId, setDestinoId] = useState<string>('');
  const [rutaId, setRutaId] = useState<string>('');
  const [conductorPrincipalId, setConductorPrincipalId] = useState<string>('');
  const [conductorAuxiliarId, setConductorAuxiliarId] = useState<string>('');
  const [asistenteViaje, setAsistenteViaje] = useState('');
  const [documentoConductor, setDocumentoConductor] = useState('');
  const [horaProgramada, setHoraProgramada] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  // Conductores asociados al bus
  const conductoresAsociados = useMemo(() => {
    if (!bus) return [];
    return bus.conductoresAsociados || [];
  }, [bus]);

  // Filtrar rutas según origen y destino seleccionados
  const rutasFiltradas = useMemo(() => {
    if (!origenId || !destinoId) return [];
    return mockRutas.filter(
      r => r.municipioOrigenId === parseInt(origenId) && 
           r.municipioDestinoId === parseInt(destinoId) && 
           r.activo
    );
  }, [origenId, destinoId]);

  // Verificar si es ruta directa (sin rutas definidas)
  const esRutaDirecta = useMemo(() => {
    return origenId && destinoId && rutasFiltradas.length === 0;
  }, [origenId, destinoId, rutasFiltradas]);

  // Calcular distancia estimada entre municipios para ruta directa
  const distanciaDirecta = useMemo(() => {
    if (!esRutaDirecta) return 0;
    const origen = mockMunicipios.find(m => m.id === parseInt(origenId));
    const destino = mockMunicipios.find(m => m.id === parseInt(destinoId));
    // Distancia estimada basada en diferencia de coordenadas (simplificado)
    // En producción se usaría API de geolocalización
    if (origen && destino) {
      // Estimación simple: diferencia absoluta de IDs * 100 (para demo)
      return Math.abs(origen.id - destino.id) * 150;
    }
    return 0;
  }, [esRutaDirecta, origenId, destinoId]);

  // Ruta seleccionada
  const rutaSeleccionada = useMemo(() => {
    if (!rutaId) return null;
    return mockRutas.find(r => r.id === parseInt(rutaId)) || null;
  }, [rutaId]);

  // Verificar si requiere segundo conductor (ruta definida o directa > 500km)
  const requiereSegundoConductor = useMemo(() => {
    if (esRutaDirecta) {
      return distanciaDirecta > DISTANCIA_SEGUNDO_CONDUCTOR;
    }
    if (!rutaSeleccionada) return false;
    return (rutaSeleccionada.distanciaKm || 0) > DISTANCIA_SEGUNDO_CONDUCTOR;
  }, [rutaSeleccionada, esRutaDirecta, distanciaDirecta]);

  // Conductor principal seleccionado
  const conductorPrincipal = useMemo(() => {
    if (!conductorPrincipalId) return null;
    return conductoresAsociados.find(c => c.id === parseInt(conductorPrincipalId)) || null;
  }, [conductorPrincipalId, conductoresAsociados]);

  // Conductores disponibles para auxiliar (excluye al principal)
  const conductoresParaAuxiliar = useMemo(() => {
    return conductoresAsociados.filter(c => c.id !== parseInt(conductorPrincipalId) && c.activo);
  }, [conductoresAsociados, conductorPrincipalId]);

  // Reset form cuando cambia el bus
  useEffect(() => {
    if (open && bus) {
      setOrigenId('');
      setDestinoId('');
      setRutaId('');
      setConductorPrincipalId('');
      setConductorAuxiliarId('');
      setAsistenteViaje('');
      setDocumentoConductor('');
      setHoraProgramada('');
      setErrors([]);
    }
  }, [open, bus]);

  // Auto-seleccionar ruta si solo hay una
  useEffect(() => {
    if (rutasFiltradas.length === 1) {
      setRutaId(rutasFiltradas[0].id.toString());
    } else {
      setRutaId('');
    }
  }, [rutasFiltradas]);

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    if (!origenId) newErrors.push('Debe seleccionar el municipio de origen');
    if (!destinoId) newErrors.push('Debe seleccionar el municipio de destino');
    if (!esRutaDirecta && !rutaId) newErrors.push('Debe seleccionar una ruta');
    if (!conductorPrincipalId) newErrors.push('Debe seleccionar un conductor principal');
    if (!documentoConductor) newErrors.push('Debe ingresar el documento (Conduce)');
    if (!horaProgramada) newErrors.push('Debe ingresar la hora programada');

    // Validar que el conductor esté asignado al bus
    if (conductorPrincipalId && !conductoresAsociados.find(c => c.id === parseInt(conductorPrincipalId))) {
      newErrors.push('El conductor seleccionado no está asignado a este bus');
    }

    // Validar documento del conductor
    if (conductorPrincipal && documentoConductor !== conductorPrincipal.numeroDocumento) {
      newErrors.push('El documento no coincide con el conductor seleccionado');
    }

    // Validar segundo conductor si la ruta supera 500km
    if (requiereSegundoConductor && !conductorAuxiliarId) {
      newErrors.push(`La ruta supera los ${DISTANCIA_SEGUNDO_CONDUCTOR} km, se requiere un segundo conductor`);
    }

    // Validar que el conductor auxiliar esté asignado al bus
    if (conductorAuxiliarId && !conductoresAsociados.find(c => c.id === parseInt(conductorAuxiliarId))) {
      newErrors.push('El conductor auxiliar no está asignado a este bus');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm() || !bus) return;

    const origenNombre = mockMunicipios.find(m => m.id === parseInt(origenId))?.nombre;
    const destinoNombre = mockMunicipios.find(m => m.id === parseInt(destinoId))?.nombre;

    const despacho: CreateDespachoDTO = {
      busId: bus.id,
      rutaId: esRutaDirecta ? undefined : parseInt(rutaId),
      conductorPrincipalId: parseInt(conductorPrincipalId),
      conductorAuxiliarId: conductorAuxiliarId ? parseInt(conductorAuxiliarId) : undefined,
      asistenteViaje: asistenteViaje || undefined,
      documentoConductor,
      horaProgramada,
    };

    onDespachar(despacho);
    toast.success('Bus despachado exitosamente', {
      description: esRutaDirecta 
        ? `Ruta Directa: ${origenNombre} → ${destinoNombre}`
        : `Ruta: ${rutaSeleccionada?.municipioOrigen?.nombre} → ${rutaSeleccionada?.municipioDestino?.nombre}`,
    });
    onOpenChange(false);
  };

  if (!bus) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Despachar Bus - {bus.placa}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Info del bus */}
          <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold">{bus.placa}</span>
                <span className="text-muted-foreground ml-2">
                  {bus.marca} {bus.modelo}
                </span>
              </div>
              <Badge variant="outline">{bus.capacidad} pasajeros</Badge>
            </div>
            {conductoresAsociados.length > 0 && (
              <div className="mt-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4 inline mr-1" />
                {conductoresAsociados.length} conductor(es) asignado(s)
              </div>
            )}
          </div>

          {/* Errores */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Origen y Destino */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="origen">Municipio Origen *</Label>
              <Select value={origenId} onValueChange={setOrigenId}>
                <SelectTrigger id="origen">
                  <SelectValue placeholder="Seleccionar origen" />
                </SelectTrigger>
                <SelectContent>
                  {mockMunicipios.filter(m => m.activo).map(municipio => (
                    <SelectItem key={municipio.id} value={municipio.id.toString()}>
                      {municipio.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="destino">Municipio Destino *</Label>
              <Select value={destinoId} onValueChange={setDestinoId} disabled={!origenId}>
                <SelectTrigger id="destino">
                  <SelectValue placeholder="Seleccionar destino" />
                </SelectTrigger>
                <SelectContent>
                  {mockMunicipios
                    .filter(m => m.activo && m.id !== parseInt(origenId))
                    .map(municipio => (
                      <SelectItem key={municipio.id} value={municipio.id.toString()}>
                        {municipio.nombre}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Selección de Ruta */}
          <div className="space-y-2">
            <Label htmlFor="ruta">Ruta {!esRutaDirecta ? '*' : ''}</Label>
            {origenId && destinoId ? (
              rutasFiltradas.length > 0 ? (
                <Select value={rutaId} onValueChange={setRutaId}>
                  <SelectTrigger id="ruta">
                    <SelectValue placeholder="Seleccionar ruta" />
                  </SelectTrigger>
                  <SelectContent>
                    {rutasFiltradas.map(ruta => (
                      <SelectItem key={ruta.id} value={ruta.id.toString()}>
                        {ruta.municipioOrigen?.nombre} → {ruta.municipioDestino?.nombre} 
                        ({ruta.distanciaKm} km - ${ruta.valorTarifa.toLocaleString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-3 border rounded-md bg-primary/5 border-primary/20">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      Directo
                    </Badge>
                    <span className="text-sm font-medium">Sin ruta predefinida</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Distancia estimada: {distanciaDirecta} km
                  </p>
                </div>
              )
            ) : (
              <p className="text-sm text-muted-foreground p-2 border rounded-md bg-muted/30">
                Seleccione origen y destino para ver rutas disponibles
              </p>
            )}
            
            {rutaSeleccionada && (
              <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                <span>Distancia: {rutaSeleccionada.distanciaKm} km</span>
                <span>Tarifa: ${rutaSeleccionada.valorTarifa.toLocaleString()}</span>
                {requiereSegundoConductor && (
                  <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                    Requiere 2 conductores
                  </Badge>
                )}
              </div>
            )}

            {esRutaDirecta && requiereSegundoConductor && (
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 mt-2">
                Requiere 2 conductores (distancia &gt; 500 km)
              </Badge>
            )}
          </div>

          {/* Conductor Principal */}
          <div className="space-y-2">
            <Label htmlFor="conductorPrincipal">Conductor Principal *</Label>
            {conductoresAsociados.length > 0 ? (
              <Select value={conductorPrincipalId} onValueChange={setConductorPrincipalId}>
                <SelectTrigger id="conductorPrincipal">
                  <SelectValue placeholder="Seleccionar conductor" />
                </SelectTrigger>
                <SelectContent>
                  {conductoresAsociados
                    .filter(c => c.activo)
                    .map(conductor => (
                      <SelectItem key={conductor.id} value={conductor.id.toString()}>
                        {conductor.nombreCompleto} - Lic: {conductor.licenciaNumero}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            ) : (
              <Alert variant="destructive" className="py-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Este bus no tiene conductores asignados. Asigne conductores antes de despachar.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Conduce */}
          <div className="space-y-2">
            <Label htmlFor="documentoConductor">
              <FileText className="w-4 h-4 inline mr-1" />
              Conduce *
            </Label>
            <Input
              id="documentoConductor"
              value={documentoConductor}
              onChange={(e) => setDocumentoConductor(e.target.value)}
              placeholder="Ingrese número de documento"
            />
            {conductorPrincipal && (
              <p className="text-xs text-muted-foreground">
                Documento esperado: {conductorPrincipal.numeroDocumento}
              </p>
            )}
          </div>

          {/* Conductor Auxiliar (si la ruta > 500km) */}
          {requiereSegundoConductor && (
            <div className="space-y-2">
              <Label htmlFor="conductorAuxiliar" className="flex items-center gap-2">
                Conductor Auxiliar *
                <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-xs">
                  Requerido (+500km)
                </Badge>
              </Label>
              {conductoresParaAuxiliar.length > 0 ? (
                <Select value={conductorAuxiliarId} onValueChange={setConductorAuxiliarId}>
                  <SelectTrigger id="conductorAuxiliar">
                    <SelectValue placeholder="Seleccionar segundo conductor" />
                  </SelectTrigger>
                  <SelectContent>
                    {conductoresParaAuxiliar.map(conductor => (
                      <SelectItem key={conductor.id} value={conductor.id.toString()}>
                        {conductor.nombreCompleto} - Lic: {conductor.licenciaNumero}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Alert variant="destructive" className="py-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    No hay otro conductor disponible. Asigne más conductores a este bus.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Asistente de Viaje (opcional) */}
          <div className="space-y-2">
            <Label htmlFor="asistenteViaje">
              <User className="w-4 h-4 inline mr-1" />
              Asistente de Viaje (opcional)
            </Label>
            <Input
              id="asistenteViaje"
              value={asistenteViaje}
              onChange={(e) => setAsistenteViaje(e.target.value)}
              placeholder="Nombre del asistente de viaje"
            />
          </div>

          {/* Hora Programada */}
          <div className="space-y-2">
            <Label htmlFor="horaProgramada">
              <Clock className="w-4 h-4 inline mr-1" />
              Hora Programada *
            </Label>
            <Input
              id="horaProgramada"
              type="time"
              value={horaProgramada}
              onChange={(e) => setHoraProgramada(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={conductoresAsociados.length === 0}
            className="gap-2"
          >
            <MapPin className="w-4 h-4" />
            Despachar Bus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
