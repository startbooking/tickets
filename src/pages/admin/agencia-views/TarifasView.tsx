import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tag, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { usePagination } from '@/hooks/usePagination';
import { PaginationBar } from "@/components/PaginationBar";

interface Tarifa {
  id: number;
  ruta: string;
  distancia: string;
  tarifa: number;
  servicio: 'REGULAR' | 'PREMIUM' | 'EJECUTIVO';
  activo: boolean;
}

export function TarifasView({ idAgencia }: { idAgencia: number }) {
  const [busqueda, setBusqueda] = useState('');
  const [tarifas, setTarifas] = useState<Tarifa[]>([
    { id: 1, ruta: 'Bogotá – Medellín', distancia: '414 km', tarifa: 95000, servicio: 'PREMIUM', activo: true },
    { id: 2, ruta: 'Bogotá – Cali', distancia: '448 km', tarifa: 82000, servicio: 'REGULAR', activo: true },
    { id: 3, ruta: 'Medellín – Cartagena', distancia: '653 km', tarifa: 120000, servicio: 'PREMIUM', activo: true },
    { id: 4, ruta: 'Bogotá – Ibagué', distancia: '212 km', tarifa: 58000, servicio: 'REGULAR', activo: true },
    { id: 5, ruta: 'Cali – Pasto', distancia: '328 km', tarifa: 72000, servicio: 'EJECUTIVO', activo: false },
    { id: 6, ruta: 'Barranquilla – Santa Marta', distancia: '182 km', tarifa: 49000, servicio: 'REGULAR', activo: true },
    { id: 7, ruta: 'Bogotá – Villavicencio', distancia: '118 km', tarifa: 45000, servicio: 'REGULAR', activo: true },
    { id: 8, ruta: 'Medellín – Pereira', distancia: '180 km', tarifa: 52000, servicio: 'EJECUTIVO', activo: true },
  ]);

  const filtradas = tarifas.filter(t =>
    t.ruta.toLowerCase().includes(busqueda.toLowerCase())
  );

  const { paginatedItems, currentPage, totalPages, pageSize, setPageSize, goToPage, nextPage, prevPage, goToFirst, goToLast } =
    usePagination<Tarifa>(filtradas, 25);

  const badgeColor = (servicio: Tarifa['servicio']) => {
    switch (servicio) {
      case 'PREMIUM': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'EJECUTIVO': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const handleNuevaTarifa = () => {
    toast.success('Formulario de nueva tarifa habilitado pronto.');
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="border-b pb-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Tag className="w-5 h-5" /></div>
              <div>
                <CardTitle className="text-xl">Tarifas y Rutas</CardTitle>
                <CardDescription>Consulta los precios por origen–destino y tipo de servicio.</CardDescription>
              </div>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2" onClick={handleNuevaTarifa}>
              <Plus className="w-4 h-4" /> Nueva Tarifa
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="relative mb-4 max-w-sm">
            <Input
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); goToPage(1); }}
              placeholder="Buscar ruta..."
              className="pl-9"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>

          <div className="border rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
            {paginatedItems.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-sm">No se encontraron tarifas para el criterio.</div>
            ) : paginatedItems.map(t => (
              <div key={t.id} className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{t.ruta}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{t.distancia} · Tarifa de referencia</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold border', badgeColor(t.servicio))}>{t.servicio}</span>
                  <div className="text-right">
                    <span className="font-mono font-black text-slate-900">$ {t.tarifa.toLocaleString('es-CO')}</span>
                    <div>
                      {t.activo
                        ? <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50">Activa</Badge>
                        : <Badge variant="outline" className="text-rose-600 border-rose-300 bg-rose-50">Inactiva</Badge>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <PaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtradas.length}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            onGoToPage={goToPage}
            onPrevPage={prevPage}
            onNextPage={nextPage}
            onGoToFirst={goToFirst}
            onGoToLast={goToLast}
          />
        </CardContent>
      </Card>
    </div>
  );
}