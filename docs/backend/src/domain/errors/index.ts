// ============================================
// DOMAIN ERRORS - Clean Architecture
// ============================================

export class DomainError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, code: string, statusCode: number = 400) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

// Errores de Autenticación y Sesión
export class UnauthorizedError extends DomainError {
  constructor(message: string = 'No autorizado') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

export class DispositivoNoAsignadoError extends DomainError {
  constructor() {
    super(
      'El dispositivo no está asignado al mismo municipio que el usuario',
      'DISPOSITIVO_MUNICIPIO_MISMATCH',
      403
    );
  }
}

export class SesionDuplicadaError extends DomainError {
  constructor() {
    super(
      'El usuario ya tiene una sesión activa en otro dispositivo',
      'SESION_DUPLICADA',
      403
    );
  }
}

export class UsuarioNoEmpleadoError extends DomainError {
  constructor() {
    super(
      'El usuario es por concesión, no empleado directo',
      'USUARIO_CONCESION',
      403
    );
  }
}

// Errores de Validación de Ticket
export class BusSinConductorError extends DomainError {
  constructor() {
    super(
      'El bus no tiene un conductor asignado',
      'BUS_SIN_CONDUCTOR',
      400
    );
  }
}

export class BusNoDespachadoError extends DomainError {
  constructor() {
    super(
      'El bus no está en estado DESPACHADO. No se pueden vender tickets para buses que no han iniciado su proceso de salida',
      'BUS_NO_DESPACHADO',
      400
    );
  }
}

export class ValorTicketInvalidoError extends DomainError {
  constructor(valorPagado: number, valorTarifa: number) {
    super(
      `El valor del ticket ($${valorPagado}) no coincide con la tarifa de la ruta ($${valorTarifa})`,
      'VALOR_TICKET_INVALIDO',
      400
    );
  }
}

export class AsientoNoDisponibleError extends DomainError {
  constructor(numeroAsiento: number) {
    super(
      `El asiento ${numeroAsiento} no está disponible`,
      'ASIENTO_NO_DISPONIBLE',
      400
    );
  }
}

export class CapacidadExcedidaError extends DomainError {
  constructor() {
    super(
      'El bus ha alcanzado su capacidad máxima',
      'CAPACIDAD_EXCEDIDA',
      400
    );
  }
}

export class PlanillaNoEncontradaError extends DomainError {
  constructor() {
    super(
      'La planilla de despacho no existe',
      'PLANILLA_NO_ENCONTRADA',
      404
    );
  }
}

export class RutaNoEncontradaError extends DomainError {
  constructor() {
    super(
      'La ruta no existe o no está activa',
      'RUTA_NO_ENCONTRADA',
      404
    );
  }
}
