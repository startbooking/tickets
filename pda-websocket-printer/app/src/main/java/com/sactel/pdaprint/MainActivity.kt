package com.sactel.pdaprint

import android.app.Activity
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

/**
 * Pantalla simple: arranca el servicio WebSocket de impresión y muestra estado.
 */
class MainActivity : Activity() {
    private lateinit var status: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        status = TextView(this).apply { text = "PDA Print Service\nIniciando..." }
        val btn = Button(this).apply { text = "Iniciar servicio" }
        setContentView(
            LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                addView(status)
                addView(btn)
            }
        )

        btn.setOnClickListener { startPrintService(); status.text = "Servicio iniciado" }
        startPrintService()
    }

    override fun onResume() {
        super.onResume()
        val running = PrintService.isRunning()
        status.text = "PDA Print Service\n" +
            "estado: ${if (running) "ACTIVO (ws://127.0.0.1:8080)" else "detenido"}"
    }

    private fun startPrintService() {
        val intent = Intent(this, PrintService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }
    }
}