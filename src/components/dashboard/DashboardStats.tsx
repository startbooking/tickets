import { Card, CardContent } from '@/components/ui/card';
import { 
  Ticket, 
  Bus, 
  DollarSign, 
  TrendingUp,
  Users,
  Route
} from 'lucide-react';
import { mockTickets, mockPlanillas, mockRutas, mockBuses } from '@/data/mockData';

export function DashboardStats() {
  const ticketsHoy = mockTickets.filter(
    t => t.estado === 'ACTIVO' || t.estado === 'USADO'
  ).length;

  const ventasHoy = mockTickets
    .filter(t => t.estado === 'ACTIVO' || t.estado === 'USADO')
    .reduce((sum, t) => sum + t.valorPagado, 0);

  const busesEnRuta = mockBuses.filter(
    b => b.estado === 'DESPACHADO' || b.estado === 'EN_RUTA'
  ).length;

  const planillasActivas = mockPlanillas.filter(
    p => p.estado === 'DESPACHADO' || p.estado === 'EN_RUTA'
  ).length;

  const stats = [
    {
      title: 'Tickets Vendidos',
      value: ticketsHoy,
      icon: Ticket,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Ventas del Día',
      value: `$${ventasHoy.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Buses en Ruta',
      value: busesEnRuta,
      icon: Bus,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
    {
      title: 'Viajes Activos',
      value: planillasActivas,
      icon: Route,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: 'Rutas Disponibles',
      value: mockRutas.filter(r => r.activo).length,
      icon: TrendingUp,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Pasajeros Hoy',
      value: ticketsHoy,
      icon: Users,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.title}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
