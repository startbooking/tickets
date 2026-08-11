-- ============================================================
-- SACTel — REVERTIR cambios en BD remota `flota9`
-- Host: 181.143.144.2 (MySQL 5.0.45)
-- Fecha: 2026-08-08
-- Revierte TODO lo aplicado por `docs/cambios_flota9.sql`.
-- Idempotente: valida existencia antes de actuar.
-- ============================================================

SET SESSION sql_mode = '';

-- ------------------------------------------------------------
-- 1) Revertir columnas en `rutas`
-- ------------------------------------------------------------
SELECT COUNT(*) INTO @c FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA='flota9' AND TABLE_NAME='rutas' AND COLUMN_NAME='estado_sitio';
SET @s = IF(@c = 1, 'ALTER TABLE flota9.rutas DROP COLUMN estado_sitio', 'SELECT ''estado_sitio no existe'' AS info');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SELECT COUNT(*) INTO @c FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA='flota9' AND TABLE_NAME='rutas' AND COLUMN_NAME='novedad_llegada';
SET @s = IF(@c = 1, 'ALTER TABLE flota9.rutas DROP COLUMN novedad_llegada', 'SELECT ''novedad_llegada no existe'' AS info');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SELECT COUNT(*) INTO @c FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA='flota9' AND TABLE_NAME='rutas' AND COLUMN_NAME='fecha_llegada';
SET @s = IF(@c = 1, 'ALTER TABLE flota9.rutas DROP COLUMN fecha_llegada', 'SELECT ''fecha_llegada no existe'' AS info');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SELECT COUNT(*) INTO @c FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA='flota9' AND TABLE_NAME='rutas' AND COLUMN_NAME='hora_llegada';
SET @s = IF(@c = 1, 'ALTER TABLE flota9.rutas DROP COLUMN hora_llegada', 'SELECT ''hora_llegada no existe'' AS info');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

SELECT COUNT(*) INTO @c FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA='flota9' AND TABLE_NAME='rutas' AND COLUMN_NAME='llegada_ruta';
SET @s = IF(@c = 1, 'ALTER TABLE flota9.rutas DROP COLUMN llegada_ruta', 'SELECT ''llegada_ruta no existe'' AS info');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ------------------------------------------------------------
-- 2) Revertir columna en `planillas`
-- ------------------------------------------------------------
SELECT COUNT(*) INTO @c FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA='flota9' AND TABLE_NAME='planillas' AND COLUMN_NAME='forma_pago';
SET @s = IF(@c = 1, 'ALTER TABLE flota9.planillas DROP COLUMN forma_pago', 'SELECT ''forma_pago no existe'' AS info');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ------------------------------------------------------------
-- 3) Revertir columna en `parametros`
-- ------------------------------------------------------------
SELECT COUNT(*) INTO @c FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA='flota9' AND TABLE_NAME='parametros' AND COLUMN_NAME='tiquete_consolidado';
SET @s = IF(@c = 1, 'ALTER TABLE flota9.parametros DROP COLUMN tiquete_consolidado', 'SELECT ''tiquete_consolidado no existe'' AS info');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ------------------------------------------------------------
-- 4) Eliminar tabla `turnos_satelite`
-- ------------------------------------------------------------
SELECT COUNT(*) INTO @c FROM information_schema.TABLES
  WHERE TABLE_SCHEMA='flota9' AND TABLE_NAME='turnos_satelite';
SET @s = IF(@c = 1, 'DROP TABLE flota9.turnos_satelite', 'SELECT ''turnos_satelite no existe'' AS info');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ------------------------------------------------------------
-- 5) Eliminar tabla `resoluciones`
-- ------------------------------------------------------------
SELECT COUNT(*) INTO @c FROM information_schema.TABLES
  WHERE TABLE_SCHEMA='flota9' AND TABLE_NAME='resoluciones';
SET @s = IF(@c = 1, 'DROP TABLE flota9.resoluciones', 'SELECT ''resoluciones no existe'' AS info');
PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;

-- ------------------------------------------------------------
-- VERIFICACIÓN FINAL (debe quedar vacío)
-- ------------------------------------------------------------
SELECT TABLE_NAME FROM information_schema.TABLES
  WHERE TABLE_SCHEMA='flota9' AND TABLE_NAME IN ('resoluciones','turnos_satelite');

SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA='flota9'
    AND ((TABLE_NAME='rutas' AND COLUMN_NAME IN ('llegada_ruta','hora_llegada','fecha_llegada','novedad_llegada','estado_sitio'))
      OR (TABLE_NAME='planillas' AND COLUMN_NAME='forma_pago')
      OR (TABLE_NAME='parametros' AND COLUMN_NAME='tiquete_consolidado'));
