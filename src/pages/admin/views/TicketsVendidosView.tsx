import { useState } from 'react';
import { travelsoftService, type TicketVendido } from '@/services/travelsoftService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function inicioMesISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

export default function TicketsVendidosView() {
  const [fechaInicio, setFechaInicio] = useState(inicioMesISO());
  const [fechaFin, setFechaFin] = useState(hoyISO());
  const [tickets, setTickets] = useState<TicketVendido[]>([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consultado, setConsultado] = useState(false);

  const consultar = async () => {
    setCargando(true);
    setError(null);
    setConsultado(true);
    try {
      const res = await travelsoftService.getVentasRango(fechaInicio, fechaFin);
      setTickets(res.tickets);
      setTotal(res.total);
    } catch (err) {
      setTickets([]);
      setTotal(0);
      setError(
        err instanceof Error
          ? `No se pudieron consultar los tiquetes: ${err.message}`
          : 'Error de comunicación con el backend al consultar los tiquetes.'
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Tickets Vendidos</h1>
        <p className="text-sm text-slate-500">
          Reporte global de tiquetes vendidos (no anulados) en el rango de fechas seleccionado.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtro de búsqueda</CardTitle>
          <CardDescription>Seleccione el rango de fechas de los tiquetes a consultar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-end gap-3">
            <div className="space-y-1 flex-1">
              <Label htmlFor="fi">Fecha desde</Label>
              <Input id="fi" type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
            </div>
            <div className="space-y-1 flex-1">
              <Label htmlFor="ff">Fecha hasta</Label>
              <Input id="ff" type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
            </div>
            <Button onClick={consultar} disabled={cargando} className="bg-slate-800 hover:bg-slate-900">
              {cargando ? 'Consultando…' : 'Consultar'}
            </Button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
          )}

          {consultado && !error && (
            <>
              <div className="text-sm text-slate-600">
                {tickets.length} tiquete(s) · Total vendido:{' '}
                <span className="font-bold text-slate-800">{total.toLocaleString('es-CO')}</span>
              </div>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 text-slate-600">
                    <tr>
                      <th className="text-left p-2">N° Tiquete</th>
                      <th className="text-left p-2">Fecha</th>
                      <th className="text-left p-2">Hora</th>
                      <th className="text-left p-2">Origen</th>
                      <th className="text-left p-2">Destino</th>
                      <th className="text-left p-2">Placa</th>
                      <th className="text-left p-2">Puesto</th>
                      <th className="text-left p-2">Pasajero</th>
                      <th className="text-left p-2">Cajero</th>
                      <th className="text-left p-2">Forma pago</th>
                      <th className="text-right p-2">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="p-4 text-center text-slate-400">
                          No hay tiquetes vendidos en el rango de fechas seleccionado.
                        </td>
                      </tr>
                    ) : (
                      tickets.map((t, i) => (
                        <tr key={t.id_planilla ?? i} className="border-t border-slate-100">
                          <td className="p-2 font-medium">{t.consecutivo_pasajero ?? t.id_planilla}</td>
                          <td className="p-2">{t.fecha_ruta || '—'}</td>
                          <td className="p-2">{t.hora_tiquete || '—'}</td>
                          <td className="p-2">{t.origen || '—'}</td>
                          <td className="p-2">{t.destino || '—'}</td>
                          <td className="p-2">{t.placa_vehi || '—'}</td>
                          <td className="p-2">{t.puesto ?? '—'}</td>
                          <td className="p-2">
                            {t.pasajero?.nombre || t.pasajero?.documento || '—'}
                          </td>
                          <td className="p-2">{t.cajero_nombre || t.cajero || '—'}</td>
                          <td className="p-2">{t.forma_pago || '—'}</td>
                          <td className="p-2 text-right">{(Number(t.valor) || 0).toLocaleString('es-CO')}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
