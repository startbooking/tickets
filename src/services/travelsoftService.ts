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
  destino_ruta: number | null;
  fecha_ruta: string | null;
  placa_vehi: string | null;
  destino: string | null;
  hora_ruta: number | null;
  habilitada_ruta: string | null;
  despachada_ruta: string | null;
  llegada_ruta: string | null;
  hora_despacho: string | null;
  hora_llegada: string | null;
  conductor: string | null;
  capacidad: number | null;
  tickets_vendidos?: number | null;
  estado_sitio?: string | null;
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
// Agencias satélite: ciudades intermedias por las que pasa la ruta.
// Venden tiquetes de los vehículos que pasan hoy por su ciudad; NO programan
// viajes ni reportan salida/llegada (no tienen vehículos en parqueadero).
// ────────────────────────────────────────────────────────────────────────────

export interface SateliteSegmento {
  destino_ruta: number;
  destino: string | null;
  valor: number | null;
}

export type EstadoVehiculoSatelite = 'POR_DESPACHAR' | 'EN_TRANSITO' | 'LLEGADO';

export interface SateliteVehiculo {
  cod_ruta: number;
  fecha_ruta: string | null;
  placa_vehi: string | null;
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
}

export interface ConductorOption {
  cedula_conduc: string;
  nombre_conduc: string;
  estado_conduc?: string;
}

export interface VehiculoOption {
  placa_vehi: string;
  orden_vehi?: string;
  modelo_vehi?: number | null;
  marca_vehi?: string | null;
  pasajeros_vehi?: number | null;
  estado_vehi?: string;
}

export interface RutaCreateInput {
  destino_ruta: number;
  hora_ruta: number;
  hora_programada?: string;
  placa_vehi: string;
  cedula_conduc?: string;
  cedula_conduc2?: string;
  cedula_auxi?: string;
  conduce_ruta?: string;
  fecha_ruta?: string;
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
  // Campos DIAN (numeración por resolución de facturación)
  consecutivo_factura?: number;
  numero_factura?: string;
  resolucion_numero?: string;
  nit_emisor?: string;
  // Campos DIAN (firma electrónica del Core SACTel)
  cufe?: string;
  qr_dian?: string;
  qr_code_url?: string;
}

export interface Resolucion {
  id_resolucion: number;
  id_orides: number;
  numero_resolucion: string;
  prefijo?: string | null;
  rango_inicial?: number | null;
  rango_final?: number | null;
  consecutivo_actual: number;
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

// Roles que entiende el frontend (App.tsx / ProtectedRoute)
export type AppRol = "SUPERADMIN" | "ADMIN_AGENCIA" | "CAJERO" | "DESPACHADOR";

export const DASHBOARD_POR_ROL: Record<AppRol, string> = {
  SUPERADMIN: "/superadmin/dashboard",
  ADMIN_AGENCIA: "/agencia",
  CAJERO: "/cajero/dashboard",
  DESPACHADOR: "/despachador",
};

// Mapeo histórico de TravelSoft: nivel_usuario -> rol del frontend
// 10=SUPERADMIN, 5=ADMIN(agencia), 2=CAJERO, 0=DESPACHADOR
const ROL_POR_NIVEL: Record<number, AppRol> = {
  10: "SUPERADMIN",
  5: "ADMIN_AGENCIA",
  2: "CAJERO",
  0: "DESPACHADOR",
};

const ROL_BACKEND_A_APP: Record<string, AppRol> = {
  SUPERADMIN: "SUPERADMIN",
  ADMIN: "ADMIN_AGENCIA",
  AGENCIA: "ADMIN_AGENCIA",
  CAJERO: "CAJERO",
  DESPACHADOR: "DESPACHADOR",
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
 * Convierte minutos desde medianoche (hora_ruta de TravelSoft) a "HH:MM".
 */
export function formatHora(minutos: number | null | undefined): string {
  const total = Number(minutos);
  if (minutos === null || minutos === undefined || Number.isNaN(total)) {
    return "—";
  }
  const h = Math.floor(total / 60).toString().padStart(2, "0");
  const m = Math.floor(total % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
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
  getUsuario: async (cedula: string): Promise<TravelsoftUser> => {
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
   * POST /ventas/satelite/tiquete
   */
  venderTiqueteSatelite: async (input: VentaTiqueteInput): Promise<TicketVenta> => {
    const response = await apiClient.post<{ success: boolean; data: TicketVenta }>(
      "/ventas/satelite/tiquete",
      input
    );
    const payload = response.data;
    if (!payload || payload.success !== true || !payload.data) {
      throw new Error("No se pudo generar el tiquete.");
    }
    return payload.data;
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
  getConductores: async (): Promise<ConductorOption[]> => {
    const response = await apiClient.get<ConductorOption[]>("/conductores", { params: { limit: 500 } });
    return response.data;
  },
  getVehiculos: async (): Promise<VehiculoOption[]> => {
    const response = await apiClient.get<VehiculoOption[]>("/vehiculos", { params: { limit: 500 } });
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
  venderTiquete: async (input: VentaTiqueteInput): Promise<TicketVenta> => {
    const response = await apiClient.post<{ success: boolean; data: TicketVenta }>("/ventas/tiquete", input);
    const payload = response.data;
    if (!payload || payload.success !== true || !payload.data) {
      throw new Error("No se pudo generar el tiquete.");
    }
    return payload.data;
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
};
