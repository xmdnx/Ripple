#!/usr/bin/env python3
"""
Linux Reactive System Monitor for Ripple Dynamic Island.
Uses D-Bus signals (GLib mainloop) for instant MPRIS media & BlueZ events,
and fast async checks for PipeWire mic / V4L2 camera.
Emits JSON lines to stdout:
{"type": "media", "data": {...}}
{"type": "devices", "data": {"camera": bool, "microphone": bool, "bluetooth": bool}}
"""

import sys
import os
import json
import subprocess
import glob
import base64
import urllib.parse
import dbus
from dbus.mainloop.glib import DBusGMainLoop
from gi.repository import GLib

DBusGMainLoop(set_as_default=True)

session_bus = None
system_bus = None

last_media_json = None
last_devices = {"camera": False, "microphone": False, "bluetooth": False}

def normalize_artwork_url(art_url):
    if not art_url:
        return None
    if art_url.startswith("file://"):
        try:
            local_path = urllib.parse.unquote(art_url[7:])
            if os.path.exists(local_path) and os.path.getsize(local_path) < 5 * 1024 * 1024:
                with open(local_path, "rb") as f:
                    b64 = base64.b64encode(f.read()).decode("ascii")
                    ext = os.path.splitext(local_path)[1].lower().replace(".", "") or "jpeg"
                    mime = "image/jpeg" if ext in ("jpg", "jpeg") else f"image/{ext}"
                    return f"data:{mime};base64,{b64}"
        except Exception:
            return None
    return art_url

def emit(event_type, data):
    try:
        payload = json.dumps({"type": event_type, "data": data}, ensure_ascii=False)
        sys.stdout.write(payload + "\n")
        sys.stdout.flush()
    except Exception:
        pass

def parse_media_track():
    global session_bus
    if not session_bus:
        return None
    try:
        players = [name for name in session_bus.list_names() if name.startswith("org.mpris.MediaPlayer2.")]
        if not players:
            return None
        selected = None
        for name in players:
            try:
                proxy = session_bus.get_object(name, "/org/mpris/MediaPlayer2")
                props = dbus.Interface(proxy, "org.freedesktop.DBus.Properties")
                status = str(props.Get("org.mpris.MediaPlayer2.Player", "PlaybackStatus", dbus_interface="org.freedesktop.DBus.Properties"))
                meta = props.Get("org.mpris.MediaPlayer2.Player", "Metadata", dbus_interface="org.freedesktop.DBus.Properties")
                title = str(meta.get("xesam:title", ""))
                artist_list = meta.get("xesam:artist", [])
                artist = ", ".join([str(a) for a in artist_list]) if artist_list else ""
                album = str(meta.get("xesam:album", ""))
                art_url = str(meta.get("mpris:artUrl", ""))
                normalized_art = normalize_artwork_url(art_url)
                data = {
                    "name": title,
                    "artist": artist,
                    "album": album,
                    "artwork_url": normalized_art or None,
                    "state": "playing" if status.lower() == "playing" else "paused",
                    "source": name.replace("org.mpris.MediaPlayer2.", "")
                }
                if status.lower() == "playing":
                    return data
                if not selected and title:
                    selected = data
            except Exception:
                continue
        return selected
    except Exception:
        return None

def check_and_emit_media():
    try:
        global last_media_json
        media = parse_media_track()
        serialized = json.dumps(media, sort_keys=True)
        if serialized != last_media_json:
            last_media_json = serialized
            emit("media", media)
    except Exception:
        pass

def on_properties_changed(*args, **kwargs):
    try:
        interface = args[0] if len(args) > 0 else kwargs.get("interface", "")
        changed = args[1] if len(args) > 1 else kwargs.get("changed", {})
        if interface == "org.mpris.MediaPlayer2.Player":
            check_and_emit_media()
        elif interface == "org.bluez.Device1":
            if isinstance(changed, dict) and "Connected" in changed:
                check_devices()
    except Exception:
        pass

def on_name_owner_changed(name, old_owner, new_owner):
    try:
        if name.startswith("org.mpris.MediaPlayer2."):
            check_and_emit_media()
    except Exception:
        pass

def check_bluetooth():
    global system_bus
    if not system_bus:
        return False
    try:
        manager = dbus.Interface(system_bus.get_object("org.bluez", "/"), "org.freedesktop.DBus.ObjectManager")
        objects = manager.GetManagedObjects()
        for path, ifaces in objects.items():
            if "org.bluez.Device1" in ifaces:
                if ifaces["org.bluez.Device1"].get("Connected", False):
                    return True
        return False
    except Exception:
        return False

def check_camera():
    videos = glob.glob("/dev/video*")
    if not videos:
        return False
    try:
        res = subprocess.run(["fuser"] + videos, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return res.returncode == 0
    except Exception:
        return False

def check_microphone():
    try:
        res = subprocess.run(["pw-dump"], stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, timeout=1)
        if res.returncode == 0 and res.stdout:
            data = json.loads(res.stdout)
            for item in data:
                props = item.get("info", {}).get("props", {})
                media_class = props.get("media.class", "")
                state = item.get("info", {}).get("state", "")
                if ("Stream/Input/Audio" in media_class or "Record" in media_class) and state == "running":
                    return True
        return False
    except Exception:
        return False

def check_devices():
    global last_devices
    cam = check_camera()
    mic = check_microphone()
    bt = check_bluetooth()
    if cam != last_devices["camera"] or mic != last_devices["microphone"] or bt != last_devices["bluetooth"]:
        last_devices = {"camera": cam, "microphone": mic, "bluetooth": bt}
        emit("devices", last_devices)
    return True

def main():
    global session_bus, system_bus
    try:
        session_bus = dbus.SessionBus()
    except Exception as e:
        sys.stderr.write(f"Session bus error: {e}\n")

    try:
        system_bus = dbus.SystemBus()
    except Exception as e:
        sys.stderr.write(f"System bus error: {e}\n")

    if session_bus:
        session_bus.add_signal_receiver(
            on_properties_changed,
            signal_name="PropertiesChanged",
            dbus_interface="org.freedesktop.DBus.Properties",
            path_keyword="path"
        )
        session_bus.add_signal_receiver(
            on_name_owner_changed,
            signal_name="NameOwnerChanged",
            dbus_interface="org.freedesktop.DBus"
        )

    if system_bus:
        system_bus.add_signal_receiver(
            on_properties_changed,
            signal_name="PropertiesChanged",
            dbus_interface="org.freedesktop.DBus.Properties",
            path_keyword="path"
        )

    # Initial emission
    check_and_emit_media()
    check_devices()

    # Fast polling for camera & microphone state changes (every 500ms instead of 2-5s)
    GLib.timeout_add(500, check_devices)

    loop = GLib.MainLoop()
    try:
        loop.run()
    except KeyboardInterrupt:
        pass

if __name__ == "__main__":
    main()
