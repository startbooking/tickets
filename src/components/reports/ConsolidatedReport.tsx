import { useState, useMemo, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Printer, FileText, MapPin, Bus, User } from 'lucide-react';
import { Ticket } from '@/types';
import { mockRutas, mockBuses, mockUsuario } from '@/data/mockData';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface ConsolidatedReportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tickets: Ticket[];
}

export function ConsolidatedReport({ open, onOpenChange, tickets }: ConsolidatedReportProps) {
  const [filterRuta, setFilterRuta] = useState<string>('all');
  const [filterBus, setFilterBus] = useState<string>('all');
  const [filterUsuario, setFilterUsuario] = useState<string>('all');
  const printRef = useRef<HTMLDivElement>(null);

  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      const matchRuta = filterRuta === 'all' || ticket.ruta.id.toString() === filterRuta;
      const matchBus = filterBus === 'all' || ticket.planilla.bus.id.toString() === filterBus;
      // Mock: todos los tickets del usuario actual
      const matchUsuario = filterUsuario === 'all' || filterUsuario === mockUsuario.id.toString();
      
      return matchRuta && matchBus && matchUsuario && ticket.estado !== 'CANCELADO';
    });
  }, [tickets, filterRuta, filterBus, filterUsuario]);

  const totalVentas = filteredTickets.reduce((sum, t) => sum + t.valorPagado, 0);
  const totalTickets = filteredTickets.length;

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Consolidado de Tickets - TransTicket</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; color: #1e3a5f; }
            .header-info { margin-bottom: 20px; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #1e3a5f; color: white; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .totals { margin-top: 20px; font-size: 18px; font-weight: bold; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <h1>TransTicket - Consolidado de Ventas</h1>
          <div class="header-info">
            <p>Fecha: ${new Date().toLocaleDateString('es-CO')}</p>
            <p>Usuario: ${mockUsuario.nombreCompleto}</p>
            ${filterRuta !== 'all' ? `<p>Ruta: ${mockRutas.find(r => r.id.toString() === filterRuta)?.municipioOrigen?.nombre} → ${mockRutas.find(r => r.id.toString() === filterRuta)?.municipioDestino?.nombre}</p>` : ''}
            ${filterBus !== 'all' ? `<p>Bus: ${mockBuses.find(b => b.id.toString() === filterBus)?.placa}</p>` : ''}
          </div>
          <table>
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Pasajero</th>
                <th>Ruta</th>
                <th>Bus</th>
                <th>Asiento</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTickets.map(t => `
                <tr>
                  <td>${t.numeroTicket}</td>
                  <td>${t.pasajero.nombreCompleto}</td>
                  <td>${t.ruta.municipioOrigen?.nombre} → ${t.ruta.municipioDestino?.nombre}</td>
                  <td>${t.planilla.bus.placa}</td>
                  <td>${t.numeroAsiento || '-'}</td>
                  <td>$${t.valorPagado.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="totals">
            <p>Total Tickets: ${totalTickets}</p>
            <p>Total Ventas: $${totalVentas.toLocaleString()}</p>
          </div>
          <div class="footer">
            <p>Generado por TransTicket - ${new Date().toLocaleString('es-CO')}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Consolidado de Tickets
          </DialogTitle>
          <DialogDescription>
            Filtra y genera el reporte consolidado de ventas
          </DialogDescription>
        </DialogHeader>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-secondary" />
              Ruta
            </Label>
            <Select value={filterRuta} onValueChange={setFilterRuta}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las rutas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las rutas</SelectItem>
                {mockRutas.map(ruta => (
                  <SelectItem key={ruta.id} value={ruta.id.toString()}>
                    {ruta.municipioOrigen?.nombre} → {ruta.municipioDestino?.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Bus className="w-4 h-4 text-secondary" />
              Bus
            </Label>
            <Select value={filterBus} onValueChange={setFilterBus}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los buses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los buses</SelectItem>
                {mockBuses.map(bus => (
                  <SelectItem key={bus.id} value={bus.id.toString()}>
                    {bus.placa} - {bus.marca}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="w-4 h-4 text-secondary" />
              Vendedor
            </Label>
            <Select value={filterUsuario} onValueChange={setFilterUsuario}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los vendedores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los vendedores</SelectItem>
                <SelectItem value={mockUsuario.id.toString()}>
                  {mockUsuario.nombreCompleto}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Tabla de resultados */}
        <div ref={printRef} className="flex-1 overflow-auto">
          {filteredTickets.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Pasajero</TableHead>
                  <TableHead>Ruta</TableHead>
                  <TableHead>Bus</TableHead>
                  <TableHead>Asiento</TableHead>
                  <TableHead>Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map(ticket => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-mono text-sm">
                      {ticket.numeroTicket}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{ticket.pasajero.nombreCompleto}</p>
                        <p className="text-xs text-muted-foreground">
                          {ticket.pasajero.numeroDocumento}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {ticket.ruta.municipioOrigen?.nombre} → {ticket.ruta.municipioDestino?.nombre}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{ticket.planilla.bus.placa}</Badge>
                    </TableCell>
                    <TableCell>
                      {ticket.numeroAsiento || '-'}
                    </TableCell>
                    <TableCell className="font-bold text-secondary">
                      ${ticket.valorPagado.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No hay tickets que coincidan con los filtros seleccionados</p>
            </div>
          )}
        </div>

        <Separator />

        {/* Totales y acciones */}
        <div className="flex items-center justify-between pt-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Total tickets: <span className="font-bold text-foreground">{totalTickets}</span>
            </p>
            <p className="text-lg font-bold text-secondary">
              Total ventas: ${totalVentas.toLocaleString()}
            </p>
          </div>

          <Button onClick={handlePrint} className="gap-2" disabled={filteredTickets.length === 0}>
            <Printer className="w-4 h-4" />
            Imprimir Consolidado
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
