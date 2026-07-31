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
import { PlanillaDespacho, FormaPago, TiqueteTransporteDTO } from '@/types';
import { mockPlanillas, getAsientosOcupados } from '@/data/mockData';
import {
  Bus, User, MapPin, AlertTriangle,
  CreditCard, Banknote, Smartphone, QrCode, Mail, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { pasajerosService } from '@/services/pasajeroService';
import { toast } from 'sonner';

interface TicketFormProps {
  onSubmit: (planilla: PlanillaDespacho, payloadDian: TiqueteTransporteDTO) => Promise<unknown>;
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
  correo: '',
  apellidos: '',
  nombres: '',
  telefono: '',
  asiento: undefined as number | undefined,
  formaPago: 'EFECTIVO' as FormaPago
};

export function TicketForm({ onSubmit, loading, authHeaders, idAgencia }: TicketFormProps) {
  const [selectedPlanilla, setSelectedPlanilla] = useState<PlanillaDespacho | null>(null);
  const [form, setForm] = useState(INITIAL_FORM_STATE);
  const [buscandoPasajero, setBuscandoPasajero] = useState(false);
  const [errorSeguridad, setErrorSeguridad] = useState<string | null>(null);

  const asientoSelectRef = useRef<HTMLButtonElement>(null);
  const asientosOcupados = selectedPlanilla ? getAsientosOcupados(selectedPlanilla.id) : [];

  const handleInputChange = <K extends keyof typeof INITIAL_FORM_STATE>(key: K, value: (typeof INITIAL_FORM_STATE)[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const consultarPasajero = async () => {
    const documento = form.documento.trim();
    if (documento.length < 4) return;

    setBuscandoPasajero(true);
    setErrorSeguridad(null);

    try {
      const result = await pasajerosService.buscarPorDocumento(documento, authHeaders);

      if (result && result.success) {
        setForm(prev => ({
          ...prev,
          nombres: result.nombres || '',
          apellidos: result.apellidos || '',
          telefono: result.telefono || '',
          correo: result.email || ''
        }));

        toast.success('Pasajero encontrado en base de datos.');

        setTimeout(() => {
          if (asientoSelectRef.current) {
            asientoSelectRef.current.focus();
            asientoSelectRef.current.click();
          }
        }, 100);
      } else {
        toast.info('Pasajero nuevo. Complete los datos para su registro automático.');
      }
    } catch (err) {
      setErrorSeguridad(err instanceof Error ? err.message : 'Error al validar el documento de identidad.');
    } finally {
      setBuscandoPasajero(false);
    }
  };

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!selectedPlanilla || !form.asiento) return;

  //   // 🎯 Construcción y Verificación del Estricto JSON Payload exigido por la DIAN
  //   const tiqueteJsonPayload = {
  //     operacion: "Emision_Tiquete_Transporte",
  //     fecha_emision: new Date().toISOString().split('T')[0],
  //     hora_emision: new Date().toLocaleTimeString('en-US', { hour12: false }),
  //     datos_emisor: {
  //       token_empresa: import.meta.env.VITE_EMPRESA_TOKEN || "DEFAULT_TOKEN_SACTEL",
  //       id_agencia: idAgencia
  //     },
  //     datos_viaje: {
  //       planilla_id: selectedPlanilla.id,
  //       numero_planilla: selectedPlanilla.numeroPlanilla,
  //       ciudad_origen: selectedPlanilla.ruta.municipioOrigen?.nombre,
  //       ciudad_destino: selectedPlanilla.ruta.municipioDestino?.nombre,
  //       valor_tiquete: parseFloat(selectedPlanilla.ruta.valorTarifa.toString()),
  //       numero_asiento: form.asiento
  //     },
  //     datos_pasajero: {
  //       numero_documento: form.documento.trim(),
  //       email_notificacion: form.correo.trim() || "notificaciones@empresa.com",
  //       nombre_pasajero: form.nombres.trim(),
  //       telefono: form.telefono.trim() || undefined
  //     },
  //     forma_pago: form.formaPago,
  //     impuestos: [
  //       {
  //         codigo: "01", 
  //         porcentaje: 0.00, 
  //         base_imponible: parseFloat(selectedPlanilla.ruta.valorTarifa.toString()),
  //         valor_impuesto: 0.00
  //       }
  //     ]
  //   };

  //   try {
  //     await onSubmit(selectedPlanilla, tiqueteJsonPayload);
  //     setForm(INITIAL_FORM_STATE);
  //     setSelectedPlanilla(null);
  //   } catch (err) {
  //     console.log(err)
  //     console.error("Fallo al emitir el tiquete transaccional:", err);
  //   }
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanilla || !form.asiento) return;

    // Al estar excluido de IVA, la tarifa es 100% base gravable pura
    const valorTarifa = parseFloat(selectedPlanilla.ruta.valorTarifa.toString());

    // 🎯 Payload sin IVA (Excluido de impuesto según Estatuto Tributario)
    const tiqueteJsonPayload = {
      operacion: "Emision_Tiquete_Transporte",
      fecha_emision: new Date().toISOString().split('T')[0],
      hora_emision: new Date().toLocaleTimeString('en-US', { hour12: false }),

      datos_emisor: {
        token_empresa: import.meta.env.VITE_EMPRESA_TOKEN || '',
        id_agencia: idAgencia
      },

      // Identificación y datos del Pasajero
      tipo_documento_pasajero: "13", // 13 = Cédula de Ciudadanía
      numero_documento_pasajero: form.documento.trim(),
      nombre_pasajero: `${form.nombres.trim()} ${form.apellidos.trim()}`.toUpperCase(),

      // Ruta y Geografía (Códigos Divipola y Nombres)
      ciudad_origen: (selectedPlanilla.ruta.municipioOrigen?.nombre || "BOGOTA").toUpperCase(),
      ciudad_destino: (selectedPlanilla.ruta.municipioDestino?.nombre || "MEDELLIN").toUpperCase(),
      terminal_origen: "TERMINAL SALITRE",
      terminal_destino: "TERMINAL NORTE",

      municipio_origen: selectedPlanilla.ruta.municipioOrigen?.codigoDivipola || "11001",
      municipio_destino: selectedPlanilla.ruta.municipioDestino?.codigoDivipola || "05001",
      departamento_origen: (selectedPlanilla.ruta.municipioOrigen?.departamento || "CUNDINAMARCA").toUpperCase(),
      departamento_destino: (selectedPlanilla.ruta.municipioDestino?.departamento || "ANTIOQUIA").toUpperCase(),

      // Logística del Viaje
      fecha_viaje: new Date().toISOString().split('T')[0],
      hora_salida: "08:00",
      numero_asiento: form.asiento.toString(),
      placa_vehiculo: selectedPlanilla.bus.placa || "ABC123",
      tipo_servicio: "1",
      ruta_codigo: `RTA-${selectedPlanilla.id}`,
      numero_manifiesto: selectedPlanilla.numeroPlanilla || "MF-2026-001",

      // Detalle del servicio - IVA 0%
      items: [
        {
          codigo: "SERV001",
          descripcion: `Tiquete de transporte terrestre intermunicipal - Silla ${form.asiento}`,
          cantidad: 1,
          unidad: "94", // Unidad de servicio
          precio_unitario: valorTarifa,
          subtotal: valorTarifa,
          porcentaje_iva: "0.00", // 👈 Sin IVA
          iva: 0.00,             // 👈 Sin IVA
          base_gravable: valorTarifa,
          exencion: "1"          // 👈 Indica al backend que está Excluido/Exento
        }
      ],

      // Totales Limpios
      total_bruto: valorTarifa,
      descuentos: 0,
      base_gravable: valorTarifa,
      iva: 0.00,
      total: valorTarifa,
      notas: "Servicio de transporte público terrestre de pasajeros excluido de IVA."
    };

    try {
      await onSubmit(selectedPlanilla, tiqueteJsonPayload);
      setForm(INITIAL_FORM_STATE);
      setSelectedPlanilla(null);
    } catch (err) {
      console.log(err)
      console.error("Fallo al emitir el tiquete transaccional:", err);
    }
  };

  const canSellTicket = (planilla: PlanillaDespacho): boolean => {
    return !!(
      planilla.bus.conductorAsignado &&
      (planilla.estado === 'DESPACHADO' || planilla.estado === 'EN_RUTA') &&
      planilla.asientosOcupados < planilla.bus.capacidad
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Selector de Viajes */}
      <Card className="lg:col-span-1 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bus className="w-5 h-5 text-primary" />
            Seleccionar Viaje
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[65vh] overflow-y-auto pr-2">
          {mockPlanillas.map(planilla => {
            const activo = canSellTicket(planilla);
            const isSelected = selectedPlanilla?.id === planilla.id;

            return (
              <button
                key={planilla.id}
                type="button"
                onClick={() => activo && setSelectedPlanilla(planilla)}
                disabled={!activo}
                className={cn(
                  'w-full p-4 rounded-lg border-2 text-left transition-all duration-200',
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : activo
                      ? 'border-border hover:border-primary/50 hover:bg-muted/50'
                      : 'border-border bg-muted/30 opacity-60 cursor-not-allowed'
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono text-sm font-semibold text-muted-foreground">{planilla.numeroPlanilla}</span>
                  <Badge variant={planilla.estado === 'DESPACHADO' ? 'default' : 'secondary'}>
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

      {/* Inputs Ordenados del Pasajero */}
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
                <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm flex items-center gap-2">
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
                      placeholder="Número de cédula"
                      value={form.documento}
                      onChange={e => handleInputChange('documento', e.target.value)}
                      onBlur={consultarPasajero}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), consultarPasajero())}
                      required
                      disabled={loading || buscandoPasajero}
                    />
                    {buscandoPasajero && <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-3 text-muted-foreground" />}
                  </div>
                </div>

                {/* 2. Correo Electrónico */}
                <div className="space-y-1.5">
                  <Label htmlFor="correo" className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-muted-foreground" /> Correo Electrónico
                  </Label>
                  <Input
                    id="correo"
                    type="email"
                    placeholder="correo@servidor.com"
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

                {/* 6. Silla */}
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
                        'p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all',
                        form.formaPago === fp.value
                          ? 'border-secondary bg-secondary text-secondary-foreground font-semibold'
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
                disabled={loading || buscandoPasajero || !form.documento || !form.nombres || !form.apellidos || !form.asiento}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Firmando y Emitiendo ante la DIAN...
                  </>
                ) : (
                  '🎟️ Generar Ticket y Emitir Factura'
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