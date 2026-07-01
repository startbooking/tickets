// ============================================
// MOCK DATA - Para desarrollo frontend sin backend
// ============================================

import { 
  Municipio, 
  Empresa, 
  Ruta, 
  Conductor, 
  Bus, 
  PlanillaDespacho, 
  Pasajero,
  Ticket,
  Usuario,
  Tablet
} from '@/types';

// ============================================
// MUNICIPIOS (15 ciudades principales)
// ============================================
export const mockMunicipios: Municipio[] = [
  { id: 1, nombre: 'Bogotá', departamento: 'Cundinamarca', activo: true },
  { id: 2, nombre: 'Medellín', departamento: 'Antioquia', activo: true },
  { id: 3, nombre: 'Cali', departamento: 'Valle del Cauca', activo: true },
  { id: 4, nombre: 'Barranquilla', departamento: 'Atlántico', activo: true },
  { id: 5, nombre: 'Cartagena', departamento: 'Bolívar', activo: true },
  { id: 6, nombre: 'Bucaramanga', departamento: 'Santander', activo: true },
  { id: 7, nombre: 'Pereira', departamento: 'Risaralda', activo: true },
  { id: 8, nombre: 'Santa Marta', departamento: 'Magdalena', activo: true },
  { id: 9, nombre: 'Manizales', departamento: 'Caldas', activo: true },
  { id: 10, nombre: 'Cúcuta', departamento: 'Norte de Santander', activo: true },
  { id: 11, nombre: 'Ibagué', departamento: 'Tolima', activo: true },
  { id: 12, nombre: 'Villavicencio', departamento: 'Meta', activo: true },
  { id: 13, nombre: 'Pasto', departamento: 'Nariño', activo: true },
  { id: 14, nombre: 'Neiva', departamento: 'Huila', activo: true },
  { id: 15, nombre: 'Armenia', departamento: 'Quindío', activo: true },
];

// ============================================
// EMPRESAS (4 empresas de transporte)
// ============================================
export const mockEmpresas: Empresa[] = [
  { id: 1, nit: '900123456-1', razonSocial: 'Transportes del Norte S.A.', activo: true },
  { id: 2, nit: '900789012-3', razonSocial: 'Flota Nacional Ltda.', activo: true },
  { id: 3, nit: '800456789-2', razonSocial: 'Copetran S.A.', activo: true },
  { id: 4, nit: '860321654-7', razonSocial: 'Expreso Bolivariano S.A.', activo: true },
];

// ============================================
// CONDUCTORES (12 conductores)
// ============================================
export const mockConductores: Conductor[] = [
  { id: 1, numeroDocumento: '79123456', nombreCompleto: 'Carlos Ramírez García', licenciaNumero: 'C1-12345', activo: true },
  { id: 2, numeroDocumento: '79654321', nombreCompleto: 'José Martínez López', licenciaNumero: 'C1-67890', activo: true },
  { id: 3, numeroDocumento: '80112233', nombreCompleto: 'Luis Fernando Gómez', licenciaNumero: 'C1-11223', activo: true },
  { id: 4, numeroDocumento: '79445566', nombreCompleto: 'Andrés Felipe Rojas', licenciaNumero: 'C1-44556', activo: true },
  { id: 5, numeroDocumento: '80778899', nombreCompleto: 'Pedro Pablo Hernández', licenciaNumero: 'C1-77889', activo: true },
  { id: 6, numeroDocumento: '79001122', nombreCompleto: 'Miguel Ángel Torres', licenciaNumero: 'C1-00112', activo: true },
  { id: 7, numeroDocumento: '80334455', nombreCompleto: 'Ricardo Sánchez Pérez', licenciaNumero: 'C1-33445', activo: true },
  { id: 8, numeroDocumento: '79667788', nombreCompleto: 'Fernando Castro Díaz', licenciaNumero: 'C1-66778', activo: true },
  { id: 9, numeroDocumento: '80990011', nombreCompleto: 'Jorge Alberto Vargas', licenciaNumero: 'C1-99001', activo: true },
  { id: 10, numeroDocumento: '79223344', nombreCompleto: 'William Moreno Cruz', licenciaNumero: 'C1-22334', activo: true },
  { id: 11, numeroDocumento: '80556677', nombreCompleto: 'Héctor Julio Ospina', licenciaNumero: 'C1-55667', activo: true },
  { id: 12, numeroDocumento: '79889900', nombreCompleto: 'Gustavo Adolfo Ríos', licenciaNumero: 'C1-88990', activo: false },
];

