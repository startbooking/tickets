import apiClient from "./apiClient";
import axios from "axios";

// ============================================
// SERVICIO TRAVELSOFT — Conexión con travelsoft.backend.lan
// ============================================

export interface TravelsoftUser {
  cedula_usuario: string;
  id_usuario: string;
  nombre_usuario: string;
  nombreCompleto: string;
  rol: string; // SUPERADMIN | ADMIN | AGENCIA | CAJERO | DESPACHADOR
  id_orides: number;
  agencia?: string | null;
  tipo_agencia?: 'principal' | 'satelite' | null;
  nivel_usuario: number;
  [key: string]: unknown;
}

export interface TravelsoftLoginResponse {
  success: boolean;
  data?: {
    user: TravelsoftUser;
    token: string;
  };
}

export interface TravelsoftLoginData {
  user: TravelsoftUser;
  token: string;
}

export type TipoAgencia = "principal" | "satelite";

export interface VehiculoEstado {
  cod_ruta: number;
  origen_ruta: number | null;
  origen?: string | null;
  destino_ruta: number | null;
  fecha_ruta: string | null;
  placa_vehi: string | null;
  orden_vehi?: string | null;
  destino: string | null;
  hora_ruta: number | null;
  habilitada_ruta: string | null;
  despachada_ruta: string | null;
  llegada_ruta: string | null;
  hora_despacho: string | null;
  hora_horario?: string | null;
  hora_llegada: string | null;
  conductor: string | null;
  recorrido?: string | null;
  capacidad: number | null;
  tickets_vendidos?: number | null;
  estado_sitio?: string | null;
  anulada?: string | null;
}

export interface DashboardCajeroData {
  fecha: string;
  id_orides: number;
  agencia: string | null;
  tipo_agencia: TipoAgencia;
  resumen: {
    despachados: number;
    en_plataforma: number;
    proximos: number;
    programados: number;
    total: number;
  } | null;
  vehiculos: {
    despachados: VehiculoEstado[];
    en_plataforma: VehiculoEstado[];
    proximos: VehiculoEstado[];
  } | null;
}

export interface DashboardCajeroResponse {
  success: boolean;
  data: DashboardCajeroData;
}

// ────────────────────────────────────────────────────────────────────────────
// Programación de vehículos (tabla `adicional`): vehículos programados y ya
// despachados de la agencia del usuario autenticado en la fecha consultada.
// ────────────────────────────────────────────────────────────────────────────

export interface ProgramacionVehiculo extends VehiculoEstado {
  cod_adicional: number;
}

export interface ProgramacionVehiculosData {
  fecha: string;
  id_orides: number;
  agencia: string | null;
  tipo_agencia: TipoAgencia;
  resumen: {
    programados: number;
    despachados: number;
    total: number;
  } | null;
  vehiculos: {
    programados: ProgramacionVehiculo[];
    despachados: ProgramacionVehiculo[];
  } | null;
}

export interface ProgramacionVehiculosResponse {
  success: boolean;
  data: ProgramacionVehiculosData;
}

// ────────────────────────────────────────────────────────────────────────────
// Agencias satélite: ciudades intermedias por las que pasa la ruta.
// Venden tiquetes de los vehículos que pasan hoy por su ciudad; NO programan
// viajes ni reportan salida/llegada (no tienen vehículos en parqueadero).
// ────────────────────────────────────────────────────────────────────────────

export interface SateliteSegmento {
  origen_ruta: number;
  destino_ruta: number;
  destino: string | null;
  valor: number | null;
}

export type EstadoVehiculoSatelite = 'POR_DESPACHAR' | 'EN_TRANSITO' | 'LLEGADO';

export interface SateliteVehiculo {
  cod_ruta: number;
  fecha_ruta: string | null;
  placa_vehi: string | null;
  orden_vehi?: string | null;
  hora_ruta: number | null;
  hora_despacho: string | null;
  despachada_ruta?: string | null;
  llegada_ruta?: string | null;
  estado?: EstadoVehiculoSatelite | null;
  conductor: string | null;
  origen_ruta: number | null;
  origen: string | null;
  destino_ruta: number | null;
  destino: string | null;
  capacidad: number | null;
  tickets_vendidos: number | null;
  segmentos: SateliteSegmento[];
  segmento_post_parada?: {
    origen_ruta: number;
    origen: string | null;
    destino_ruta: number;
    destino: string | null;
    valor: number | null;
  } | null;
}

export interface TurnoSateliteVenta {
  id_planilla: number;
  consecutivo: number;
  hora: string;
  cod_ruta: number;
  placa: string;
  origen: string;
  destino: string;
  asiento: number;
  pasajero: string;
  documento?: string;
  valor: number;
  forma_pago: string;
  numero_factura?: string | null;
  resolucion_numero?: string | null;
  cufe?: string | null;
  qr_dian?: string | null;
  nit_emisor?: string | null;
  fecha_ruta?: string | null;
  hora_ruta?: number | null;
  mensaje?: string | null;
}

export interface CierreTurnoSateliteInput {
  operador: string;
  inicio: string;
  cierre: string;
  tiquetes: number;
  total: number;
  efectivo: number;
  tarjeta: number;
  qr: number;
  ventas: TurnoSateliteVenta[];
}

export interface CierreTurnoSateliteResult {
  id_turno: number;
  tiquetes: number;
  total: number;
}

export interface SateliteDashboardData {
  fecha: string;
  id_orides: number;
  agencia: string | null;
  tipo_agencia: 'satelite';
  resumen: { vehiculos: number } | null;
  vehiculos: SateliteVehiculo[];
}

export interface EnTransitoItem {
  cod_ruta: number;
  origen_ruta: number;
  fecha_ruta: string | null;
  fecha_llegada: string | null;
  origen: string | null;
  destino: string | null;
  placa_vehi: string | null;
  orden_vehi?: string | null;
  hora_ruta: number | null;
  hora_despacho: string | null;
  hora_llegada: string | null;
  conductor: string | null;
  novedad_llegada: string | null;
  estado_sitio: string | null;
}

export interface LlegadasData {
  fecha: string;
  id_orides: number;
  en_transito: EnTransitoItem[];
  llegados: EnTransitoItem[];
}

export interface OperacionResponse {
  success: boolean;
  data?: Record<string, unknown>;
}

export interface OridesOption {
  id_orides: number;
  desc_orides: string | null;
  agencia_orides?: string;
  despacho_orides?: string;
  tipo_agencia?: string | null;
}

/** Recorrido (tabla `recorrido`): descripción + origen/destino/sentido. */
export interface RecorridoOption {
  Id_recorrido: number;
  desc_recorrido: string | null;
  origen: number;
  destino: number;
  sentido: number;
  tiempo_viaje?: number | null;
}

