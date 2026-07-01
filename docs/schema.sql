-- ============================================
-- SISTEMA DE TICKETS DE TRANSPORTE INTERMUNICIPAL
-- Esquema de Base de Datos MySQL
-- Clean Architecture
-- ============================================

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS transporte_intermunicipal
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE transporte_intermunicipal;

-- ============================================
-- TABLAS DE CONFIGURACIÓN BASE
-- ============================================

-- Municipios
CREATE TABLE municipios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    departamento VARCHAR(100) NOT NULL,
    codigo_dane VARCHAR(10) UNIQUE,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_municipio_activo (activo),
    INDEX idx_municipio_nombre (nombre)
);

-- Empresas de Transporte
CREATE TABLE empresas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nit VARCHAR(20) NOT NULL UNIQUE,
    razon_social VARCHAR(200) NOT NULL,
    direccion VARCHAR(300),
    telefono VARCHAR(20),
    email VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_empresa_activa (activo)
);

-- Rutas (Origen -> Destino con tarifa)
CREATE TABLE rutas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    municipio_origen_id INT NOT NULL,
    municipio_destino_id INT NOT NULL,
    valor_tarifa DECIMAL(12, 2) NOT NULL,
    distancia_km DECIMAL(8, 2),
    tiempo_estimado_minutos INT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (municipio_origen_id) REFERENCES municipios(id),
    FOREIGN KEY (municipio_destino_id) REFERENCES municipios(id),
    
    UNIQUE KEY unique_ruta (municipio_origen_id, municipio_destino_id),
    INDEX idx_ruta_activa (activo),
    INDEX idx_ruta_origen (municipio_origen_id),
    INDEX idx_ruta_destino (municipio_destino_id)
);

-- ============================================
-- TABLAS DE RECURSOS HUMANOS Y VEHÍCULOS
-- ============================================

-- Conductores
CREATE TABLE conductores (
    id INT PRIMARY KEY AUTO_INCREMENT,
    numero_documento VARCHAR(20) NOT NULL UNIQUE,
    tipo_documento ENUM('CC', 'CE', 'PA') DEFAULT 'CC',
    nombre_completo VARCHAR(200) NOT NULL,
    telefono VARCHAR(20),
    licencia_numero VARCHAR(30) NOT NULL,
    licencia_categoria VARCHAR(10) NOT NULL,
    licencia_vencimiento DATE NOT NULL,
    empresa_id INT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (empresa_id) REFERENCES empresas(id),
    INDEX idx_conductor_activo (activo),
    INDEX idx_conductor_empresa (empresa_id)
);

-- Buses
CREATE TABLE buses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    placa VARCHAR(10) NOT NULL UNIQUE,
    capacidad INT NOT NULL,
    marca VARCHAR(50),
    modelo VARCHAR(50),
    ano INT,
    empresa_id INT NOT NULL,
    conductor_asignado_id INT,
    estado ENUM('DISPONIBLE', 'DESPACHADO', 'EN_RUTA', 'MANTENIMIENTO', 'INACTIVO') DEFAULT 'DISPONIBLE',
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (empresa_id) REFERENCES empresas(id),
    FOREIGN KEY (conductor_asignado_id) REFERENCES conductores(id),
    
    INDEX idx_bus_estado (estado),
    INDEX idx_bus_placa (placa),
    INDEX idx_bus_empresa (empresa_id)
);

-- ============================================
-- TABLAS DE USUARIOS Y CONTROL DE ACCESO
-- ============================================

-- Usuarios del Sistema (Vendedores/Operadores)
CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    numero_documento VARCHAR(20) NOT NULL UNIQUE,
    tipo_documento ENUM('CC', 'CE', 'PA') DEFAULT 'CC',
    nombre_completo VARCHAR(200) NOT NULL,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    municipio_asignado_id INT NOT NULL,
    empresa_id INT,
    tipo_vinculacion ENUM('EMPLEADO', 'CONCESION') NOT NULL,
    rol ENUM('VENDEDOR', 'SUPERVISOR', 'ADMIN') DEFAULT 'VENDEDOR',
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (municipio_asignado_id) REFERENCES municipios(id),
    FOREIGN KEY (empresa_id) REFERENCES empresas(id),
    
    INDEX idx_usuario_municipio (municipio_asignado_id),
    INDEX idx_usuario_activo (activo),
    INDEX idx_usuario_tipo (tipo_vinculacion)
);

-- Dispositivos Registrados
CREATE TABLE dispositivos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    identificador_unico VARCHAR(100) NOT NULL UNIQUE,
    nombre VARCHAR(100),
    tipo ENUM('COMPUTADOR', 'TABLET', 'MOVIL', 'TERMINAL') DEFAULT 'TERMINAL',
    municipio_asignado_id INT NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (municipio_asignado_id) REFERENCES municipios(id),
    
    INDEX idx_dispositivo_municipio (municipio_asignado_id),
    INDEX idx_dispositivo_activo (activo)
);

-- Sesiones de Usuario (Control de acceso simultáneo)
CREATE TABLE sesiones_usuario (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    dispositivo_id INT NOT NULL,
    token_sesion VARCHAR(255) NOT NULL UNIQUE,
    ip_address VARCHAR(45),
    activa BOOLEAN DEFAULT TRUE,
    fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_fin TIMESTAMP NULL,
    ultima_actividad TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (dispositivo_id) REFERENCES dispositivos(id),
    
    INDEX idx_sesion_usuario (usuario_id),
    INDEX idx_sesion_activa (activa),
    INDEX idx_sesion_token (token_sesion)
);

