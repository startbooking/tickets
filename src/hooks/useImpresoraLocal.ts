// Hook de impresión local con autodetección. Expone el estado de la impresora
// local mejor disponible y métodos para imprimir / probar, sin que el operador
// tenga que seleccionarla manualmente.

import { useCallback, useEffect, useState } from 'react';
import {
  detectarImpresoraLocal,
  imprimirLocal,
  testImpresionLocal,
  type EstadoImpresoraLocal,
  type MetodoImpresionLocal,
} from '@/services/impresoraLocal';
import { isAndroidDevice } from '@/utils/ticketFormatter';
import type { ImpresionResultado } from '@/services/ticketFiscalService';

export function useImpresoraLocal() {
  const [estado, setEstado] = useState<EstadoImpresoraLocal | null>(null);
  const [detectando, setDetectando] = useState(true);
  const [testeando, setTesteando] = useState(false);

  const detectar = useCallback(async () => {
    setDetectando(true);
    try {
      // En Android el servicio puede arrancar/pararse en mitad de sesión;
      // detectarImpresoraLocal re-sondea la caché del WS en ese entorno.
      setEstado(await detectarImpresoraLocal());
    } finally {
      setDetectando(false);
    }
  }, []);

  useEffect(() => {
    void detectar();
  }, [detectar]);

  const imprimir = useCallback(
    async (texto: string, onMetodo?: (m: MetodoImpresionLocal) => void): Promise<ImpresionResultado> => {
      return imprimirLocal(texto, onMetodo);
    },
    []
  );

  const test = useCallback(async (): Promise<ImpresionResultado> => {
    setTesteando(true);
    try {
      const r = await testImpresionLocal();
      await detectar();
      return r;
    } finally {
      setTesteando(false);
    }
  }, [detectar]);

  return {
    /** Impresora local detectada (null mientras se sondea). */
    estado,
    /** true mientras se determina la impresora disponible. */
    detectando,
    /** true si hay al menos una impresora local (incl. la del sistema). */
    disponible: estado !== null,
    /** true mientras se imprime el ticket de prueba. */
    testeando,
    imprimir,
    test,
    detectar,
  };
}
