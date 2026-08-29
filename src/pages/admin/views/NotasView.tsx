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
import type { NotaDianDTO } from '@/types';
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

export default function NotasView() {
  const { user } = useAuth();
  const [tipo, setTipo] = useState<'91' | '92'>('91');
  const [numeroFactura, setNumeroFactura] = useState('');
  const [cude, setCude] = useState('');
  const [fechaRef, setFechaRef] = useState('');
  const [motivo, setMotivo] = useState('');
  const [valor, setValor] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<DianResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const emitir = async () => {
    setLoading(true);
    setError(null);
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
      } else {
        setError(res?.message || 'El Core DIAN no autorizó la nota.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de comunicación con el Core DIAN.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Notas Crédito / Débito (DIAN)</h1>
        <p className="text-sm text-slate-500">
          Emita Nota Crédito (91) o Nota Débito (92) sobre un Documento Equivalente Electrónico (Tipo 21) ya autorizado.
        </p>
      </div>

      <Tabs value={tipo} onValueChange={(v) => setTipo(v as '91' | '92')}>
        <TabsList>
          <TabsTrigger value="91">Nota Crédito (91)</TabsTrigger>
          <TabsTrigger value="92">Nota Débito (92)</TabsTrigger>
        </TabsList>

        <TabsContent value="91">
          <Card>
            <CardHeader>
              <CardTitle>Nota Crédito — ajuste a favor del pasajero</CardTitle>
              <CardDescription>Devolución, anulación parcial o corrección de un tiquete.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
              <Button onClick={emitir} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
                {loading ? 'Emitiendo…' : 'Emitir Nota Crédito'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="92">
          <Card>
            <CardHeader>
              <CardTitle>Nota Débito — ajuste a favor de la empresa</CardTitle>
              <CardDescription>Cargos adicionales o diferencia de tarifa sobre un tiquete.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
              <Button onClick={emitir} disabled={loading} className="bg-amber-600 hover:bg-amber-700">
                {loading ? 'Emitiendo…' : 'Emitir Nota Débito'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      {resultado?.success && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg text-xs font-mono">
          <p className="font-bold text-sm mb-1">✅ Nota autorizada por DIAN</p>
          <p>Factura: {resultado.numero_factura}</p>
          <p className="break-all">CUDE: {resultado.cude || resultado.cufe}</p>
        </div>
      )}
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
