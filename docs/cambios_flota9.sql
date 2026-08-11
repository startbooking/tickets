-- ============================================================
-- SACTel — Script de cambios en BD remota `flota9`
-- Host: 181.143.144.2 (MySQL 5.0.45, motor MyISAM en tablas legacy)
-- Fecha: 2026-08-08
-- Objetivo: alinear `flota9` con el esquema operativo que usa el
-- backend travelsoft (tabla `resoluciones`, flujo de llegada de
-- rutas, forma de pago en planillas, tiquete consolidado).
--
-- IMPORTANTE:
--   - MySQL 5.0 NO soporta utf8mb4 ni la colación utf8mb4_0900_ai_ci.
--     Las tablas nuevas usan utf8_general_ci (compatible 5.0).
--   - Las tablas legacy son MyISAM; se crean las nuevas como InnoDB
--     solo si el servidor lo permite (soporte compilado).
--   - Este script es IDEMPOTENTE: valida existencia antes de crear.
-- ============================================================

-- ------------------------------------------------------------
-- 1) COLUMNA `llegada_ruta` + `hora_llegada` en `rutas`
--    (flujo de reporte de llegada del despachador)
-- ------------------------------------------------------------
SET SESSION sql_mode = '';

-- Columna 1: llegada_ruta
SELECT COUNT(*) INTO @c1 FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA='flota9' AND TABLE_NAME='rutas' AND COLUMN_NAME='llegada_ruta';
SET @sql1 = IF(@c1 = 0,
  'ALTER TABLE flota9.rutas ADD COLUMN llegada_ruta CHAR(1) NOT NULL DEFAULT ''0'' AFTER despachada_ruta',
  'SELECT ''llegada_ruta ya existe'' AS info');
PREPARE st1 FROM @sql1; EXECUTE st1; DEALLOCATE PREPARE st1;

-- Columna 2: hora_llegada
SELECT COUNT(*) INTO @c2 FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA='flota9' AND TABLE_NAME='rutas' AND COLUMN_NAME='hora_llegada';
SET @sql2 = IF(@c2 = 0,
  'ALTER TABLE flota9.rutas ADD COLUMN hora_llegada CHAR(10) NULL DEFAULT NULL AFTER hora_despacho',
  'SELECT ''hora_llegada ya existe'' AS info');
PREPARE st2 FROM @sql2; EXECUTE st2; DEALLOCATE PREPARE st2;

-- Columna 3: fecha_llegada
SELECT COUNT(*) INTO @c3 FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA='flota9' AND TABLE_NAME='rutas' AND COLUMN_NAME='fecha_llegada';
SET @sql3 = IF(@c3 = 0,
  'ALTER TABLE flota9.rutas ADD COLUMN fecha_llegada DATE NULL DEFAULT NULL AFTER hora_llegada',
  'SELECT ''fecha_llegada ya existe'' AS info');
PREPARE st3 FROM @sql3; EXECUTE st3; DEALLOCATE PREPARE st3;

-- Columna 4: novedad_llegada
SELECT COUNT(*) INTO @c4 FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA='flota9' AND TABLE_NAME='rutas' AND COLUMN_NAME='novedad_llegada';
SET @sql4 = IF(@c4 = 0,
  'ALTER TABLE flota9.rutas ADD COLUMN novedad_llegada VARCHAR(500) NULL DEFAULT NULL AFTER fecha_llegada',
  'SELECT ''novedad_llegada ya existe'' AS info');
PREPARE st4 FROM @sql4; EXECUTE st4; DEALLOCATE PREPARE st4;

-- Columna 5: estado_sitio
SELECT COUNT(*) INTO @c5 FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA='flota9' AND TABLE_NAME='rutas' AND COLUMN_NAME='estado_sitio';
SET @sql5 = IF(@c5 = 0,
  'ALTER TABLE flota9.rutas ADD COLUMN estado_sitio VARCHAR(20) NULL DEFAULT NULL AFTER novedad_llegada',
  'SELECT ''estado_sitio ya existe'' AS info');
PREPARE st5 FROM @sql5; EXECUTE st5; DEALLOCATE PREPARE st5;

-- ------------------------------------------------------------
-- 2) COLUMNA `forma_pago` en `planillas`
--    (EFECTIVO | TARJETA | QR)
-- ------------------------------------------------------------
SELECT COUNT(*) INTO @c6 FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA='flota9' AND TABLE_NAME='planillas' AND COLUMN_NAME='forma_pago';
SET @sql6 = IF(@c6 = 0,
  'ALTER TABLE flota9.planillas ADD COLUMN forma_pago CHAR(20) NULL DEFAULT NULL AFTER datafono',
  'SELECT ''forma_pago ya existe'' AS info');
