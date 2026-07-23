#!/usr/bin/env python3
"""
Gateway detector bridge for the Electron app.

This intentionally follows the same high-level approach used by Philipp Grimm's
EnOcean Device Manager:
- list serial ports with pyserial
- detect FAM14/FGW/FAM-USB with eltakobus.serial.RS485SerialInterfaceV2
- for FAM14, lock the bus and read the FAM14 bus object at address 255
- for FAM-USB, use the AB 58 base-id request through RS485SerialInterfaceV2

The script prints exactly one JSON object to stdout. Diagnostic information goes
to stderr so Electron can show/log it without breaking JSON parsing.
"""

import argparse
import asyncio
import json
import sys
import traceback
from typing import Any, Dict, List, Optional


def jprint(obj: Dict[str, Any]) -> None:
    print(json.dumps(obj, ensure_ascii=False), flush=True)


def log(*parts: Any) -> None:
    print("[python-detect]", *parts, file=sys.stderr, flush=True)


def fmt_base_id(value: Any) -> Optional[str]:
    if value is None:
        return None
    if isinstance(value, str):
        return value.upper()
    if isinstance(value, int):
        raw = value.to_bytes(4, "big", signed=False)
        return "-".join(f"{b:02X}" for b in raw)
    if isinstance(value, (bytes, bytearray)):
        raw = bytes(value[:4])
        if len(raw) == 4:
            return "-".join(f"{b:02X}" for b in raw)
    if isinstance(value, list) and len(value) >= 4:
        return "-".join(f"{int(b) & 0xFF:02X}" for b in value[:4])
    return str(value).upper()


def list_ports(preferred_path: str = "") -> List[Dict[str, Any]]:
    import serial.tools.list_ports

    ports: List[Dict[str, Any]] = []
    seen = set()

    def add(path: str, manufacturer: str = "", description: str = "", source: str = "pyserial") -> None:
        if not path:
            return
        key = path.upper()
        if key in seen:
            return
        seen.add(key)
        ports.append({
            "path": path,
            "manufacturer": manufacturer or "",
            "description": description or "",
            "source": source,
        })

    if preferred_path:
        add(preferred_path.strip(), "Manuell eingetragen", "", "manual")

    for p in serial.tools.list_ports.comports():
        add(
            getattr(p, "device", ""),
            getattr(p, "manufacturer", "") or "",
            getattr(p, "description", "") or "",
            "pyserial",
        )

    return ports


async def get_fam_usb_base_id(bus: Any) -> Optional[str]:
    from eltakobus.message import ESP2Message
    from eltakobus.util import b2s

    old_callback = getattr(bus, "callback", None)
    try:
        try:
            bus.set_callback(None)
        except Exception:
            pass

        data = b"\xAB\x58\x00\x00\x00\x00\x00\x00\x00\x00\x00"
        response = await bus.exchange(ESP2Message(bytes(data)), ESP2Message, retries=3, timeout=1)
        base_id = b2s(response.body[2:6])
        if base_id and base_id != "00-00-00-00":
            return base_id.upper()
        return None
    finally:
        try:
            bus.set_callback(old_callback)
        except Exception:
            pass


async def get_fam14_base_id(bus: Any) -> Optional[str]:
    from eltakobus import locking
    from eltakobus.device import create_busobject

    old_callback = getattr(bus, "callback", None)
    locked = False
    try:
        try:
            bus.set_callback(None)
        except Exception:
            pass

        log("locking FAM14 bus")
        locked = (await locking.lock_bus(bus)) == locking.LOCKED
        log("bus locked", locked)

        fam14 = await create_busobject(bus=bus, id=255)
        log("created bus object", fam14)

        base_id = await fam14.get_base_id()
        return fmt_base_id(base_id)
    finally:
        if locked:
            try:
                await locking.unlock_bus(bus)
                log("bus unlocked")
            except Exception as e:
                log("unlock failed", repr(e))
        try:
            bus.set_callback(old_callback)
        except Exception:
            pass


