-- ─────────────────────────────────────────────────────────────────────────────
-- Migración: 010 — Motivo de anulación de ruta
-- ─────────────────────────────────────────────────────────────────────────────
-- Contexto: al anular una ruta se exige indicar el motivo. Se guarda en rutas
-- como texto libre (máx. 255). Solo aplica al registro de rutas; el flag de
-- adicional sigue siendo suficiente para parar la venta.

SET SESSION sql_mode = (
    SELECT REPLACE(@@SESSION.sql_mode, 'NO_ZERO_DATE', '')
);
SET SESSION sql_mode = (
    SELECT REPLACE(@@SESSION.sql_mode, 'NO_ZERO_IN_DATE', '')
);

ALTER TABLE rutas
  ADD COLUMN motivo_anulacion VARCHAR(255) DEFAULT NULL
  AFTER anulada_ruta;