import { useState, useCallback } from 'react';
import { 
  Ticket, 
  CreateTicketDTO, 
  PlanillaDespacho 
} from '@/types';
import { 
  mockTickets, 
  mockPlanillas, 
  mockPasajeros,
  generateTicketNumber,
  getAsientosOcupados 
} from '@/data/mockData';
import { toast } from '@/hooks/use-toast';
import { usePrinter } from '@/hooks/usePrinter';

interface ValidationResult {
  valid: boolean;
  error?: string;
  code?: string;
}

export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets);
  const [loading, setLoading] = useState(false);
  const [lastCreatedTicket, setLastCreatedTicket] = useState<Ticket | null>(null);
  const printer = usePrinter();

  const validateTicketCreation = useCallback((
    planilla: PlanillaDespacho,
    dto: CreateTicketDTO
  ): ValidationResult => {
    // VALIDACIÓN 1: Bus debe tener conductor asignado
    if (!planilla.bus.conductorAsignado) {
      return {
        valid: false,
        error: 'El bus no tiene un conductor asignado',
        code: 'BUS_SIN_CONDUCTOR',
      };
    }

    // VALIDACIÓN 2: Bus debe estar en estado DESPACHADO
    if (planilla.bus.estado !== 'DESPACHADO') {
      return {
        valid: false,
        error: 'El bus no está en estado DESPACHADO. No se pueden vender tickets para buses que no han iniciado su proceso de salida.',
        code: 'BUS_NO_DESPACHADO',
      };
    }

    // VALIDACIÓN 3: Verificar capacidad
    if (planilla.asientosOcupados >= planilla.bus.capacidad) {
      return {
        valid: false,
        error: 'El bus ha alcanzado su capacidad máxima',
        code: 'CAPACIDAD_EXCEDIDA',
      };
    }

    // VALIDACIÓN 4: Verificar asiento disponible (si se especificó)
    if (dto.numeroAsiento) {
      if (dto.numeroAsiento < 1 || dto.numeroAsiento > planilla.bus.capacidad) {
        return {
          valid: false,
          error: `Número de asiento inválido. Debe estar entre 1 y ${planilla.bus.capacidad}`,
          code: 'ASIENTO_INVALIDO',
        };
      }

      const asientosOcupados = getAsientosOcupados(planilla.id);
      if (asientosOcupados.includes(dto.numeroAsiento)) {
        return {
          valid: false,
          error: `El asiento ${dto.numeroAsiento} ya está ocupado`,
          code: 'ASIENTO_NO_DISPONIBLE',
        };
      }
    }

    return { valid: true };
  }, []);

  const createTicket = useCallback(async (
    planilla: PlanillaDespacho,
    dto: CreateTicketDTO
  ): Promise<Ticket | null> => {
    setLoading(true);

    try {
      // Validar
      const validation = validateTicketCreation(planilla, dto);
      if (!validation.valid) {
        toast({
          title: 'Error de validación',
          description: validation.error,
          variant: 'destructive',
        });
        return null;
      }

      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 500));

      // Buscar o crear pasajero
      let pasajero = mockPasajeros.find(
        p => p.numeroDocumento === dto.pasajeroDocumento
      );

      if (!pasajero) {
        pasajero = {
          id: mockPasajeros.length + 1,
          numeroDocumento: dto.pasajeroDocumento,
          tipoDocumento: 'CC',
          nombreCompleto: dto.pasajeroNombre,
          telefono: dto.pasajeroTelefono,
        };
        mockPasajeros.push(pasajero);
      }

      // Crear ticket
      const newTicket: Ticket = {
        id: tickets.length + 1,
        numeroTicket: generateTicketNumber(),
        planilla,
        pasajero,
        ruta: planilla.ruta,
        numeroAsiento: dto.numeroAsiento,
        valorPagado: planilla.ruta.valorTarifa,
        formaPago: dto.formaPago,
        estado: 'ACTIVO',
        fechaVenta: new Date().toISOString(),
      };

      // Actualizar estado
      setTickets(prev => [...prev, newTicket]);

      // Actualizar asientos ocupados en la planilla (mock)
      const planillaIndex = mockPlanillas.findIndex(p => p.id === planilla.id);
      if (planillaIndex >= 0) {
        mockPlanillas[planillaIndex].asientosOcupados += 1;
      }

      toast({
        title: '¡Ticket creado exitosamente!',
        description: `Número: ${newTicket.numeroTicket}`,
      });

      // Store last created ticket for invoice display
      setLastCreatedTicket(newTicket);

      // Auto print invoice to thermal printer
      await printer.autoPrint(newTicket);

      return newTicket;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo crear el ticket',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [tickets, validateTicketCreation, printer]);

  const cancelTicket = useCallback(async (ticketId: number): Promise<boolean> => {
    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      setTickets(prev =>
        prev.map(t =>
          t.id === ticketId ? { ...t, estado: 'CANCELADO' as const } : t
        )
      );

      toast({
        title: 'Ticket cancelado',
        description: 'El ticket ha sido cancelado exitosamente',
      });

      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    tickets,
    loading,
    lastCreatedTicket,
    setLastCreatedTicket,
    createTicket,
    cancelTicket,
    validateTicketCreation,
    printer,
  };
}
