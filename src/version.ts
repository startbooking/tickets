// Versión de la APP (frontend web). Subir junto con la versión del APK
// (sactel-pda-web/app/build.gradle -> versionName) cuando se despliegue.
export const APP_VERSION = "1.0.0";

// El APK (WebView) inyecta su versionName en el User-Agent como "SACTelAPK/x.y".
// En escritorio/otros navegadores no existe -> devuelve null.
export function getApkVersion(): string | null {
  if (typeof navigator === "undefined") return null;
  const match = navigator.userAgent.match(/SACTelAPK\/([\d.]+)/);
  return match ? match[1] : null;
}
