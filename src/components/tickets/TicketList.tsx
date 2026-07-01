import { Ticket } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { 
  Ticket as TicketIcon, 
  XCircle,
  MapPin,
  Clock,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TicketListProps {
  tickets: Ticket[];
  onCancel: (ticketId: number) => void;
}

const estadoStyles: Record<string, string> = {
  ACTIVO: 'bg-success/10 text-success border-success/20',
  USADO: 'bg-muted text-muted-foreground border-muted',
  CANCELADO: 'bg-destructive/10 text-destructive border-destructive/20',
  REEMBOLSADO: 'bg-warning/10 text-warning border-warning/20',
};

export function TicketList({ tickets, onCancel }: TicketListProps) {
  if (tickets.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <TicketIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg">No hay tickets vendidos</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TicketIcon className="w-5 h-5 text-primary" />
          Tickets Vendidos ({tickets.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead>Pasajero</TableHead>
                <TableHead>Ruta</TableHead>
                <TableHead>Asiento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map(ticket => (
                <TableRow key={ticket.id}>
                  <TableCell>
                    <span className="font-mono text-sm font-medium">
                      {ticket.numeroTicket}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{ticket.pasajero.nombreCompleto}</p>
                        <p className="text-xs text-muted-foreground">
                          {ticket.pasajero.numeroDocumento}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-secondary" />
                      <span>
                        {ticket.ruta.municipioOrigen?.nombre} → {ticket.ruta.municipioDestino?.nombre}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {ticket.numeroAsiento ? (
                      <Badge variant="outline">{ticket.numeroAsiento}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-secondary">
                      ${ticket.valorPagado.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="w-3 h-3" />
                      {format(new Date(ticket.fechaVenta), 'HH:mm', { locale: es })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={cn(estadoStyles[ticket.estado])}
                    >
                      {ticket.estado}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {ticket.estado === 'ACTIVO' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onCancel(ticket.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
