-- ─────────────────────────────────────────────────────────────────────────────
-- Migración: 004 — Agrega id_horario a la tabla rutas
-- ─────────────────────────────────────────────────────────────────────────────
-- Contexto: la hora de salida de una ruta se toma de la tabla `horario`
-- (se muestra hora_horario y se persiste el id_horario del horario elegido),
-- tal como lo hace el módulo de programación de vehículos (rodamiento).
-- Anulable para no romper registros existentes; se aplica a la BD del backend.

SET SESSION sql_mode = (
    SELECT REPLACE(@@SESSION.sql_mode, 'NO_ZERO_DATE', '')
);
SET SESSION sql_mode = (
    SELECT REPLACE(@@SESSION.sql_mode, 'NO_ZERO_IN_DATE', '')
);

ALTER TABLE rutas
  ADD COLUMN id_horario INT DEFAULT NULL
  AFTER hora_ruta;