export interface HorarioOption {
  id_horario: number;
  hora_horario: string | null;
  hora_time: string | null;
}

/** Conduce de documento de tránsito (tabla `concedes`). */
export interface ConduceOption {
  id_conduce: number;
  desc_conduce: string | null;
}

export interface ConductorOption {
  cedula_conduc: string;
  nombre_conduc: string;
  estado_conduc?: string;
}

// ── Conductor (tabla `conductores`, PK = cedula_conduc) ──────────────────

export interface ConductorSACTel {
  cedula_conduc: string;
  nombre_conduc: string;
  telefono_conduc?: string | null;
  celular_conduc?: string | null;
  correo_conduc?: string | null;
  estado_conduc?: string;
}

export interface ConductorCreateInput {
  cedula_conduc: string;
  nombre_conduc: string;
  telefono_conduc?: string;
  celular_conduc?: string;
  correo_conduc?: string;
  estado_conduc?: string;
}

export interface ConductorUpdateInput {
  nombre_conduc?: string;
  telefono_conduc?: string;
  celular_conduc?: string;
  correo_conduc?: string;
  estado_conduc?: string;
}

// ── Pasajero (tabla `pasajero`) ──────────────────────────────────────────

export interface PasajeroSACTel {
  cedula_pasajero?: string;
  nombre_pasajero?: string;
  telefono_pasajero?: string | null;
  correo_pasajero?: string | null;
  pasajero_internet?: string | null;
  cedula_usuario?: string | null;
  direccion_pasajero?: string | null;
}

// ── Viaje de un pasajero (tabla `planillas`) ─────────────────────────────

export interface ViajePasajero {
  id_planilla?: number;
  cod_ruta?: number;
  fecha_ruta?: string | null;
  hora_ruta?: number | null;
  origen_ruta?: number | null;
  destino_ruta?: number | null;
  placa_vehi?: string | null;
  cedula_conduc?: string | null;
  cedula_pasajero?: string | null;
  valor?: number | null;
  puesto?: number | null;
  forma_pago?: string | null;
  anulado_tiquete?: string | null;
  hora_tiquete?: string | null;
}

// ── Vehículo (tabla `vehiculo`, PK = placa_vehi) ──────────────────────────────

export interface VehiculoSACTel {
  placa_vehi: string;
  orden_vehi?: string | null;
  modelo_vehi?: number | null;
  marca_vehi?: string | null;
  pasajeros_vehi?: number | null;
  tipo_vehi?: string | null;
  estado_vehi?: string | null;
  bloqueo_vehi?: string | null;
  fuera_servicio?: string | null;
  origen_siguiente?: number | null;
  observacion_bloqueo?: string | null;
  numero_chasis_vehi?: string | null;
  numero_motor_vehi?: string | null;
}

export interface VehiculoCreateInput {
  placa_vehi: string;
  orden_vehi?: string;
  modelo_vehi?: number;
  marca_vehi?: string;
  pasajeros_vehi?: number;
  tipo_vehi?: string;
  estado_vehi?: string;
  bloqueo_vehi?: string;
  observacion_bloqueo?: string;
  numero_chasis_vehi?: string;
  numero_motor_vehi?: string;
}

export interface VehiculoUpdateInput {
  orden_vehi?: string;
  modelo_vehi?: number;
  marca_vehi?: string;
  pasajeros_vehi?: number;
  tipo_vehi?: string;
  estado_vehi?: string;
  bloqueo_vehi?: string;
  observacion_bloqueo?: string;
}

export interface VehiculoOption {
  placa_vehi: string;
  orden_vehi?: string;
  modelo_vehi?: number | null;
  marca_vehi?: string | null;
  pasajeros_vehi?: number | null;
  estado_vehi?: string;
}

/** Conductor asociado a un vehículo (GET /vehiculos/{placa}/conductores). */
export interface VehiculoConductor {
  cedula_conduc: string;
  nombre_conduc?: string | null;
  estado_conduc?: string;
  titular?: number;
}

/** Respuesta de GET /vehiculos/{placa}/conductores. */
export interface VehiculoConductoresRespuesta {
  conductores: VehiculoConductor[];
  ultimo_conduc?: string | null;
}

export interface RutaCreateInput {
  destino_ruta: number;
  id_recorrido?: number;
  hora_ruta: number;
  id_horario?: number;
  hora_programada?: string;
  placa_vehi: string;
  numero_orden?: string;
  id_ruta_tipo?: number;
  cedula_conduc?: string;
  cedula_conduc2?: string;
  cedula_auxi?: string;
  conduce_ruta?: string;
  id_conduce?: number;
  fecha_ruta?: string;
  fecha_regreso?: string;
  hora_regreso?: string;
}

export interface RutaTipoOption {
  id_ruta_tipo: number;
  desc_ruta_tipo: string;
}

export interface SillaItem {
  numero: number;
  estado: "disponible" | "ocupada";
}

export interface SillasData {
  cod_ruta: number;
  fecha: string;
  placa: string | null;
  destino: string | null;
  destino_ruta: number | null;
  hora_ruta: number | null;
  capacidad: number;
  valor: number | null;
  ocupadas: number[];
  sillas: SillaItem[];
  // Tramo origen (presente en el croquis de las agencias satélite)
  origen?: string | null;
  origen_ruta?: number | null;
  segmentos?: SateliteSegmento[];
}

export type FormaPago = "EFECTIVO" | "TARJETA" | "QR";

export interface VentaTiqueteInput {
  cod_ruta: number;
  puesto: number;
  puestos?: number[];
  numero_documento: string;
  nombres: string;
  apellidos: string;
  correo?: string;
  telefono?: string;
  forma_pago: FormaPago;
  fecha?: string;
  // Tramo vendido (obligatorio en agencias satélite)
  origen_ruta?: number;
  destino_ruta?: number;
  valor?: number;
}

export interface TicketVenta {
  id_planilla: number;
  consecutivo_pasajero: number;
  consecutivo_planilla: number;
  cod_ruta: number;
  fecha_ruta: string;
  hora_ruta: number | null;
  hora_tiquete?: string;
  placa_vehi: string | null;
  origen: string | null;
  destino: string | null;
  puesto: number;
  valor: number | null;
  pasajero: {
    nombre: string;
    documento: string;
    correo?: string | null;
    telefono?: string | null;
  };
  forma_pago: FormaPago;
  mensaje?: string | null;
  cajero?: string | null;
  cajero_nombre?: string | null;
  numero_operacion?: number | null;
  // Campos DIAN (numeración por resolución de facturación)
  consecutivo_factura?: number;
  numero_factura?: string;
  resolucion_numero?: string;
  nit_emisor?: string;
  // Datos del vehículo y del servicio
  tipo_vehi?: string | null;
  marca_vehi?: string | null;
  tipo_servicio?: string | null;
  municipio?: string | null;
  fecha_venta?: string;
  // Campos de venta multi-silla (compra de varias sillas en un mismo tiquete)
  cantidad?: number;
  puestos?: number[];
  sillas?: number[];
  total?: number;
  consolidado?: boolean;
  // Campos DIAN (firma electrónica del Core SACTel)
  cufe?: string;
  qr_dian?: string;
  qr_code_url?: string;
}

