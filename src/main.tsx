import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "virtual:pwa-register";
import { toast } from "sonner";

// Registro del Service Worker con auto-actualización.
// Con registerType: 'autoUpdate', al detectar un nuevo build el SW queda
// "en espera"; onNeedRefresh fuerza la activación y recarga la PDA para
// que use el cache (assets) de la nueva versión de la plataforma.
const updateSW = registerSW({
  onNeedRefresh() {
    toast.info("Nueva versión disponible. Actualizando la aplicación…", {
      duration: 4000,
    });
    void updateSW(true);
  },
  onOfflineReady() {
    /* La app ya funciona en modo offline (cache PWA) */
  },
});

// Las PDAs/kioscos suelen quedar abiertas 24/7 y nunca recargan, por lo que
// el navegador no volvería a chequear el SW hasta mucho más tarde. Forzamos
// el chequeo de actualizaciones del SW cada 5 minutos para aplicar los
// cambios de plataforma sin intervención manual.
setInterval(() => {
  void updateSW(false);
}, 5 * 60 * 1000);

createRoot(document.getElementById("root")!).render(<App />);
