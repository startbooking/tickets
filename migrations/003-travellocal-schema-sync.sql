-- ─────────────────────────────────────────────────────────────────────────────
-- Migración: 003 — Sincronizar travellocal (flota9) con el esquema del código
-- ─────────────────────────────────────────────────────────────────────────────
-- Tablas/columnas que el backend SACTel.Cloud requiere pero que no existen
-- en la base de datos remota flota9 (ahora importada como travellocal).

USE travellocal;

-- 1. Tabla resoluciones de facturación DIAN (usada por _get_resolucion_activa,
--    vender_tiquete, reportar_llegada, endpoints /resoluciones/agencia, etc.)
CREATE TABLE IF NOT EXISTS resoluciones (
    id_resolucion INT AUTO_INCREMENT PRIMARY KEY,
    id_orides INT NOT NULL DEFAULT 0,
    numero_resolucion VARCHAR(40) NOT NULL,
    prefijo VARCHAR(10),
    rango_inicial BIGINT,
    rango_final BIGINT,
    consecutivo_actual BIGINT NOT NULL DEFAULT 0,
    fecha_resolucion DATE,
    municipio VARCHAR(120),
    vigencia_desde DATE,
    vigencia_hasta DATE,
    activa TINYINT(1) NOT NULL DEFAULT 1,
    notas VARCHAR(255),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Tabla turnos_satelite (usada por el cierre de turno satélite)
CREATE TABLE IF NOT EXISTS turnos_satelite (
    id_turno INT AUTO_INCREMENT PRIMARY KEY,
    id_orides INT NOT NULL DEFAULT 0,
    cedula_usuario VARCHAR(30),
    operador VARCHAR(100),
    fecha_inicio DATE,
    inicio DATETIME,
    cierre DATETIME,
    tiquetes INT NOT NULL DEFAULT 0,
    total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    efectivo DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    tarjeta DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    qr DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    detalle JSON,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Columnas en parametros: tiquete_consolidado (usada por GET/PUT /parametros/tickets)
ALTER TABLE parametros
  ADD COLUMN tiquete_consolidado CHAR(1) DEFAULT '0';

-- 4. Columnas en rutas: llegada_ruta, hora_llegada, fecha_llegada, novedad_llegada, estado_sitio
ALTER TABLE rutas
  ADD COLUMN llegada_ruta CHAR(1) NOT NULL DEFAULT '0',
  ADD COLUMN hora_llegada CHAR(10),
  ADD COLUMN fecha_llegada DATE,
  ADD COLUMN novedad_llegada VARCHAR(500),
  ADD COLUMN estado_sitio VARCHAR(20);

-- 5. Columna en planillas: forma_pago
ALTER TABLE planillas
  ADD COLUMN forma_pago CHAR(20) DEFAULT 'EFECTIVO';

-- 6. Columna numero_orden en rutas (número de orden de ventanilla de Secretaría)
ALTER TABLE rutas
  ADD COLUMN numero_orden VARCHAR(6) AFTER placa_vehi_original;

-- 7. Tabla hal_licencias estándar de resoluciones activas
CREATE INDEX idx_resol_activa ON resoluciones (id_orides, activa);