export interface ParametrosTickets {
  tiquete_consolidado: string;
}

export interface VentaTiqueteResult {
  data: TicketVenta;
  tiquetes: TicketVenta[];
  cantidad: number;
  total: number;
  puestos: number[];
  consolidado: boolean;
}

/** Un tiquete vendido por el cajero, para el informe de cierre de caja. */
export interface VentaCajero {
  id_planilla: number;
  consecutivo_pasajero: number;
  cod_ruta: number;
  fecha_ruta: string;
  hora_tiquete?: string | null;
  placa_vehi: string | null;
  marca_vehi?: string | null;
  tipo_vehi?: string | null;
  origen?: string | null;
  destino?: string | null;
  puesto: number;
  valor: number | null;
  forma_pago: FormaPago;
  pasajero?: {
    nombre?: string | null;
    documento?: string | null;
  };
}

export interface ManifiestoPasajero {
  puesto: number | null;
  consecutivo_pasajero: number | null;
  nombre?: string | null;
  documento?: string | null;
  valor: number | null;
  forma_pago?: string | null;
  hora_tiquete?: string | null;
}

export interface ManifiestoDespacho {
  cod_ruta: number;
  origen_ruta: number;
  destino_ruta: number | null;
  fecha_ruta: string;
  placa_vehi: string | null;
  origen?: string | null;
  destino?: string | null;
  hora_ruta: number | null;
  hora_despacho?: string | null;
  vehiculo: {
    marca?: string | null;
    tipo?: string | null;
    modelo?: number | null;
    capacidad?: number | null;
  };
  conductores: { cedula: string; nombre?: string | null }[];
  auxiliar?: { cedula: string; nombre?: string | null } | null;
  conduce?: string | number | null;
  pasajeros: ManifiestoPasajero[];
  totales: { pasajeros: number; total_venta_cajero: number };
}

export interface Resolucion {
  id_resolucion: number;
  id_orides: number;
  numero_resolucion: string;
  prefijo?: string | null;
  rango_inicial?: number | null;
  rango_final?: number | null;
  consecutivo_actual: number;
  fecha_resolucion?: string | null;
  municipio?: string | null;
  vigencia_desde?: string | null;
  vigencia_hasta?: string | null;
  activa: number;
  notas?: string | null;
  fecha_creacion?: string;
}

export interface ResolucionInput {
  numero_resolucion: string;
  prefijo?: string;
  rango_inicial?: number;
  rango_final?: number;
  consecutivo_actual: number;
  fecha_resolucion?: string;
  municipio?: string;
  vigencia_desde?: string;
  vigencia_hasta?: string;
  activa: number;
  notas?: string;
  id_orides?: number;
}

export interface PasajeroInfo {
  documento: string;
  nombre_completo: string;
  nombres: string;
  apellidos: string;
  telefono: string | null;
  correo: string | null;
}

export interface EstadoImpresora {
  detectada: boolean;
  impresora?: {
    vendor_id: string;
    product_id: string;
    producto: string;
    fabricante: string;
  } | null;
}

export interface ImprimirTicketResult {
  impresora?: string;
  bytes?: number;
  copias?: number;
}

// ── Tipos de usuario (tabla `usuario` del backend) ───────────────────────────

/** Niveles de usuario que reconoce TravelSoft (mapeo nivel_usuario → rol). */
export const NIVEL_USUARIO_LABEL: Record<number, string> = {
  10: "SUPERADMIN",
  6: "Rodamiento + Taquilla",
  5: "Taquilla",
  4: "Rodamiento",
  2: "CAJERO",
  0: "DESPACHADOR",
};

export type EstadoUsuario = "1" | "0";

export interface UsuarioSACTel {
  cedula_usuario: string;
  nombre_usuario: string;
  clave_usuario: string;
  id_orides: number;
  nivel_usuario: number;
  estado_usuario: EstadoUsuario;
}

export interface UsuarioSACTelConAgencia extends UsuarioSACTel {
  agencia?: string;
  tipo_agencia?: string;
}

export interface UsuarioCreateInput {
  cedula_usuario: string;
  nombre_usuario: string;
  clave_usuario: string;
  id_orides: number;
  nivel_usuario: number;
  estado_usuario?: EstadoUsuario;
}

export interface UsuarioUpdateInput {
  nombre_usuario?: string;
  clave_usuario?: string;
  id_orides?: number;
  nivel_usuario?: number;
  estado_usuario?: EstadoUsuario;
}

// Roles que entiende el frontend (App.tsx / ProtectedRoute)
export type AppRol = "SUPERADMIN" | "ADMIN_AGENCIA" | "CAJERO" | "DESPACHADOR" | "CAJERO_DESPACHADOR";

export const DASHBOARD_POR_ROL: Record<AppRol, string> = {
  SUPERADMIN: "/superadmin/dashboard",
  ADMIN_AGENCIA: "/agencia",
  CAJERO: "/cajero/dashboard",
  // Nivel 4 (Rodamiento) y Nivel 6 (Rodamiento+Taquilla) usan el CajeroDashboard:
  // el nivel 4 solo Programación (esRodamiento), el nivel 6 acceso completo.
  DESPACHADOR: "/cajero/dashboard",
  CAJERO_DESPACHADOR: "/cajero/dashboard",
};

// Mapeo de TravelSoft: nivel_usuario -> rol del frontend
// 4=Rodamiento (programa, sin taquilla) → DESPACHADOR (CajeroDashboard con esRodamiento)
// 5=Taquilla → CAJERO (dashboard cajero, venta)
// 6=Taquilla+Rodamiento → CAJERO_DESPACHADOR (CajeroDashboard completo)
// 10=SUPERADMIN, 2=CAJERO, 0=DESPACHADOR (legacy)
const ROL_POR_NIVEL: Record<number, AppRol> = {
  10: "SUPERADMIN",
  6: "CAJERO_DESPACHADOR",
  5: "CAJERO",
  4: "DESPACHADOR",
  2: "CAJERO",
  0: "DESPACHADOR",
};

