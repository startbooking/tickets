# Backend API - Sistema de Tickets de Transporte Intermunicipal

## Arquitectura

Este proyecto sigue los principios de **Clean Architecture**:

```
src/
├── domain/           # Capa de Dominio (Entidades y Errores)
│   ├── entities/     # Entidades del negocio
│   └── errors/       # Errores de dominio personalizados
├── application/      # Capa de Aplicación (Casos de Uso)
│   └── use-cases/    # Lógica de negocio
├── infrastructure/   # Capa de Infraestructura
│   ├── routes/       # Rutas de Express
│   ├── middleware/   # Middlewares
│   ├── repositories/ # Implementaciones de repositorios
│   └── database/     # Conexión a MySQL
└── main.ts           # Punto de entrada
```

## Instalación

```bash
npm install express mysql2 bcrypt jsonwebtoken uuid
npm install -D typescript @types/express @types/node @types/bcrypt @types/jsonwebtoken
```

## Configuración

Crear archivo `.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=transporte_intermunicipal
JWT_SECRET=tu_secret_jwt
PORT=3000
```

## Validaciones Implementadas

### Login de Usuario

1. **Dispositivo mismo municipio**: El dispositivo debe estar asignado al mismo municipio que el usuario
2. **Sin sesiones duplicadas**: El usuario no puede tener sesiones activas en diferentes dispositivos
3. **Tipo de vinculación**: Se identifica si es EMPLEADO o CONCESION

### Creación de Tickets

1. **Bus con conductor**: El bus debe tener un conductor asignado
2. **Bus despachado**: El bus debe estar en estado 'DESPACHADO' (con planilla de despacho activa)
3. **Valor correcto**: El valor del ticket debe coincidir exactamente con la tarifa de la ruta
4. **Capacidad disponible**: El bus no debe exceder su capacidad máxima
5. **Asiento disponible**: Si se especifica asiento, debe estar libre

## Endpoints

### Autenticación

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@ejemplo.com",
  "password": "password123",
  "dispositivoId": "DEVICE-001"
}
```

### Tickets

```http
POST /api/tickets
Authorization: Bearer <token>
Content-Type: application/json

{
  "planillaDespachoId": 1,
  "pasajeroId": 1,
  "rutaId": 1,
  "numeroAsiento": 5,
  "valorPagado": 85000.00,
  "formaPago": "EFECTIVO"
}
```

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| `UNAUTHORIZED` | Credenciales inválidas |
| `DISPOSITIVO_MUNICIPIO_MISMATCH` | Dispositivo no asignado al municipio del usuario |
| `SESION_DUPLICADA` | Usuario con sesión activa en otro dispositivo |
| `BUS_SIN_CONDUCTOR` | Bus sin conductor asignado |
| `BUS_NO_DESPACHADO` | Bus no está en estado DESPACHADO |
| `VALOR_TICKET_INVALIDO` | Valor no coincide con tarifa de ruta |
| `CAPACIDAD_EXCEDIDA` | Bus lleno |
| `ASIENTO_NO_DISPONIBLE` | Asiento ocupado |
