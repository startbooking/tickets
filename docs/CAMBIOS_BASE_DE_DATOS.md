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