// ============================================
// RUTAS (12 rutas intermunicipales)
// ============================================
export const mockRutas: Ruta[] = [
  { id: 1, municipioOrigenId: 1, municipioDestinoId: 2, valorTarifa: 85000, distanciaKm: 420, tiempoEstimadoMinutos: 540, activo: true, municipioOrigen: mockMunicipios[0], municipioDestino: mockMunicipios[1] },
  { id: 2, municipioOrigenId: 1, municipioDestinoId: 3, valorTarifa: 95000, distanciaKm: 480, tiempoEstimadoMinutos: 600, activo: true, municipioOrigen: mockMunicipios[0], municipioDestino: mockMunicipios[2] },
  { id: 3, municipioOrigenId: 1, municipioDestinoId: 4, valorTarifa: 120000, distanciaKm: 980, tiempoEstimadoMinutos: 1080, activo: true, municipioOrigen: mockMunicipios[0], municipioDestino: mockMunicipios[3] },
  { id: 4, municipioOrigenId: 1, municipioDestinoId: 6, valorTarifa: 65000, distanciaKm: 380, tiempoEstimadoMinutos: 480, activo: true, municipioOrigen: mockMunicipios[0], municipioDestino: mockMunicipios[5] },
  { id: 5, municipioOrigenId: 2, municipioDestinoId: 3, valorTarifa: 75000, distanciaKm: 350, tiempoEstimadoMinutos: 420, activo: true, municipioOrigen: mockMunicipios[1], municipioDestino: mockMunicipios[2] },
  { id: 6, municipioOrigenId: 2, municipioDestinoId: 7, valorTarifa: 35000, distanciaKm: 180, tiempoEstimadoMinutos: 240, activo: true, municipioOrigen: mockMunicipios[1], municipioDestino: mockMunicipios[6] },
  { id: 7, municipioOrigenId: 3, municipioDestinoId: 13, valorTarifa: 55000, distanciaKm: 280, tiempoEstimadoMinutos: 360, activo: true, municipioOrigen: mockMunicipios[2], municipioDestino: mockMunicipios[12] },
  { id: 8, municipioOrigenId: 4, municipioDestinoId: 5, valorTarifa: 25000, distanciaKm: 120, tiempoEstimadoMinutos: 150, activo: true, municipioOrigen: mockMunicipios[3], municipioDestino: mockMunicipios[4] },
  { id: 9, municipioOrigenId: 4, municipioDestinoId: 8, valorTarifa: 20000, distanciaKm: 100, tiempoEstimadoMinutos: 120, activo: true, municipioOrigen: mockMunicipios[3], municipioDestino: mockMunicipios[7] },
  { id: 10, municipioOrigenId: 1, municipioDestinoId: 11, valorTarifa: 45000, distanciaKm: 200, tiempoEstimadoMinutos: 300, activo: true, municipioOrigen: mockMunicipios[0], municipioDestino: mockMunicipios[10] },
  { id: 11, municipioOrigenId: 1, municipioDestinoId: 12, valorTarifa: 38000, distanciaKm: 120, tiempoEstimadoMinutos: 180, activo: true, municipioOrigen: mockMunicipios[0], municipioDestino: mockMunicipios[11] },
  { id: 12, municipioOrigenId: 6, municipioDestinoId: 10, valorTarifa: 32000, distanciaKm: 190, tiempoEstimadoMinutos: 240, activo: true, municipioOrigen: mockMunicipios[5], municipioDestino: mockMunicipios[9] },
];

