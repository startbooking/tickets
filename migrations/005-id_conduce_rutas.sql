-- ─────────────────────────────────────────────────────────────────────────────
-- Migración: 005 — Agrega id_conduce (FK a `concedes`) en la tabla rutas
-- ─────────────────────────────────────────────────────────────────────────────
-- Contexto: el N° de conduce se selecciona desde la tabla `concedes`
-- (id_conduce + desc_conduce). Se persiste el id_conduce numérico en `rutas`
-- para integridad referencial; anulable para no romper históricos.
-- Nota: la columna legacy `conduce_ruta` (CHAR(100)) queda como respaldo
-- del texto descriptivo. Aplicar a la BD del backend (flota9 / travelSoft).

SET SESSION sql_mode = (
    SELECT REPLACE(@@SESSION.sql_mode, 'NO_ZERO_DATE', '')
);
SET SESSION sql_mode = (
    SELECT REPLACE(@@SESSION.sql_mode, 'NO_ZERO_IN_DATE', '')
);

ALTER TABLE rutas
  ADD COLUMN id_conduce INT DEFAULT NULL
  AFTER conduce_ruta;