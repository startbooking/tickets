# Cambios en la Base de Datos `travelSoft`

Registro de modificaciones estructurales (DDL) aplicadas a las tablas de la base
de datos `travelSoft` (MySQL, host `127.0.0.1:3306`).

Fecha de aplicación: 2026-07-31.

## Tabla: `rutas`

### Columnas añadidas

| Columna | Tipo | Null | Default | Posición |
|---------|------|------|---------|----------|
| `llegada_ruta` | `CHAR(1)` | NOT NULL | `'0'` | Después de `despachada_ruta` |
| `hora_llegada` | `CHAR(10)` | NULL | `NULL` | Después de `hora_despacho` |

### Propósito

Soportar el flujo de **despacho** y **reporte de llegada** de vehículos entre
agencias principales:

- `llegada_ruta = '0'` → el vehículo aún no ha llegado a la agencia destino.
- `llegada_ruta = '1'` → el vehículo llegó y `hora_llegada` guarda la hora
  (`HH:MM`) en que la agencia destino reportó la llegada.

### Semántica de estado de una ruta

| `despachada_ruta` | `llegada_ruta` | Significado |
|-------------------|----------------|-------------|
| `0` | `0` | Próxima a salir / en plataforma (sin despachar) |
| `1` | `0` | **En tránsito** hacia la agencia destino |
| `1` | `1` | **Llegó** a la agencia destino |

### SQL aplicado

```sql
SET SESSION sql_mode = '';

ALTER TABLE rutas
  ADD COLUMN llegada_ruta CHAR(1) NOT NULL DEFAULT '0' AFTER despachada_ruta,
  ADD COLUMN hora_llegada CHAR(10) NULL DEFAULT NULL AFTER hora_despacho;
```

### Rollback

```sql
ALTER TABLE rutas
  DROP COLUMN hora_llegada,
  DROP COLUMN llegada_ruta;
```

### Nota operativa (importante)

El modo estricto global del servidor (`STRICT_TRANS_TABLES`, `NO_ZERO_DATE`,
`NO_ZERO_IN_DATE`) rechaza el valor por defecto `0000-00-00` de la columna
preexistente `fecha_ruta` (NOT NULL) al reconstruir la tabla durante un `ALTER`.
Por eso el ALTER debe ejecutarse con `SET SESSION sql_mode = '';` en la misma
sesión (el modo global no se modifica). Cualquier `ALTER TABLE rutas` futuro
requiere el mismo paso previo.

## Tabla: `planillas`

### Columna añadida

| Columna | Tipo | Null | Default | Posición |
|---------|------|------|---------|----------|
| `forma_pago` | `CHAR(20)` | NULL | `NULL` | Después de `datafono` |

### Propósito

Registrar la forma de pago con que se vendió cada tiquete en el flujo de
**taquilla de ventas** del cajero:

- `EFECTIVO` → pago en caja.
- `TARJETA` → débito/crédito; además la columna preexistente `datafono` se fija
  en `1` (coherente con el sistema anterior).
- `QR` → pago por código QR.

### SQL aplicado

```sql
SET SESSION sql_mode = '';

ALTER TABLE planillas
  ADD COLUMN forma_pago CHAR(20) NULL DEFAULT NULL AFTER datafono;
```

### Rollback

```sql
ALTER TABLE planillas DROP COLUMN forma_pago;
```

## Cambios de solo lectura (sin modificación de esquema)

- La distinción **agencia principal / agencia satélite** se determina por lectura
  de `rutas`: principal si `id_orides` aparece como `origen_ruta` o `destino_ruta`
  de alguna ruta; satélite si solo es `intermedio_ruta`. No se modificó `orides`.
- Las columnas `agencia_orides` y `despacho_orides` de la tabla `orides` se usan
  únicamente como referencia de lectura (validación de agencia asignada al cajero).
- La venta de tiquetes consulta la tarifa en `tarifa` (`id_orides_1` = agencia
  del cajero, `id_orides_2` = destino) y los consecutivos
  `consecutivo_pasajero` / `consecutivo_planilla` de `parametros` (que se
  incrementan en cada venta).

## Tabla: `rutas` — columna `id_horario` (Migración 004)

### Columna añadida

| Columna | Tipo | Null | Default | Posición |
|---------|------|------|---------|----------|
| `id_horario` | `INT` | NULL | `NULL` | Después de `hora_ruta` |

### Propósito

Persistir el horario de salida de una ruta en lugar de almacenar la hora como
texto plano. La tabla `horario` dispone de `id_horario` (PK), `hora_horario`
(display para el usuario) y `hora_time` (`TIME`, valor real).

