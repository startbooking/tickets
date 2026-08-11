# Configuración de Base de Datos — Sistema de Tickets SACTel

## Resumen

El sistema SACTel utiliza una base de datos **MySQL** que alberga toda la información
transaccional del sistema de tickets, flota, rutas, pasajeros, ventas, resoluciones
fiscales y parámetros de empresa.

---

## Conexión actual

### Variable de entorno (`.env.local` y `.env.production`)

| Variable | Valor |
|---|---|
| `VITE_DB_HOST` | `181.143.144.2` |
| `VITE_DB_DATABASE` | `flota9` |
| `VITE_DB_USER` | `developer` |
| `VITE_DB_PASSWORD` | `123456` |

### Detalles de conexión

| Campo | Valor |
|---|---|
| **Motor** | MySQL 8.x |
| **Host** | `181.143.144.2` |
| **Puerto** | `3306` (default MySQL) |
| **Base de datos** | `flota9` |
| **Usuario** | `developer` |
| **Contraseña** | `123456` |
| **Tipo de acceso** | Remoto (desde el backend y herramientas de administración) |

---

## Cómo conectarse

### Desde el servidor backend (FastAPI)

El backend (`travelsoft`, puerto `8005`) se conecta a la base de datos remota
`flota9` alojada en `181.143.144.2:3306` usando las credenciales definidas en las
variables de entorno. No se requiere configuración adicional en el servidor si las
variables `.env` están actualizadas.

### Desde un cliente MySQL local (administración)

```bash
mysql -h 181.143.144.2 -P 3306 -u developer -pflota9
```

Opcionalmente, para usar un archivo de contraseña (`.my.cnf`):

```ini
[client]
host=181.143.144.2
port=3306
user=developer
password=123456
database=flota9
```

```bash
mysql --defaults-file=~/.my.cnf
```

### Desde Python (script de mantenimiento)

```python
import mysql.connector

conn = mysql.connector.connect(
    host="181.143.144.2",
    port=3306,
    user="developer",
    password="123456",
    database="flota9",
)

cursor = conn.cursor(dictionary=True)
cursor.execute("SELECT NOW() AS server_time")
print(cursor.fetchone())
conn.close()
```

---

## Migraciones y esquema

El esquema de la base de datos define las siguientes tablas clave (entre otras):

| Tabla | Propósito |
|---|---|
| `parametros` | Parámetros del sistema (consecutivos, mensaje de tiquete, configuración de impresión) |
| `propietario` | Datos de la empresa propietaria (nombre, NIT, dirección) |
| `rutas` | Rutas de buses con origen, destino, intermedios y estado de despacho/llegada |
| `planillas` | Planillas de despacho y venta de tiquetes (asientos, pasajeros, forma de pago) |
| `pasajero` | Catálogo de pasajeros |
| `orides` | Agencias/origenes-destinos (municipios) |
| `tarifa` | Tarifas por ruta y tipo de servicio |
| `resoluciones` | Resoluciones DIAN autorizadas por municipio y fecha |
| `vehiculo` | Flota de buses y sus características |
| `conductores` | Conductores de la flota |
| `usuarios` | Usuarios del sistema (cajeros, admins, superadmin) |

Las migraciones de esquema se encuentran en `migrations/` y la documentación de
cambios estructurales en [`docs/CAMBIOS_BASE_DE_DATOS.md`](CAMBIOS_BASE_DE_DATOS.md).

---

## Notas de seguridad

- **No compartir** las credenciales de la base de datos en repositorios públicos.
  El archivo `.env` está excluido de Git (ver `.gitignore`).
- Las copias de seguridad anteriores de la configuración `.env` se guardaron como
  `.env.local.bak` y `.env.production.bak` antes de actualizar.
- El usuario `developer` tiene permisos de lectura y escritura sobre `flota9`.
- Para cambios críticos de esquema, siempre usar `SET SESSION sql_mode = '';`
  antes de `ALTER TABLE` para evitar errores con columnas de fecha.

---

## Resolución de problemas comunes

| Problema | Causa probable | Solución |
|---|---|---|
| `Access denied for user 'developer'@'...' ` | Contraseña incorrecta o usuario sin permisos | Verificar `.env` y otorgar permisos en MySQL |
| `Can't connect to MySQL server on '181.143.144.2'` | Firewall bloquea el puerto 3306 o el host está caído | Verificar conectividad: `telnet 181.143.144.2 3306` |
| `Unknown database 'flota9'` | La base de datos no existe | Crear con `CREATE DATABASE flota9;` |
| `Table 'flota9.rutas' doesn't exist` | Las migraciones no se aplicaron | Revisar `migrations/` e aplicar scripts faltantes |
