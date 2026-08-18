-- ─────────────────────────────────────────────────────────────────────────────
-- Migración: 009 — Anular ruta (anulada_ruta / anulada_adicional)
-- ─────────────────────────────────────────────────────────────────────────────
-- Contexto: el cajero/despachador puede anular una ruta programada. Al anularla
-- no se pueden generar ventas de tiquetes ni despacharla para la venta.
-- Se usa un flag explícito 'anulada' (no habilitada='0') para conservar el
-- historial y dar un badge/estado claro en la programación.

SET SESSION sql_mode = (
    SELECT REPLACE(@@SESSION.sql_mode, 'NO_ZERO_DATE', '')
);
SET SESSION sql_mode = (
    SELECT REPLACE(@@SESSION.sql_mode, 'NO_ZERO_IN_DATE', '')
);

ALTER TABLE rutas
  ADD COLUMN anulada_ruta CHAR(1) NOT NULL DEFAULT '0'
  AFTER habilitada_ruta;

ALTER TABLE adicional
  ADD COLUMN anulada_adicional CHAR(1) NOT NULL DEFAULT '0'
  AFTER habilitada_adicional;