- `GET /horario/` → lista los horarios disponibles.
- `POST /rutas/crear` → recibe `id_horario` y lo almacena en `rutas.id_horario`.
- Anulable para no romper registros históricos que no tengan horario asociado.

### SQL aplicado (ver `migrations/004-id_horario_rutas.sql`)

```sql
ALTER TABLE rutas
  ADD COLUMN id_horario INT DEFAULT NULL
  AFTER hora_ruta;
```

### Rollback

```sql
ALTER TABLE rutas
  DROP COLUMN id_horario;
```

## Tabla: `rutas` — columna `id_conduce` (Migración 005)

### Columna añadida

| Columna | Tipo | Null | Default | Posición |
|---------|------|------|---------|----------|
| `id_conduce` | `INT` | NULL | `NULL` | Después de `conduce_ruta` |

### Propósito

Persistir el N° de conduce seleccionado desde la tabla `concedes`
(`id_conduce` + `desc_conduce`) en lugar de depender solo del texto descriptivo
legacy `conduce_ruta` (`CHAR(100)`). Se persiste el `id_conduce` numérico para
integridad referencial.

- `GET /conduces/` → lista los conductores disponibles (`ConduceOption`).
- `POST /rutas/crear` → recibe `id_conduce` y lo almacena en `rutas.id_conduce`.
- El campo `conduce_ruta` queda como respaldo del texto descriptivo (legacy).
- Anulable para no romper registros históricos sin conduce asociado.
- **Aplicada a `travelSoft` el 2026-08-13.** El backend de `crear_ruta` ahora
  resuelve automáticamente `conduce_ruta` (texto) desde `concedes.desc_conduce`
  cuando llega `id_conduce`, y permite crear rutas sin conduce (flujo del
  despachador, que solo exige destino/hora/placa).

### SQL aplicado (ver `migrations/005-id_conduce_rutas.sql`)

```sql
ALTER TABLE rutas
  ADD COLUMN id_conduce INT DEFAULT NULL
  AFTER conduce_ruta;
```

### Rollback

```sql
ALTER TABLE rutas
  DROP COLUMN id_conduce;
```

## Tabla: `usuario` — rol, password_hash, token_version (Migración 006)

### Contexto

`travelSoft` (BD activa del service) ya tiene `rol`, `password_hash`,
`token_version` y `estado_usuario` (usuarios demo insertados el 2026-08-12).
La BD `travellocal` (usada cuando el backend corre con el `.env` local, sin el
systemd service) **no** las tenía: faltaban `rol`, `password_hash` y
`token_version`. `nivel_usuario` y `estado_usuario` ya existían y no se tocan.

### Columnas añadidas (solo si faltan, migración idempotente)

| Columna | Tipo | Null | Default |
|---------|------|------|---------|
| `rol` | `VARCHAR(20)` | NO | `CAJERO` |
| `password_hash` | `VARCHAR(255)` | YES | `NULL` |
| `token_version` | `INT` | NO | `0` |

### Nota técnica

MySQL 8.x (versión del servidor: 8.4.10) **no soporta** `ADD COLUMN IF NOT
EXISTS` (eso es MariaDB). Se usa el patrón `information_schema.columns` +
`PREPARE`/`EXECUTE` para que la migración sea re-ejecutable sin errores.

### SQL aplicado (ver `migrations/006-usuario-schema-sync.sql`)

```sql
USE travellocal;

SET @db = 'travellocal';
-- rol
SET @sql_rol = (SELECT IF(
    EXISTS(SELECT 1 FROM information_schema.columns
           WHERE table_schema = @db AND table_name = 'usuario' AND column_name = 'rol'),
    'SELECT 1',
    'ALTER TABLE usuario ADD COLUMN rol VARCHAR(20) NOT NULL DEFAULT ''CAJERO'' AFTER clave_usuario'));
PREPARE stmt_rol FROM @sql_rol; EXECUTE stmt_rol; DEALLOCATE PREPARE stmt_rol;
-- ... (password_hash y token_version análogos: ver el archivo completo)
```

### Rollback

```sql
ALTER TABLE travellocal.usuario
  DROP COLUMN rol,
  DROP COLUMN password_hash,
  DROP COLUMN token_version;
```

### Nota

Solo afecta al entorno local. El service activo lee siempre `travelSoft`
(systemd sobreescribe `DB_DATABASE=travelSoft` sobre el `.env`). El backend
autentica con `SELECT * FROM usuario WHERE cedula_usuario = %s`, así que con
estas columnas presentes el flujo local de login ya es compatible.
