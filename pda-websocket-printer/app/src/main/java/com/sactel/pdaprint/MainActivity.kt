package com.sactel.pdaprint

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast

/**
 * Pantalla simple: arranca el servicio WebSocket de impresión y muestra estado.
 * Pide los permisos de Bluetooth/notificaciones en tiempo de ejecución, porque en
 * Android 12+ son permisos de ejecución y no se conceden solos: si no se solicitan
 * aquí, el botón "Permisos" de la app sale deshabilitado y la impresión SPP falla.
 */
class MainActivity : Activity() {

    private lateinit var status: TextView

    private fun construirPermisos(): List<String> {
        val lista = mutableListOf<String>()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            lista.add(Manifest.permission.BLUETOOTH_SCAN)
            lista.add(Manifest.permission.BLUETOOTH_CONNECT)
        } else {
            // En Android < 12 el Bluetooth clásico puede requerir ubicación.
            lista.add(Manifest.permission.ACCESS_FINE_LOCATION)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            lista.add(Manifest.permission.POST_NOTIFICATIONS)
        }
        return lista
    }

    private fun permisosFaltantes(): List<String> =
        construirPermisos().filter {
            checkSelfPermission(it) != PackageManager.PERMISSION_GRANTED
        }

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

        btn.setOnClickListener {
            if (permisosFaltantes().isNotEmpty()) {
                Toast.makeText(this, "Solicitando permisos de Bluetooth...", Toast.LENGTH_SHORT).show()
                solicitarPermisos()
            } else {
                startPrintService()
                status.text = "Servicio iniciado"
            }
        }

        // Pide permisos al abrir la app por primera vez.
        if (permisosFaltantes().isNotEmpty()) {
            solicitarPermisos()
        } else {
            startPrintService()
        }
    }

    override fun onResume() {
        super.onResume()
        val running = PrintService.isRunning()
        status.text = "PDA Print Service\n" +
            "estado: ${if (running) "ACTIVO (ws://127.0.0.1:8080)" else "detenido"}" +
            (if (permisosFaltantes().isNotEmpty()) "\n(pendientes de permisos)" else "")
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == REQ_PERMISOS) {
            if (permisosFaltantes().isNotEmpty()) {
                Toast.makeText(
                    this,
                    "Faltan permisos. Revísalos en Ajustes → Permisos de esta app.",
                    Toast.LENGTH_LONG
                ).show()
            } else {
                startPrintService()
                status.text = "Servicio iniciado"
            }
        }
    }

    private fun solicitarPermisos() {
        requestPermissions(permisosFaltantes().toTypedArray(), REQ_PERMISOS)
    }

    private fun startPrintService() {
        val intent = Intent(this, PrintService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }
    }

    companion object {
        private const val REQ_PERMISOS = 1001
    }
}