// ============================================
// BUSES (15 buses de la flota)
// Cada bus tiene conductores asociados (varios conductores pueden estar asignados a un solo bus)
// ============================================
export const mockBuses: Bus[] = [
  { id: 1, placa: 'ABC-123', capacidad: 40, marca: 'Mercedes-Benz', modelo: 'OF-1721', estado: 'DESPACHADO', conductorAsignado: mockConductores[0], conductoresAsociados: [mockConductores[0], mockConductores[1]] },
  { id: 2, placa: 'DEF-456', capacidad: 42, marca: 'Volvo', modelo: 'B7R', estado: 'DESPACHADO', conductorAsignado: mockConductores[1], conductoresAsociados: [mockConductores[1], mockConductores[2], mockConductores[3]] },
  { id: 3, placa: 'GHI-789', capacidad: 38, marca: 'Scania', modelo: 'K310', estado: 'DESPACHADO', conductorAsignado: mockConductores[2], conductoresAsociados: [mockConductores[2], mockConductores[4]] },
  { id: 4, placa: 'JKL-012', capacidad: 45, marca: 'Mercedes-Benz', modelo: 'O-500', estado: 'DESPACHADO', conductorAsignado: mockConductores[3], conductoresAsociados: [mockConductores[3], mockConductores[5], mockConductores[6]] },
  { id: 5, placa: 'MNO-345', capacidad: 40, marca: 'Volvo', modelo: 'B9R', estado: 'EN_RUTA', conductorAsignado: mockConductores[4], conductoresAsociados: [mockConductores[4], mockConductores[7]] },
  { id: 6, placa: 'PQR-678', capacidad: 42, marca: 'Marcopolo', modelo: 'Paradiso', estado: 'DISPONIBLE', conductorAsignado: undefined, conductoresAsociados: [mockConductores[5], mockConductores[6], mockConductores[8]] },
  { id: 7, placa: 'STU-901', capacidad: 38, marca: 'Scania', modelo: 'K360', estado: 'DISPONIBLE', conductorAsignado: undefined, conductoresAsociados: [mockConductores[7], mockConductores[9]] },
  { id: 8, placa: 'VWX-234', capacidad: 44, marca: 'Mercedes-Benz', modelo: 'O-400', estado: 'MANTENIMIENTO', conductorAsignado: mockConductores[7], conductoresAsociados: [mockConductores[7], mockConductores[10]] },
  { id: 9, placa: 'YZA-567', capacidad: 40, marca: 'Volvo', modelo: 'B12R', estado: 'DISPONIBLE', conductorAsignado: undefined, conductoresAsociados: [mockConductores[8], mockConductores[9], mockConductores[10]] },
  { id: 10, placa: 'BCD-890', capacidad: 42, marca: 'Irizar', modelo: 'i6', estado: 'DESPACHADO', conductorAsignado: mockConductores[5], conductoresAsociados: [mockConductores[5], mockConductores[0]] },
  { id: 11, placa: 'EFG-123', capacidad: 38, marca: 'Busscar', modelo: 'Panorámico', estado: 'EN_RUTA', conductorAsignado: mockConductores[6], conductoresAsociados: [mockConductores[6], mockConductores[1]] },
  { id: 12, placa: 'HIJ-456', capacidad: 45, marca: 'Mercedes-Benz', modelo: 'OF-1724', estado: 'DISPONIBLE', conductorAsignado: undefined, conductoresAsociados: [mockConductores[2], mockConductores[3], mockConductores[4]] },
  { id: 13, placa: 'KLM-789', capacidad: 40, marca: 'Volvo', modelo: 'B8R', estado: 'INACTIVO', conductorAsignado: undefined, conductoresAsociados: [] },
  { id: 14, placa: 'NOP-012', capacidad: 42, marca: 'Scania', modelo: 'K380', estado: 'DESPACHADO', conductorAsignado: mockConductores[8], conductoresAsociados: [mockConductores[8], mockConductores[9]] },
  { id: 15, placa: 'QRS-345', capacidad: 38, marca: 'Marcopolo', modelo: 'Viaggio', estado: 'DISPONIBLE', conductorAsignado: undefined, conductoresAsociados: [mockConductores[10], mockConductores[0], mockConductores[1]] },
];

