# Documentación de la Base de Datos `flota9`

## Cómo se generó esta documentación

Esta documentación fue generada de forma automatizada con el endpoint público del
sistema SACTel:

```
POST https://api.sactel.net/api/v1/dictionary/generate
```

El endpoint genera un archivo **Excel** (`diccionario_datos_flota9.xlsx`) con el
diccionario de datos de la base `flota9`, listando por cada tabla sus campos,
tipos de dato, nulabilidad, claves, valores por defecto, extras e índices.

### Regeneración

Para regenerar el diccionario (después de migraciones o cambios de esquema):

```bash
curl -s -X POST https://api.sactel.net/api/v1/dictionary/generate \
  -H "Content-Type: application/json" \
  -d '{"database_name":"flota9","host":"181.143.144.2","port":3306,"username":"developer","password":"123456"}' \
  -o docs/diccionario_datos_flota9.xlsx
```

> **Nota**: MySQL 5.0 no soporta la colación `utf8mb4`; el backend ya detecta
> ese error y falla silenciosamente a `utf8`, por lo que la generación funciona.

## Contenido del diccionario

| Atributo | Valor |
|---|---|
| Base de datos | `flota9` |
| Host | `181.143.144.2` |
| Motor / versión | MySQL 5.0.45 |
| Archivo Excel | `docs/diccionario_datos_flota9.xlsx` |
| Hojas | 1 ("Diccionario de Datos") |
| Tablas documentadas | 127 (119 tablas + 8 vistas) |
| Filas de datos | 2177 |
| Columnas del diccionario | Campo, Tipo de Dato, Nulo, Clave, Valor por Defecto, Extra, Descripción |

## Índice de tablas por módulo

### Tablas de operación y venta (núcleo del sistema de tickets)

| Tabla | Descripción |
|---|---|
| `planillas` | Venta de tiquetes por puesto (asiento) en cada ruta/fecha |
| `rutas` | Programación de rutas (origen, destino, vehículos, conductores, estados) |
| `pasajero` | Catálogo de pasajeros |
| `tarifa` | Tarifas por origen–destino y tipo de servicio |
| `recorrido` | Recorridos/servicios entre municipios |
| `orides` | Agencias (orígenes/destinos) con descripción |
| `conductores` | Conductores de la flota |
| `auxiliares` | Auxiliares de ruta (terceros en el bus) |
| `vehiculo` | Vehículos de la flota (placas, tarjeta, SOAT, seguros) |
| `propietario` | Propietarios/empresas, NIT de la empresa emisora |
| `parametros` | Parámetros del sistema (consecutivos, config impresión) |
| `ruta_tipo` | Tipos de servicio (SIN AIRE, CON AIRE, EXCEPCIONADOS) |
| `usuario` | Usuarios del sistema (cajeros, despachadores, admins, superadmin) |
| `resumen_caja` | Resumen de caja y cierre contable |

### Tablas contables y de tesorería

| Tabla | Descripción |
|---|---|
| `vales` / `vales_x` / `vales_autorizados` | Vales por anticipo/crédito, autorizaciones |
| `vales_guataqui`, `vales_imprimir`, `vales_imprimir_autorizar` | Vales relacionados (Guataquí / impresión) |
| `recaudos` | Recaudo de caja |
| `consignaciones` | Consignaciones bancarias |
| `cuentas` | Cuentas de propietarios/conductores |
| `creditos_distribuidos` | Distribución de créditos |
| `cajamenor` / `dinero_base` | Caja menor y base de caja |
| `anticipados` / `anticipos_administrativos` | Anticipos administrativos y de viaje |
| `reintegro` | Reintegro de gastos |
| `regresos` | Regresos/cancelaciones |

### Producción y rodamiento

| Tabla | Descripción |
|---|---|
| `producidos_conductor` | Producción por conductor |
| `producidos_conductor_medios` | Idem por medios |
| `producidos_recorridos` | Producción por recorrido |
| `ingreso_producidos` / `ingreso_turismos` | Ingresos de producción / turismo |
| `rodamiento` / `rodamiento_historico` | Rodamiento de vehículos y su histórico |
| `turnos_rdto` | Turnos de rendimiento |
| `despachos_terminal` | Despachos registrados en terminal |
| `transmision` | Registros de transmisión |
| `temporada` | Temporadas de promoción |
| `tiqueconvenio`, `tiquedatafono`, `tiqueteinternet` | Tiquetes por convenio, datáfono, internet |
| `tiquetes_promocion` | Tiquetes de promociones |

### Relaciones vehículo–conductor–propietario/historia

