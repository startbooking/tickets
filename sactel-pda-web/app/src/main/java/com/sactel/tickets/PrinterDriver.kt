package com.travelsoft.tickets

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothSocket
import android.util.Log
import java.util.UUID

/**
 * Imprime bytes ESC/POS en la impresora integrada de la Sunmi.
 *
 * Vía principal: Bluetooth SPP al dispositivo virtual "InnerPrinter"
 * (dirección fija 00:11:22:33:44:55, UUID SPP estándar). Es el método que usa
 * la propia documentación de Sunmi y funciona sin el plugin JS USDK.
 */
object PrinterDriver {

    private val SPP_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")
    private const val INNERPRINTER_ADDRESS = "00:11:22:33:44:55"

    fun imprimir(bytes: ByteArray) {
        val ok = imprimirPorSpp(bytes)
        if (!ok) {
            Log.w(TAG, "InnerPrinter SPP no disponible; sin vía alternativa.")
        }
    }

    /** Conecta por SPP a InnerPrinter y escribe los bytes (ticket ESC/POS). */
    private fun imprimirPorSpp(bytes: ByteArray): Boolean {
        var socket: BluetoothSocket? = null
        return try {
            @Suppress("DEPRECATION")
            val adapter = BluetoothAdapter.getDefaultAdapter() ?: return false
            val device = buscarInnerPrinter(adapter)
            if (device == null) {
                Log.w(TAG, "No se encontró InnerPrinter emparejado.")
                return false
            }
            socket = device.createRfcommSocketToServiceRecord(SPP_UUID)
            socket.connect()
            socket.outputStream.write(bytes)
            socket.outputStream.flush()
            socket.close()
            true
        } catch (e: Exception) {
            Log.w(TAG, "SPP falló: ${e.message}")
            try { socket?.close() } catch (_: Exception) {}
            false
        }
    }

    private fun buscarInnerPrinter(adapter: BluetoothAdapter): BluetoothDevice? {
        // 1) Dirección virtual fija de Sunmi
        try {
            @Suppress("DEPRECATION")
            val dev = adapter.getRemoteDevice(INNERPRINTER_ADDRESS)
            if (dev.type == BluetoothDevice.DEVICE_TYPE_CLASSIC || isBonded(adapter, dev)) return dev
        } catch (_: Exception) {}
        // 2) Cualquier dispositivo emparejado cuyo nombre contenga "InnerPrinter"
        @Suppress("DEPRECATION")
        return adapter.bondedDevices?.firstOrNull {
            it.name?.contains("InnerPrinter", ignoreCase = true) == true
        }
    }

    private fun isBonded(adapter: BluetoothAdapter, dev: BluetoothDevice): Boolean {
        @Suppress("DEPRECATION")
        return adapter.bondedDevices?.any { it.address == dev.address } == true
    }

    private const val TAG = "PdaPrint"
}