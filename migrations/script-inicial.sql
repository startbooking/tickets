-- 1. CREACIÓN DE LA BASE DE DATOS
CREATE DATABASE IF NOT EXISTS transporte_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE transporte_db;

-- 2. CREACIÓN DE TABLAS (En orden de jerarquía para evitar conflictos de llaves foráneas)

-- Tabla de Ciudades / Terminales
CREATE TABLE ciudades (
    id_ciudad INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    departamento VARCHAR(100) NOT NULL,
    CONSTRAINT uq_ciudad_dep UNIQUE (nombre, departamento)
);

-- Tabla de Empresas de Transporte
CREATE TABLE empresas (
    id_empresa INT AUTO_INCREMENT PRIMARY KEY,
    nit VARCHAR(20) NOT NULL UNIQUE,
    razon_social VARCHAR(150) NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(100)
);

-- Tabla de Buses
CREATE TABLE buses (
    id_bus INT AUTO_INCREMENT PRIMARY KEY,
    id_empresa INT NOT NULL,
    placa VARCHAR(10) NOT NULL UNIQUE,
    numero_interno VARCHAR(20) NOT NULL, -- El número que lleva pintado el bus
    capacidad_asientos INT NOT NULL,
    modelo VARCHAR(50),
    FOREIGN KEY (id_empresa) REFERENCES empresas(id_empresa) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Tabla de Rutas
CREATE TABLE rutas (
    id_ruta INT AUTO_INCREMENT PRIMARY KEY,
    id_origen INT NOT NULL,
    id_destino INT NOT NULL,
    duracion_estimada TIME NOT NULL,
    distancia_km DECIMAL(6,2),
    FOREIGN KEY (id_origen) REFERENCES ciudades(id_ciudad),
    FOREIGN KEY (id_destino) REFERENCES ciudades(id_ciudad),
    CONSTRAINT chk_origen_destino CHECK (id_origen <> id_destino) -- Evita que origen y destino sean iguales
);

-- Tabla de Horarios / Viajes Programados
CREATE TABLE viajes (
    id_viaje INT AUTO_INCREMENT PRIMARY KEY,
    id_ruta INT NOT NULL,
    id_bus INT NOT NULL,
    fecha_salida DATE NOT NULL,
    hora_salida TIME NOT NULL,
    precio_tiquete DECIMAL(10,2) NOT NULL,
    estado ENUM('Programado', 'En Ruta', 'Finalizado', 'Cancelado') DEFAULT 'Programado',
    FOREIGN KEY (id_ruta) REFERENCES rutas(id_ruta) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (id_bus) REFERENCES buses(id_bus) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Tabla de Clientes / Pasajeros
CREATE TABLE pasajeros (
    id_pasajero INT AUTO_INCREMENT PRIMARY KEY,
    tipo_documento ENUM('CC', 'CE', 'PASAPORTE', 'TI') NOT NULL,
    documento VARCHAR(20) NOT NULL UNIQUE,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(100)
);

-- Tabla de Tiquetes (Ventas)
CREATE TABLE tiquetes (
    id_tiquete INT AUTO_INCREMENT PRIMARY KEY,
    id_viaje INT NOT NULL,
    id_pasajero INT NOT NULL,
    numero_asiento INT NOT NULL,
    fecha_compra TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metodo_pago ENUM('Efectivo', 'Tarjeta', 'Transferencia', 'Online') NOT NULL,
    estado_tiquete ENUM('Activo', 'Cancelado', 'Utilizado') DEFAULT 'Activo',
    FOREIGN KEY (id_viaje) REFERENCES viajes(id_viaje),
    FOREIGN KEY (id_pasajero) REFERENCES pasajeros(id_pasajero),
    CONSTRAINT uq_viaje_asiento UNIQUE (id_viaje, numero_asiento) -- Evita que se venda el mismo asiento en el mismo viaje
);

-- Tabla de Agencias / Puntos de Venta física
CREATE TABLE agencias (
    id_agency INT AUTO_INCREMENT PRIMARY KEY,
    id_ciudad INT NOT NULL,
    nombre_agencia VARCHAR(100) NOT NULL,
    direccion VARCHAR(150) NOT NULL,
    telefono VARCHAR(20),
    FOREIGN KEY (id_ciudad) REFERENCES ciudades(id_ciudad)
);

-- Tabla de Usuarios (Empleados: Cajeros, Administradores, etc.)
CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    id_agency INT NOT NULL, -- Agencia base donde trabaja
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    rol ENUM('SuperAdmin', 'Administrador_Agencia', 'Cajero', 'Despachador') DEFAULT 'Cajero',
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (id_agency) REFERENCES agencias(id_agency)
);

-- Tabla de Equipos (PCs, Puntos de Venta / POS, Datáfonos)
CREATE TABLE equipos (
    id_equipo INT AUTO_INCREMENT PRIMARY KEY,
    id_agency INT NOT NULL,     -- Agencia a la que pertenece el hardware
    id_usuario_asignado INT,    -- Usuario responsable actual (puede ser NULL si está libre)
    nombre_equipo VARCHAR(100) NOT NULL, -- Ej: 'POS-Caja1', 'PC-Administracion'
    tipo_equipo ENUM('Computador', 'Datáfono', 'Tablet', 'Tótem Autoservicio') NOT NULL,
    serial_hardware VARCHAR(100) NOT NULL UNIQUE,
    ip_autorizada VARCHAR(45),  -- Para seguridad en redes del transporte
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (id_agency) REFERENCES agencias(id_agency),
    FOREIGN KEY (id_usuario_asignado) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
);

-- Tabla de Resoluciones de Facturación (Exigido por la DIAN en Colombia)
CREATE TABLE resoluciones_facturacion (
    id_resolucion INT AUTO_INCREMENT PRIMARY KEY,
    id_agency INT NOT NULL, -- Las resoluciones suelen asignarse por prefijos a agencias/cajas
    numero_resolucion VARCHAR(50) NOT NULL UNIQUE,
    prefijo VARCHAR(10) NOT NULL,
    rango_desde INT NOT NULL,
    rango_hasta INT NOT NULL,
    consecutivo_actual INT NOT NULL,
    fecha_resolucion DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    activa BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (id_agency) REFERENCES agencias(id_agency),
    CONSTRAINT chk_rangos CHECK (rango_hasta > rango_desde),
    CONSTRAINT chk_consecutivo CHECK (consecutivo_actual >= rango_desde AND consecutivo_actual <= rango_hasta)
);

-- ========================================================================
-- MODIFICACIÓN DE LA TABLA DE TIQUETES (Para asociar la venta)
-- ========================================================================
-- NOTA: Si estás corriendo el script desde cero, añade estos campos a tu tabla 'tiquetes'.
-- Si la tabla ya existe, esto simula la estructura final que debe tener:

ALTER TABLE tiquetes 
    ADD COLUMN id_usuario_vendedor INT AFTER id_pasajero,
    ADD COLUMN id_equipo_venta INT AFTER id_usuario_vendedor,
    ADD COLUMN id_resolucion INT AFTER id_equipo_venta,
    ADD COLUMN numero_factura VARCHAR(30) AFTER id_resolucion,
    ADD COLUMN hash_cufe VARCHAR(256) AFTER numero_factura, -- Código Único de Factura Electrónica (DIAN)
    ADD CONSTRAINT fk_tiquete_usuario FOREIGN KEY (id_usuario_vendedor) REFERENCES usuarios(id_usuario),
    ADD CONSTRAINT fk_tiquete_equipo FOREIGN KEY (id_equipo_venta) REFERENCES equipos(id_equipo),
    ADD CONSTRAINT fk_tiquete_resolucion FOREIGN KEY (id_resolucion) REFERENCES resoluciones_facturacion(id_resolucion),
    ADD CONSTRAINT uq_factura UNIQUE (id_resolucion, numero_factura);

-- 3. INSERCIÓN DE DATOS DE PRUEBA (Para verificar el funcionamiento)

INSERT INTO ciudades (nombre, departamento) VALUES 
('Bogotá', 'Cundinamarca'),
('Medellín', 'Antioquia'),
('Cali', 'Valle del Cauca');

INSERT INTO empresas (nit, razon_social, telefono) VALUES 
('800123456-1', 'Expreso Bolivariano S.A.', '6013456789'),
('900987654-2', 'Flota Occidental', '6042345678');

INSERT INTO buses (id_empresa, placa, numero_interno, capacidad_asientos) VALUES 
(1, 'SXZ123', '2040', 42),
(2, 'TRK456', '1025', 38);

INSERT INTO rutas (id_origen, id_destino, duracion_estimada, distancia_km) VALUES 
(1, 2, '08:00:00', 415.00), -- Bogotá a Medellín
(2, 3, '09:30:00', 430.00); -- Medellín a Cali

INSERT INTO viajes (id_ruta, id_bus, fecha_salida, hora_salida, precio_tiquete) VALUES 
(1, 1, '2026-07-15', '06:30:00', 95000.00),
(1, 1, '2026-07-15', '22:00:00', 110000.00);

INSERT INTO pasajeros (tipo_documento, documento, nombres, apellidos, telefono) VALUES 
('CC', '1018234567', 'Carlos', 'Mendoza', '3101234567'),
('CC', '52345678', 'Ana', 'Gomez', '3209876543');

INSERT INTO tiquetes (id_viaje, id_pasajero, numero_asiento, metodo_pago) VALUES 
(1, 1, 5, 'Online'),
(1, 2, 6, 'Efectivo');

-- Insertar Agencia (Asumiendo que Bogotá es id_ciudad = 1)
INSERT INTO agencias (id_ciudad, nombre_agencia, direccion, telefono) 
VALUES (1, 'Terminal Salitre - Taquilla 45', 'Calle 22C # 68D', '6014444444');

-- Insertar Usuario (Contraseña en hash ficticia)
INSERT INTO usuarios (id_agency, username, password_hash, nombres, apellidos, rol) 
VALUES (1, 'carlos_cajero', '$2y$10$abcdefghijklmnopqrstuv', 'Carlos', 'Pérez', 'Cajero');

-- Insertar Equipo asignado a la agencia y al usuario
INSERT INTO equipos (id_agency, id_usuario_asignado, nombre_equipo, tipo_equipo, serial_hardware, ip_autorizada) 
VALUES (1, 1, 'Caja Principal 01', 'Computador', 'ST192837465', '192.168.1.50');

-- Insertar Resolución de la DIAN para la taquilla
INSERT INTO resoluciones_facturacion (id_agency, numero_resolucion, prefijo, rango_desde, rango_hasta, consecutivo_actual, fecha_resolucion, fecha_vencimiento) 
VALUES (1, '187640000001', 'BOG', 1, 10000, 1, '2026-01-01', '2027-01-01');