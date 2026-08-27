// Bandera global de "venta en curso" para que el registro PWA sepa si puede
// recargar la PDA sin interrumpir una transacción. Se actualiza desde
// SubViewVentas y se consulta en main.tsx (onNeedRefresh del Service Worker).

let saleActive = false;

export const setSaleInProgress = (value: boolean): void => {
  saleActive = value;
};

export const isSaleInProgress = (): boolean => saleActive;
