import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { FileText, Bus, User, MapPin, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { mockPlanillas } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { EstadoPlanilla } from '@/types';

const estadoColors: Record<EstadoPlanilla, string> = {
  PROGRAMADO: 'bg-muted text-muted-foreground',
  DESPACHADO: 'bg-success/10 text-success border-success/20',
  EN_RUTA: 'bg-primary/10 text-primary border-primary/20',
  FINALIZADO: 'bg-muted text-muted-foreground',
  CANCELADO: 'bg-destructive/10 text-destructive border-destructive/20',
};

export function PlanillaList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Planillas de Despacho
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Planilla</TableHead>
                <TableHead>Ruta</TableHead>
                <TableHead>Bus</TableHead>
                <TableHead>Conductor</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Ocupación</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockPlanillas.map(planilla => (
                <TableRow key={planilla.id}>
                  <TableCell>
                    <span className="font-mono font-medium">
                      {planilla.numeroPlanilla}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-secondary" />
                      <span>
                        {planilla.ruta.municipioOrigen?.nombre} → {planilla.ruta.municipioDestino?.nombre}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Bus className="w-4 h-4 text-primary" />
                      <span className="font-medium">{planilla.bus.placa}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {planilla.conductor ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-success" />
                          <span>{planilla.conductor.nombreCompleto}</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4 text-warning" />
                          <span className="text-warning">Sin asignar</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{planilla.horaProgramada}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-secondary rounded-full transition-all"
                          style={{ 
                            width: `${(planilla.asientosOcupados / planilla.bus.capacidad) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {planilla.asientosOcupados}/{planilla.bus.capacidad}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={cn(estadoColors[planilla.estado])}
                    >
                      {planilla.estado}
                    </Badge>
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
