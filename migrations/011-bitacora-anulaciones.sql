-- ─────────────────────────────────────────────────────────────────────────────
-- Migración: 011 — Bitácora de anulaciones de ruta
-- ─────────────────────────────────────────────────────────────────────────────
-- Contexto: además del estado funcional (habilitada_adicional='0' +
-- anulada_adicional='1' en `adicional` y anulada_ruta + motivo_anulacion en
-- `rutas`), se guarda un registro IMMUTABLE (solo inserta) por cada anulación.
-- Permite medir/reportar: cuántas anulaciones por día, por motivo, por usuario.
-- Complementa el campo actual (el campo es el "semáforo"; esta tabla es el
-- "contador y trazabilidad"). No reemplaza ninguna columna existente.

SET SESSION sql_mode = (
    SELECT REPLACE(@@SESSION.sql_mode, 'NO_ZERO_DATE', '')
);
SET SESSION sql_mode = (
    SELECT REPLACE(@@SESSION.sql_mode, 'NO_ZERO_IN_DATE', '')
);

CREATE TABLE IF NOT EXISTS bitacora_anulaciones (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  cod_ruta INT NOT NULL,
  origen_ruta INT NOT NULL,
  fecha_ruta DATE NOT NULL,
  placa_vehi CHAR(10) DEFAULT NULL,
  numero_orden VARCHAR(6) DEFAULT NULL,
  motivo_anulacion VARCHAR(255) NOT NULL,
  cedula_usuario VARCHAR(30) DEFAULT NULL,
  nombre_usuario VARCHAR(200) DEFAULT NULL,
  fecha_anulacion DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_bitacora_fecha (fecha_ruta),
  KEY idx_bitacora_ruta (cod_ruta, origen_ruta, fecha_ruta)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;