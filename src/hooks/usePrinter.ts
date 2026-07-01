// ============================================
// USE PRINTER HOOK - Gestión de impresora térmica
// ============================================

import { useState, useCallback, useEffect } from 'react';
import { Ticket } from '@/types';
import { 
  thermalPrinter, 
  generateInvoiceHTML, 
  buildInvoiceData, 
  buildInvoiceBytes 
} from '@/lib/thermalPrinter';
import { toast } from '@/hooks/use-toast';

export function usePrinter() {
  const [isConnected, setIsConnected] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(thermalPrinter.isSupported());
  }, []);

  // Connect to thermal printer
  const connectPrinter = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      toast({
        title: 'No soportado',
        description: 'Tu navegador no soporta Web Serial API. Usa Chrome o Edge.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const connected = await thermalPrinter.connect();
      setIsConnected(connected);
      
      if (connected) {
        toast({
          title: 'Impresora conectada',
          description: 'La impresora térmica está lista para imprimir.',
        });
      } else {
        toast({
          title: 'Error de conexión',
          description: 'No se pudo conectar con la impresora.',
          variant: 'destructive',
        });
      }
      
      return connected;
    } catch (error) {
      console.error('Error connecting to printer:', error);
      return false;
    }
  }, [isSupported]);

  // Disconnect printer
  const disconnectPrinter = useCallback(async () => {
    await thermalPrinter.disconnect();
    setIsConnected(false);
    toast({
      title: 'Impresora desconectada',
      description: 'La impresora térmica ha sido desconectada.',
    });
  }, []);

  // Print ticket invoice directly to thermal printer
  const printTicketThermal = useCallback(async (ticket: Ticket): Promise<boolean> => {
    if (!isConnected) {
      // Try to connect automatically
      const connected = await connectPrinter();
      if (!connected) {
        return false;
      }
    }

    setIsPrinting(true);
    
    try {
      const success = await thermalPrinter.printInvoice(ticket);
      
      if (success) {
        toast({
          title: 'Impresión exitosa',
          description: `Factura ${ticket.numeroTicket} impresa correctamente.`,
        });
      } else {
        toast({
          title: 'Error de impresión',
          description: 'No se pudo imprimir la factura.',
          variant: 'destructive',
        });
      }
      
      return success;
    } catch (error) {
      console.error('Error printing ticket:', error);
      toast({
        title: 'Error',
        description: 'Ocurrió un error al imprimir.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsPrinting(false);
    }
  }, [isConnected, connectPrinter]);

  // Print using browser window (fallback)
  const printTicketWindow = useCallback((ticket: Ticket) => {
    const html = generateInvoiceHTML(ticket);
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      
      // Auto print after content loads
      printWindow.onload = () => {
        printWindow.print();
        // Close after printing
        printWindow.onafterprint = () => {
          printWindow.close();
        };
      };
    } else {
      toast({
        title: 'Error',
        description: 'No se pudo abrir la ventana de impresión.',
        variant: 'destructive',
      });
    }
  }, []);

  // Auto print - tries thermal first, falls back to window print
  const autoPrint = useCallback(async (ticket: Ticket): Promise<void> => {
    // If thermal printer is connected, use it
    if (isConnected) {
      await printTicketThermal(ticket);
      return;
    }

    // If Web Serial is supported and we have a saved connection preference
    if (isSupported) {
      // Try to connect and print
      const connected = await connectPrinter();
      if (connected) {
        await printTicketThermal(ticket);
        return;
      }
    }

    // Fallback to window print
    printTicketWindow(ticket);
  }, [isConnected, isSupported, connectPrinter, printTicketThermal, printTicketWindow]);

  // Get invoice data for preview
  const getInvoiceData = useCallback((ticket: Ticket) => {
    return buildInvoiceData(ticket);
  }, []);

  // Get raw bytes for debugging
  const getInvoiceBytes = useCallback((ticket: Ticket) => {
    const data = buildInvoiceData(ticket);
    return buildInvoiceBytes(data);
  }, []);

  return {
    isConnected,
    isPrinting,
    isSupported,
    connectPrinter,
    disconnectPrinter,
    printTicketThermal,
    printTicketWindow,
    autoPrint,
    getInvoiceData,
    getInvoiceBytes,
  };
}
