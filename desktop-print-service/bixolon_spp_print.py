#!/usr/bin/env python3
"""Imprime ESC/POS en impresora Bluetooth SPP (Bixolon SPP-R200III) via BlueZ D-Bus.
No requiere root ni rfcomm. Reintenta tras desconectar la sesion SPP previa.
Uso:  python3 bixolon_spp_print.py <MAC>   (lee ESC/POS de stdin)
"""
import sys
import os
import time
import dbus
import dbus.service
import dbus.mainloop.glib
from gi.repository import GLib

SPP_UUID = "00001101-0000-1000-8000-00805f9b34fb"
BUS_NAME = "org.bluez"
PROFILE_PATH = "/test/bixolon_spp"


class Profile(dbus.service.Object):
    def __init__(self, bus, path, loop):
        super().__init__(bus, path)
        self.fd = None
        self.loop = loop

    @dbus.service.method("org.bluez.Profile1", in_signature="", out_signature="")
    def Release(self):
        pass

    @dbus.service.method("org.bluez.Profile1", in_signature="oha{sv}", out_signature="")
    def NewConnection(self, path, fd, props):
        self.fd = fd.take() if hasattr(fd, "take") else int(fd)
        self.loop.quit()

    @dbus.service.method("org.bluez.Profile1", in_signature="o", out_signature="")
    def RequestDisconnection(self, path):
        pass

    @dbus.service.method("org.bluez.Profile1", in_signature="o", out_signature="")
    def Cancel(self, path):
        pass


def main():
    if len(sys.argv) < 2:
        sys.stderr.write("Uso: bixolon_spp_print.py <MAC>\n")
        return 2
    mac = sys.argv[1]
    data = sys.stdin.buffer.read()
    if not data:
        sys.stderr.write("Sin datos en stdin\n")
        return 1

    dbus.mainloop.glib.DBusGMainLoop(set_as_default=True)
    bus = dbus.SystemBus()
    dev_path = f"/org/bluez/hci0/dev_{mac.replace(':', '_')}"
    profile_path = PROFILE_PATH
    loop = GLib.MainLoop()
    profile = Profile(bus, profile_path, loop)
    mgr = dbus.Interface(bus.get_object(BUS_NAME, "/org/bluez"), "org.bluez.ProfileManager1")
    opts = dbus.Dictionary(
        {"Channel": dbus.UInt16(1), "Name": "BixolonSPP",
         "RequireAuthentication": False, "RequireAuthorization": False,
         "AutoConnect": True},
        signature="sv",
    )
    # Limpia un registro SPP previo que haya quedado colgado (BlueZ lo indexa por UUID)
    try:
        mgr.UnregisterProfile(profile_path)
    except dbus.DBusException:
        pass
    try:
        mgr.RegisterProfile(profile_path, SPP_UUID, opts)
    except dbus.DBusException as e:
        sys.stderr.write(f"RegisterProfile: {e}\n")
        return 1
    dev = dbus.Interface(bus.get_object(BUS_NAME, dev_path), "org.bluez.Device1")

    def cleanup():
        try:
            mgr.UnregisterProfile(profile_path)
        except Exception:
            pass

    rc = 1
    for intento in range(1, 3):
        profile.fd = None
        # Limpia sesion SPP previa que la impresora pueda tener colgada
        try:
            dev.DisconnectProfile(SPP_UUID, timeout=4000)
        except dbus.DBusException:
            pass
        time.sleep(1.0)

        def do_connect():
            try:
                dev.ConnectProfile(SPP_UUID, timeout=12000)
            except dbus.DBusException as e:
                sys.stderr.write(f"ConnectProfile: {e}\n")
            return False

        GLib.idle_add(do_connect)
        GLib.timeout_add(14000, lambda: loop.quit())
        loop.run()

        if profile.fd is None:
            sys.stderr.write(f"Intento {intento}: sin fd (no conecto SPP)\n")
            time.sleep(2)
            continue

        try:
            with os.fdopen(profile.fd, "wb") as f:
                f.write(data)
                f.flush()
            rc = 0
            break
        except OSError as e:
            sys.stderr.write(f"Error escribiendo: {e}\n")
            time.sleep(2)

    cleanup()
    if rc == 0:
        return 0
    sys.stderr.write("No se pudo imprimir tras reintentos\n")
    return 1


if __name__ == "__main__":
    sys.exit(main())
