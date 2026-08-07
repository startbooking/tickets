package com.sactel.tickets

import android.app.admin.DeviceAdminReceiver
import android.content.Context
import android.content.Intent
import android.widget.Toast

/**
 * Receptor que convierte a esta app en "administrador de dispositivo".
 * Con el admin activo Android impide desinstalar/desactivar la aplicación,
 * lo que protege la configuración (Bluetooth/InnerPrinter) de ser eliminada.
 */
class AdminReceiver : DeviceAdminReceiver() {
    override fun onEnabled(context: Context, intent: Intent) {
        Toast.makeText(context, "Protección activa: la impresora no será eliminada.", Toast.LENGTH_LONG).show()
    }
}