| Tabla | Descripción |
|---|---|
| `vehiculo_conductor` | Asignación vehículo–conductor |
| `vehiculo_conductor_sobrantes` | Sobrantes de asignación |
| `vehiculo_propietario` | Asignación vehículo–propietario |
| `vehiculo_auxiliar` | Auxiliares (terceros) asignados a vehículo |
| `vehiculo_tiempos` | Tiempos de vehículo |
| `vehiculo_viejo` | Vehículos históricos/retirados |
| `historia_conductor` / `historia_conductor_bloqueo` | Historía del conductor y bloqueos |
| `historia_conductor_retiros` / `historia_conductor_viejo` | Retiros / versiones previas |
| `historia_propietario` / `historia_propietario_viejo` | Historia del propietario |

### Históricos

| Tabla | Descripción |
|---|---|
| `historico_planillas` | Histórico de ventas de tiquetes |
| `historico_rutas` | Histórico de rutas |
| `anulados` | Tiquetes anulados |
| `asistencia` / `asistencia2` / `asistencia3` | Asistencias |
| `ausencias` | Faltas/ausencias |
| `enturnados` | Enturnamientos de turnos |
| `huellas` / `huellas2` | Lectores biométricos |
| `comunicados` | Comunicados |
| `festivos` / `festivos_nomina` | Calendario festivo y festivos nómina |
| `siniestros` | Siniestros de vehículos |
| `sustituto` | Sustituciones de conductores |
| `transbordos` | Transbordos de pasajeros |
| `transito` | Registros de tránsito |
| `desbloqueo` | Historial de desbloqueos |
| `grupo_bloqueo` | Grupos de bloqueo |
| `enroll` | Enrolamiento biométrico |

### Venta web / integraciones auxiliares

| Tabla | Descripción |
|---|---|
| `busvirtual` | Buses virtuales (venta online) |
| `plataforma_externa` | Integración con plataformas externas |
| `recorrido_web`, `recorrido_citys`, `recorrido_citys_busvirtual` | Recorridos web |
| `orides_1` / `orides_2` | Vistas de orides (alias) |
| `ciudades_origen` | Ciudades de origen |
| `fechas_web` | Fechas para la web |

### Tablas tipo `x_*` (migración/intercambio)

| Tabla | Descripción |
|---|---|
| `x_comprador`, `x_factura`, `x_itinerario`, `x_map` | Datos de intercambio/histórico |
| `x_pasajero`, `x_reserva`, `x_ruta`, `x_silla` | Datos de reservas y rutas para migración |

### Vistas

| Vista | Propósito |
|---|---|
| `orides_1`, `orides_2`, `origendestino` | Vistas de origen/destino |
| `vista_ciudades_recorrido2` | Ciudades por recorrido |
| `vista_planilla` | Vista principal de planillas |
| `vista_planillas_puestos` | Puestos ocupados |
| `vista_planillas_puestos_vacios` | Puestos libres |
| `vista_planillas_unica` | Vista planilla única |

## Estructura de una fila del diccionario

Cada tabla ocupa un bloque dentro de la hoja, con la siguiente estructura:

```
Base de Datos: flota9                          <- título (fila 1)
Tabla | <nombre de la tabla>                  <- identificador
Descripción de la Tabla | (rellenar manualmente)
Índices | Descripción del Indice
<lista de índices>                             <- ej: UNIQUE PRIMARY(cedula_conduc)
Campo | Tipo de Dato | Nulo | Clave | Valor por Defecto | Extra | Descripción del Campo
<campo> | <tipo> | <null/no> | <PRI/MUL> | <default> | <auto_increment> | (doc)
...
```

## Cómo interpretar las columnas

- **Campo**: nombre de la columna.
- **Tipo de Dato**: tipo SQL (ej. `char(10)`, `int(11)`, `date`, `decimal(12,2)`).
- **Nulo**: `YES` (permite NULL) o `NO` (obligatorio).
- **Clave**: `PRI` (primaria), `UNI` (única), `MUL` (índice no único) o vacío.
- **Valor por Defecto**: valor default; si aparece `0` frecuentemente.
- **Extra**: marcadores como `auto_increment`.
- **Descripción del Campo**: campo libre para completar documentación manual.

## Documentación relacionada

- [`CONFIGURACION_BASE_DE_DATOS.md`](CONFIGURACION_BASE_DE_DATOS.md): conexión y credenciales.
- [`ANALISIS_BASE_DE_DATOS_FLOTA9.md`](ANALISIS_BASE_DE_DATOS_FLOTA9.md): estado, riesgos y recomendaciones.
- [`CAMBIOS_BASE_DE_DATOS.md`](CAMBIOS_BASE_DE_DATOS.md): migración y cambios DDL.