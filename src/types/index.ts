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
  id: number;
  tipo_documento: 'CC' | 'CE' | 'TI' | 'PA' | 'RC';
  documetno: string;
  nombres: string;
  apellidos: string;
  telefono?: string;
  email?:string;
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
  id_agencia: number;
  nombre: string;
  email: string;
  password_hash:string; 
  token_actual: string;
  ultimo_ingreso: string;
  rol: string;
  activo: number;
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
