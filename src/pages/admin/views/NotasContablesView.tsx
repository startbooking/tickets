import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { dianService, type DianResponse } from '@/services/dianService';
import {
  EMPRESA_NIT,
  EMPRESA_NOMBRE,
  EMPRESA_DIRECCION,
  EMPRESA_TELEFONO,
  EMPRESA_EMAIL,
} from '@/services/ticketFiscalService';
import type { NotaDianDTO, NotaDianResumen } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function nitYDv(nitRaw: string): { nit: string; dv: string } {
  const limpio = nitRaw.replace(/[^0-9]/g, '');
  return { nit: limpio.slice(0, -1), dv: limpio.slice(-1) };
}

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function inicioMesISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

export default function NotasContablesView() {
  const { user } = useAuth();
  const [tipo, setTipo] = useState<'91' | '92'>('91');

  // Consulta por rango de fechas
  const [fechaInicio, setFechaInicio] = useState(inicioMesISO());
  const [fechaFin, setFechaFin] = useState(hoyISO());
  const [lista, setLista] = useState<NotaDianResumen[]>([]);
  const [cargando, setCargando] = useState(false);
  const [errorConsulta, setErrorConsulta] = useState<string | null>(null);
  const [consultado, setConsultado] = useState(false);

  // Emisión
  const [mostrarEmision, setMostrarEmision] = useState(false);
  const [numeroFactura, setNumeroFactura] = useState('');
  const [cude, setCude] = useState('');
  const [fechaRef, setFechaRef] = useState('');
  const [motivo, setMotivo] = useState('');
  const [valor, setValor] = useState('');
  const [loadingEmision, setLoadingEmision] = useState(false);
  const [resultado, setResultado] = useState<DianResponse | null>(null);
  const [errorEmision, setErrorEmision] = useState<string | null>(null);

  const consultar = async () => {
    setCargando(true);
    setErrorConsulta(null);
    setConsultado(true);
    try {
      const datos =
        tipo === '91'
          ? await dianService.listarNotasCredito(fechaInicio, fechaFin)
          : await dianService.listarNotasDebito(fechaInicio, fechaFin);
      setLista(datos);
    } catch (err) {
      setLista([]);
      setErrorConsulta(
        err instanceof Error
          ? `No se pudieron consultar las notas: ${err.message}`
          : 'Error de comunicación con el Core DIAN al consultar las notas.'
      );
    } finally {
      setCargando(false);
    }
  };

  const emitir = async () => {
    setLoadingEmision(true);
    setErrorEmision(null);
    setResultado(null);
    const valorNum = Number(valor) || 0;
    const { nit, dv } = nitYDv(EMPRESA_NIT);
    const ambiente = (import.meta.env.VITE_DIAN_ENVIRONMENT || 'test') === 'production' ? '1' : '2';

    const payload: NotaDianDTO = {
      tipoDocumento: tipo,
      descripcionTipoDocumento:
        tipo === '91'
          ? 'Nota Crédito Documento Equivalente Electrónico'
          : 'Nota Débito Documento Equivalente Electrónico',
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
        numeroDocumentoReferencia: numeroFactura || undefined,
        cudeReferencia: cude || undefined,
        fechaEmisionReferencia: fechaRef || undefined,
        motivo,
        valorAjuste: valorNum,
      },
      lineasDetalle: [
        {
          numeroLinea: 1,
          codigoProducto: 'AJUS-DEE',
          descripcion: motivo || 'Ajuste de documento equivalente',
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
      const res =
        tipo === '91'
          ? await dianService.emitirNotaCredito(payload, authHeaders)
          : await dianService.emitirNotaDebito(payload, authHeaders);
      if (res && (res.success || res.cude)) {
        setResultado(res);
        setMostrarEmision(false);
      } else {
        setErrorEmision(res?.message || 'El Core DIAN no autorizó la nota.');
      }
    } catch (err) {
      setErrorEmision(err instanceof Error ? err.message : 'Error de comunicación con el Core DIAN.');
    } finally {
      setLoadingEmision(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Notas Contables (DIAN)</h1>
        <p className="text-sm text-slate-500">
          Consulte las Notas Crédito (91) y Notas Débito (92) por rango de fechas. Emita ajustes sobre un
          Documento Equivalente Electrónico (Tipo 21) ya autorizado.
        </p>
      </div>

      <Tabs value={tipo} onValueChange={(v) => { setTipo(v as '91' | '92'); setConsultado(false); setLista([]); setErrorConsulta(null); }}>
        <TabsList>
          <TabsTrigger value="91">Notas Crédito (91)</TabsTrigger>
          <TabsTrigger value="92">Notas Débito (92)</TabsTrigger>
        </TabsList>

        {(['91', '92'] as const).map((t) => (
          <TabsContent key={t} value={t}>
            <Card>
              <CardHeader>
                <CardTitle>
                  {t === '91' ? 'Notas Crédito — ajuste a favor del pasajero' : 'Notas Débito — ajuste a favor de la empresa'}
                </CardTitle>
                <CardDescription>
                  {t === '91'
                    ? 'Devolución, anulación parcial o corrección de un tiquete.'
                    : 'Cargos adicionales o diferencia de tarifa sobre un tiquete.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filtro por fechas */}
                <div className="flex flex-col md:flex-row md:items-end gap-3">
                  <div className="space-y-1 flex-1">
                    <Label htmlFor={`fi-${t}`}>Fecha desde</Label>
                    <Input id={`fi-${t}`} type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
                  </div>
                  <div className="space-y-1 flex-1">
                    <Label htmlFor={`ff-${t}`}>Fecha hasta</Label>
                    <Input id={`ff-${t}`} type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
                  </div>
                  <Button onClick={consultar} disabled={cargando} className="bg-slate-800 hover:bg-slate-900">
                    {cargando ? 'Consultando…' : 'Consultar'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setMostrarEmision((v) => !v)}
                    className="border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                  >
                    {mostrarEmision ? 'Ocultar emisión' : 'Emitir nota'}
                  </Button>
                </div>

                {errorConsulta && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{errorConsulta}</div>
                )}

                {/* Resultados */}
                {consultado && !errorConsulta && (
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100 text-slate-600">
                        <tr>
                          <th className="text-left p-2">N° Factura</th>
                          <th className="text-left p-2">Fecha</th>
                          <th className="text-left p-2">NIT Adquirente</th>
                          <th className="text-left p-2">Adquirente</th>
                          <th className="text-right p-2">Valor</th>
                          <th className="text-left p-2">CUDE</th>
                          <th className="text-left p-2">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lista.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-4 text-center text-slate-400">
                              No hay notas registradas en el rango de fechas seleccionado.
                            </td>
                          </tr>
                        ) : (
                          lista.map((n, i) => (
                            <tr key={i} className="border-t border-slate-100">
                              <td className="p-2 font-medium">{n.numeroFactura || n.consecutivo || '—'}</td>
                              <td className="p-2">{n.fechaEmision || '—'}</td>
                              <td className="p-2">{n.nitAdquirente || '—'}</td>
                              <td className="p-2">{n.nombreAdquirente || '—'}</td>
                              <td className="p-2 text-right">{(n.valor ?? 0).toLocaleString('es-CO')}</td>
                              <td className="p-2 font-mono text-xs break-all">{n.cude || '—'}</td>
                              <td className="p-2">{n.estado || '—'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Formulario de emisión */}
                {mostrarEmision && (
                  <div className="space-y-4 border-t border-slate-200 pt-4">
                    <ReferenciaForm
                      numeroFactura={numeroFactura}
                      setNumeroFactura={setNumeroFactura}
                      cude={cude}
                      setCude={setCude}
                      fechaRef={fechaRef}
                      setFechaRef={setFechaRef}
                      motivo={motivo}
                      setMotivo={setMotivo}
                      valor={valor}
                      setValor={setValor}
                    />
                    <Button onClick={emitir} disabled={loadingEmision} className="bg-emerald-600 hover:bg-emerald-700">
                      {loadingEmision ? 'Emitiendo…' : `Emitir Nota ${t === '91' ? 'Crédito' : 'Débito'}`}
                    </Button>
                    {errorEmision && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{errorEmision}</div>
                    )}
                    {resultado?.success && (
                      <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg text-xs font-mono">
                        <p className="font-bold text-sm mb-1">✅ Nota autorizada por DIAN</p>
                        <p>Factura: {resultado.numero_factura}</p>
                        <p className="break-all">CUDE: {resultado.cude || resultado.cufe}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

interface ReferenciaFormProps {
  numeroFactura: string;
  setNumeroFactura: (v: string) => void;
  cude: string;
  setCude: (v: string) => void;
  fechaRef: string;
  setFechaRef: (v: string) => void;
  motivo: string;
  setMotivo: (v: string) => void;
  valor: string;
  setValor: (v: string) => void;
}

function ReferenciaForm({
  numeroFactura,
  setNumeroFactura,
  cude,
  setCude,
  fechaRef,
  setFechaRef,
  motivo,
  setMotivo,
  valor,
  setValor,
}: ReferenciaFormProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="nf">N° factura / DEE original</Label>
          <Input id="nf" value={numeroFactura} onChange={(e) => setNumeroFactura(e.target.value)} placeholder="FSV-00000123" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="cude">CUDE original</Label>
          <Input id="cude" value={cude} onChange={(e) => setCude(e.target.value)} placeholder="A1B2…96" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="fecha">Fecha emisión original</Label>
          <Input id="fecha" type="date" value={fechaRef} onChange={(e) => setFechaRef(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="valor">Valor del ajuste (COP)</Label>
          <Input id="valor" type="number" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="45000" />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="motivo">Motivo</Label>
        <Textarea id="motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Error en origen/destino, devolución parcial…" />
      </div>
    </>
  );
}