// ============================================
// USUARIOS (10 usuarios del sistema)
// ============================================
export const mockUsuarios: Usuario[] = [
  { id: 1, numeroDocumento: '1010123456', nombreCompleto: 'Juan Pérez Vendedor', email: 'juan.perez@transporte.com', telefono: '3001234567', tipoVinculacion: 'EMPLEADO', municipio: mockMunicipios[0], empresa: mockEmpresas[0], activo: true },
  { id: 2, numeroDocumento: '1020234567', nombreCompleto: 'María García López', email: 'maria.garcia@transporte.com', telefono: '3012345678', tipoVinculacion: 'EMPLEADO', municipio: mockMunicipios[0], empresa: mockEmpresas[0], activo: true },
  { id: 3, numeroDocumento: '1030345678', nombreCompleto: 'Carlos Rodríguez Díaz', email: 'carlos.rodriguez@transporte.com', telefono: '3023456789', tipoVinculacion: 'EMPLEADO', municipio: mockMunicipios[1], empresa: mockEmpresas[1], activo: true },
  { id: 4, numeroDocumento: '1040456789', nombreCompleto: 'Ana Martínez Ruiz', email: 'ana.martinez@transporte.com', telefono: '3034567890', tipoVinculacion: 'EMPLEADO', municipio: mockMunicipios[2], empresa: mockEmpresas[2], activo: true },
  { id: 5, numeroDocumento: '1050567890', nombreCompleto: 'Pedro Sánchez Torres', email: 'pedro.sanchez@concesion.com', telefono: '3045678901', tipoVinculacion: 'CONCESION', municipio: mockMunicipios[0], empresa: mockEmpresas[3], activo: true },
  { id: 6, numeroDocumento: '1060678901', nombreCompleto: 'Laura Gómez Vargas', email: 'laura.gomez@concesion.com', telefono: '3056789012', tipoVinculacion: 'CONCESION', municipio: mockMunicipios[1], empresa: mockEmpresas[3], activo: true },
  { id: 7, numeroDocumento: '1070789012', nombreCompleto: 'Andrés López Mendoza', email: 'andres.lopez@transporte.com', telefono: '3067890123', tipoVinculacion: 'EMPLEADO', municipio: mockMunicipios[3], empresa: mockEmpresas[0], activo: true },
  { id: 8, numeroDocumento: '1080890123', nombreCompleto: 'Sandra Castro Ríos', email: 'sandra.castro@transporte.com', telefono: '3078901234', tipoVinculacion: 'EMPLEADO', municipio: mockMunicipios[4], empresa: mockEmpresas[1], activo: true },
  { id: 9, numeroDocumento: '1090901234', nombreCompleto: 'Diego Hernández Paz', email: 'diego.hernandez@concesion.com', telefono: '3089012345', tipoVinculacion: 'CONCESION', municipio: mockMunicipios[5], empresa: mockEmpresas[2], activo: false },
  { id: 10, numeroDocumento: '1100012345', nombreCompleto: 'Patricia Moreno Silva', email: 'patricia.moreno@transporte.com', telefono: '3090123456', tipoVinculacion: 'EMPLEADO', municipio: mockMunicipios[6], empresa: mockEmpresas[0], activo: true },
];

// Usuario actual (para sesión)
export const mockUsuario: Usuario = mockUsuarios[0];

// ============================================
// TABLETS (8 dispositivos registrados)
// ============================================
export const mockTablets: Tablet[] = [
  { id: 1, codigoDispositivo: 'TAB-BOG-001', marca: 'Samsung', modelo: 'Galaxy Tab A8', imei: '354678901234567', municipioAsignado: mockMunicipios[0], usuarioActual: mockUsuarios[0], activo: true, ultimaConexion: '2024-01-15T08:30:00' },
  { id: 2, codigoDispositivo: 'TAB-BOG-002', marca: 'Samsung', modelo: 'Galaxy Tab A7', imei: '354678901234568', municipioAsignado: mockMunicipios[0], usuarioActual: mockUsuarios[1], activo: true, ultimaConexion: '2024-01-15T07:45:00' },
  { id: 3, codigoDispositivo: 'TAB-MED-001', marca: 'Lenovo', modelo: 'Tab M10', imei: '354678901234569', municipioAsignado: mockMunicipios[1], usuarioActual: mockUsuarios[2], activo: true, ultimaConexion: '2024-01-15T09:00:00' },
  { id: 4, codigoDispositivo: 'TAB-CAL-001', marca: 'Samsung', modelo: 'Galaxy Tab A8', imei: '354678901234570', municipioAsignado: mockMunicipios[2], usuarioActual: mockUsuarios[3], activo: true, ultimaConexion: '2024-01-15T06:30:00' },
  { id: 5, codigoDispositivo: 'TAB-BAR-001', marca: 'Huawei', modelo: 'MatePad T10', imei: '354678901234571', municipioAsignado: mockMunicipios[3], usuarioActual: mockUsuarios[6], activo: true, ultimaConexion: '2024-01-15T08:15:00' },
  { id: 6, codigoDispositivo: 'TAB-CAR-001', marca: 'Samsung', modelo: 'Galaxy Tab S6 Lite', imei: '354678901234572', municipioAsignado: mockMunicipios[4], usuarioActual: mockUsuarios[7], activo: true, ultimaConexion: '2024-01-15T07:00:00' },
  { id: 7, codigoDispositivo: 'TAB-BUC-001', marca: 'Lenovo', modelo: 'Tab P11', imei: '354678901234573', municipioAsignado: mockMunicipios[5], usuarioActual: undefined, activo: true, ultimaConexion: '2024-01-14T18:30:00' },
  { id: 8, codigoDispositivo: 'TAB-PER-001', marca: 'Samsung', modelo: 'Galaxy Tab A7 Lite', imei: '354678901234574', municipioAsignado: mockMunicipios[6], usuarioActual: mockUsuarios[9], activo: false, ultimaConexion: '2024-01-10T12:00:00' },
];

