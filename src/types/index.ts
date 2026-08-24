// ============================================
// FRONTEND TYPES
// ============================================

export interface ApiHeaders {
  'x-user-id': string | number;
  'x-user-role': string;
  token?: string;
}


export interface Municipio {
  id: number;
  nombre: string;
  departamento: string;
  activo: boolean;
  codigoDivipola?: string;
}

export interface Empresa {
  id: number;
  nit: string;
  razonSocial: string;
  activo: boolean;
}

export interface Ruta {
  id: number;
  municipioOrigenId: number;
  municipioDestinoId: number;
  valorTarifa: number;
  distanciaKm?: number;
  tiempoEstimadoMinutos?: number;
  activo: boolean;
  municipioOrigen?: Municipio;
  municipioDestino?: Municipio;
}

export interface Conductor {
  id: number;
  numeroDocumento: string;
  nombreCompleto: string;
  licenciaNumero: string;
  activo: boolean;
}

export type EstadoBus = 'DISPONIBLE' | 'DESPACHADO' | 'EN_RUTA' | 'ARRIBADO' | 'MANTENIMIENTO' | 'INACTIVO';

export interface ViajeDespacho {
  id_viaje: number;
  cod_ruta?: number;
  destino: string;
  fecha: string;
  hora: string;
  placa_bus: string;
  capacidad: number;
  estado: 'Programado' | 'En Ruta' | 'Finalizado' | 'Cancelado';
  pasajeros: Pasajero[];
}

export interface Bus {
  id: number;
  placa: string;
  capacidad: number;
  marca?: string;
  modelo?: string;
  estado: EstadoBus;
  conductorAsignado?: Conductor;
  conductoresAsociados?: Conductor[]; // Varios conductores pueden estar asignados a un bus
  // Campos adicionales para envío de dinero
  rutaActual?: Ruta;
  horaDespacho?: string;
}

export interface Pasajero {
  id?: number;
  tipo_documento?: 'CC' | 'CE' | 'TI' | 'PA' | 'RC';
  documento?: string;
  nombres?: string;
  apellidos?: string;
  telefono?: string;
  email?: string;
  numeroDocumento?: string;
  tipoDocumento?: string;
  nombreCompleto?: string;
  asiento?: number;
  asistio?: boolean;
}

export type EstadoPlanilla = 'PROGRAMADO' | 'DESPACHADO' | 'EN_RUTA' | 'FINALIZADO' | 'CANCELADO';

export interface PlanillaDespacho {
  id: number;
  numeroPlanilla: string;
  bus: Bus;
  conductor: Conductor;
  conductorAuxiliar?: Conductor; // Segundo conductor para rutas > 500km
  asistenteViaje?: string; // Nombre del asistente de viaje (opcional)
  ruta: Ruta;
  fechaDespacho: string;
  horaProgramada: string;
  estado: EstadoPlanilla;
  asientosOcupados: number;
}

export type FormaPago = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'QR';
export type EstadoTicket = 'ACTIVO' | 'USADO' | 'CANCELADO' | 'REEMBOLSADO';

export interface Ticket {
  id: number;
  numeroTicket: string;
  planilla: PlanillaDespacho;
  pasajero: Pasajero;
  ruta: Ruta;
  numeroAsiento?: number;
  valorPagado: number;
  formaPago: FormaPago;
  estado: EstadoTicket;
  fechaVenta: string;
}

export interface CreateTicketDTO {
  planillaDespachoId: number;
  pasajeroDocumento: string;
  pasajeroNombre: string;
  pasajeroTelefono?: string;
  numeroAsiento?: number;
  formaPago: FormaPago;
}

export interface CreateDespachoDTO {
  busId: number;
  rutaId?: number; // Opcional para rutas directas
  conductorPrincipalId: number;
  conductorAuxiliarId?: number; // Requerido si ruta > 500km
  asistenteViaje?: string;
  documentoConductor: string;
  horaProgramada: string;
}

export interface Usuario {
  id: number;
  id_agencia?: number;
  agenciaId?: number;
  id_orides?: number;
  nombre?: string;
  name?: string;
  nombreCompleto?: string;
  numeroDocumento?: string;
  email?: string;
  password_hash?: string;
  token_actual?: string;
  ultimo_ingreso?: string;
  rol?: string;
  role?: string;
  activo?: boolean;
  telefono?: string;
  tipoVinculacion?: string;
  municipio?: Municipio;
  empresa?: Empresa;
  [key: string]: unknown;
}

export interface Tablet {
  id: number;
  codigoDispositivo: string;
  marca: string;
  modelo: string;
  imei: string;
  municipioAsignado: Municipio;
  usuarioActual?: Usuario;
  activo: boolean;
  ultimaConexion?: string;
}




// ============================================
// ENVÍO DE DINERO TYPES
// ============================================

export type EstadoEnvio = 'PENDIENTE' | 'EN_TRANSITO' | 'ENTREGADO' | 'CANCELADO';

export interface EnvioDinero {
  id: number;
  numeroEnvio: string;
  remitente: {
    numeroDocumento: string;
    tipoDocumento: 'CC' | 'CE' | 'TI' | 'PA';
    nombreCompleto: string;
    telefono?: string;
  };
  destinatario: {
    numeroDocumento: string;
    nombreCompleto: string;
    telefono?: string;
  };
  receptor?: {
    numeroDocumento: string;
    nombreCompleto: string;
    telefono?: string;
    fechaRecepcion: string;
  };
  monto: number;
  comision: number;
  montoTotal: number;
  conductor: Conductor;
  bus: Bus; // Bus que transporta el dinero
  municipioOrigen: Municipio;
  municipioDestino: Municipio;
  planilla?: PlanillaDespacho;
  estado: EstadoEnvio;
  fechaCreacion: string;
  horaDespacho: string; // Hora del despacho del bus
  fechaEntrega?: string;
  observaciones?: string;
}

