package com.sactel.pdaprint

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build

/**
 * Arranca el servicio de impresión cuando la PDA se enciende.
 * - BOOT_COMPLETED: arranque normal de Android.
 * - QUICKBOOT_POWERON / LOCKED_BOOT_COMPLETED: encendido rápido propio de Sunmi/SunOS.
 */
class BootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            Intent.ACTION_BOOT_COMPLETED,
            Intent.ACTION_LOCKED_BOOT_COMPLETED,
            "android.intent.action.QUICKBOOT_POWERON" -> {
                val em = PrintService.isRunning()
                if (!em && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(Intent(context, PrintService::class.java))
                } else {
                    context.startService(Intent(context, PrintService::class.java))
                }
            }
        }
    }
}