// ============================================
// PLANILLAS DE DESPACHO (8 planillas activas)
// ============================================
export const mockPlanillas: PlanillaDespacho[] = [
  { id: 1, numeroPlanilla: 'PL-2024-0001', bus: mockBuses[0], conductor: mockConductores[0], ruta: mockRutas[0], fechaDespacho: '2024-01-15', horaProgramada: '05:30', estado: 'DESPACHADO', asientosOcupados: 18 },
  { id: 2, numeroPlanilla: 'PL-2024-0002', bus: mockBuses[1], conductor: mockConductores[1], ruta: mockRutas[1], fechaDespacho: '2024-01-15', horaProgramada: '06:00', estado: 'DESPACHADO', asientosOcupados: 12 },
  { id: 3, numeroPlanilla: 'PL-2024-0003', bus: mockBuses[2], conductor: mockConductores[2], ruta: mockRutas[2], fechaDespacho: '2024-01-15', horaProgramada: '07:00', estado: 'DESPACHADO', asientosOcupados: 25 },
  { id: 4, numeroPlanilla: 'PL-2024-0004', bus: mockBuses[3], conductor: mockConductores[3], ruta: mockRutas[3], fechaDespacho: '2024-01-15', horaProgramada: '08:00', estado: 'DESPACHADO', asientosOcupados: 8 },
  { id: 5, numeroPlanilla: 'PL-2024-0005', bus: mockBuses[4], conductor: mockConductores[4], ruta: mockRutas[4], fechaDespacho: '2024-01-15', horaProgramada: '06:30', estado: 'EN_RUTA', asientosOcupados: 35 },
  { id: 6, numeroPlanilla: 'PL-2024-0006', bus: mockBuses[9], conductor: mockConductores[5], ruta: mockRutas[5], fechaDespacho: '2024-01-15', horaProgramada: '09:00', estado: 'DESPACHADO', asientosOcupados: 15 },
  { id: 7, numeroPlanilla: 'PL-2024-0007', bus: mockBuses[10], conductor: mockConductores[6], ruta: mockRutas[7], fechaDespacho: '2024-01-15', horaProgramada: '07:30', estado: 'EN_RUTA', asientosOcupados: 30 },
  { id: 8, numeroPlanilla: 'PL-2024-0008', bus: mockBuses[13], conductor: mockConductores[8], ruta: mockRutas[10], fechaDespacho: '2024-01-15', horaProgramada: '10:00', estado: 'DESPACHADO', asientosOcupados: 5 },
];

