import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { toast } from "sonner";
import { isSaleInProgress } from "@/services/saleStatus";

// ── Montar la app PRIMERO ────────────────────────────────────────────────
// La app debe renderizarse siempre, sin importar el estado del Service
// Worker. Si el registro del SW falla (entorno sin soporte, error de
// instalación, etc.) la página NO debe quedar en blanco. Por eso el
// createRoot se ejecuta antes y de forma independiente al registro del SW.
const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<App />);
}

// Registro del Service Worker con auto-actualización.
// Con registerType: 'autoUpdate', al detectar un nuevo build el SW queda
// "en espera"; onNeedRefresh fuerza la activación y recarga la PDA para
// que use el cache (assets) de la nueva versión de la plataforma.
// Se envuelve en try/catch para que cualquier fallo de registro del SW
// (p. ej. contexto no seguro, excepción de instalación) nunca impida que
// la app ya montada funcione.
async function registrarServiceWorker() {
  try {
    const { registerSW } = await import("virtual:pwa-register");
    const updateSW = registerSW({
      onNeedRefresh() {
        const tryUpdate = () => {
          // No interrumpir una venta en curso: esperar y reintentar.
          if (isSaleInProgress()) {
            toast.info(
              "Hay una venta en curso. Se actualizará al terminar la transacción…",
              { duration: 4000 },
            );
            window.setTimeout(tryUpdate, 10_000);
            return;
          }
          toast.info("Nueva versión disponible. Actualizando la aplicación…", {
            duration: 4000,
          });
          void updateSW(true);
        };
        tryUpdate();
      },
      onOfflineReady() {
        /* La app ya funciona en modo offline (cache PWA) */
      },
    });

    // Las PDAs/kioscos suelen quedar abiertas 24/7 y nunca recargan, por lo
    // que el navegador no volvería a chequear el SW hasta mucho más tarde.
    // Forzamos el chequeo de actualizaciones al cargar y cada 5 minutos para
    // aplicar los cambios de plataforma y desatascar PDAs pegadas en un
    // build viejo (cuyo index.html cacheado apuntaba a JS ya borrados).
    void updateSW(false);
    window.setInterval(() => {
      void updateSW(false);
    }, 5 * 60 * 1000);
  } catch {
    /* Sin SW: la app sigue funcionando como web normal. */
  }
}

void registrarServiceWorker();
