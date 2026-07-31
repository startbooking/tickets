CREATE DATABASE IF NOT EXISTS transporte_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE transporte_db;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. MÓDULO GEOGRÁFICO Y CORPORATIVO
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE ciudades (
    id_ciudad INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    departamento VARCHAR(100) NOT NULL,
    CONSTRAINT uq_ciudad_dep UNIQUE (nombre, departamento)
) ENGINE=InnoDB;

CREATE TABLE empresas (
    id_empresa INT AUTO_INCREMENT PRIMARY KEY,
    nit VARCHAR(20) NOT NULL UNIQUE,
    razon_social VARCHAR(150) NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(100)
) ENGINE=InnoDB;

CREATE TABLE agencias (
    id_agency INT AUTO_INCREMENT PRIMARY KEY,
    id_ciudad INT NOT NULL,
    nombre_agencia VARCHAR(100) NOT NULL,
    direccion VARCHAR(150) NOT NULL,
    telefono VARCHAR(20),
    FOREIGN KEY (id_ciudad) REFERENCES ciudades(id_ciudad) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. MÓDULO DE USUARIOS, ROLES Y EQUIPOS Hardware
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    id_agency INT NOT NULL, 
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    rol ENUM('SUPERADMIN', 'ADMIN_AGENCIA', 'CAJERO', 'DESPACHADOR') DEFAULT 'CAJERO',
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_agency) REFERENCES agencias(id_agency) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE equipos (
    id_equipo INT AUTO_INCREMENT PRIMARY KEY,
    id_agency INT NOT NULL,     
    id_usuario_assigned INT,    
    nombre_equipo VARCHAR(100) NOT NULL, 
    tipo_equipo ENUM('Computador', 'Datáfono', 'Tablet', 'Tótem Autoservicio') NOT NULL,
    serial_hardware VARCHAR(100) NOT NULL UNIQUE,
    ip_autorizada VARCHAR(45),  
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (id_agency) REFERENCES agencias(id_agency) ON DELETE RESTRICT,
    FOREIGN KEY (id_usuario_assigned) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. MÓDULO DE OPERACIÓN LOGÍSTICA Y VEHÍCULOS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE buses (
    id_bus INT AUTO_INCREMENT PRIMARY KEY,
    id_empresa INT NOT NULL,
    placa VARCHAR(10) NOT NULL UNIQUE,
    numero_interno VARCHAR(20) NOT NULL, 
    capacidad_asientos INT NOT NULL,
    modelo VARCHAR(50),
    estado ENUM('Disponible', 'En Ruta', 'Mantenimiento') DEFAULT 'Disponible',
    FOREIGN KEY (id_empresa) REFERENCES empresas(id_empresa) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE rutas (
    id_ruta INT AUTO_INCREMENT PRIMARY KEY,
    id_origen INT NOT NULL,
    id_destino INT NOT NULL,
    duracion_estimada TIME NOT NULL,
    distancia_km DECIMAL(6,2),
    FOREIGN KEY (id_origen) REFERENCES ciudades(id_ciudad) ON DELETE RESTRICT,
    FOREIGN KEY (id_destino) REFERENCES ciudades(id_ciudad) ON DELETE RESTRICT,
    CONSTRAINT chk_origen_destino CHECK (id_origen <> id_destino)
) ENGINE=InnoDB;

CREATE TABLE viajes (
    id_viaje INT AUTO_INCREMENT PRIMARY KEY,
    id_ruta INT NOT NULL,
    id_bus INT NOT NULL,
    fecha_salida DATE NOT NULL,
    hora_salida TIME NOT NULL,
    precio_tiquete DECIMAL(10,2) NOT NULL,
    estado ENUM('Programado', 'Alistamiento', 'En Ruta', 'Finalizado', 'Cancelado') DEFAULT 'Programado',
    FOREIGN KEY (id_ruta) REFERENCES rutas(id_ruta) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (id_bus) REFERENCES buses(id_bus) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 🛠️ NUEVA: Control Logístico y de Alcoholimetría para el DESPACHADOR
CREATE TABLE alistamientos (
    id_alistamiento INT AUTO_INCREMENT PRIMARY KEY,
    id_viaje INT NOT NULL UNIQUE,
    id_despachador INT NOT NULL,
    conductor_nombre VARCHAR(150) NOT NULL,
    conductor_licencia VARCHAR(50) NOT NULL,
    resultado_alcoholimetro DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    check_llantas TINYINT(1) DEFAULT 1,
    check_luces TINYINT(1) DEFAULT 1,
    check_seguridad TINYINT(1) DEFAULT 1,
    apto_salida TINYINT(1) GENERATED ALWAYS AS (IF(resultado_alcoholimetro = 0.00, 1, 0)) STORED,
    fecha_despacho TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_viaje) REFERENCES viajes(id_viaje) ON DELETE CASCADE,
    FOREIGN KEY (id_despachador) REFERENCES usuarios(id_usuario) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. MÓDULO DE CAJA Y COMERCIAL
-- ─────────────────────────────────────────────────────────────────────────────

-- 🛠️ NUEVA: Turnos de Caja para el control diario del CAJERO
CREATE TABLE turnos_caja (
    id_turno INT AUTO_INCREMENT PRIMARY KEY,
    id_cajero INT NOT NULL,
    id_agency INT NOT NULL,
    monto_apertura DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    monto_cierre_sistema DECIMAL(12,2) NULL,
    estado ENUM('Abierto', 'Clausurado') DEFAULT 'Abierto',
    fecha_apertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre TIMESTAMP NULL,
    FOREIGN KEY (id_cajero) REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
    FOREIGN KEY (id_agency) REFERENCES agencias(id_agency) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE pasajeros (
    id_pasajero INT AUTO_INCREMENT PRIMARY KEY,
    tipo_documento ENUM('CC', 'CE', 'PASAPORTE', 'TI') NOT NULL,
    documento VARCHAR(20) NOT NULL UNIQUE,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(100)
) ENGINE=InnoDB;

CREATE TABLE resoluciones_facturacion (
    id_resolucion INT AUTO_INCREMENT PRIMARY KEY,
    id_agency INT NOT NULL, 
    numero_resolucion VARCHAR(50) NOT NULL UNIQUE,
    prefijo VARCHAR(10) NOT NULL,
    rango_desde INT NOT NULL,
    rango_hasta INT NOT NULL,
    consecutivo_actual INT NOT NULL,
    fecha_resolucion DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    activa BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (id_agency) REFERENCES agencias(id_agency) ON DELETE RESTRICT,
    CONSTRAINT chk_rangos CHECK (rango_hasta > rango_desde),
    CONSTRAINT chk_consecutivo CHECK (consecutivo_actual >= rango_desde AND consecutivo_actual <= rango_hasta)
) ENGINE=InnoDB;

-- 🔄 OPTIMIZADA: Estructura unificada de Tiquetes sin necesidad de ALTER posterior
CREATE TABLE tiquetes (
    id_tiquete INT AUTO_INCREMENT PRIMARY KEY,
    id_viaje INT NOT NULL,
    id_pasajero INT NOT NULL,
    id_usuario_vendedor INT NOT NULL,
    id_turno_caja INT NOT NULL, -- Vinculado al turno operativo del cajero
    id_equipo_venta INT NULL,
    id_resolucion INT NULL,
    numero_asiento INT NOT NULL,
    numero_factura VARCHAR(30) NULL,
    hash_cufe VARCHAR(256) NULL, -- Exigido por la DIAN (Sin IVA)
    fecha_compra TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metodo_pago ENUM('Efectivo', 'Tarjeta', 'Transferencia', 'Online') NOT NULL,
    tipo_registro ENUM('Venta', 'Reserva') DEFAULT 'Venta',
    estado_tiquete ENUM('Activo', 'Cancelado', 'Utilizado', 'Expirado') DEFAULT 'Activo',
    FOREIGN KEY (id_viaje) REFERENCES viajes(id_viaje) ON DELETE RESTRICT,
    FOREIGN KEY (id_pasajero) REFERENCES pasajeros(id_pasajero) ON DELETE RESTRICT,
    FOREIGN KEY (id_usuario_vendedor) REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
    FOREIGN KEY (id_turno_caja) REFERENCES turnos_caja(id_turno) ON DELETE RESTRICT,
    FOREIGN KEY (id_equipo_venta) REFERENCES equipos(id_equipo) ON DELETE SET NULL,
    FOREIGN KEY (id_resolucion) REFERENCES resoluciones_facturacion(id_resolucion) ON DELETE RESTRICT,
    CONSTRAINT uq_viaje_asiento UNIQUE (id_viaje, numero_asiento),
    CONSTRAINT uq_factura UNIQUE (id_resolucion, numero_factura)
) ENGINE=InnoDB;