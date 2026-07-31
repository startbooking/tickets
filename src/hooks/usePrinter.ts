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

export interface DianPrintData {
  factura: string;
  pasajero: string;
  documento: string;
  origen: string;
  destino: string;
  silla: number;
  valor: number;
  formaPago: string;
  cufe: string;
  qr?: string;
}

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

  // Print a DIAN receipt using the browser print window
  const printTicket = useCallback((data: DianPrintData) => {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Tiquete DIAN</title>
      <style>
        body{font-family:monospace;width:80mm;margin:0 auto;color:#000;font-size:12px}
        h2{text-align:center;margin:4px 0}
        hr{border:none;border-top:1px dashed #000;margin:6px 0}
        p{margin:2px 0}
        .t{text-align:right;font-weight:bold}
      </style></head><body>
      <h2>TIQUETE DE TRANSPORTE</h2>
      <p class="t">NIT: 800.123.456-1</p>
      <hr>
      <p>Factura N: ${data.factura}</p>
      <p>Fecha: ${new Date().toLocaleString()}</p>
      <hr>
      <p>Ruta: ${data.origen} - ${data.destino}</p>
      <p>Asiento: ${data.silla} | Pago: ${data.formaPago}</p>
      <hr>
      <p>Pasajero: ${data.pasajero}</p>
      <p>Documento: ${data.documento}</p>
      <hr>
      <p class="t">TOTAL: $${data.valor.toLocaleString('es-CO')}</p>
      <hr>
      <p style="font-size:9px;word-break:break-all">CUFE: ${data.cufe}</p>
      <p style="text-align:center;margin-top:10px">¡Buen viaje!</p>
      </body></html>`;
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => printWindow.print();
    }
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
    printTicket,
    autoPrint,
    getInvoiceData,
    getInvoiceBytes,
  };
}