const ROL_BACKEND_A_APP: Record<string, AppRol> = {
  SUPERADMIN: "SUPERADMIN",
  ADMIN: "ADMIN_AGENCIA",
  AGENCIA: "ADMIN_AGENCIA",
  CAJERO: "CAJERO",
  DESPACHADOR: "DESPACHADOR",
  CAJERO_DESPACHADOR: "CAJERO_DESPACHADOR",
};

/**
 * Normaliza el rol del backend a uno de los 4 roles del frontend.
 * Prioriza el nivel_usuario (referencia del negocio), con fallback al rol.
 */
export function normalizeRol(user: { rol?: string; nivel_usuario?: number }): AppRol {
  const nivel = user.nivel_usuario;
  if (nivel !== undefined && nivel !== null && ROL_POR_NIVEL[nivel]) {
    return ROL_POR_NIVEL[nivel];
  }
  const rol = user.rol ? ROL_BACKEND_A_APP[user.rol.toUpperCase()] : undefined;
  return rol || "CAJERO";
}

/**
 * Devuelve la ruta del dashboard según el nivel del usuario.
 * Las agencias satélite siempre van al panel móvil /satelite (solo venta).
 */
export function getDashboardPorNivel(user: { rol?: string; nivel_usuario?: number; tipo_agencia?: string | null }): string {
  if (user.tipo_agencia === 'satelite') return '/satelite';
  return DASHBOARD_POR_ROL[normalizeRol(user)];
}

/**
 * Divide el nombre completo ("NOMBRE1 NOMBRE2 APELLIDO1 APELLIDO2")
 * en nombres y apellidos (los 2 últimos tokens son apellidos).
 */
export function splitNombreCompleto(nombreCompleto: string): { nombres: string; apellidos: string } {
  const partes = (nombreCompleto || "").trim().split(/\s+/).filter(Boolean);
  if (partes.length <= 2) {
    return { nombres: partes[0] || "", apellidos: partes.slice(1).join(" ") };
  }
  const apellidos = partes.slice(-2).join(" ");
  const nombres = partes.slice(0, -2).join(" ");
  return { nombres, apellidos };
}

/**
 * Convierte una duración ISO 8601 ("PT2H5M", "PT30M") a minutos desde
 * medianoche. El backend entrega `horario.hora_time` en ese formato.
 */
export function horaDurationAMinutos(iso: string | null | undefined): number {
  if (!iso) return 0;
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso.trim());
  if (!m) return 0;
  const h = parseInt(m[1] || '0', 10);
  const mi = parseInt(m[2] || '0', 10);
  const s = parseInt(m[3] || '0', 10);
  return h * 60 + mi + Math.round(s / 60);
}

/**
 * Convierte minutos desde medianoche (hora_ruta de TravelSoft) a "HH:MM".
 * Retorna "--" si el valor es nulo, undefined, NaN o 0.
 */
