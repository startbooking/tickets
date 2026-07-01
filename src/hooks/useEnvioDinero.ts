// ============================================
// USE ENVIO DINERO HOOK - Gestión de envíos de dinero
// Includes support for receipts: remitente, conductor, receptor
// ============================================

import { useState, useCallback } from 'react';
import { EnvioDinero, CreateEnvioDineroDTO, Municipio, ReciboEnvioDineroDTO } from '@/types';
import { mockMunicipios, mockBuses, mockPlanillas } from '@/data/mockData';
import { toast } from '@/hooks/use-toast';
import { usePrinter } from '@/hooks/usePrinter';
import { 
  thermalPrinter, 
  buildEnvioReciboBytes, 
  generateEnvioReciboHTML 
} from '@/lib/thermalPrinter';

// Receipt type for thermal printing
type ReciboTipo = 'remitente' | 'conductor' | 'receptor';

// Mock data for envios
const mockEnvios: EnvioDinero[] = [];

const COMISION_PORCENTAJE = 0.05; // 5% de comisión

export function generateEnvioNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ENV-${year}${month}${day}-${random}`;
}

export function useEnvioDinero() {
  const [envios, setEnvios] = useState<EnvioDinero[]>(mockEnvios);
  const [loading, setLoading] = useState(false);
  const [lastCreatedEnvio, setLastCreatedEnvio] = useState<EnvioDinero | null>(null);
  const printer = usePrinter();

  const createEnvio = useCallback(async (
    dto: CreateEnvioDineroDTO,
    municipioOrigen: Municipio
  ): Promise<EnvioDinero | null> => {
    setLoading(true);

    try {
      // Validaciones
      if (dto.monto <= 0) {
        toast({
          title: 'Error de validación',
          description: 'El monto debe ser mayor a 0',
          variant: 'destructive',
        });
        return null;
      }

      // Buscar bus
      const bus = mockBuses.find(b => b.id === dto.busId);
      if (!bus) {
        toast({
          title: 'Error',
          description: 'Bus no encontrado',
          variant: 'destructive',
        });
        return null;
      }

      // Buscar conductor asignado al bus
      const conductor = bus.conductorAsignado;
      if (!conductor) {
        toast({
          title: 'Error',
          description: 'El bus no tiene conductor asignado',
          variant: 'destructive',
        });
        return null;
      }

      // Buscar municipio destino
      const municipioDestino = mockMunicipios.find(m => m.id === dto.municipioDestinoId);
      if (!municipioDestino) {
        toast({
          title: 'Error',
          description: 'Municipio destino no encontrado',
          variant: 'destructive',
        });
        return null;
      }

      // Buscar planilla del bus para obtener la hora
      const planilla = mockPlanillas.find(p => 
        p.bus.id === bus.id && 
        (p.estado === 'DESPACHADO' || p.estado === 'PROGRAMADO')
      );
      
      const horaDespacho = planilla?.horaProgramada || 
        new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 500));

      const comision = Math.round(dto.monto * COMISION_PORCENTAJE);
      const montoTotal = dto.monto + comision;

      const newEnvio: EnvioDinero = {
        id: envios.length + 1,
        numeroEnvio: generateEnvioNumber(),
        remitente: {
          numeroDocumento: dto.remitenteDocumento,
          tipoDocumento: dto.remitenteTipoDocumento,
          nombreCompleto: dto.remitenteNombre,
          telefono: dto.remitenteTelefono,
        },
        destinatario: {
          numeroDocumento: dto.destinatarioDocumento,
          nombreCompleto: dto.destinatarioNombre,
          telefono: dto.destinatarioTelefono,
        },
        monto: dto.monto,
        comision,
        montoTotal,
        conductor,
        bus,
        municipioOrigen,
        municipioDestino,
        planilla,
        estado: 'PENDIENTE',
        fechaCreacion: new Date().toISOString(),
        horaDespacho,
        observaciones: dto.observaciones,
      };

      setEnvios(prev => [...prev, newEnvio]);
      setLastCreatedEnvio(newEnvio);

      toast({
        title: '¡Envío registrado!',
        description: `Número: ${newEnvio.numeroEnvio} - Bus: ${bus.placa}`,
      });

      // Auto print receipts
      await printEnvioReceipts(newEnvio);

      return newEnvio;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo registrar el envío',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [envios]);

  const printEnvioReceipts = async (envio: EnvioDinero) => {
    try {
      // Print remitente receipt
      if (printer.isConnected) {
        const remitenteBytes = buildEnvioReciboBytes(envio, 'remitente');
        await thermalPrinter.printBytes(remitenteBytes);
        
        // Small delay between prints
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Print conductor receipt
        const conductorBytes = buildEnvioReciboBytes(envio, 'conductor');
        await thermalPrinter.printBytes(conductorBytes);
      } else {
        // Fallback to browser print
        printEnvioWindow(envio, 'remitente');
        setTimeout(() => {
          printEnvioWindow(envio, 'conductor');
        }, 2000);
      }
    } catch (error) {
      console.error('Error printing envio receipts:', error);
      toast({
        title: 'Advertencia',
        description: 'Envío registrado pero hubo un error al imprimir los recibos',
        variant: 'destructive',
      });
    }
  };

  const printEnvioWindow = (envio: EnvioDinero, tipo: ReciboTipo) => {
    const html = generateEnvioReciboHTML(envio, tipo);
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
        setTimeout(() => printWindow.close(), 1000);
      };
    }
  };

  const cancelEnvio = useCallback(async (envioId: number): Promise<boolean> => {
    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      setEnvios(prev =>
        prev.map(e =>
          e.id === envioId ? { ...e, estado: 'CANCELADO' as const } : e
        )
      );

      toast({
        title: 'Envío cancelado',
        description: 'El envío ha sido cancelado exitosamente',
      });

      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsDelivered = useCallback(async (
    envioId: number, 
    recibo: ReciboEnvioDineroDTO
  ): Promise<boolean> => {
    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      let updatedEnvio: EnvioDinero | null = null;

      setEnvios(prev =>
        prev.map(e => {
          if (e.id === envioId) {
            updatedEnvio = { 
              ...e, 
              estado: 'ENTREGADO' as const, 
              fechaEntrega: new Date().toISOString(),
              receptor: {
                numeroDocumento: recibo.receptorDocumento,
                nombreCompleto: recibo.receptorNombre,
                telefono: recibo.receptorTelefono,
                fechaRecepcion: new Date().toISOString(),
              }
            };
            return updatedEnvio;
          }
          return e;
        })
      );

      toast({
        title: 'Envío entregado',
        description: `Recibido por: ${recibo.receptorNombre}`,
      });

      // Print receptor receipt
      if (updatedEnvio) {
        await printReciboReceptor(updatedEnvio);
      }

      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const printReciboReceptor = async (envio: EnvioDinero) => {
    try {
      if (printer.isConnected) {
        const receptorBytes = buildEnvioReciboBytes(envio, 'receptor');
        await thermalPrinter.printBytes(receptorBytes);
      } else {
        printEnvioWindow(envio, 'receptor');
      }
    } catch (error) {
      console.error('Error printing receptor receipt:', error);
    }
  };

  return {
    envios,
    loading,
    lastCreatedEnvio,
    createEnvio,
    cancelEnvio,
    markAsDelivered,
    printEnvioReceipts,
    printer,
  };
}
