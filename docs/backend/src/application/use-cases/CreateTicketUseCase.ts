// ============================================
// CREATE TICKET USE CASE - Clean Architecture
// Application Layer
// ============================================

import {
  CreateTicketDTO,
  SessionContext,
  Ticket,
  PlanillaDespacho,
  Bus,
  Ruta,
} from '../../domain/entities';

import {
  BusSinConductorError,
  BusNoDespachadoError,
  ValorTicketInvalidoError,
  AsientoNoDisponibleError,
  CapacidadExcedidaError,
  PlanillaNoEncontradaError,
  RutaNoEncontradaError,
} from '../../domain/errors';

// Repository Interfaces (Ports)
export interface IPlanillaRepository {
  findById(id: number): Promise<PlanillaDespacho | null>;
  updateAsientosOcupados(id: number, cantidad: number): Promise<void>;
}

export interface IBusRepository {
  findById(id: number): Promise<Bus | null>;
}

export interface IRutaRepository {
  findById(id: number): Promise<Ruta | null>;
}

export interface ITicketRepository {
  create(ticket: Omit<Ticket, 'id'>): Promise<Ticket>;
  findByPlanillaAndAsiento(planillaId: number, asiento: number): Promise<Ticket | null>;
  generateNumeroTicket(): Promise<string>;
}

export interface IUnitOfWork {
  beginTransaction(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

// Use Case
export class CreateTicketUseCase {
  constructor(
    private readonly planillaRepository: IPlanillaRepository,
    private readonly busRepository: IBusRepository,
    private readonly rutaRepository: IRutaRepository,
    private readonly ticketRepository: ITicketRepository,
    private readonly unitOfWork: IUnitOfWork
  ) {}

  async execute(dto: CreateTicketDTO, context: SessionContext): Promise<Ticket> {
    await this.unitOfWork.beginTransaction();

    try {
      // 1. Obtener y validar la planilla de despacho
      const planilla = await this.planillaRepository.findById(dto.planillaDespachoId);
      if (!planilla) {
        throw new PlanillaNoEncontradaError();
      }

      // 2. Obtener y validar el bus
      const bus = await this.busRepository.findById(planilla.busId);
      if (!bus) {
        throw new PlanillaNoEncontradaError();
      }

      // VALIDACIÓN CRÍTICA 1: El bus debe tener conductor asignado
      if (!bus.conductorAsignadoId) {
        throw new BusSinConductorError();
      }

      // VALIDACIÓN CRÍTICA 2: El bus debe estar en estado DESPACHADO
      if (bus.estado !== 'DESPACHADO') {
        throw new BusNoDespachadoError();
      }

      // 3. Obtener y validar la ruta
      const ruta = await this.rutaRepository.findById(dto.rutaId);
      if (!ruta || !ruta.activo) {
        throw new RutaNoEncontradaError();
      }

      // VALIDACIÓN CRÍTICA 3: El valor del ticket debe coincidir con la tarifa
      if (dto.valorPagado !== ruta.valorTarifa) {
        throw new ValorTicketInvalidoError(dto.valorPagado, ruta.valorTarifa);
      }

      // 4. Validar capacidad del bus
      if (planilla.asientosOcupados >= bus.capacidad) {
        throw new CapacidadExcedidaError();
      }

      // 5. Validar asiento si se especificó
      if (dto.numeroAsiento) {
        if (dto.numeroAsiento > bus.capacidad || dto.numeroAsiento < 1) {
          throw new AsientoNoDisponibleError(dto.numeroAsiento);
        }

        const asientoOcupado = await this.ticketRepository.findByPlanillaAndAsiento(
          dto.planillaDespachoId,
          dto.numeroAsiento
        );

        if (asientoOcupado) {
          throw new AsientoNoDisponibleError(dto.numeroAsiento);
        }
      }

      // 6. Generar número de ticket
      const numeroTicket = await this.ticketRepository.generateNumeroTicket();

      // 7. Crear el ticket
      const ticket = await this.ticketRepository.create({
        numeroTicket,
        planillaDespachoId: dto.planillaDespachoId,
        pasajeroId: dto.pasajeroId,
        rutaId: dto.rutaId,
        numeroAsiento: dto.numeroAsiento,
        valorPagado: dto.valorPagado,
        formaPago: dto.formaPago,
        estado: 'ACTIVO',
        usuarioVentaId: context.usuarioId,
        dispositivoVentaId: context.dispositivoId,
        fechaVenta: new Date(),
        observaciones: dto.observaciones,
      });

      // 8. Actualizar asientos ocupados
      await this.planillaRepository.updateAsientosOcupados(
        dto.planillaDespachoId,
        planilla.asientosOcupados + 1
      );

      await this.unitOfWork.commit();

      return ticket;
    } catch (error) {
      await this.unitOfWork.rollback();
      throw error;
    }
  }
}