// ============================================
// PASAJEROS (20 pasajeros registrados)
// ============================================
export const mockPasajeros: Pasajero[] = [
  { id: 1, numeroDocumento: '1001234567', tipoDocumento: 'CC', nombreCompleto: 'Ana María Torres Gómez', telefono: '3101234567' },
  { id: 2, numeroDocumento: '1007654321', tipoDocumento: 'CC', nombreCompleto: 'Pedro González Silva', telefono: '3109876543' },
  { id: 3, numeroDocumento: '1002345678', tipoDocumento: 'CC', nombreCompleto: 'Laura Valentina Méndez', telefono: '3112345678' },
  { id: 4, numeroDocumento: '1003456789', tipoDocumento: 'CC', nombreCompleto: 'Carlos Eduardo Ruiz', telefono: '3123456789' },
  { id: 5, numeroDocumento: '1004567890', tipoDocumento: 'CC', nombreCompleto: 'María Fernanda López', telefono: '3134567890' },
  { id: 6, numeroDocumento: '1005678901', tipoDocumento: 'CC', nombreCompleto: 'Juan Pablo Herrera', telefono: '3145678901' },
  { id: 7, numeroDocumento: '1006789012', tipoDocumento: 'CC', nombreCompleto: 'Sofía Alejandra Castro', telefono: '3156789012' },
  { id: 8, numeroDocumento: '1007890123', tipoDocumento: 'CC', nombreCompleto: 'Daniel Andrés Moreno', telefono: '3167890123' },
  { id: 9, numeroDocumento: '1008901234', tipoDocumento: 'CC', nombreCompleto: 'Valentina Ríos Paz', telefono: '3178901234' },
  { id: 10, numeroDocumento: '1009012345', tipoDocumento: 'CC', nombreCompleto: 'Sebastián Vargas Cruz', telefono: '3189012345' },
  { id: 11, numeroDocumento: 'TI-98765432', tipoDocumento: 'TI', nombreCompleto: 'Camilo Andrés Díaz', telefono: '3190123456' },
  { id: 12, numeroDocumento: 'CE-87654321', tipoDocumento: 'CE', nombreCompleto: 'Roberto Carlos Pérez', telefono: '3201234567' },
  { id: 13, numeroDocumento: '1011223344', tipoDocumento: 'CC', nombreCompleto: 'Paula Andrea Gómez', telefono: '3212345678' },
  { id: 14, numeroDocumento: '1012334455', tipoDocumento: 'CC', nombreCompleto: 'Andrés Felipe Muñoz', telefono: '3223456789' },
  { id: 15, numeroDocumento: '1013445566', tipoDocumento: 'CC', nombreCompleto: 'Isabella García Rojas', telefono: '3234567890' },
  { id: 16, numeroDocumento: '1014556677', tipoDocumento: 'CC', nombreCompleto: 'Miguel Ángel Ospina', telefono: '3245678901' },
  { id: 17, numeroDocumento: '1015667788', tipoDocumento: 'CC', nombreCompleto: 'Carolina Sánchez Mejía', telefono: '3256789012' },
  { id: 18, numeroDocumento: 'PA-76543210', tipoDocumento: 'PA', nombreCompleto: 'James Williams Brown', telefono: '3267890123' },
  { id: 19, numeroDocumento: '1017889900', tipoDocumento: 'CC', nombreCompleto: 'Natalia Hernández Vega', telefono: '3278901234' },
  { id: 20, numeroDocumento: '1018990011', tipoDocumento: 'CC', nombreCompleto: 'Julián David Torres', telefono: '3289012345' },
];

