/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_TICKETS_BACKEND_URL: string;
  readonly VITE_BACKEND_DIAN_URL: string;
  readonly VITE_EMPRESA_TOKEN: string;
  // Añade aquí cualquier otra variable que uses en tu frontend...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}


