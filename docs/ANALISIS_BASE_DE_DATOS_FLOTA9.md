# Análisis de la Base de Datos `flota9` — 2026-08-08

## Conexión

| Campo | Valor |
|---|---|
| Host | `181.143.144.2` |
| Puerto | `3306` |
| Base de datos | `flota9` |
| Usuario | `developer` |
| Motor / versión | **MySQL 5.0.45** |

## Estado general

| Métrica | Valor |
|---|---|
| Tablas (BASE TABLE) | 119 |
| Vistas | 8 |
| **Total** | **127** |
| Motores | 100 % **MyISAM** |
| Tipos de fila | `Fixed` (la mayoría) y `Dynamic` |
| Colaciones | Mezcladas: `latin1_swedish_ci` y `utf8_general_ci` |

### Tablas críticas (usadas por el sistema de tickets)

| Tabla | Filas | Observación |
|---|---|---|
| `conductores` | 1336 | OK |
| `vehiculo` | 537 | OK |
| `propietario` | 665 | OK |
| `usuario` | 3 | OK |
| `rutas` | 179 | OK |
| `planillas` | 0 | Tabla vacía — utiliza históricos |
| `recorrido` | 98 | OK |
| `tarifa` | 361 | OK |
| `parametros` | 1 | OK |
| `orides` | 113 | OK |
| `resoluciones` | **AUSENTE** → creada | Se creó en este script |
| `ruta_tipo` | 3 | OK |

## Problemas detectados

1. **MySQL 5.0.45 (2008)**: sin soporte para `utf8mb4`, `CHECK`, `GENERATED`,
   particiones, JSON, ni motores modernos. Solo `MyISAM` disponible → **sin
   transacciones ACID ni claves foráneas**. Riesgo de corrupción en cortes de
   energía.
2. **100 % MyISAM**: colaciones o bloqueo a nivel de tabla entera; los JOIN grandes
   y escrituras concurrentes degradan el rendimiento y pueden dañar datos.
3. **Colaciones mezcladas** (`latin1`/`utf8`): los `JOIN` entre tablas con
   collation distinta producen errores `Illegal mix of collations` o comparaciones
   incorrectas. Recomendado unificar a `utf8_general_ci` en largo plazo (con
   prueba de la app legacy antes).
4. **Vistas**: 8 vistas (`vista_planilla`, `vista_planillas_puestos`, etc.),
   solo lectura.
5. **Tablas `x_*`** (web legacy): conteniendo en su mayoría 0 filas — candidatas
   a archivo/purga.

## Cambios aplicados (script `docs/cambios_flota9.sql`)

Se alineó `flota9` con el esquema que espera el backend travelsoft (los que ya
existen en la BD operativa `travelSoft` local):

| Cambio | Detalle |
|---|---|
| `rutas.llegada_ruta` | `CHAR(1) NOT NULL DEFAULT '0'` |
| `rutas.hora_llegada` | `CHAR(10) NULL` |
| `rutas.fecha_llegada` | `DATE NULL` |
| `rutas.novedad_llegada` | `VARCHAR(500) NULL` |
| `rutas.estado_sitio` | `VARCHAR(20) NULL` (EN_PARQUEADERO/EN_SITIO) |
| `planillas.forma_pago` | `CHAR(20) NULL` (EFECTIVO/TARJETA/QR) |
| `parametros.tiquete_consolidado` | `CHAR(1) NOT NULL DEFAULT '0'` |
| Tabla `resoluciones` | Creada (ver DDL abajo) |
| Tabla `turnos_satelite` | Creada (ver DDL abajo) |

> Los cambios se crearon como **MyISAM** porque es el único motor disponible en
> el MySQL 5.0.45 remoto. Si a futuro se migra a MySQL ≥ 5.6 con InnoDB, se
> recomienda `ALTER TABLE … ENGINE=InnoDB` para transacciones y FKs.

## Recomendaciones (pendientes/futuras)

1. **Migrar a un MySQL moderno** (≥ 8.0) — es el cambio correctivo de fondo.
2. **Convertir tablas transaccionales a InnoDB** (planillas, rutas, conductores,
   vehiculo, pasajero, parametros).
3. **Unificar colaciones** de toda la BD a `utf8mb4_general_ci` / `utf8mb4_unicode_ci`.
4. **Programar respaldos** (mysqldump diario + binlog si se mueve a MySQL 8).
5. **Registrar `USER` de aplicación** `developer` con menos privilegios a futuro
   (hoy usa usuario completo mutador).

## DDL de las tablas nuevas

### `resoluciones`

```sql
CREATE TABLE flota9.resoluciones (
  id_resolucion INT NOT NULL AUTO_INCREMENT,
  id_orides INT NOT NULL COMMENT 'Agencia (principal o satelite) a la que pertenece la resolucion',
  numero_resolucion VARCHAR(40) NOT NULL COMMENT 'Numero de resolucion DIAN de autorizacion',
  prefijo VARCHAR(10) DEFAULT NULL COMMENT 'Prefijo de numeracion (si aplica)',
  rango_inicial BIGINT DEFAULT NULL,
  rango_final BIGINT DEFAULT NULL,
  consecutivo_actual BIGINT NOT NULL DEFAULT 0 COMMENT 'Ultimo consecutivo utilizado',
  fecha_resolucion DATE DEFAULT NULL COMMENT 'Fecha de expedicion de la resolucion',
  municipio VARCHAR(120) DEFAULT NULL COMMENT 'Municipio al que se autoriza la resolucion',
  vigencia_desde DATE DEFAULT NULL,
  vigencia_hasta DATE DEFAULT NULL,
  activa TINYINT(1) NOT NULL DEFAULT 1,
  notas VARCHAR(255) DEFAULT NULL,
  fecha_creacion TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_resolucion),
  KEY idx_resolucion_orides (id_orides),
  KEY idx_resolucion_activa (activa)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
```

### `turnos_satelite`

```sql
CREATE TABLE flota9.turnos_satelite (
  id_turno INT NOT NULL AUTO_INCREMENT,
  id_orides INT NOT NULL,
  cedula_usuario VARCHAR(30) DEFAULT NULL,
  operador VARCHAR(100) DEFAULT NULL,
  fecha_inicio DATE DEFAULT NULL,
  inicio DATETIME DEFAULT NULL,
  cierre DATETIME DEFAULT NULL,
  tiquetes INT NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  efectivo DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  tarjeta DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  qr DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  detalle TEXT,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_turno),
  KEY idx_turnos_orides (id_orides)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
```

## Archivos generados

| Archivo | Descripción |
|---|---|
| `docs/diccionario_datos_flota9.xlsx` | Diccionario de datos completo (130 tablas, 2177 filas) |
| `docs/cambios_flota9.sql` | Script de cambios aplicado (idempotente) |
| `docs/CONFIGURACION_BASE_DE_DATOS.md` | Configuración de conexión |