// ============================================
// TICKETS (25 tickets vendidos)
// ============================================
export const mockTickets: Ticket[] = [
  // Tickets de la planilla 1 (Bogotá → Medellín)
  { id: 1, numeroTicket: 'TK-2024-000001', planilla: mockPlanillas[0], pasajero: mockPasajeros[0], ruta: mockRutas[0], numeroAsiento: 1, valorPagado: 85000, formaPago: 'EFECTIVO', estado: 'ACTIVO', fechaVenta: '2024-01-15T05:00:00' },
  { id: 2, numeroTicket: 'TK-2024-000002', planilla: mockPlanillas[0], pasajero: mockPasajeros[1], ruta: mockRutas[0], numeroAsiento: 2, valorPagado: 85000, formaPago: 'TARJETA', estado: 'ACTIVO', fechaVenta: '2024-01-15T05:05:00' },
  { id: 3, numeroTicket: 'TK-2024-000003', planilla: mockPlanillas[0], pasajero: mockPasajeros[2], ruta: mockRutas[0], numeroAsiento: 5, valorPagado: 85000, formaPago: 'TRANSFERENCIA', estado: 'ACTIVO', fechaVenta: '2024-01-15T05:10:00' },
  { id: 4, numeroTicket: 'TK-2024-000004', planilla: mockPlanillas[0], pasajero: mockPasajeros[3], ruta: mockRutas[0], numeroAsiento: 6, valorPagado: 85000, formaPago: 'EFECTIVO', estado: 'ACTIVO', fechaVenta: '2024-01-15T05:12:00' },
  { id: 5, numeroTicket: 'TK-2024-000005', planilla: mockPlanillas[0], pasajero: mockPasajeros[4], ruta: mockRutas[0], numeroAsiento: 10, valorPagado: 85000, formaPago: 'QR', estado: 'USADO', fechaVenta: '2024-01-15T05:15:00' },
  
  // Tickets de la planilla 2 (Bogotá → Cali)
  { id: 6, numeroTicket: 'TK-2024-000006', planilla: mockPlanillas[1], pasajero: mockPasajeros[5], ruta: mockRutas[1], numeroAsiento: 3, valorPagado: 95000, formaPago: 'EFECTIVO', estado: 'ACTIVO', fechaVenta: '2024-01-15T05:30:00' },
  { id: 7, numeroTicket: 'TK-2024-000007', planilla: mockPlanillas[1], pasajero: mockPasajeros[6], ruta: mockRutas[1], numeroAsiento: 4, valorPagado: 95000, formaPago: 'TARJETA', estado: 'ACTIVO', fechaVenta: '2024-01-15T05:35:00' },
  { id: 8, numeroTicket: 'TK-2024-000008', planilla: mockPlanillas[1], pasajero: mockPasajeros[7], ruta: mockRutas[1], numeroAsiento: 7, valorPagado: 95000, formaPago: 'EFECTIVO', estado: 'CANCELADO', fechaVenta: '2024-01-15T05:40:00' },
  { id: 9, numeroTicket: 'TK-2024-000009', planilla: mockPlanillas[1], pasajero: mockPasajeros[8], ruta: mockRutas[1], numeroAsiento: 12, valorPagado: 95000, formaPago: 'TRANSFERENCIA', estado: 'ACTIVO', fechaVenta: '2024-01-15T05:45:00' },
  
  // Tickets de la planilla 3 (Bogotá → Barranquilla)
  { id: 10, numeroTicket: 'TK-2024-000010', planilla: mockPlanillas[2], pasajero: mockPasajeros[9], ruta: mockRutas[2], numeroAsiento: 1, valorPagado: 120000, formaPago: 'TARJETA', estado: 'ACTIVO', fechaVenta: '2024-01-15T06:00:00' },
  { id: 11, numeroTicket: 'TK-2024-000011', planilla: mockPlanillas[2], pasajero: mockPasajeros[10], ruta: mockRutas[2], numeroAsiento: 2, valorPagado: 120000, formaPago: 'EFECTIVO', estado: 'ACTIVO', fechaVenta: '2024-01-15T06:05:00' },
  { id: 12, numeroTicket: 'TK-2024-000012', planilla: mockPlanillas[2], pasajero: mockPasajeros[11], ruta: mockRutas[2], numeroAsiento: 8, valorPagado: 120000, formaPago: 'QR', estado: 'ACTIVO', fechaVenta: '2024-01-15T06:10:00' },
  { id: 13, numeroTicket: 'TK-2024-000013', planilla: mockPlanillas[2], pasajero: mockPasajeros[12], ruta: mockRutas[2], numeroAsiento: 15, valorPagado: 120000, formaPago: 'EFECTIVO', estado: 'USADO', fechaVenta: '2024-01-15T06:20:00' },
  { id: 14, numeroTicket: 'TK-2024-000014', planilla: mockPlanillas[2], pasajero: mockPasajeros[13], ruta: mockRutas[2], numeroAsiento: 20, valorPagado: 120000, formaPago: 'TARJETA', estado: 'ACTIVO', fechaVenta: '2024-01-15T06:25:00' },
  
  // Tickets de la planilla 4 (Bogotá → Bucaramanga)
  { id: 15, numeroTicket: 'TK-2024-000015', planilla: mockPlanillas[3], pasajero: mockPasajeros[14], ruta: mockRutas[3], numeroAsiento: 5, valorPagado: 65000, formaPago: 'EFECTIVO', estado: 'ACTIVO', fechaVenta: '2024-01-15T07:00:00' },
  { id: 16, numeroTicket: 'TK-2024-000016', planilla: mockPlanillas[3], pasajero: mockPasajeros[15], ruta: mockRutas[3], numeroAsiento: 9, valorPagado: 65000, formaPago: 'TRANSFERENCIA', estado: 'ACTIVO', fechaVenta: '2024-01-15T07:10:00' },
  
  // Tickets de la planilla 5 (Medellín → Cali) - EN_RUTA
  { id: 17, numeroTicket: 'TK-2024-000017', planilla: mockPlanillas[4], pasajero: mockPasajeros[16], ruta: mockRutas[4], numeroAsiento: 1, valorPagado: 75000, formaPago: 'EFECTIVO', estado: 'USADO', fechaVenta: '2024-01-15T06:00:00' },
  { id: 18, numeroTicket: 'TK-2024-000018', planilla: mockPlanillas[4], pasajero: mockPasajeros[17], ruta: mockRutas[4], numeroAsiento: 3, valorPagado: 75000, formaPago: 'TARJETA', estado: 'USADO', fechaVenta: '2024-01-15T06:05:00' },
  { id: 19, numeroTicket: 'TK-2024-000019', planilla: mockPlanillas[4], pasajero: mockPasajeros[18], ruta: mockRutas[4], numeroAsiento: 7, valorPagado: 75000, formaPago: 'EFECTIVO', estado: 'USADO', fechaVenta: '2024-01-15T06:10:00' },
  
  // Tickets de la planilla 6 (Medellín → Pereira)
  { id: 20, numeroTicket: 'TK-2024-000020', planilla: mockPlanillas[5], pasajero: mockPasajeros[19], ruta: mockRutas[5], numeroAsiento: 2, valorPagado: 35000, formaPago: 'EFECTIVO', estado: 'ACTIVO', fechaVenta: '2024-01-15T08:30:00' },
  { id: 21, numeroTicket: 'TK-2024-000021', planilla: mockPlanillas[5], pasajero: mockPasajeros[0], ruta: mockRutas[5], numeroAsiento: 6, valorPagado: 35000, formaPago: 'QR', estado: 'ACTIVO', fechaVenta: '2024-01-15T08:35:00' },
  
  // Tickets de la planilla 7 (Barranquilla → Cartagena) - EN_RUTA
  { id: 22, numeroTicket: 'TK-2024-000022', planilla: mockPlanillas[6], pasajero: mockPasajeros[1], ruta: mockRutas[7], numeroAsiento: 4, valorPagado: 25000, formaPago: 'EFECTIVO', estado: 'USADO', fechaVenta: '2024-01-15T07:00:00' },
  { id: 23, numeroTicket: 'TK-2024-000023', planilla: mockPlanillas[6], pasajero: mockPasajeros[2], ruta: mockRutas[7], numeroAsiento: 11, valorPagado: 25000, formaPago: 'TARJETA', estado: 'USADO', fechaVenta: '2024-01-15T07:05:00' },
  
  // Tickets de la planilla 8 (Bogotá → Villavicencio)
  { id: 24, numeroTicket: 'TK-2024-000024', planilla: mockPlanillas[7], pasajero: mockPasajeros[3], ruta: mockRutas[10], numeroAsiento: 1, valorPagado: 38000, formaPago: 'EFECTIVO', estado: 'ACTIVO', fechaVenta: '2024-01-15T09:30:00' },
  { id: 25, numeroTicket: 'TK-2024-000025', planilla: mockPlanillas[7], pasajero: mockPasajeros[4], ruta: mockRutas[10], numeroAsiento: 3, valorPagado: 38000, formaPago: 'TRANSFERENCIA', estado: 'ACTIVO', fechaVenta: '2024-01-15T09:35:00' },
];