export interface CreateEnvioDineroDTO {
  remitenteDocumento: string;
  remitenteTipoDocumento: 'CC' | 'CE' | 'TI' | 'PA';
  remitenteNombre: string;
  remitenteTelefono?: string;
  destinatarioDocumento: string;
  destinatarioNombre: string;
  destinatarioTelefono?: string;
  monto: number;
  busId: number; // Bus seleccionado para el envío
  municipioDestinoId: number;
  planillaId?: number;
  observaciones?: string;
}

export interface ReciboEnvioDineroDTO {
  envioId: number;
  receptorDocumento: string;
  receptorNombre: string;
  receptorTelefono?: string;
}

// ============================================
// DIAN TICKET TYPES
// ============================================

export interface TiqueteItemDTO {
  codigo: string;
  descripcion: string;
  cantidad: number;
  unidad: string;
  precio_unitario: number;
  subtotal: number;
  porcentaje_iva: string;
  iva: number;
  base_gravable: number;
  exencion: string;
}

export interface TiqueteImpuestoDTO {
  codigo: string;
  porcentaje: number;
  base_imponible: number;
  valor_impuesto: number;
}

export interface TiqueteTransporteDTO {
  operacion?: string;
  fecha_emision?: string;
  hora_emision?: string;
  datos_emisor?: {
    token_empresa?: string;
    id_agencia?: number;
  };
  tipo_documento_pasajero?: string;
  numero_documento_pasajero?: string;
  nombre_pasajero?: string;
  ciudad_origen?: string;
  ciudad_destino?: string;
  terminal_origen?: string;
  terminal_destino?: string;
  municipio_origen?: string;
  municipio_destino?: string;
  departamento_origen?: string;
  departamento_destino?: string;
  fecha_viaje?: string;
  hora_salida?: string;
  numero_asiento?: string;
  placa_vehiculo?: string;
  tipo_servicio?: string;
  ruta_codigo?: string;
  numero_manifiesto?: string;
  items?: TiqueteItemDTO[];
  total_bruto?: number;
  descuentos?: number;
  base_gravable?: number;
  iva?: number;
  total?: number;
  notas?: string;
  forma_pago?: string;
  datos_viaje?: {
    id_interno_viaje?: string | number;
    origen?: string;
    destino?: string;
    placa_vehiculo?: string;
    numero_asiento?: number;
    valor_tiquete?: number;
  };
  datos_pasajero?: {
    tipo_documento?: string;
    numero_documento?: string;
    nombres?: string;
    apellidos?: string;
    email_notificacion?: string;
  };
  impuestos?: TiqueteImpuestoDTO[];
  // Documento equivalente electrónico DIAN (versión 1.0, tipo 21).
  tipoDocumento?: string;
  descripcionTipoDocumento?: string;
  versionEstructura?: string;
  ambiente?: string;
  prefijo?: string;
  numeroConsecutivo?: number;
  cude?: string;
  cufe?: string;
  fechaEmision?: string;
  horaEmision?: string;
  divisa?: string;
  formaPago?: string;
  medioPago?: string;
  emisor?: {
    nit?: string;
    dv?: string;
    razonSocial?: string;
    nombreComercial?: string;
    tipoOrganizacion?: string;
    regimenTributario?: string;
    responsabilidadFiscal?: string;
    direccion?: { municipioNombre?: string; direccion?: string };
    contacto?: { telefono?: string; email?: string };
  };
  adquirente?: {
    tipoIdentificacion?: string;
    numeroIdentificacion?: string;
    nombres?: string;
    apellidos?: string;
    direccion?: { municipioNombre?: string };
    contacto?: { telefono?: string; email?: string };
  };
  detallesServicioTransporte?: {
    modoTransporte?: string;
    tipoServicio?: string;
    origen?: { nombre?: string };
    destino?: { nombre?: string };
    vehiculo?: {
      placa?: string;
      numeroInterno?: string;
      empresaAfiliada?: string;
      nitEmpresaAfiliada?: string;
    };
    viaje?: {
      fechaSalida?: string;
      horaSalida?: string;
      puestos?: string;
      numeroPuestos?: number;
    };
  };
  lineasDetalle?: Array<{
    numeroLinea?: number;
    codigoProducto?: string;
    descripcion?: string;
    cantidad?: number;
    unidadMedida?: string;
    valorUnitario?: number;
    descuento?: number;
    subtotal?: number;
    impuestos?: unknown[];
    totalLinea?: number;
  }>;
  totales?: {
    lineasTotal?: number;
    subtotalBruto?: number;
    totalDescuentos?: number;
    totalCargos?: number;
    totalImpuestos?: number;
    totalPagar?: number;
  };
  informacionRepresentacionGrafica?: {
    qrData?: string;
    urlValidacionDian?: string;
  };
  agencia?: string;
  numero_operacion?: number;
  tipo_venta?: string;
  tipo_transporte?: string;
  elaborado?: string;
  [key: string]: unknown;
}
