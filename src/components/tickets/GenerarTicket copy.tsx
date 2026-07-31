import { useState } from 'react';
import { dianService, DianResponse } from '@/services/dianService';

interface GenerarTicketProps {
  datosViaje: any;       // Información de la ruta y bus seleccionados
  datosPasajero: any;   // Información del cliente en taquilla
  asientoSeleccionado: number;
}

export default function GenerarTicket({ datosViaje, datosPasajero, asientoSeleccionado }: GenerarTicketProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [resultadoDian, setResultadoDian] = useState<DianResponse | null>(null);

  const handleGenerarYEnviarTicket = async () => {
    setLoading(true);
    setError(null);

    // 1. Estructuración del JSON bajo el formato requerido para el envío a la DIAN
    const tiqueteJsonPayload = {
      operacion: "Emision_Tiquete_Transporte",
      fecha_emision: new Date().toISOString().split('T')[0],
      hora_emision: new Date().toLocaleTimeString('en-US', { hour12: false }),
      datos_emisor: {
        token_empresa: import.meta.env.VITE_EMPRESA_TOKEN
      },
      datos_viaje: {
        id_interno_viaje: datosViaje.id_viaje,
        origen: datosViaje.origen_nombre,
        destino: datosViaje.destino_nombre,
        placa_vehiculo: datosViaje.placa_bus,
        numero_asiento: asientoSeleccionado,
        valor_tiquete: parseFloat(datosViaje.precio_tiquete)
      },
      datos_pasajero: {
        tipo_documento: datosPasajero.tipo_documento,
        numero_documento: datosPasajero.documento,
        nombres: datosPasajero.nombres,
        apellidos: datosPasajero.apellidos,
        email_notificacion: datosPasajero.email || "notificaciones@empresa.com"
      },
      impuestos: [
        {
          codigo: "01", // Código DIAN para IVA
          porcentaje: 0.00, // El transporte intermunicipal de pasajeros está excluido de IVA en Colombia
          base_imponible: parseFloat(datosViaje.precio_tiquete),
          valor_impuesto: 0.00
        }
      ]
    };

    try {
      console.log("🚀 Enviando payload estructurado a Sactel DIAN...", tiqueteJsonPayload);
      
      // 2. Enviamos el JSON al backend receptor y esperamos la respuesta síncrona
      const respuesta = await dianService.emitirTiquete(tiqueteJsonPayload);
      
      setResultadoDian(respuesta);
      
      // 3. Respuesta exitosa recibida de la DIAN -> Disparamos la impresión nativa del recibo
      if (respuesta.success) {
        setTimeout(() => {
          window.print(); // Ejecuta los estilos de impresión css o abre la pasarela física
        }, 500);
      }

    } catch (err: any) {
      console.error("🚨 Fallo en la emisión del documento ante la DIAN:", err);
      setError(err.response?.data?.message || "Error de comunicación con el servidor de la DIAN.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Finalizar Venta de Pasaje</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          ⚠️ {error}
        </div>
      )}

      {resultadoDian?.success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg text-xs font-mono">
          <p className="font-bold text-sm mb-1">✅ Factura Autorizada por DIAN</p>
          <p>Factura: {resultadoDian.numero_factura}</p>
          <p className="break-all">CUFE: {resultadoDian.cufe}</p>
        </div>
      )}

      <button
        onClick={handleGenerarYEnviarTicket}
        disabled={loading}
        className={`w-full py-3 px-6 rounded-lg font-bold text-white transition-all shadow-md flex items-center justify-center gap-2 ${
          loading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
        }`}
      >
        {loading ? (
          <>
            <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
            Firmando y Emitiendo ante la DIAN...
          </>
        ) : (
          <>
            🎟️ Generar Ticket y Emitir Factura
          </>
        )}
      </button>

      {/* Sección oculta en pantalla, visible solo al imprimir mediante CSS (@media print) */}
      {resultadoDian?.success && (
        <div className="hidden print:block p-4 font-mono text-xs w-[80mm] text-black">
          <h2 className="text-center font-bold">TIQUETE DE TRANSPORTE S.A.</h2>
          <p className="text-center">NIT: 800.123.456-1</p>
          <hr className="border-dashed my-2" />
          <p>Factura N°: {resultadoDian.numero_factura}</p>
          <p>Fecha: {new Date().toLocaleDateString()}</p>
          <hr className="border-dashed my-2" />
          <p>Ruta: {datosViaje.origen_nombre} - {datosViaje.destino_nombre}</p>
          <p>Placa Bus: {datosViaje.placa_bus}</p>
          <p className="text-sm font-bold">Asiento asignado: {asientoSeleccionado}</p>
          <hr className="border-dashed my-2" />
          <p>Pasajero: {datosPasajero.nombres} {datosPasajero.apellidos}</p>
          <p>Documento: {datosPasajero.documento}</p>
          <hr className="border-dashed my-2" />
          <p className="text-right font-bold text-sm">TOTAL: ${datosViaje.precio_tiquete}</p>
          <hr className="border-dashed my-2" />
          <p className="break-all text-[9px]">CUFE: {resultadoDian.cufe}</p>
          <p className="text-center mt-4">¡Buen viaje!</p>
        </div>
      )}
    </div>
  );
}