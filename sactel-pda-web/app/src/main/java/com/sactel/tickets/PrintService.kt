package com.travelsoft.tickets

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import org.java_websocket.WebSocket
import org.java_websocket.handshake.ClientHandshake
import org.java_websocket.server.WebSocketServer
import org.json.JSONObject
import java.net.InetSocketAddress
import java.util.Base64

/**
 * Servicio en primer plano que hostea un servidor WebSocket en 127.0.0.1:8091
 * y, al recibir { action:"PRINT", data:"<base64 ESC/POS>" }, imprime en la
 * impresora integrada de la Sunmi (InnerPrinter) SIN abrir diálogos.
 */
class PrintService : Service() {

    private var server: WebSocketServer? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        startForeground(NOTIF_ID, buildNotification())
        running = true
        startWsServer()
    }

    override fun onDestroy() {
        running = false
        server?.stop()
        server = null
        super.onDestroy()
    }

    private fun buildNotification(): Notification {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getSystemService(NotificationManager::class.java)
                .createNotificationChannel(
                    NotificationChannel(CHANNEL_ID, "PDA Print", NotificationManager.IMPORTANCE_LOW)
                )
        }
        @Suppress("DEPRECATION")
        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, CHANNEL_ID)
        } else {
            Notification.Builder(this)
        }
        return builder
            .setSmallIcon(android.R.drawable.ic_menu_compass)
            .setContentTitle("PDA Print Service")
            .setContentText("Escuchando en ws://127.0.0.1:8091")
            .setOngoing(true)
            .build()
    }

    private fun startWsServer() {
        val srv = object : WebSocketServer(InetSocketAddress("127.0.0.1", PORT)) {
            override fun onOpen(conn: WebSocket, handshake: ClientHandshake) {}
            override fun onClose(conn: WebSocket, code: Int, reason: String, remote: Boolean) {}
            override fun onError(conn: WebSocket?, ex: Exception) {
                Log.e(TAG, "WebSocketServer onError (conn=${conn != null}): ${ex.message}", ex)
            }
            override fun onStart() {
                Log.i(TAG, "WebSocketServer escuchando en 127.0.0.1:$PORT")
            }

            override fun onMessage(conn: WebSocket, message: String) {
                val respuesta = manejarMensaje(message)
                try { conn.send(respuesta.toString()) } catch (_: Exception) {}
            }
        }
        srv.setReuseAddr(true)
        try {
            srv.start()
            server = srv
        } catch (e: Exception) {
            Log.e(TAG, "No se pudo iniciar el servidor WS en $PORT: ${e.message}", e)
        }
    }

    private fun manejarMensaje(message: String): JSONObject {
        val out = JSONObject()
        try {
            val req = JSONObject(message)
            when (req.optString("action", "").uppercase()) {
                "PRINT" -> {
                    val data = req.optString("data")
                    val bytes = Base64.getDecoder().decode(data)
                    PrinterDriver.imprimir(bytes)
                    out.put("code", 0).put("message", "ok")
                }
                "PING" -> out.put("code", 0).put("message", "pong")
                else -> out.put("code", 1).put("message", "acción no soportada")
            }
        } catch (e: Throwable) {
            out.put("code", 1).put("message", "error: ${e.message}")
        }
        return out
    }

    companion object {
        const val PORT = 8091
        private const val NOTIF_ID = 1
        private const val CHANNEL_ID = "pda"
        private const val TAG = "PrintService"
        @Volatile private var running = false
        fun isRunning() = running
    }
}