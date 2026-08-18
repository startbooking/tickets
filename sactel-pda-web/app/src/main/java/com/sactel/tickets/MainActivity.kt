package com.sactel.tickets

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient

/**
 * Aplicación instalable de SACTel: carga la plataforma web (PWA) en un WebView
 * y arranca en segundo plano el servidor WebSocket local de impresión
 * (ws://127.0.0.1:8091) para que los tickets se impriman sin diálogos.
 */
class MainActivity : Activity() {

    private val APP_URL = "https://travelsoft.plus"

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val webView = WebView(this)
        webView.apply {
            setBackgroundColor(0xFFFFFFFF.toInt())
            webViewClient = object : WebViewClient() {
                // Mantén [enlaces HTTP normales] dentro de la app (solo la web SACTel).
                override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                    val url = request?.url ?: return false
                    // Abrir enlaces externos (PayPal etc.) en el navegador.
                    if (url.host != null && !esSactel(url.host!!)) {
                        startActivity(Intent(Intent.ACTION_VIEW, url))
                        return true
                    }
                    return false
                }
            }
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true       // localStorage de la impresora guardada
                databaseEnabled = true
                useWideViewPort = true
                loadWithOverviewMode = true
                // Permite ws://127.0.0.1:8091 del servicio local desde HTTPS.
                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                setSupportZoom(false)
                blockNetworkLoads = false
            }
            loadUrl(APP_URL)
        }

        setContentView(webView)

        // Arranca el servicio WebSocket de impresión local.
        if (tienePermisosNecesarios()) {
            startPrintService()
        } else {
            solicitarPermisos()
        }
    }

    private fun esSactel(host: String): Boolean =
        host == "travelsoft.plus" || host.endsWith(".travelsoft.plus") ||
            host == "tickets.sactel.cloud" || host.endsWith(".sactel.cloud")

    private fun permisosNecesarios(): List<String> {
        val lista = mutableListOf<String>()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            lista.add(Manifest.permission.BLUETOOTH_SCAN)
            lista.add(Manifest.permission.BLUETOOTH_CONNECT)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            lista.add(Manifest.permission.POST_NOTIFICATIONS)
        }
        return lista
    }

    private fun tienePermisosNecesarios(): Boolean =
        permisosNecesarios().all {
            checkSelfPermission(it) == PackageManager.PERMISSION_GRANTED
        }

    private fun solicitarPermisos() {
        requestPermissions(permisosNecesarios().toTypedArray(), REQ_PERMISOS)
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == REQ_PERMISOS && tienePermisosNecesarios()) {
            startPrintService()
        }
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