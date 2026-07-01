// ============================================
// ENTITIES - Clean Architecture Domain Layer
// ============================================

export interface Municipio {
  id: number;
  nombre: string;
  departamento: string;
  codigoDane?: string;
  activo: boolean;
}

export interface Empresa {
  id: number;
  nit: string;
  razonSocial: string;
  direccion?: string;
  telefono?: string;
  email?: string;
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
  // Relations
  municipioOrigen?: Municipio;
  municipioDestino?: Municipio;
}

export interface Conductor {
  id: number;
  numeroDocumento: string;
  tipoDocumento: 'CC' | 'CE' | 'PA';
  nombreCompleto: string;
  telefono?: string;
  licenciaNumero: string;
  licenciaCategoria: string;
  licenciaVencimiento: Date;
  empresaId?: number;
  activo: boolean;
}

export type EstadoBus = 'DISPONIBLE' | 'DESPACHADO' | 'EN_RUTA' | 'MANTENIMIENTO' | 'INACTIVO';

export interface Bus {
  id: number;
  placa: string;
  capacidad: number;
  marca?: string;
  modelo?: string;
  ano?: number;
  empresaId: number;
  conductorAsignadoId?: number;
  estado: EstadoBus;
  activo: boolean;
  // Relations
  conductorAsignado?: Conductor;
  empresa?: Empresa;
}

export type TipoVinculacion = 'EMPLEADO' | 'CONCESION';
export type RolUsuario = 'VENDEDOR' | 'SUPERVISOR' | 'ADMIN';

export interface Usuario {
  id: number;
  numeroDocumento: string;
  tipoDocumento: 'CC' | 'CE' | 'PA';
  nombreCompleto: string;
  email?: string;
  telefono?: string;
  municipioAsignadoId: number;
  empresaId?: number;
  tipoVinculacion: TipoVinculacion;
  rol: RolUsuario;
  activo: boolean;
  // Relations
  municipioAsignado?: Municipio;
  empresa?: Empresa;
}

export interface Dispositivo {
  id: number;
  identificadorUnico: string;
  nombre?: string;
  tipo: 'COMPUTADOR' | 'TABLET' | 'MOVIL' | 'TERMINAL';
  municipioAsignadoId: number;
  activo: boolean;
  // Relations
  municipioAsignado?: Municipio;
}

export interface SesionUsuario {
  id: number;
  usuarioId: number;
  dispositivoId: number;
  tokenSesion: string;
  ipAddress?: string;
  activa: boolean;
  fechaInicio: Date;
  fechaFin?: Date;
  ultimaActividad: Date;
}

export interface Pasajero {
  id: number;
  numeroDocumento: string;
  tipoDocumento: 'CC' | 'CE' | 'TI' | 'PA' | 'RC';
  nombreCompleto: string;
  telefono?: string;
  email?: string;
}

export type EstadoPlanilla = 'PROGRAMADO' | 'DESPACHADO' | 'EN_RUTA' | 'FINALIZADO' | 'CANCELADO';

export interface PlanillaDespacho {
  id: number;
  numeroPlanilla: string;
  busId: number;
  conductorId: number;
  rutaId: number;
  fechaDespacho: Date;
  horaProgramada: string;
  horaSalidaReal?: string;
  estado: EstadoPlanilla;
  asientosOcupados: number;
  observaciones?: string;
  usuarioDespachoId?: number;
  // Relations
  bus?: Bus;
  conductor?: Conductor;
  ruta?: Ruta;
}

export type EstadoTicket = 'ACTIVO' | 'USADO' | 'CANCELADO' | 'REEMBOLSADO';
export type FormaPago = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'QR';

export interface Ticket {
  id: number;
  numeroTicket: string;
  planillaDespachoId: number;
  pasajeroId: number;
  rutaId: number;
  numeroAsiento?: number;
  valorPagado: number;
  formaPago: FormaPago;
  estado: EstadoTicket;
  usuarioVentaId: number;
  dispositivoVentaId: number;
  fechaVenta: Date;
  fechaUso?: Date;
  observaciones?: string;
  // Relations
  planillaDespacho?: PlanillaDespacho;
  pasajero?: Pasajero;
  ruta?: Ruta;
}

// ============================================
// DTOs
// ============================================

export interface CreateTicketDTO {
  planillaDespachoId: number;
  pasajeroId: number;
  rutaId: number;
  numeroAsiento?: number;
  valorPagado: number;
  formaPago: FormaPago;
  observaciones?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
  dispositivoId: string;
}

export interface SessionContext {
  usuarioId: number;
  dispositivoId: number;
  municipioId: number;
  tipoVinculacion: TipoVinculacion;
  sesionId: number;
}
