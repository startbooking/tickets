-- ─────────────────────────────────────────────────────────────────────────────
-- Migración: 008 — Sincroniza el esquema de la BD remota `flota9`
-- (host 181.143.144.2, MySQL 5.0.45) con el que el backend travelsoft espera.
-- Idempotente (information_schema + PREPARE). MySQL 5.0 NO soporta utf8mb4,
-- las columnas/tablas nuevas se crean con utf8_general_ci.
-- Aplicar con: mysql -h 181.143.144.2 -u developer -p flota9 < 008-flota9-schema-sync.sql
-- ─────────────────────────────────────────────────────────────────────────────
SET SESSION sql_mode = '';
SET SESSION collation_connection = utf8_general_ci;
SET NAMES utf8;

-- ------------------------------------------------------------
-- 1) rutas.numero_orden (VARCHAR(6)) — migración 002
-- ------------------------------------------------------------
SET @sql = (SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.columns
           WHERE table_schema='flota9' AND table_name='rutas' AND column_name='numero_orden'),
    'SELECT 1',
    'ALTER TABLE flota9.rutas ADD COLUMN numero_orden VARCHAR(6) DEFAULT NULL AFTER placa_vehi_original'));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------
-- 2) rutas.id_horario (INT) — migración 004
-- ------------------------------------------------------------
SET @sql = (SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.columns
           WHERE table_schema='flota9' AND table_name='rutas' AND column_name='id_horario'),
    'SELECT 1',
    'ALTER TABLE flota9.rutas ADD COLUMN id_horario INT DEFAULT NULL AFTER hora_ruta'));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------
-- 3) rutas.id_conduce (INT) — migración 005
-- ------------------------------------------------------------
SET @sql = (SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.columns
           WHERE table_schema='flota9' AND table_name='rutas' AND column_name='id_conduce'),
    'SELECT 1',
    'ALTER TABLE flota9.rutas ADD COLUMN id_conduce INT DEFAULT NULL AFTER conduce_ruta'));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------
-- 4) rutas: flujo de llegada (cambios_flota9)
-- ------------------------------------------------------------
SET @sql = (SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.columns
           WHERE table_schema='flota9' AND table_name='rutas' AND column_name='llegada_ruta'),
    'SELECT 1',
    'ALTER TABLE flota9.rutas ADD COLUMN llegada_ruta CHAR(1) NOT NULL DEFAULT ''0'' AFTER despachada_ruta'));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.columns
           WHERE table_schema='flota9' AND table_name='rutas' AND column_name='hora_llegada'),
    'SELECT 1',
    'ALTER TABLE flota9.rutas ADD COLUMN hora_llegada CHAR(10) DEFAULT NULL AFTER hora_despacho'));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.columns
           WHERE table_schema='flota9' AND table_name='rutas' AND column_name='fecha_llegada'),
    'SELECT 1',
    'ALTER TABLE flota9.rutas ADD COLUMN fecha_llegada DATE DEFAULT NULL AFTER hora_llegada'));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.columns
           WHERE table_schema='flota9' AND table_name='rutas' AND column_name='novedad_llegada'),
    'SELECT 1',
    'ALTER TABLE flota9.rutas ADD COLUMN novedad_llegada VARCHAR(500) DEFAULT NULL AFTER fecha_llegada'));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.columns
           WHERE table_schema='flota9' AND table_name='rutas' AND column_name='estado_sitio'),
    'SELECT 1',
    'ALTER TABLE flota9.rutas ADD COLUMN estado_sitio VARCHAR(20) DEFAULT NULL AFTER novedad_llegada'));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------
-- 5) planillas.forma_pago (EFECTIVO | TARJETA | QR)
-- ------------------------------------------------------------
SET @sql = (SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.columns
           WHERE table_schema='flota9' AND table_name='planillas' AND column_name='forma_pago'),
    'SELECT 1',
    'ALTER TABLE flota9.planillas ADD COLUMN forma_pago CHAR(20) DEFAULT NULL AFTER datafono'));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------
-- 6) parametros.tiquete_consolidado ('0' | '1')
-- ------------------------------------------------------------
SET @sql = (SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.columns
           WHERE table_schema='flota9' AND table_name='parametros' AND column_name='tiquete_consolidado'),
    'SELECT 1',
    'ALTER TABLE flota9.parametros ADD COLUMN tiquete_consolidado CHAR(1) NOT NULL DEFAULT ''0'''));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------
