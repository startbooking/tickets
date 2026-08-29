-- =============================================================================
-- 012 - Documento Equivalente Electrónico (DEE) ante la DIAN
-- =============================================================================
-- Persiste cada tiquete emitido como Documento Equivalente Electrónico (Tipo 21)
-- para trazabilidad, reimpresión con CUDE/QR y anulación ante la DIAN.
-- El Core SACTel (dian.sactel.net :8008) escribe/lee estos registros vía
--   POST /dian/v1/tiquete-transporte/guardar
--   GET  /dian/v1/tiquete-transporte/{id_planilla}
--   POST /dian/v1/tiquete-transporte/anular

CREATE TABLE IF NOT EXISTS documentos_dian (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_planilla INT NOT NULL COMMENT 'PK de planillas (viaje del pasajero)',
  tipo_documento VARCHAR(3) NOT NULL DEFAULT '21'
    COMMENT 'Tipo 21 = Documento Equivalente Electrónico Tiquete de Transporte',
  prefijo VARCHAR(10),
  numero_consecutivo BIGINT,
  numero_factura VARCHAR(30),
  cude VARCHAR(96) COMMENT 'CUDE asignado por la DIAN/Core firmador',
  qr_data TEXT COMMENT 'Cadena QR de validación (requerida por la DIAN)',
  url_validacion VARCHAR(512) COMMENT 'URL de validación en el catálogo de la DIAN',
  estado ENUM('BORRADOR','AUTORIZADO','RECHAZADO','ANULADO') NOT NULL DEFAULT 'BORRADOR',
  respuesta_dian JSON COMMENT 'Respuesta cruda del Core (audit)',
  id_resolucion INT,
  id_orides INT COMMENT 'Agencia emisora',
  total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_impuestos DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  forma_pago VARCHAR(20),
  medio_pago VARCHAR(5),
  -- Anulación (F6): CUDE de anulación y trazabilidad
  cude_anulacion VARCHAR(96),
  motivo_anulacion VARCHAR(255),
  fecha_anulacion DATETIME,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_documentos_planilla (id_planilla),
  INDEX idx_documentos_estado (estado),
  INDEX idx_documentos_cude (cude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
