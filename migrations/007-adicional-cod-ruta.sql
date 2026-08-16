-- ─────────────────────────────────────────────────────────────────────────────
-- Migración: 007 — Adicional: cod_ruta (enlace rutas ↔ adicional)
-- ─────────────────────────────────────────────────────────────────────────────
-- Contexto: crear_ruta inserta una fila en `rutas` (cod_ruta) y otra en
-- `adicional` (cod_adicional), pero hasta ahora su única relación implícita
-- era placa_vehi + fecha_adicional + origen_adicional. Para que el despacho
-- y la llegada puedan sincronizar el estado de `adicional` (despachada_adicional)
-- se persiste cod_ruta en cada fila de `adicional`.
-- Aplicar a la BD activa del backend (travelSoft). Idempotente.

SET SESSION sql_mode = (
    SELECT REPLACE(@@SESSION.sql_mode, 'NO_ZERO_DATE', '')
);
SET SESSION sql_mode = (
    SELECT REPLACE(@@SESSION.sql_mode, 'NO_ZERO_IN_DATE', '')
);

SET @db = DATABASE();

SET @sql_cr = (SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.columns
           WHERE table_schema = @db AND table_name = 'adicional' AND column_name = 'cod_ruta'),
    'SELECT 1',
    'ALTER TABLE adicional ADD COLUMN cod_ruta INT DEFAULT NULL AFTER cod_adicional'
));
PREPARE stmt_cr FROM @sql_cr; EXECUTE stmt_cr; DEALLOCATE PREPARE stmt_cr;