// ============================================
// INVOICE PREVIEW COMPONENT
// Vista previa de la factura del ticket
// ============================================

import { useState, useEffect } from 'react';
import { Ticket } from '@/types';
import { buildInvoiceData } from '@/lib/thermalPrinter';
import QRCode from 'qrcode';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Printer, X, Building2, User, MapPin, CreditCard, FileCheck, QrCode } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface InvoicePreviewProps {
  ticket: Ticket | null;
  open: boolean;
  onClose: () => void;
  onPrint: () => void;
  isPrinting: boolean;
}

// Format currency
function formatCurrency(value: number): string {
  return `$${value.toLocaleString('es-CO')}`;
}

// Format date
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Format time
function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function InvoicePreview({ 
  ticket, 
  open, 
  onClose, 
  onPrint, 
  isPrinting 
}: InvoicePreviewProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  
  useEffect(() => {
    if (ticket) {
      const data = buildInvoiceData(ticket);
      const qrData = `https://verify.transveloz.com/ticket/${data.numeroFactura}?cude=${data.cude.substring(0, 16)}`;
      QRCode.toDataURL(qrData, { width: 120, margin: 1 })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error('QR generation error:', err));
    }
  }, [ticket]);
  
  if (!ticket) return null;
  
  const data = buildInvoiceData(ticket);
  
  const formaPagoLabels: Record<string, string> = {
    'EFECTIVO': 'Contado (Efectivo)',
    'TARJETA': 'Contado (Tarjeta Débito)',
    'TRANSFERENCIA': 'Contado (Transferencia)',
    'QR': 'Contado (Código QR)',
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>Factura {data.numeroFactura}</DialogTitle>
        </DialogHeader>
        
        {/* Ticket Receipt Style */}
        <div className="bg-white text-gray-900 rounded-lg p-6 font-mono text-sm space-y-4">
          {/* Header */}
          <div className="text-center space-y-1">
            <div className="flex justify-center mb-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
            </div>
            <h1 className="font-bold text-lg">{data.empresa.razonSocial}</h1>
            <p className="text-xs text-gray-600">NIT: {data.empresa.nit}</p>
            <p className="text-xs text-gray-600">{data.empresa.direccion}</p>
            <p className="text-xs text-gray-600">Tel: {data.empresa.telefono}</p>
            <p className="text-xs text-gray-600">{data.empresa.correo}</p>
            <Badge variant="outline" className="text-xs">
              {data.empresa.regimen}
            </Badge>
          </div>

          <Separator className="border-dashed" />
          
          {/* Title */}
          <div className="text-center">
            <h2 className="font-bold text-primary">TIQUETE DE TRANSPORTE</h2>
            <p className="text-xs text-gray-600">DE PASAJEROS ELECTRÓNICO</p>
          </div>

          <Separator className="border-dashed" />
          
          {/* Invoice Info */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="font-bold">Número:</span>
              <span className="text-primary font-bold">{data.numeroFactura}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Fecha Emisión:</span>
              <span>{formatDate(data.fechaEmision.toISOString())}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Hora:</span>
              <span>{formatTime(data.fechaEmision.toISOString())}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Fecha Viaje:</span>
              <span>{data.ticket.planilla.fechaDespacho}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Hora Salida:</span>
              <span className="font-bold">{data.ticket.planilla.horaProgramada}</span>
            </div>
          </div>

          <Separator className="border-dashed" />
          
          {/* Passenger */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 justify-center">
              <User className="w-4 h-4 text-gray-600" />
              <span className="font-bold text-xs uppercase">Datos del Pasajero</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Nombre:</span>
                <span className="font-medium">{data.ticket.pasajero.nombreCompleto}</span>
              </div>
              <div className="flex justify-between">
                <span>Identificación:</span>
                <span>{data.ticket.pasajero.numeroDocumento}</span>
              </div>
              {data.ticket.pasajero.telefono && (
                <div className="flex justify-between">
                  <span>Teléfono:</span>
                  <span>{data.ticket.pasajero.telefono}</span>
                </div>
              )}
            </div>
          </div>

          <Separator className="border-dashed" />
          
          {/* Service Details */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 justify-center">
              <MapPin className="w-4 h-4 text-gray-600" />
              <span className="font-bold text-xs uppercase">Detalle del Servicio</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Modo:</span>
                <span>Terrestre Automotor</span>
              </div>
              <div className="flex justify-between">
                <span>Origen:</span>
                <span className="text-right">
                  {data.ticket.ruta.municipioOrigen?.nombre}
                  <br />
                  <span className="text-gray-500">({data.ticket.ruta.municipioOrigen?.departamento})</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span>Destino:</span>
                <span className="text-right">
                  {data.ticket.ruta.municipioDestino?.nombre}
                  <br />
                  <span className="text-gray-500">({data.ticket.ruta.municipioDestino?.departamento})</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span>Vehículo (Placa):</span>
                <span className="font-bold">{data.ticket.planilla.bus.placa}</span>
              </div>
              <div className="flex justify-between">
                <span>Marca/Modelo:</span>
                <span>{data.ticket.planilla.bus.marca} {data.ticket.planilla.bus.modelo}</span>
              </div>
              {data.ticket.numeroAsiento && (
                <div className="flex justify-between">
                  <span>Silla:</span>
                  <span className="font-bold text-lg">{data.ticket.numeroAsiento}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tipo de Servicio:</span>
                <span>Intermunicipal</span>
              </div>
            </div>
          </div>

          <Separator className="border-dashed" />
          
          {/* Financial Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 justify-center">
              <CreditCard className="w-4 h-4 text-gray-600" />
              <span className="font-bold text-xs uppercase">Información Financiera</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Valor Neto Pasaje</span>
                <span>{formatCurrency(data.valorNeto)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tasa Uso Terminal</span>
                <span>{formatCurrency(data.tasaTerminal)}</span>
              </div>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>TOTAL A PAGAR</span>
              <span className="text-secondary">{formatCurrency(data.total)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-xs">
              <span>Forma de Pago:</span>
              <span>{formaPagoLabels[data.ticket.formaPago]}</span>
            </div>
          </div>

          <Separator className="border-dashed" />
          
          {/* Legal Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 justify-center">
              <FileCheck className="w-4 h-4 text-gray-600" />
              <span className="font-bold text-xs uppercase">Información Legal DIAN</span>
            </div>
            <div className="space-y-1 text-[10px] text-gray-600">
              <p><strong>CUDE:</strong></p>
              <p className="break-all bg-gray-100 p-1 rounded">{data.cude}</p>
              <p><strong>Rango de Numeración:</strong></p>
              <p>{data.rangoAutorizacion}</p>
            </div>
          </div>

          <Separator className="border-dashed" />
          
          {/* QR Code */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 justify-center">
              <QrCode className="w-4 h-4 text-gray-600" />
              <span className="font-bold text-xs uppercase">Verificación Digital</span>
            </div>
            {qrDataUrl && (
              <div className="flex justify-center">
                <img src={qrDataUrl} alt="Código QR de verificación" className="w-28 h-28" />
              </div>
            )}
            <p className="text-[10px] text-gray-500 text-center">
              Escanea para verificar la autenticidad
            </p>
          </div>

          <Separator className="border-dashed" />
          
          {/* Footer */}
          <div className="text-center text-xs text-gray-600 space-y-1">
            <p className="font-medium">¡Gracias por viajar con nosotros!</p>
            <p>Conserve este tiquete hasta finalizar su viaje</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            <X className="w-4 h-4 mr-2" />
            Cerrar
          </Button>
          <Button
            className="flex-1 bg-secondary hover:bg-secondary/90"
            onClick={onPrint}
            disabled={isPrinting}
          >
            <Printer className="w-4 h-4 mr-2" />
            {isPrinting ? 'Imprimiendo...' : 'Imprimir'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