-- ============================================
-- TABLAS DE PASAJEROS
-- ============================================

-- Pasajeros
CREATE TABLE pasajeros (
    id INT PRIMARY KEY AUTO_INCREMENT,
    numero_documento VARCHAR(20) NOT NULL,
    tipo_documento ENUM('CC', 'CE', 'TI', 'PA', 'RC') DEFAULT 'CC',
    nombre_completo VARCHAR(200) NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_pasajero (tipo_documento, numero_documento),
    INDEX idx_pasajero_documento (numero_documento)
);

-- ============================================
-- TABLAS DE DESPACHO Y TICKETS
-- ============================================

-- Planillas de Despacho
CREATE TABLE planillas_despacho (
    id INT PRIMARY KEY AUTO_INCREMENT,
    numero_planilla VARCHAR(30) NOT NULL UNIQUE,
    bus_id INT NOT NULL,
    conductor_id INT NOT NULL,
    ruta_id INT NOT NULL,
    fecha_despacho DATE NOT NULL,
    hora_programada TIME NOT NULL,
    hora_salida_real TIME,
    estado ENUM('PROGRAMADO', 'DESPACHADO', 'EN_RUTA', 'FINALIZADO', 'CANCELADO') DEFAULT 'PROGRAMADO',
    asientos_ocupados INT DEFAULT 0,
    observaciones TEXT,
    usuario_despacho_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (bus_id) REFERENCES buses(id),
    FOREIGN KEY (conductor_id) REFERENCES conductores(id),
    FOREIGN KEY (ruta_id) REFERENCES rutas(id),
    FOREIGN KEY (usuario_despacho_id) REFERENCES usuarios(id),
    
    INDEX idx_planilla_fecha (fecha_despacho),
    INDEX idx_planilla_estado (estado),
    INDEX idx_planilla_bus (bus_id)
);

-- Tickets
CREATE TABLE tickets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    numero_ticket VARCHAR(30) NOT NULL UNIQUE,
    planilla_despacho_id INT NOT NULL,
    pasajero_id INT NOT NULL,
    ruta_id INT NOT NULL,
    numero_asiento INT,
    valor_pagado DECIMAL(12, 2) NOT NULL,
    forma_pago ENUM('EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'QR') DEFAULT 'EFECTIVO',
    estado ENUM('ACTIVO', 'USADO', 'CANCELADO', 'REEMBOLSADO') DEFAULT 'ACTIVO',
    usuario_venta_id INT NOT NULL,
    dispositivo_venta_id INT NOT NULL,
    fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_uso TIMESTAMP NULL,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (planilla_despacho_id) REFERENCES planillas_despacho(id),
    FOREIGN KEY (pasajero_id) REFERENCES pasajeros(id),
    FOREIGN KEY (ruta_id) REFERENCES rutas(id),
    FOREIGN KEY (usuario_venta_id) REFERENCES usuarios(id),
    FOREIGN KEY (dispositivo_venta_id) REFERENCES dispositivos(id),
    
    INDEX idx_ticket_planilla (planilla_despacho_id),
    INDEX idx_ticket_fecha (fecha_venta),
    INDEX idx_ticket_estado (estado),
    INDEX idx_ticket_pasajero (pasajero_id)
);

-- ============================================
-- AUDITORÍA
-- ============================================

-- Log de Auditoría
CREATE TABLE auditoria (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tabla_afectada VARCHAR(50) NOT NULL,
    registro_id INT NOT NULL,
    accion ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    datos_anteriores JSON,
    datos_nuevos JSON,
    usuario_id INT,
    dispositivo_id INT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (dispositivo_id) REFERENCES dispositivos(id),
    
    INDEX idx_auditoria_tabla (tabla_afectada),
    INDEX idx_auditoria_fecha (created_at)
);

-- ============================================
-- DATOS DE EJEMPLO
-- ============================================

-- Insertar algunos municipios de ejemplo
INSERT INTO municipios (nombre, departamento, codigo_dane) VALUES
('Bogotá', 'Cundinamarca', '11001'),
('Medellín', 'Antioquia', '05001'),
('Cali', 'Valle del Cauca', '76001'),
('Barranquilla', 'Atlántico', '08001'),
('Cartagena', 'Bolívar', '13001'),
('Bucaramanga', 'Santander', '68001');

-- Insertar empresa de ejemplo
INSERT INTO empresas (nit, razon_social, direccion, telefono, email) VALUES
('900123456-1', 'Transportes Ejemplo S.A.', 'Calle 100 #45-67, Bogotá', '6017654321', 'info@transportesejemplo.com');

-- Insertar rutas de ejemplo
INSERT INTO rutas (municipio_origen_id, municipio_destino_id, valor_tarifa, distancia_km, tiempo_estimado_minutos) VALUES
(1, 2, 85000.00, 420, 540),
(1, 3, 95000.00, 480, 600),
(2, 3, 75000.00, 350, 420),
(1, 6, 65000.00, 380, 480);