-- 7) usuario.rol / password_hash / token_version — migración 006
-- ------------------------------------------------------------
SET @sql = (SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.columns
           WHERE table_schema='flota9' AND table_name='usuario' AND column_name='rol'),
    'SELECT 1',
    'ALTER TABLE flota9.usuario ADD COLUMN rol VARCHAR(20) NOT NULL DEFAULT ''CAJERO'' AFTER clave_usuario'));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.columns
           WHERE table_schema='flota9' AND table_name='usuario' AND column_name='password_hash'),
    'SELECT 1',
    'ALTER TABLE flota9.usuario ADD COLUMN password_hash VARCHAR(255) DEFAULT NULL AFTER rol'));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.columns
           WHERE table_schema='flota9' AND table_name='usuario' AND column_name='token_version'),
    'SELECT 1',
    'ALTER TABLE flota9.usuario ADD COLUMN token_version INT NOT NULL DEFAULT 0 AFTER password_hash'));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------
-- 8) adicional.cod_ruta — migración 007
-- ------------------------------------------------------------
SET @sql = (SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.columns
           WHERE table_schema='flota9' AND table_name='adicional' AND column_name='cod_ruta'),
    'SELECT 1',
    'ALTER TABLE flota9.adicional ADD COLUMN cod_ruta INT DEFAULT NULL AFTER cod_adicional'));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------
-- 9) Tabla `resoluciones`
-- ------------------------------------------------------------
SET @sql = (SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.tables
           WHERE table_schema='flota9' AND table_name='resoluciones'),
    'SELECT 1',
    'CREATE TABLE flota9.resoluciones (
        id_resolucion INT NOT NULL AUTO_INCREMENT,
        id_orides INT NOT NULL,
        numero_resolucion VARCHAR(40) NOT NULL,
        prefijo VARCHAR(10) DEFAULT NULL,
        rango_inicial BIGINT DEFAULT NULL,
        rango_final BIGINT DEFAULT NULL,
        consecutivo_actual BIGINT NOT NULL DEFAULT 0,
        fecha_resolucion DATE DEFAULT NULL,
        municipio VARCHAR(120) DEFAULT NULL,
        vigencia_desde DATE DEFAULT NULL,
        vigencia_hasta DATE DEFAULT NULL,
        activa TINYINT(1) NOT NULL DEFAULT 1,
        notas VARCHAR(255) DEFAULT NULL,
        fecha_creacion TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id_resolucion),
        KEY idx_resolucion_orides (id_orides),
        KEY idx_resolucion_activa (activa)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci'));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------
-- 10) Tabla `turnos_satelite`
-- ------------------------------------------------------------
SET @sql = (SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.tables
           WHERE table_schema='flota9' AND table_name='turnos_satelite'),
    'SELECT 1',
    'CREATE TABLE flota9.turnos_satelite (
        id_turno INT NOT NULL AUTO_INCREMENT,
        id_orides INT NOT NULL,
        cedula_usuario VARCHAR(30) DEFAULT NULL,
        operador VARCHAR(100) DEFAULT NULL,
        fecha_inicio DATE DEFAULT NULL,
        inicio DATETIME DEFAULT NULL,
        cierre DATETIME DEFAULT NULL,
        tiquetes INT NOT NULL DEFAULT 0,
        total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        efectivo DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        tarjeta DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        qr DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        detalle TEXT,
        fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id_turno),
        KEY idx_turnos_orides (id_orides)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci'));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------
-- VERIFICACIÓN
-- ------------------------------------------------------------
SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA='flota9'
    AND ((TABLE_NAME='rutas' AND COLUMN_NAME IN ('numero_orden','id_horario','id_conduce','llegada_ruta','hora_llegada','fecha_llegada','novedad_llegada','estado_sitio'))
      OR (TABLE_NAME='planillas' AND COLUMN_NAME='forma_pago')
      OR (TABLE_NAME='parametros' AND COLUMN_NAME='tiquete_consolidado')
      OR (TABLE_NAME='usuario' AND COLUMN_NAME IN ('rol','password_hash','token_version'))
      OR (TABLE_NAME='adicional' AND COLUMN_NAME='cod_ruta'))
  ORDER BY TABLE_NAME, COLUMN_NAME;

SELECT TABLE_NAME, ENGINE FROM information_schema.TABLES
  WHERE TABLE_SCHEMA='flota9' AND TABLE_NAME IN ('resoluciones','turnos_satelite');
