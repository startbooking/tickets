import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { LoginModal } from '@/components/auth/LoginModal';
import { Bus, MapPin, Ticket, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Footer } from '@/components/layout/Footer';

const Index = () => {
  const [loginOpen, setLoginOpen] = useState(false);

  const features = [
    {
      icon: Ticket,
      title: 'Gestión de Tickets',
      description: 'Venta y control de boletos con validaciones en tiempo real',
    },
    {
      icon: Bus,
      title: 'Control de Flota',
      description: 'Administración de buses, conductores y capacidad',
    },
    {
      icon: MapPin,
      title: 'Rutas Configurables',
      description: 'Gestión de origen, destino y tarifas por ruta',
    },
    {
      icon: Users,
      title: 'Multi-empresa',
      description: 'Soporte para empresas y concesionarios',
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar superior */}
      <Navbar onLoginClick={() => setLoginOpen(true)} />

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="text-center max-w-3xl mx-auto mb-8 mt-4">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Sistema de Boletería para{' '}
            <span className="text-primary">Transporte Intermunicipal</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Plataforma integral para la gestión de tickets, control de rutas, 
            administración de flota y validación de despachos en tiempo real.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-border hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Section */}
        {/* <div className="bg-card border border-border rounded-xl p-8 text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-3">
            ¿Listo para comenzar?
          </h2>
          <p className="text-muted-foreground mb-4">
            Inicia sesión para acceder al panel de administración y gestionar tus operaciones.
          </p>
          <button 
            onClick={() => setLoginOpen(true)}
            className="text-primary hover:text-primary/80 font-medium underline underline-offset-4"
          >
            Ingresar a la plataforma →
          </button>
        </div> */}
      </main>
      <Footer />
      {/* Login Modal */}
      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </div>
  );
};

export default Index;