async def try_rs485_port(port_path: str, baud_rate: int, target: str = "auto") -> Dict[str, Any]:
    from eltakobus.serial import RS485SerialInterfaceV2

    bus = None
    try:
        log("try RS485", port_path, baud_rate, "target=", target)
        bus = RS485SerialInterfaceV2(
            port_path,
            baud_rate=baud_rate,
            delay_message=0.2,
            auto_reconnect=False,
        )
        bus.start()
        bus.is_serial_connected.wait(timeout=2)

        if not bus.is_active():
            return {"ok": False, "error": "Port geöffnet, aber RS485-Schnittstelle nicht aktiv"}

        suppress_echo = bool(getattr(bus, "suppress_echo", False))
        log("RS485 active", port_path, baud_rate, "suppress_echo=", suppress_echo)

        if suppress_echo:
            if target in ("fam-usb", "fgw14"):
                return {"ok": False, "error": "Port verhält sich wie FAM14 (suppress_echo)."}
            base_id = await asyncio.wait_for(get_fam14_base_id(bus), timeout=8)
            if base_id:
                return {
                    "ok": True,
                    "gateway": {
                        "type": "fam14",
                        "label": "Eltako FAM14",
                        "serial_path": port_path,
                        "baudRate": baud_rate,
                        "protocol": "eltakobus-fam14",
                        "parser": "python-eltakobus-create_busobject-255",
                        "base_id": base_id,
                    },
                }
            return {"ok": False, "error": "FAM14 erkannt, aber Base-ID konnte nicht gelesen werden"}

        if baud_rate == 9600 and target in ("auto", "fam-usb", "rs485"):
            base_id = await asyncio.wait_for(get_fam_usb_base_id(bus), timeout=5)
            if base_id:
                return {
                    "ok": True,
                    "gateway": {
                        "type": "fam-usb",
                        "label": "Eltako FAM-USB",
                        "serial_path": port_path,
                        "baudRate": baud_rate,
                        "protocol": "eltakobus-fam-usb-ab58",
                        "parser": "python-eltakobus-exchange-ab58",
                        "base_id": base_id,
                    },
                }

        if baud_rate == 57600 and target in ("auto", "fgw14", "rs485"):
            return {
                "ok": True,
                "gateway": {
                    "type": "fgw14usb",
                    "label": "Eltako FGW14-USB",
                    "serial_path": port_path,
                    "baudRate": baud_rate,
                    "protocol": "eltakobus-rs485-no-suppress-echo",
                    "parser": "python-eltakobus-rs485-no-suppress-echo",
                    "base_id": "",
                },
            }

        return {"ok": False, "error": "Keine passende ELTAKO-Gateway-Antwort"}

    except Exception as exc:
        return {"ok": False, "error": f"{type(exc).__name__}: {exc}"}
    finally:
        if bus is not None:
            try:
                bus.stop()
                bus.join(0.8)
            except Exception:
                pass

async def detect(preferred_path: str = "", mode: str = "auto") -> Dict[str, Any]:
    ports = list_ports(preferred_path)
    attempts: List[Dict[str, Any]] = []

    if not ports:
        return {"ok": False, "ports": [], "attempts": [], "error": "Kein serieller Port gefunden"}

    for port_info in ports:
        port_path = port_info["path"]
        if mode == "auto":
            candidates = [(9600, "auto"), (57600, "auto")]
        elif mode == "fam-usb":
            candidates = [(9600, "fam-usb")]
        elif mode == "fam14":
            candidates = [(57600, "fam14"), (9600, "fam14")]
        elif mode == "fgw14":
            candidates = [(57600, "fgw14")]
        else:
            candidates = [(9600, "rs485"), (57600, "rs485")]

        for baud_rate, target in candidates:
            result = await try_rs485_port(port_path, baud_rate, target)
            attempts.append({
                "path": port_path,
                "manufacturer": port_info.get("manufacturer", ""),
                "description": port_info.get("description", ""),
                "protocol": "rs485",
                "baudRate": baud_rate,
                "ok": result.get("ok", False),
                "error": result.get("error", ""),
            })

            if result.get("ok"):
                gateway = result["gateway"]
                gateway["manufacturer"] = port_info.get("manufacturer", "")
                gateway["description"] = port_info.get("description", "")
                return {"ok": True, "gateway": gateway, "ports": ports, "attempts": attempts}

    return {
        "ok": False,
        "ports": ports,
        "attempts": attempts,
        "error": "Ports wurden getestet, aber kein unterstütztes ELTAKO-Gateway erkannt. Prüfe COM-Port, Baudrate und ob PCT14 oder eine andere Software den Port belegt.",
    }

async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--preferred", default="")
    parser.add_argument("--mode", default="auto", choices=["auto", "fam14", "fam-usb", "fgw14", "rs485"])
    args = parser.parse_args()

    try:
        result = await detect(args.preferred, args.mode)
        jprint(result)
    except Exception as e:
        log("fatal", repr(e))
        traceback.print_exc(file=sys.stderr)
        jprint({"ok": False, "error": f"Python-Detector fehlgeschlagen: {type(e).__name__}: {e}", "ports": [], "attempts": []})


if __name__ == "__main__":
    asyncio.run(main())
