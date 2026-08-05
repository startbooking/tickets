import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Landmark, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { usePagination } from '@/hooks/usePagination';
import { PaginationBar } from "@/components/PaginationBar";

interface Empresa {
  id: number;
  nit: string;
  razonSocial: string;
  contacto: string;
  flota: number;
  activo: boolean;
}

export function EmpresasView({ idAgencia }: { idAgencia: number }) {
  const [busqueda, setBusqueda] = useState('');
  const [empresas, setEmpresas] = useState<Empresa[]>([
    { id: 1, nit: '900.123.456-7', razonSocial: 'Flota Magdalena S.A.', contacto: 'Gerencia Operativa', flota: 24, activo: true },
    { id: 2, nit: '800.987.654-3', razonSocial: 'Expreso Bolivariano', contacto: 'Administración Central', flota: 18, activo: true },
    { id: 3, nit: '901.456.789-0', razonSocial: 'Coomotor Cooperativa', contacto: 'Dirección General', flota: 31, activo: true },
    { id: 4, nit: '860.555.111-2', razonSocial: 'Transportes El Cóndor', contacto: 'Recursos Humanos', flota: 9, activo: false },
    { id: 5, nit: '830.222.333-4', razonSocial: 'Autobuses Rápidos del Caribe', contacto: 'Coordinación de Rutas', flota: 15, activo: true },
    { id: 6, nit: '890.444.555-6', razonSocial: 'Cootranshuila', contacto: 'Oficina Principal', flota: 12, activo: true },
  ]);

  const filtradas = empresas.filter(e =>
    e.razonSocial.toLowerCase().includes(busqueda.toLowerCase())
  );

  const { paginatedItems, currentPage, totalPages, pageSize, setPageSize, goToPage, nextPage, prevPage, goToFirst, goToLast } =
    usePagination<Empresa>(filtradas, 25);

  const handleNuevaEmpresa = () => {
    toast.success('Registro de nueva empresa habilitado pronto.');
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="border-b pb-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Landmark className="w-5 h-5" /></div>
              <div>
                <CardTitle className="text-xl">Empresas y Concesionarios</CardTitle>
                <CardDescription>Gestión de las empresas transportadoras vinculadas a la terminal.</CardDescription>
              </div>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2" onClick={handleNuevaEmpresa}>
              <Plus className="w-4 h-4" /> Nueva Empresa
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="relative mb-4 max-w-sm">
            <Input
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); goToPage(1); }}
              placeholder="Buscar empresa..."
              className="pl-9"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>

          <div className="border rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
            {paginatedItems.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-sm">No se encontraron empresas para el criterio.</div>
            ) : paginatedItems.map(e => (
              <div key={e.id} className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{e.razonSocial}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">NIT {e.nit} · {e.contacto}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">
                    {e.flota} unidades
                  </span>
                  {e.activo
                    ? <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50">Activa</Badge>
                    : <Badge variant="outline" className="text-rose-600 border-rose-300 bg-rose-50">Inactiva</Badge>}
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