export function formatHora(minutos: number | null | undefined): string {
  if (minutos === null || minutos === undefined || minutos === 0) {
    return "--";
  }
  const total = Number(minutos);
  if (Number.isNaN(total)) {
    return "--";
  }
  const h = Math.floor(total / 60).toString().padStart(2, "0");
  const m = Math.floor(total % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Hora de salida efectiva del vehículo programado:
 * usa `hora_despacho` si es una hora válida; si viene '00:00' o vacía
 * (dato sin asignar), cae al horario real (`hora_horario`) y luego a
 * `hora_ruta` en minutos.
 */
export function horaSalidaVehiculo(v: {
  hora_despacho?: string | null;
  hora_horario?: string | null;
  hora_ruta?: number | null;
}): string {
  const despacho = (v.hora_despacho || "").trim();
  if (despacho && despacho !== "00:00") {
    return despacho;
  }
  const horario = (v.hora_horario || "").trim();
  if (horario) {
    return horario;
  }
  return formatHora(v.hora_ruta);
}

/**
 * Estado del sitio donde queda el vehículo tras reportar su llegada,
 * para ser despachado más adelante desde la agencia.
 */
export type EstadoSitio = "EN_PARQUEADERO" | "EN_SITIO";

export const ESTADOS_SITIO: EstadoSitio[] = ["EN_PARQUEADERO", "EN_SITIO"];

export const ESTADO_SITIO_LABEL: Record<EstadoSitio, string> = {
  EN_PARQUEADERO: "En Parqueadero",
  EN_SITIO: "En Sitio",
};

export const travelsoftService = {
  /**
   * Login contra POST /api/v1/auth/login de travelsoft.backend.lan
   * Devuelve el usuario con: cedula, nombres, apellidos, rol y nivel.
   */
  login: async (cedula_usuario: string, password: string): Promise<TravelsoftLoginData> => {
    try {
      const response = await apiClient.post<TravelsoftLoginResponse>("/auth/login", {
        cedula_usuario,
        password,
      });
      const payload = response.data;
      if (!payload || payload.success !== true || !payload.data?.user || !payload.data.token) {
        throw new Error("Credenciales incorrectas.");
      }
      return { user: payload.data.user, token: payload.data.token };
    } catch (err) {
      // Extrae el mensaje del backend ({ success:false, error:{ message, code } } o { detail })
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as
          | { error?: { message?: string }; detail?: string }
          | undefined;
        const mensaje = data?.error?.message || data?.detail;
        if (mensaje) {
          throw new Error(mensaje);
        }
      }
      throw err;
    }
  },

  /**
   * Trae el usuario del backend travelsoft por cédula (GET /usuarios/{cedula}).
   */
  /**
    * Trae el usuario del backend travelsoft por cédula (GET /usuarios/{cedula}).
    * Retorna el perfil de TravelSoft con: cedula, nombres, apellidos, rol y nivel.
    */
   getUsuarioOrides: async (cedula: string): Promise<TravelsoftUser> => {
     const response = await apiClient.get<TravelsoftUser>(
       `/usuarios/${encodeURIComponent(cedula)}`
     );
     return response.data;
   },

  /**
   * Estadísticas de vehículos del día para la agencia del cajero autenticado.
   * GET /dashboard/cajero?fecha=YYYY-MM-DD (por defecto: hoy).
   * Las agencias satélite devuelven resumen/vehiculos = null.
   */
  getDashboardCajero: async (fecha?: string): Promise<DashboardCajeroData> => {
    const response = await apiClient.get<DashboardCajeroResponse>("/dashboard/cajero", {
      params: fecha ? { fecha } : undefined,
    });
    const payload = response.data;
    if (!payload || payload.success !== true || !payload.data) {
      throw new Error("No se pudieron cargar las estadísticas de vehículos.");
    }
    return payload.data;
  },

  /**
   * Programación de vehículos del día (tabla `adicional`) para la agencia
   * del usuario autenticado. GET /despacho/programacion?fecha=YYYY-MM-DD.
   * Devuelve vehículos programados (despachada_adicional = '0') y
   * despachados ('1') con conductor, destino, capacidad y tiquetes vendidos.
   */
  getProgramacionVehiculos: async (fecha?: string): Promise<ProgramacionVehiculosData> => {
    const response = await apiClient.get<ProgramacionVehiculosResponse>("/despacho/programacion", {
      params: fecha ? { fecha } : undefined,
    });
    const payload = response.data;
    if (!payload || payload.success !== true || !payload.data) {
      throw new Error("No se pudieron cargar los vehículos programados.");
    }
    return payload.data;
  },

  /**
   * Panel de la agencia satélite: vehículos que pasan hoy por la ciudad.
   * GET /dashboard/satelite?fecha=YYYY-MM-DD (403 si la agencia no es satélite).
   */
  getDashboardSatelite: async (fecha?: string): Promise<SateliteDashboardData> => {
    const response = await apiClient.get<{ success: boolean; data: SateliteDashboardData }>(
      "/dashboard/satelite",
      { params: fecha ? { fecha } : undefined }
    );
    const payload = response.data;
    if (!payload || payload.success !== true || !payload.data) {
      throw new Error("No se pudieron cargar los vehículos de la agencia satélite.");
    }
    return payload.data;
  },

  /**
   * Croquis de sillas de un vehículo que pasa por la agencia satélite.
   * GET /ventas/satelite/sillas?cod_ruta=&fecha=
   */
  getSillasSatelite: async (cod_ruta: number, fecha?: string): Promise<SillasData> => {
    const response = await apiClient.get<{ success: boolean; data: SillasData }>(
      "/ventas/satelite/sillas",
      { params: { cod_ruta, ...(fecha ? { fecha } : {}) } }
    );
    const payload = response.data;
    if (!payload || payload.success !== true || !payload.data) {
      throw new Error("No se pudieron cargar las sillas del vehículo.");
    }
    return payload.data;
  },

  /**
   * Vende el tiquete de un tramo en una agencia satélite.
   * Soporta una o varias sillas (puestos) y devuelve el resultado consolidado
   * igual que la venta principal (VentaTiqueteResult).
   * POST /ventas/satelite/tiquete
   */
  venderTiqueteSatelite: async (input: VentaTiqueteInput): Promise<VentaTiqueteResult> => {
    const response = await apiClient.post<
      { success: boolean; data: TicketVenta } & Partial<VentaTiqueteResult>
    >("/ventas/satelite/tiquete", input);
    const payload = response.data;
    if (!payload || payload.success !== true || !payload.data) {
      throw new Error("No se pudo generar el tiquete.");
    }
    const puestos = payload.puestos ?? (payload.data.puesto ? [payload.data.puesto] : []);
    return {
      data: payload.data,
      tiquetes: payload.tiquetes ?? [payload.data],
      cantidad: payload.cantidad ?? payload.data.cantidad ?? (puestos.length || 1),
      total: payload.total ?? payload.data.total ?? (payload.data.valor ?? 0) * (puestos.length || 1),
      puestos,
      consolidado: payload.consolidado ?? false,
    };
  },

  /**
   * Informe de cierre de cajero: tiquetes vendidos por el cajero autenticado.
   * GET /ventas/cajero?fecha=YYYY-MM-DD
   */
  getVentasCajero: async (fecha?: string): Promise<VentaCajero[]> => {
    const response = await apiClient.get<{ success: boolean; data: VentaCajero[] }>(
      "/ventas/cajero",
      { params: fecha ? { fecha } : {} }
    );
    const payload = response.data;
    if (!payload || payload.success !== true) {
      throw new Error("No se pudieron cargar las ventas del cajero.");
    }
    return payload.data ?? [];
  },

  /**
   * Persiste el cierre de turno de la agencia satélite.
   * POST /turnos/satelite/cierre
   */
  cerrarTurnoSatelite: async (input: CierreTurnoSateliteInput): Promise<CierreTurnoSateliteResult> => {
    const response = await apiClient.post<{ success: boolean; data: CierreTurnoSateliteResult }>(
      "/turnos/satelite/cierre",
      input
    );
    const payload = response.data;
    if (!payload || payload.success !== true || !payload.data) {
      throw new Error("No se pudo guardar el cierre del turno.");
    }
    return payload.data;
  },

  /**
   * Despacha un vehículo de la agencia autenticada (POST /despacho/vehiculo).
   * Marca la ruta como despachada_ruta='1' con hora_despacho.
   */
  despacharVehiculo: async (cod_ruta: number, fecha?: string): Promise<OperacionResponse["data"]> => {
    const response = await apiClient.post<OperacionResponse>("/despacho/vehiculo", {
      cod_ruta,
      ...(fecha ? { fecha } : {}),
    });
    const payload = response.data;
    if (!payload || payload.success !== true) {
      throw new Error("No se pudo despachar el vehículo.");
    }
    return payload.data;
  },

  /**
   * Anula una ruta programada de la agencia autenticada (POST /rutas/anular).
   * Al anularse no se pueden vender tiquetes ni despachar la ruta.
   */
  anularRuta: async (cod_ruta: number, fecha?: string, motivo?: string): Promise<OperacionResponse["data"]> => {
    const response = await apiClient.post<OperacionResponse>("/rutas/anular", {
      cod_ruta,
      ...(fecha ? { fecha } : {}),
      motivo,
    });
    const payload = response.data;
    if (!payload || payload.success !== true) {
      throw new Error("No se pudo anular la ruta.");
    }
    return payload.data;
  },

  /**
   * Bitácora de anulaciones de ruta (trazabilidad / medición).
   * GET /anulaciones
   */
  getAnulaciones: async (params?: { fecha?: string; usuario?: string; limite?: number }) => {
    const { data } = await apiClient.get<{
      success: boolean;
      data: {
        totales: { total: number; hoy: number };
        anulaciones: {
          id: number;
          cod_ruta: number;
          origen_ruta: number;
          fecha_ruta: string;
          placa_vehi: string | null;
          numero_orden: string | null;
          motivo_anulacion: string;
          cedula_usuario: string | null;
          nombre_usuario: string | null;
          fecha_anulacion: string;
        }[];
      };
    }>("/anulaciones", { params });
    if (!data || data.success !== true) {
      throw new Error("No se pudo consultar la bitácora de anulaciones.");
    }
    return data.data;
  },

  /**
   * Manifiesto de despacho: lista de pasajeros (por silla) + datos de vehículo,
   * conductores, auxiliar, origen/destino y totales del cajero.
   * GET /despacho/manifiesto
   */
  getManifiestoDespacho: async (
    cod_ruta: number,
    fecha?: string
  ): Promise<ManifiestoDespacho | null> => {
    const response = await apiClient.get<{ success: boolean; data: ManifiestoDespacho }>(
      "/despacho/manifiesto",
      { params: { cod_ruta, ...(fecha ? { fecha } : {}) } }
    );
    const payload = response.data;
    if (!payload || payload.success !== true) {
      throw new Error("No se pudo cargar el manifiesto de despacho.");
    }
    return payload.data ?? null;
  },

  /**
   * Vehículos hacia mi agencia: en tránsito (despachados sin llegar) y llegados.
   * GET /llegadas/en-transito
   */
  getLlegadas: async (fecha?: string): Promise<LlegadasData> => {
    const response = await apiClient.get<{ success: boolean; data: LlegadasData }>(
      "/llegadas/en-transito",
      { params: fecha ? { fecha } : undefined }
    );
    const payload = response.data;
    if (!payload || payload.success !== true || !payload.data) {
      throw new Error("No se pudieron cargar las llegadas.");
    }
    return payload.data;
  },

  /**
   * Reporta la llegada de un vehículo despachado desde otra agencia principal.
   * POST /llegadas/reportar
   */
  reportarLlegada: async (
    cod_ruta: number,
    origen_ruta: number,
    options: { fecha?: string; fecha_llegada?: string; hora?: string; conductor?: string; novedad?: string; estado_sitio?: string } = {}
  ): Promise<OperacionResponse["data"]> => {
    const response = await apiClient.post<OperacionResponse>("/llegadas/reportar", {
      cod_ruta,
      origen_ruta,
      ...(options.fecha ? { fecha: options.fecha } : {}),
      ...(options.fecha_llegada ? { fecha_llegada: options.fecha_llegada } : {}),
      ...(options.hora ? { hora: options.hora } : {}),
      ...(options.conductor ? { conductor: options.conductor } : {}),
      ...(options.novedad ? { novedad: options.novedad } : {}),
      ...(options.estado_sitio ? { estado_sitio: options.estado_sitio } : {}),
    });
    const payload = response.data;
    if (!payload || payload.success !== true) {
      throw new Error("No se pudo reportar la llegada.");
    }
    return payload.data;
  },

  /**
   * Catálogos para el formulario de nueva ruta.
   * GET /orides, /conductores, /vehiculos
   */
  getOrides: async (): Promise<OridesOption[]> => {
    const response = await apiClient.get<OridesOption[]>("/orides", { params: { limit: 500 } });
    return response.data;
  },
  /** Destinos filtrados: agencia_orides='1' y desc_orides <> 'MANTENIN' */
  getDestinosFiltrados: async (): Promise<OridesOption[]> => {
    const all = await travelsoftService.getOrides();
    return all.filter(
      (o) =>
        String(o.agencia_orides ?? "0") === "1" &&
        (o.desc_orides ?? "").trim() !== "" &&
        (o.desc_orides ?? "").trim().toUpperCase() !== "MANTENIN",
    );
  },
  /** Horarios de salida (GET /horario/) — campos hora_horario (display) y hora_time (valor HH:MM:SS) */
  getHorarios: async (): Promise<HorarioOption[]> => {
    const response = await apiClient.get<HorarioOption[]>("/horario/", { params: { limit: 500 } });
    return response.data;
  },
  /** Conduces / N° de conduce de documento de tránsito (GET /conduces/). */
  getConduces: async (): Promise<ConduceOption[]> => {
    const response = await apiClient.get<ConduceOption[]>("/conduces/", { params: { limit: 500 } });
    return response.data;
  },
  getConductores: async (): Promise<ConductorOption[]> => {
    const response = await apiClient.get<ConductorOption[]>("/conductores", { params: { limit: 500 } });
    return response.data;
  },
  /** Lista de vehículos para dropdowns/selects (GET /vehiculos). */
  getVehiculosDropdown: async (): Promise<VehiculoOption[]> => {
    const response = await apiClient.get<VehiculoOption[]>("/vehiculos", { params: { limit: 500 } });
    return response.data;
  },
  /** Conductores asociados a un vehículo (GET /vehiculos/{placa}/conductores). */
  getConductoresVehiculo: async (placa: string): Promise<VehiculoConductoresRespuesta> => {
    const response = await apiClient.get<VehiculoConductoresRespuesta>(
      `/vehiculos/${encodeURIComponent(placa)}/conductores`
    );
    return response.data;
  },
  /** Destinos válidos según recorridos activos desde un origen (GET /recorridos/destinos). */
  getRecorridoDestinos: async (origen: number): Promise<OridesOption[]> => {
    const response = await apiClient.get<OridesOption[]>("/recorridos/destinos", { params: { origen } });
    return response.data;
  },
  /** Lista de recorridos (Id_recorrido + desc_recorrido + origen/destino/sentido). */
  getRecorridos: async (): Promise<RecorridoOption[]> => {
    const response = await apiClient.get<RecorridoOption[]>("/recorridos", { params: { limit: 500 } });
    return response.data;
  },

  /**
   * Crea una nueva ruta (estado "por despachar") para la agencia del usuario.
   * POST /rutas/crear
   */
  crearRuta: async (input: RutaCreateInput): Promise<Record<string, unknown>> => {
    const response = await apiClient.post<OperacionResponse>("/rutas/crear", input);
    const payload = response.data;
    if (!payload || payload.success !== true) {
      throw new Error("No se pudo crear la ruta.");
    }
    return payload.data || {};
  },

  /**
   * Croquis de sillas de un vehículo "por despachar" de la agencia.
   * GET /ventas/sillas?cod_ruta=&fecha=
   */
  getSillas: async (cod_ruta: number, fecha?: string): Promise<SillasData> => {
    const response = await apiClient.get<{ success: boolean; data: SillasData }>("/ventas/sillas", {
      params: { cod_ruta, ...(fecha ? { fecha } : {}) },
    });
    const payload = response.data;
    if (!payload || payload.success !== true || !payload.data) {
      throw new Error("No se pudieron cargar las sillas del vehículo.");
    }
    return payload.data;
  },

  /**
   * Consulta un pasajero por su número de identificación (GET /ventas/pasajero).
   * Devuelve null si el pasajero no existe (se creará al generar el tiquete).
   */
  getPasajero: async (documento: string): Promise<PasajeroInfo | null> => {
    const response = await apiClient.get<{ success: boolean; data: { pasajero: PasajeroInfo | null } }>(
      "/ventas/pasajero",
      { params: { documento: documento.trim() } }
    );
    const payload = response.data;
    if (!payload || payload.success !== true || !payload.data) {
      throw new Error("No se pudo consultar el pasajero.");
    }
    return payload.data.pasajero;
  },

  /**
   * Genera la venta de un tiquete y devuelve los datos para su impresión.
   * POST /ventas/tiquete
   */
  venderTiquete: async (input: VentaTiqueteInput): Promise<VentaTiqueteResult> => {
    const response = await apiClient.post<{ success: boolean; data: TicketVenta; tiquetes?: TicketVenta[] }>(
      "/ventas/tiquete",
      input
    );
    const payload = response.data;
    if (!payload || payload.success !== true || !payload.data) {
      throw new Error("No se pudo generar el tiquete.");
    }
    const data = payload.data;
    const tiquetes = payload.tiquetes ?? [data];
    const cantidad = data.cantidad ?? tiquetes.length;
    const total = data.total ?? (Number(data.valor || 0) * tiquetes.length);
    return {
      data,
      tiquetes,
      cantidad,
      total,
      puestos: data.puestos ?? (data.puesto ? [data.puesto] : []),
      consolidado: data.consolidado === true,
    };
  },

  /**
   * Estado de la impresora térmica USB conectada al servidor (pyusb).
   * GET /impresion/estado
   */
  getEstadoImpresora: async (): Promise<EstadoImpresora> => {
    const response = await apiClient.get<{ success: boolean; data: EstadoImpresora }>("/impresion/estado");
    const payload = response.data;
    if (!payload || payload.success !== true || !payload.data) {
      throw new Error("No se pudo consultar el estado de la impresora.");
    }
    return payload.data;
  },

  /**
   * Imprime el tiquete ESC/POS en la impresora USB del servidor sin
   * intervención del usuario (pyusb). POST /impresion/ticket
   */
  imprimirTicketEscPos: async (texto: string, copias = 1): Promise<ImprimirTicketResult> => {
    const response = await apiClient.post<{ success: boolean; data: ImprimirTicketResult }>(
      "/impresion/ticket",
      { texto, copias }
    );
    const payload = response.data;
    if (!payload || payload.success !== true || !payload.data) {
      throw new Error("No se pudo imprimir el tiquete.");
    }
    return payload.data;
  },

  /**
   * Resoluciones de facturación DIAN de una agencia.
   * GET /resoluciones/agencia — el parámetro `agencia` solo aplica para SUPERADMIN.
   */
  getResoluciones: async (agencia?: number): Promise<Resolucion[]> => {
    const response = await apiClient.get<{ success: boolean; data: Resolucion[] }>(
      "/resoluciones/agencia",
      { params: agencia ? { agencia } : undefined }
    );
    const payload = response.data;
    if (!payload || payload.success !== true || !payload.data) {
      throw new Error("No se pudieron cargar las resoluciones DIAN.");
    }
    return payload.data;
  },

  /**
   * Crea una resolución de facturación DIAN. POST /resoluciones/agencia
   */
  crearResolucion: async (input: ResolucionInput): Promise<Resolucion> => {
    const response = await apiClient.post<{ success: boolean; data: Resolucion }>(
      "/resoluciones/agencia",
      input
    );
    const payload = response.data;
    if (!payload || payload.success !== true || !payload.data) {
      throw new Error("No se pudo crear la resolución.");
    }
    return payload.data;
  },

  /**
   * Actualiza una resolución de facturación DIAN. PUT /resoluciones/agencia/{id}
   */
  actualizarResolucion: async (id: number, input: ResolucionInput): Promise<Resolucion> => {
    const response = await apiClient.put<{ success: boolean; data: Resolucion }>(
      `/resoluciones/agencia/${id}`,
      input
    );
    const payload = response.data;
    if (!payload || payload.success !== true || !payload.data) {
      throw new Error("No se pudo actualizar la resolución.");
    }
    return payload.data;
  },

  /**
   * Elimina una resolución de facturación DIAN. DELETE /resoluciones/agencia/{id}
   */
  eliminarResolucion: async (id: number, agencia?: number): Promise<void> => {
    const response = await apiClient.delete<{ success: boolean }>(`/resoluciones/agencia/${id}`, {
      ...(agencia ? { params: { agencia } } : {}),
    });
    const payload = response.data;
     if (!payload || payload.success !== true) {
       throw new Error("No se pudo eliminar la resolución.");
     }
   },

  // ── CRUD de usuarios (tabla `usuario` vía router genérico /api/v1/usuario/) ──

  /** Lista todos los usuarios con el nombre de su agencia (GET /usuario/). */
  getUsuarios: async (): Promise<UsuarioSACTelConAgencia[]> => {
    const response = await apiClient.get<UsuarioSACTel[]>("/usuario/", { params: { limit: 500 } });
    const raw = Array.isArray(response.data) ? response.data : [];
    const orides = await travelsoftService.getOrides();
    const mapaOrides = new Map(orides.map((o) => [o.id_orides, o.desc_orides]));
    return raw.map((u) => ({
      ...u,
      agencia: mapaOrides.get(u.id_orides) || String(u.id_orides),
    }));
  },

   /** Obtiene un usuario por su cédula (GET /usuario/{cedula}). */
   getUsuarioLocal: async (cedula: string): Promise<UsuarioSACTel> => {
     const response = await apiClient.get<UsuarioSACTel>(`/usuario/${cedula}`);
     return response.data;
   },

  /** Crea un nuevo usuario (POST /usuario/). */
  crearUsuario: async (input: UsuarioCreateInput): Promise<UsuarioSACTel> => {
    const response = await apiClient.post<UsuarioSACTel>("/usuario/", input);
    return response.data;
  },

  /** Actualiza un usuario existente (PUT /usuario/{cedula}). */
  actualizarUsuario: async (cedula: string, input: UsuarioUpdateInput): Promise<UsuarioSACTel> => {
    const response = await apiClient.put<UsuarioSACTel>(`/usuario/${cedula}`, input);
    return response.data;
  },

  /** Bloquea o desbloquea un usuario cambiando `estado_usuario` (PUT /usuario/{cedula}). */
  toggleUsuarioBloqueado: async (cedula: string, estado: EstadoUsuario): Promise<UsuarioSACTel> => {
    const response = await apiClient.put<UsuarioSACTel>(`/usuario/${cedula}`, { estado_usuario: estado });
    return response.data;
  },

  /** Cambia la clave de un usuario (PUT /usuario/{cedula}). */
  cambiarClaveUsuario: async (cedula: string, nuevaClave: string): Promise<UsuarioSACTel> => {
    const response = await apiClient.put<UsuarioSACTel>(`/usuario/${cedula}`, { clave_usuario: nuevaClave });
    return response.data;
  },

  // ── CRUD de vehículos (tabla `vehiculo` vía router genérico /api/v1/vehiculo/) ──

  /** Lista los tipos de servicio disponibles para programar una ruta (GET /rutas/tipos). */
  getRutasTipos: async (): Promise<RutaTipoOption[]> => {
    const response = await apiClient.get<RutaTipoOption[]>("/rutas/tipos");
    return Array.isArray(response.data) ? response.data : [];
  },

  /** Lee la configuración de impresión de tiquetes de los parámetros del sistema (GET /parametros/tickets). */
  getParametrosTickets: async (): Promise<ParametrosTickets> => {
    const response = await apiClient.get<{ success: boolean; data: ParametrosTickets }>("/parametros/tickets");
    const payload = response.data;
    if (!payload || payload.success !== true || !payload.data) {
      throw new Error("No se pudo leer la configuración de tiquetes.");
    }
    return payload.data;
  },

  /** Guarda la configuración de impresión de tiquetes (PUT /parametros/tickets). */
  setParametrosTickets: async (tiquete_consolidado: string): Promise<ParametrosTickets> => {
    const response = await apiClient.put<{ success: boolean; data: ParametrosTickets }>(
      "/parametros/tickets",
      { tiquete_consolidado }
    );
    const payload = response.data;
    if (!payload || payload.success !== true || !payload.data) {
      throw new Error("No se pudo guardar la configuración de tiquetes.");
    }
    return payload.data;
  },

  /** Lista todos los vehículos de la flota SACTel (GET /vehiculo/). */
  getFlotaVehiculos: async (limit = 500): Promise<VehiculoSACTel[]> => {
    const response = await apiClient.get<VehiculoSACTel[]>("/vehiculo/", { params: { limit } });
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Vehículos que pueden programarse en la agencia dada: están en estado
   * operativo (no inactivo, no bloqueado, no fuera de servicio) y disponibles
   * en esa agencia (origen_siguiente = agencia).
   */
  getVehiculosDisponiblesAgencia: async (agenciaId: number): Promise<VehiculoSACTel[]> => {
    const flota = await travelsoftService.getFlotaVehiculos(500);
    const idAgencia = Number(agenciaId);
    return flota.filter((v) => {
      const operativoOk =
        (v.estado_vehi ?? '1') === '1' &&
        (v.bloqueo_vehi ?? '0') !== '1' &&
        (v.fuera_servicio ?? '0') !== '1';
      const disponibleEnAgencia = v.origen_siguiente !== null && v.origen_siguiente !== undefined && Number(v.origen_siguiente) === idAgencia;
      return operativoOk && disponibleEnAgencia;
    }).sort((a, b) => (a.placa_vehi || '').localeCompare(b.placa_vehi || ''));
  },

  /** Obtiene un vehículo por placa (GET /vehiculo/{placa}). */
  getVehiculo: async (placa: string): Promise<VehiculoSACTel> => {
    const response = await apiClient.get<VehiculoSACTel>(`/vehiculo/${encodeURIComponent(placa)}`);
    return response.data;
  },

  /** Crea un nuevo vehículo (POST /vehiculo/). */
  crearVehiculo: async (input: VehiculoCreateInput): Promise<{ message: string; id?: number }> => {
    const response = await apiClient.post<{ message: string; id?: number }>("/vehiculo/", input);
    return response.data;
  },

  /** Actualiza un vehículo por placa (PUT /vehiculo/{placa}). */
  actualizarVehiculo: async (placa: string, input: VehiculoUpdateInput): Promise<{ message: string }> => {
    const response = await apiClient.put<{ message: string }>(`/vehiculo/${encodeURIComponent(placa)}`, input);
    return response.data;
  },

  /** Bloquea o desbloquea un vehículo cambiando `bloqueo_vehi` (PUT /vehiculo/{placa}). */
  toggleVehiculoBloqueado: async (placa: string, bloqueado: boolean, observacion = ''): Promise<{ message: string }> => {
    const response = await apiClient.put<{ message: string }>(`/vehiculo/${encodeURIComponent(placa)}`, {
      bloqueo_vehi: bloqueado ? '1' : '0',
      observacion_bloqueo: observacion,
    });
    return response.data;
  },

  // ── CRUD de conductores (tabla `conductores` vía router /api/v1/conductores) ──

  /** Lista todos los conductores de la base SACTel (GET /conductores). */
  getFlotaConductores: async (limit = 500): Promise<ConductorSACTel[]> => {
    const response = await apiClient.get<ConductorSACTel[]>("/conductores", { params: { limit } });
    return Array.isArray(response.data) ? response.data : [];
  },

  /** Obtiene un conductor por su cédula (GET /conductores/{cedula}). */
  getConductor: async (cedula: string): Promise<ConductorSACTel> => {
    const response = await apiClient.get<ConductorSACTel>(`/conductores/${encodeURIComponent(cedula)}`);
    return response.data;
  },

  /** Crea un nuevo conductor (POST /conductores). */
  crearConductor: async (input: ConductorCreateInput): Promise<{ message: string; id?: number }> => {
    const response = await apiClient.post<{ message: string; id?: number }>("/conductores", input);
    return response.data;
  },

  /** Actualiza un conductor por cédula (PUT /conductores/{cedula}). */
  actualizarConductor: async (cedula: string, input: ConductorUpdateInput): Promise<{ message: string }> => {
    const response = await apiClient.put<{ message: string }>(`/conductores/${encodeURIComponent(cedula)}`, input);
    return response.data;
  },

  /** Bloquea o desbloquea un conductor cambiando `estado_conduc` (PUT /conductores/{cedula}). */
  toggleConductorBloqueado: async (cedula: string, bloqueado: boolean): Promise<{ message: string }> => {
    const response = await apiClient.put<{ message: string }>(`/conductores/${encodeURIComponent(cedula)}`, {
      estado_conduc: bloqueado ? '0' : '1',
    });
    return response.data;
  },

  // ── Consulta de pasajeros y sus viajes (solo lectura) ─────────────────

  /** Lista todos los pasajeros registrados (GET /pasajero/). */
  getPasajeros: async (limit = 500): Promise<PasajeroSACTel[]> => {
    const response = await apiClient.get<PasajeroSACTel[]>("/pasajero/", { params: { limit } });
    return Array.isArray(response.data) ? response.data : [];
  },

  /** Consulta los viajes de un pasajero por su cédula (GET /planillas/ + filtro local). */
  getViajesPasajero: async (cedula: string, limit = 500): Promise<ViajePasajero[]> => {
    const response = await apiClient.get<ViajePasajero[]>("/planillas/", { params: { limit } });
    const raw = Array.isArray(response.data) ? response.data : [];
    const target = (cedula || '').trim();
    if (!target) return raw;
    return raw.filter((v) => {
      const c = v?.cedula_pasajero || '';
      return c.trim() === target;
    });
  },
};
