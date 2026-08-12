-- ─────────────────────────────────────────────────────────────────────────────
-- Migración: 002 — Agrega numero_orden a la tabla rutas
-- ─────────────────────────────────────────────────────────────────────────────
-- Contexto: El número de orden (número de ventanilla de la Secretaría de
-- Transporte, distinto de la placa) debe asociarse a cada ruta programada.
-- Columna agregada como nullable para no romper registros existentes.

ALTER TABLE rutas
  ADD COLUMN numero_orden VARCHAR(6) DEFAULT NULL
  AFTER placa_vehi_original;
