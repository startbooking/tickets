import React, { useState } from 'react';
import { generateTicketTXT } from '../utils/ticketFormatter';

export default function TicketDispatcher() {
  const [loading, setLoading] = useState(false);

  // Simulación de datos del formulario de venta
  const mockTicket = {
    empresa: "TRANSMETA S.A.S",
    consecutivo: "TK-2026-894",
    fecha: new Date().toLocaleDateString(),
    hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    origen: "Villavicencio",
    destino: "Bogotá",
    pasajero: "Carlos Mendoza",
    asiento: "12",
    valor: 45000
  };

  const handlePrint = () => {
    setLoading(true);
    try {
      // 1. Generamos el texto plano con comandos ESC/POS
      const ticketContent = generateTicketTXT(mockTicket);
      
      // 2. Lo codificamos en Base64 para que viaje seguro por la URL
      const base64Content = btoa(unescape(encodeURIComponent(ticketContent)));
      
      // 3. Creamos el Intent para RawBT (App puente en Android)
      // Esto abrirá RawBT, imprimirá en silencio por el Bluetooth emparejado y volverá instantáneamente
      const rawBtIntent = `intent://base64,${base64Content}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;
      
      // 4. Redirección forzada para ejecutar la acción
      window.location.href = rawBtIntent;
      
    } catch (error) {
      console.error("Error en la impresión:", error);
      alert("No se pudo enviar a la impresora");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 flex flex-col items-center justify-center">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          🚌 Despacho de Pasajes
        </h2>
        
        {/* Vista previa del tiquete simulada en UI con Tailwind */}
        <div className="bg-amber-50 p-4 rounded-lg border border-dashed border-amber-300 font-mono text-xs text-slate-700 mb-6 shadow-inner">
          <div className="text-center font-bold text-sm">{mockTicket.empresa}</div>
          <div className="text-center text-base font-bold my-1">{mockTicket.consecutivo}</div>
          <hr className="border-dashed border-amber-300 my-2" />
          <p><strong>Origen:</strong> {mockTicket.origen}</p>
          <p><strong>Destino:</strong> {mockTicket.destino}</p>
          <p><strong>Asiento:</strong> {mockTicket.asiento}</p>
          <p><strong>Pasajero:</strong> {mockTicket.pasajero}</p>
          <hr className="border-dashed border-amber-300 my-2" />
          <div className="text-right text-sm font-bold text-slate-900">
            TOTAL: ${mockTicket.valor.toLocaleString('es-CO')}
          </div>
        </div>

        <button
          onClick={handlePrint}
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl transition duration-200 shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            "🎟️ Emitir e Imprimir Tiquete"
          )}
        </button>
      </div>
    </div>
  );
}