PREPARE st6 FROM @sql6; EXECUTE st6; DEALLOCATE PREPARE st6;

-- ------------------------------------------------------------
-- 3) COLUMNA `tiquete_consolidado` en `parametros`
--    ('0' = un tiquete por silla | '1' = tiquete consolidado)
-- ------------------------------------------------------------
SELECT COUNT(*) INTO @c7 FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA='flota9' AND TABLE_NAME='parametros' AND COLUMN_NAME='tiquete_consolidado';
SET @sql7 = IF(@c7 = 0,
  'ALTER TABLE flota9.parametros ADD COLUMN tiquete_consolidado CHAR(1) NOT NULL DEFAULT ''0''',
  'SELECT ''tiquete_consolidado ya existe'' AS info');
PREPARE st7 FROM @sql7; EXECUTE st7; DEALLOCATE PREPARE st7;

-- ------------------------------------------------------------
-- 4) TABLA `resoluciones` (ausente en flota9)
--    Usada por el backend para emisión electrónica DIAN
-- ------------------------------------------------------------
SELECT COUNT(*) INTO @c8 FROM information_schema.TABLES
  WHERE TABLE_SCHEMA='flota9' AND TABLE_NAME='resoluciones';
SET @sql8 = IF(@c8 = 0,
  'CREATE TABLE flota9.resoluciones (
    id_resolucion INT NOT NULL AUTO_INCREMENT,
    id_orides INT NOT NULL COMMENT ''Agencia (principal o satelite) a la que pertenece la resolucion'',
    numero_resolucion VARCHAR(40) NOT NULL COMMENT ''Numero de resolucion DIAN de autorizacion'',
    prefijo VARCHAR(10) DEFAULT NULL COMMENT ''Prefijo de numeracion (si aplica)'',
    rango_inicial BIGINT DEFAULT NULL,
    rango_final BIGINT DEFAULT NULL,
    consecutivo_actual BIGINT NOT NULL DEFAULT 0 COMMENT ''Ultimo consecutivo utilizado'',
    fecha_resolucion DATE DEFAULT NULL COMMENT ''Fecha de expedicion de la resolucion'',
    municipio VARCHAR(120) DEFAULT NULL COMMENT ''Municipio al que se autoriza la resolucion'',
    vigencia_desde DATE DEFAULT NULL,
    vigencia_hasta DATE DEFAULT NULL,
    activa TINYINT(1) NOT NULL DEFAULT 1,
    notas VARCHAR(255) DEFAULT NULL,
    fecha_creacion TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_resolucion),
    KEY idx_resolucion_orides (id_orides),
    KEY idx_resolucion_activa (activa)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci',
  'SELECT ''resoluciones ya existe'' AS info');
PREPARE st8 FROM @sql8; EXECUTE st8; DEALLOCATE PREPARE st8;

-- ------------------------------------------------------------
-- 5) TABLA `turnos_satelite` (ausente en flota9)
--    Turnos operativos de las agencias satelite (venta multi-silla)
-- ------------------------------------------------------------
SELECT COUNT(*) INTO @c9 FROM information_schema.TABLES
  WHERE TABLE_SCHEMA='flota9' AND TABLE_NAME='turnos_satelite';
SET @sql9 = IF(@c9 = 0,
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci',
  'SELECT ''turnos_satelite ya existe'' AS info');
PREPARE st9 FROM @sql9; EXECUTE st9; DEALLOCATE PREPARE st9;

-- ------------------------------------------------------------
-- VERIFICACIÓN FINAL
-- ------------------------------------------------------------
SELECT TABLE_NAME, ENGINE FROM information_schema.TABLES
  WHERE TABLE_SCHEMA='flota9'
    AND TABLE_NAME IN ('resoluciones','turnos_satelite')
  ORDER BY TABLE_NAME;

SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA='flota9'
    AND ((TABLE_NAME='rutas' AND COLUMN_NAME IN ('llegada_ruta','hora_llegada','fecha_llegada','novedad_llegada','estado_sitio'))
      OR (TABLE_NAME='planillas' AND COLUMN_NAME='forma_pago')
      OR (TABLE_NAME='parametros' AND COLUMN_NAME='tiquete_consolidado'))
  ORDER BY TABLE_NAME, ORDINAL_POSITION;
