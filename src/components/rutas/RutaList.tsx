import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Route, MapPin, Clock, DollarSign } from 'lucide-react';
import { mockRutas } from '@/data/mockData';
import { cn } from '@/lib/utils';

export function RutaList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Route className="w-5 h-5 text-primary" />
          Rutas Configuradas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockRutas.map(ruta => (
            <div
              key={ruta.id}
              className={cn(
                "p-4 rounded-lg border-2 transition-all",
                ruta.activo 
                  ? "border-primary/20 bg-primary/5" 
                  : "border-border bg-muted/30 opacity-60"
              )}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-secondary" />
                  <div>
                    <span className="font-bold">{ruta.municipioOrigen?.nombre}</span>
                    <span className="mx-2">→</span>
                    <span className="font-bold">{ruta.municipioDestino?.nombre}</span>
                  </div>
                </div>
                <Badge variant={ruta.activo ? "default" : "secondary"}>
                  {ruta.activo ? 'Activa' : 'Inactiva'}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-success" />
                  <div>
                    <p className="text-muted-foreground">Tarifa</p>
                    <p className="font-bold text-lg text-secondary">
                      ${ruta.valorTarifa.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Route className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-muted-foreground">Distancia</p>
                    <p className="font-medium">{ruta.distanciaKm} km</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-warning" />
                  <div>
                    <p className="text-muted-foreground">Tiempo</p>
                    <p className="font-medium">
                      {Math.floor((ruta.tiempoEstimadoMinutos || 0) / 60)}h {(ruta.tiempoEstimadoMinutos || 0) % 60}m
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
