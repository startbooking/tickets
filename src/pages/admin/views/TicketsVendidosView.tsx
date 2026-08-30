import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { travelsoftService, type TicketVendido } from '@/services/travelsoftService';
import { dianService, type DianResponse } from '@/services/dianService';
import type { NotaDianDTO } from '@/types';
import {
  EMPRESA_NIT,
  EMPRESA_NOMBRE,
  EMPRESA_DIRECCION,
  EMPRESA_TELEFONO,
  EMPRESA_EMAIL,
} from '@/services/ticketFiscalService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PaginationBar } from '@/components/PaginationBar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Download, ShieldCheck, Mail, FileMinus } from 'lucide-react';

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function inicioMesISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function nitYDv(nitRaw: string): { nit: string; dv: string } {
  const limpio = nitRaw.replace(/[^0-9]/g, '');
  return { nit: limpio.slice(0, -1), dv: limpio.slice(-1) };
}

function descargarBlob(blob: Blob, nombre: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

type AccionProcesando = { id: number; tipo: 'zip' | 'validar' } | null;

export default function TicketsVendidosView() {
  const { user } = useAuth();
  const [fechaInicio, setFechaInicio] = useState(inicioMesISO());
  const [fechaFin, setFechaFin] = useState(hoyISO());
  const [tickets, setTickets] = useState<TicketVendido[]>([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consultado, setConsultado] = useState(false);

  // Paginación
  const [pageSize, setPageSize] = useState(25);
  const [pagina, setPagina] = useState(1);
  const totalItems = tickets.length;
  const totalPaginas = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginaEff = Math.min(pagina, totalPaginas);
  const inicio = (paginaEff - 1) * pageSize;
  const listaPagina = tickets.slice(inicio, inicio + pageSize);

  // Acciones por fila
  const [procesando, setProcesando] = useState<AccionProcesando>(null);
  const [reenviarTicket, setReenviarTicket] = useState<TicketVendido | null>(null);
  const [correoReenvio, setCorreoReenvio] = useState('');
  const [enviandoCorreo, setEnviandoCorreo] = useState(false);
  const [notaTicket, setNotaTicket] = useState<TicketVendido | null>(null);
  const [notaNumero, setNotaNumero] = useState('');
  const [notaCude, setNotaCude] = useState('');
  const [notaFecha, setNotaFecha] = useState('');
  const [notaValor, setNotaValor] = useState('');
  const [notaMotivo, setNotaMotivo] = useState('');
  const [emitiendoNota, setEmitiendoNota] = useState(false);

  const consultar = async () => {
    setCargando(true);
    setError(null);
    setConsultado(true);
    setPagina(1);
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

  const descargarZip = async (t: TicketVendido) => {
    if (t.id_planilla == null) return;
    setProcesando({ id: t.id_planilla, tipo: 'zip' });
    try {
      const blob = await dianService.descargarZip(t.id_planilla);
      descargarBlob(blob, `DEE_${t.numero_factura || t.id_planilla}.zip`);
      toast.success('ZIP del documento electrónico descargado.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo descargar el ZIP.');
    } finally {
      setProcesando(null);
    }
  };

  const validar = async (t: TicketVendido) => {
    if (t.id_planilla == null) return;
    setProcesando({ id: t.id_planilla, tipo: 'validar' });
    try {
      const res: DianResponse = await dianService.validarDocumento(t.id_planilla);
      toast.success(res.message || 'Documento validado ante la DIAN.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo validar el documento.');
    } finally {
      setProcesando(null);
    }
  };

  const abrirReenviar = (t: TicketVendido) => {
    setReenviarTicket(t);
    setCorreoReenvio('');
  };

  const confirmarReenviar = async () => {
    if (!reenviarTicket || reenviarTicket.id_planilla == null) return;
    if (!correoReenvio.trim()) {
      toast.error('Ingrese el correo de destino.');
      return;
    }
    setEnviandoCorreo(true);
    try {
      const res = await dianService.reenviarDee(reenviarTicket.id_planilla, correoReenvio.trim());
      toast.success(res.message || `Documento reenviado a ${correoReenvio.trim()}.`);
      setReenviarTicket(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo reenviar el documento.');
    } finally {
      setEnviandoCorreo(false);
    }
  };

  const abrirNota = (t: TicketVendido) => {
    setNotaTicket(t);
    setNotaNumero(t.numero_factura || '');
    setNotaCude('');
    setNotaFecha(t.fecha_ruta || '');
    setNotaValor(String(Number(t.valor) || 0));
    setNotaMotivo('');
  };

  const confirmarNota = async () => {
    if (!notaTicket || notaTicket.id_planilla == null) return;
    if (!notaNumero.trim() || !notaCude.trim()) {
      toast.error('El número de factura y el CUDE son obligatorios.');
      return;
    }
    setEmitiendoNota(true);
    const valorNum = Number(notaValor) || 0;
    const { nit, dv } = nitYDv(EMPRESA_NIT);
    const ambiente = (import.meta.env.VITE_DIAN_ENVIRONMENT || 'test') === 'production' ? '1' : '2';

    const payload: NotaDianDTO = {
      tipoDocumento: '91',
      descripcionTipoDocumento: 'Nota Crédito Documento Equivalente Electrónico',
      versionEstructura: '1.0',
      ambiente,
      divisa: 'COP',
      emisor: {
        nit,
        dv,
        razonSocial: EMPRESA_NOMBRE,
        nombreComercial: EMPRESA_NOMBRE,
        tipoOrganizacion: '1',
        regimenTributario: '48',
        responsabilidadFiscal: 'O-13;O-15;O-47',
        direccion: { municipioNombre: 'BOGOTA', direccion: EMPRESA_DIRECCION },
        contacto: { telefono: EMPRESA_TELEFONO, email: EMPRESA_EMAIL },
      },
      documentoReferencia: {
        tipoDocumentoReferencia: '21',
        numeroDocumentoReferencia: notaNumero.trim(),
        cudeReferencia: notaCude.trim(),
        fechaEmisionReferencia: notaFecha || undefined,
        motivo: notaMotivo.trim(),
        valorAjuste: valorNum,
      },
      lineasDetalle: [
        {
          numeroLinea: 1,
          codigoProducto: 'AJUS-DEE',
          descripcion: notaMotivo.trim() || 'Ajuste de documento equivalente',
          cantidad: 1,
          unidadMedida: '94',
          valorUnitario: valorNum,
          descuento: 0,
          subtotal: valorNum,
          impuestos: [],
          totalLinea: valorNum,
        },
      ],
      totales: {
        lineasTotal: valorNum,
        subtotalBruto: valorNum,
        totalDescuentos: 0,
        totalCargos: 0,
        totalImpuestos: 0,
        totalPagar: valorNum,
      },
    };

    const authHeaders = {
      'x-user-id': user?.id || 0,
      'x-user-role': user?.rol || 'SUPERADMIN',
    };

    try {
      const res = await dianService.emitirNotaCredito(payload, authHeaders);
      if (res && (res.success || res.cude)) {
        toast.success(
          res.message
            ? `Nota Crédito autorizada: ${res.message}`
            : `Nota Crédito autorizada (CUDE: ${res.cude || res.cufe})`
        );
        setNotaTicket(null);
      } else {
        toast.error(res?.message || 'El Core DIAN no autorizó la nota.');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo emitir la Nota Crédito.');
    } finally {
      setEmitiendoNota(false);
    }
  };

  const estaProcesando = (t: TicketVendido, tipo: 'zip' | 'validar') =>
    procesando?.id === t.id_planilla && procesando.tipo === tipo;

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
                      <th className="text-center p-2">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="p-4 text-center text-slate-400">
                          No hay tiquetes vendidos en el rango de fechas seleccionado.
                        </td>
                      </tr>
                    ) : (
                      listaPagina.map((t, i) => (
                        <tr key={t.id_planilla ?? inicio + i} className="border-t border-slate-100">
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
                          <td className="p-2">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                size="icon"
                                variant="outline"
                                title="Descargar ZIP del documento electrónico"
                                disabled={!t.id_planilla || estaProcesando(t, 'zip')}
                                onClick={() => descargarZip(t)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="outline"
                                title="Validar en la DIAN"
                                disabled={!t.id_planilla || estaProcesando(t, 'validar')}
                                onClick={() => validar(t)}
                                className="text-blue-600"
                              >
                                <ShieldCheck className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="outline"
                                title="Reenviar DEE a otro correo"
                                disabled={!t.id_planilla}
                                onClick={() => abrirReenviar(t)}
                                className="text-emerald-600"
                              >
                                <Mail className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="outline"
                                title="Generar Nota Crédito"
                                disabled={!t.id_planilla}
                                onClick={() => abrirNota(t)}
                                className="text-rose-600"
                              >
                                <FileMinus className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {listaPagina.length > 0 && (
                <PaginationBar
                  currentPage={paginaEff}
                  totalPages={totalPaginas}
                  totalItems={totalItems}
                  pageSize={pageSize}
                  onPageSizeChange={(s) => { setPageSize(s); setPagina(1); }}
                  onGoToPage={(p) => setPagina(Math.min(Math.max(1, p), totalPaginas))}
                  onPrevPage={() => setPagina((p) => Math.max(1, p - 1))}
                  onNextPage={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  onGoToFirst={() => setPagina(1)}
                  onGoToLast={() => setPagina(totalPaginas)}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Diálogo: reenviar DEE a otro correo */}
      <Dialog open={!!reenviarTicket} onOpenChange={(o) => { if (!o) setReenviarTicket(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reenviar Documento Equivalente Electrónico</DialogTitle>
            <DialogDescription>
              Envíe el DEE del tiquete {reenviarTicket?.numero_factura || reenviarTicket?.id_planilla} a un correo diferente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            <Label htmlFor="correo-reenvio">Correo de destino</Label>
            <Input
              id="correo-reenvio"
              type="email"
              value={correoReenvio}
              onChange={(e) => setCorreoReenvio(e.target.value)}
              placeholder="cliente@correo.com"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReenviarTicket(null)} disabled={enviandoCorreo}>
              Cancelar
            </Button>
            <Button onClick={confirmarReenviar} disabled={enviandoCorreo} className="bg-emerald-600 hover:bg-emerald-700">
              {enviandoCorreo ? 'Enviando…' : 'Reenviar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo: generar Nota Crédito */}
      <Dialog open={!!notaTicket} onOpenChange={(o) => { if (!o) setNotaTicket(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generar Nota Crédito (91)</DialogTitle>
            <DialogDescription>
              Ajuste a favor del pasajero sobre el DEE {notaTicket?.numero_factura || notaTicket?.id_planilla} ya autorizado.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="nc-numero">N° factura / DEE original</Label>
              <Input id="nc-numero" value={notaNumero} onChange={(e) => setNotaNumero(e.target.value)} placeholder="FSV-00000123" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="nc-cude">CUDE original</Label>
              <Input id="nc-cude" value={notaCude} onChange={(e) => setNotaCude(e.target.value)} placeholder="A1B2…96" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="nc-fecha">Fecha emisión original</Label>
              <Input id="nc-fecha" type="date" value={notaFecha} onChange={(e) => setNotaFecha(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="nc-valor">Valor del ajuste (COP)</Label>
              <Input id="nc-valor" type="number" value={notaValor} onChange={(e) => setNotaValor(e.target.value)} placeholder="45000" />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="nc-motivo">Motivo</Label>
            <Textarea
              id="nc-motivo"
              value={notaMotivo}
              onChange={(e) => setNotaMotivo(e.target.value)}
              placeholder="Devolución, anulación parcial, corrección de datos…"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotaTicket(null)} disabled={emitiendoNota}>
              Cancelar
            </Button>
            <Button onClick={confirmarNota} disabled={emitiendoNota} className="bg-rose-600 hover:bg-rose-700">
              {emitiendoNota ? 'Emitiendo…' : 'Emitir Nota Crédito'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