// ============================================
// FUNCIONES AUXILIARES
// ============================================

// Contador para generar números de ticket
let ticketCounter = mockTickets.length;
export const generateTicketNumber = (): string => {
  ticketCounter++;
  return `TK-2024-${String(ticketCounter).padStart(6, '0')}`;
};

// Obtener asientos ocupados de una planilla
export const getAsientosOcupados = (planillaId: number): number[] => {
  return mockTickets
    .filter(t => t.planilla.id === planillaId && t.estado === 'ACTIVO')
    .map(t => t.numeroAsiento)
    .filter((a): a is number => a !== undefined);
};

// Obtener tablet por municipio
export const getTabletsByMunicipio = (municipioId: number): Tablet[] => {
  return mockTablets.filter(t => t.municipioAsignado.id === municipioId && t.activo);
};

// Obtener usuarios por municipio
export const getUsuariosByMunicipio = (municipioId: number): Usuario[] => {
  return mockUsuarios.filter(u => u.municipio.id === municipioId && u.activo);
};

// Estadísticas rápidas
export const getEstadisticasRapidas = () => {
  const ticketsActivos = mockTickets.filter(t => t.estado === 'ACTIVO' || t.estado === 'USADO');
  const ventasTotal = ticketsActivos.reduce((sum, t) => sum + t.valorPagado, 0);
  const busesEnRuta = mockBuses.filter(b => b.estado === 'DESPACHADO' || b.estado === 'EN_RUTA').length;
  const planillasActivas = mockPlanillas.filter(p => p.estado === 'DESPACHADO' || p.estado === 'EN_RUTA').length;
  
  return {
    ticketsVendidos: ticketsActivos.length,
    ventasTotal,
    busesEnRuta,
    planillasActivas,
    rutasActivas: mockRutas.filter(r => r.activo).length,
    pasajerosHoy: ticketsActivos.length,
  };
};
