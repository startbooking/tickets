-- ─────────────────────────────────────────────────────────────────────────────
-- Migración: 006 — Usuario: rol, password_hash, token_version
-- ─────────────────────────────────────────────────────────────────────────────
-- El backend SACTel.Cloud autentica con clave encriptada (password_hash),
-- roles finos (rol) y token_version para invalidar sesiones. Estas columnas
-- ya existen en travelSoft (BD activa del service); esta migración sincroniza
-- travellocal (la BD que usa el backend cuando corre con el .env local).
-- Idempotente (MySQL 8.x no soporta ADD COLUMN IF NOT EXISTS; se usa
-- information_schema + PREPARE).
-- Nota: nivel_usuario y estado_usuario YA existen en travellocal; no se tocan.

USE travellocal;

SET @db = 'travellocal';

-- rol
SET @sql_rol = (SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.columns
           WHERE table_schema = @db AND table_name = 'usuario' AND column_name = 'rol'),
    'SELECT 1', 'ALTER TABLE usuario ADD COLUMN rol VARCHAR(20) NOT NULL DEFAULT ''CAJERO'' AFTER clave_usuario'));
PREPARE stmt_rol FROM @sql_rol; EXECUTE stmt_rol; DEALLOCATE PREPARE stmt_rol;

-- password_hash
SET @sql_ph = (SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.columns
           WHERE table_schema = @db AND table_name = 'usuario' AND column_name = 'password_hash'),
    'SELECT 1', 'ALTER TABLE usuario ADD COLUMN password_hash VARCHAR(255) DEFAULT NULL AFTER rol'));
PREPARE stmt_ph FROM @sql_ph; EXECUTE stmt_ph; DEALLOCATE PREPARE stmt_ph;

-- token_version
SET @sql_tv = (SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.columns
           WHERE table_schema = @db AND table_name = 'usuario' AND column_name = 'token_version'),
    'SELECT 1', 'ALTER TABLE usuario ADD COLUMN token_version INT NOT NULL DEFAULT 0 AFTER password_hash'));
PREPARE stmt_tv FROM @sql_tv; EXECUTE stmt_tv; DEALLOCATE PREPARE stmt_tv;