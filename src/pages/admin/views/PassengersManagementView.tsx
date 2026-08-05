import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Users, Search, RefreshCcw, Eye, CalendarDays, X, Clock,
} from "lucide-react";
import {
  travelsoftService,
  type PasajeroSACTel,
  type ViajePasajero,
} from '@/services/travelsoftService';
import { usePagination } from '@/hooks/usePagination';
import { PaginationBar } from "@/components/PaginationBar";
import { formatHora } from '@/services/travelsoftService';

function ViajesModal({ pasajero, open, onClose }: {
  pasajero: PasajeroSACTel | null;
  open: boolean;
  onClose: () => void;
}) {
  const [viajes, setViajes] = useState<ViajePasajero[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !pasajero) return;
    setLoading(true);
    setViajes([]);
    travelsoftService.getViajesPasajero(pasajero.cedula_pasajero || '')
      .then((data) => setViajes(data))
      .catch(() => toast.error('No se pudieron cargar los viajes del pasajero.'))
      .finally(() => setLoading(false));
  }, [open, pasajero]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Historial de Viajes
          </DialogTitle>
          <DialogDescription>
            {pasajero ? `${pasajero.nombre_pasajero || ''} — CC ${pasajero.cedula_pasajero || ''}` : ''}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCcw className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : viajes.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            Este pasajero no tiene viajes registrados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                  <th className="p-3 rounded-l-lg">Fecha</th>
                  <th className="p-3">Hora</th>
                  <th className="p-3">Origen</th>
                  <th className="p-3">Destino</th>
                  <th className="p-3">Placa</th>
                  <th className="p-3">Puesto</th>
                  <th className="p-3">Valor</th>
                  <th className="p-3 rounded-r-lg">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {viajes.map((v) => (
                  <tr key={v.id_planilla} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3">
                      <span className="flex items-center gap-1 text-slate-700">
                        <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                        {v.fecha_ruta || '—'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="flex items-center gap-1 text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {formatHora(v.hora_ruta)}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{v.origen_ruta ?? '—'}</td>
                    <td className="p-3 text-slate-600">{v.destino_ruta ?? '—'}</td>
                    <td className="p-3">
                      {v.placa_vehi ? (
                        <span className="bg-slate-200 text-slate-800 font-bold px-2 py-0.5 rounded text-xs tracking-wider">
                          {v.placa_vehi}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="p-3 text-slate-600">{v.puesto ?? '—'}</td>
                    <td className="p-3 font-semibold text-slate-900">
                      {v.valor != null ? `$${Number(v.valor).toLocaleString('es-CO')}` : '—'}
                    </td>
                    <td className="p-3">
                      {v.anulado_tiquete === '1' ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                          Anulado
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          Vigente
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-1" /> Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PassengersManagementView() {
  const [pasajeros, setPasajeros] = useState<PasajeroSACTel[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [viajesOpen, setViajesOpen] = useState(false);
  const [selectedPasajero, setSelectedPasajero] = useState<PasajeroSACTel | null>(null);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const data = await travelsoftService.getPasajeros();
      setPasajeros(data);
    } catch (err) {
      toast.error('No se pudieron cargar los pasajeros.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void cargarDatos();
  }, []);

  const pasajerosFiltrados = pasajeros.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      (p.cedula_pasajero || '').toLowerCase().includes(term) ||
      (p.nombre_pasajero || '').toLowerCase().includes(term) ||
      (p.correo_pasajero || '').toLowerCase().includes(term)
    );
  });

  const { paginatedItems, currentPage, totalPages, pageSize, setPageSize, goToPage, nextPage, prevPage, goToFirst, goToLast } =
    usePagination<PasajeroSACTel>(pasajerosFiltrados, 25);

  return (
    <Card className="shadow-sm border-slate-200 bg-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
        <div className="flex-1 min-w-0">
          <CardTitle className="text-xl flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Maestro de Pasajeros
          </CardTitle>
          <CardDescription className="mt-1">
            Consulta de pasajeros registrados e historial de sus viajes. Vista de solo lectura.
          </CardDescription>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por cédula, nombre o correo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-56 h-9 text-sm"
            />
          </div>
          <Button variant="outline" size="sm" onClick={cargarDatos} disabled={loading}>
            <RefreshCcw className={`w-4 h-4 ${loading && 'animate-spin'}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                <th className="p-3 rounded-l-lg">Cédula</th>
                <th className="p-3">Pasajero</th>
                <th className="p-3">Teléfono</th>
                <th className="p-3">Correo</th>
                <th className="p-3">Dirección</th>
                <th className="p-3 text-right rounded-r-lg">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {paginatedItems.map((p) => (
                <tr key={`${p.cedula_pasajero}|${p.nombre_pasajero}`} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 font-semibold text-slate-900">{p.cedula_pasajero || '—'}</td>
                  <td className="p-3 font-semibold text-slate-900">{p.nombre_pasajero || '—'}</td>
                  <td className="p-3 text-slate-600">{p.telefono_pasajero || '—'}</td>
                  <td className="p-3 text-slate-600">{p.correo_pasajero || '—'}</td>
                  <td className="p-3 text-slate-600">{p.direccion_pasajero || '—'}</td>
                  <td className="p-3 text-right">
                    <Button
                      variant="ghost" size="sm"
                      title="Consultar viajes"
                      onClick={() => { setSelectedPasajero(p); setViajesOpen(true); }}
                      className="text-blue-600 hover:bg-blue-50"
                    >
                      <Eye className="w-4 h-4 mr-1" /> Viajes
                    </Button>
                  </td>
                </tr>
              ))}
              {!loading && paginatedItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">
                    No se encontraron pasajeros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={pasajerosFiltrados.length}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          onGoToPage={goToPage}
          onPrevPage={prevPage}
          onNextPage={nextPage}
          onGoToFirst={goToFirst}
          onGoToLast={goToLast}
        />
      </CardContent>

      <ViajesModal
        pasajero={selectedPasajero}
        open={viajesOpen}
        onClose={() => { setViajesOpen(false); setSelectedPasajero(null); }}
      />
    </Card>
  );
}