#!/usr/bin/env python3
"""
Write Home Assistant sender IDs into ELTAKO Series-14 bus actuators.

This mirrors the relevant write path of Philipp Grimm's EnOcean Device Manager:
connect to the FAM14/FGW14 bus, lock it, enumerate bus devices and call
ensure_programmed(channel, sender_address, eep_profile) for programmable actors.
"""
import argparse
import asyncio
import json
import sys
import time
import traceback
from typing import Any, Dict, List, Optional


def jprint(obj: Dict[str, Any]) -> None:
    print(json.dumps(obj, ensure_ascii=False), flush=True)


def log(*parts: Any) -> None:
    print("[python-write-senders]", *parts, file=sys.stderr, flush=True)


def norm_id(value: str) -> str:
    raw = str(value or "").strip().upper().replace(":", "-").replace(" ", "-")
    parts = [p for p in raw.split("-") if p]
    if len(parts) == 4 and all(len(p) <= 2 for p in parts):
        return "-".join(p.zfill(2) for p in parts)
    clean = raw.replace("-", "")
    if len(clean) == 8:
        return "-".join(clean[i:i+2] for i in range(0, 8, 2))
    return raw


def load_sender_map(path: str) -> Dict[str, Dict[str, Dict[str, str]]]:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    result: Dict[str, Dict[str, Dict[str, str]]] = {}
    for item in data.get("entries", data if isinstance(data, list) else []):
        device_id = norm_id(item.get("device_id") or item.get("id") or "")
        sender_id = norm_id(item.get("sender_id") or "")
        sender_eep = str(item.get("sender_eep") or item.get("eep") or "").strip().upper()
        name = str(item.get("name") or "")
        if not device_id or not sender_id or not sender_eep:
            continue
        result[device_id] = {
            "sender": {"id": sender_id, "eep": sender_eep},
            "name": name,
            "device_eep": str(item.get("device_eep") or item.get("device_eep_out") or "").strip().upper(),
            "device_type": str(item.get("device_type") or "").strip(),
            "platform": str(item.get("platform") or "").strip(),
        }
    return result


async def enumerate_bus(bus: Any):
    from eltakobus.device import BusObject, create_busobject, sorted_known_objects

    skip_until = 0
    for i in range(1, 256):
        try:
            if i <= skip_until:
                continue
            bus_object = await create_busobject(bus=bus, id=i)
            skip_until = i + getattr(bus_object, "size", 1) - 1
            yield bus_object
        except TimeoutError:
            continue
        except Exception as e:
            log("Cannot detect device at address", i, repr(e))
            continue


def _sender_bytes_from_id(sender_id: str) -> bytes:
    clean = norm_id(sender_id).replace("-", "")
    if len(clean) != 8:
        raise ValueError(f"ungültige Sender-ID: {sender_id}")
    return bytes(int(clean[i:i+2], 16) for i in range(0, 8, 2))


def _clean_label(value: Any) -> str:
    text = str(value or "").strip()
    if not text or text.lower() in {"none", "null", "undefined"}:
        return ""
    return text


def _entry_device_type(entry: Dict[str, Any]) -> str:
    candidates = [
        entry.get("device_type"),
        entry.get("model"),
        entry.get("eltako"),
    ]
    name = _clean_label(entry.get("name"))
    if name:
        candidates.append(name.split()[0])
    for candidate in candidates:
        label = _clean_label(candidate)
        if label and label != "BusObject":
            return label
    return "Gerät"


def _device_display_name(entry: Dict[str, Any], fallback_type: str, device_ext_id: str) -> str:
    device_type = _entry_device_type(entry)
    name = _clean_label(entry.get("name"))

    # Der Log soll den echten Aktor/Anzeigenamen zeigen und nie den internen
    # Python-Klassennamen BusObject. Bei Kanalnamen wie "Wohnzimmer LED Band"
    # bleibt der Aktortyp zusätzlich sichtbar.
    if name and name != device_type and name != device_ext_id:
        return f"{name} ({device_type} {device_ext_id})"
    if device_type and device_type != "Gerät":
        return f"{device_type} {device_ext_id}"
    fallback = _clean_label(fallback_type)
    if fallback and fallback != "BusObject":
        return f"{fallback} {device_ext_id}"
    return f"Unbekanntes Gerät {device_ext_id}"


async def _ensure_programmed_controller_profile(dev: Any, sender_id: str, channel: int = 0) -> Optional[bool]:
    """Program controller/GFVS sender for profiles not known by eltako14bus.

    FRGBW14/FRGBW71 use the free profile 07-37-F7. The currently available
    eltako14bus package does not know this EEP and does not provide a dedicated
    FRGBW device class. The Series-14 memory layout nevertheless follows the
    normal controller/GFVS scheme used by dimmer-style devices: sender address +
    key 0 + function 32 + channel/subchannel + value 0. We write only into an
    empty line and never overwrite an existing non-empty line.
    """
    sender = _sender_bytes_from_id(sender_id)
    memory_size = int(getattr(dev, "memory_size", 0) or 0)
    if memory_size <= 0 or not hasattr(dev, "read_mem_line") or not hasattr(dev, "write_mem_line"):
        return None

    # For single logical RGBW controller entries use subchannel 1. This mirrors
    # DimmerStyle behavior for devices without explicit subchannels.
    subchannel = max(1, int(channel or 0) + 1)
    expected_line = sender + bytes((0, 32, subchannel, 0))

    # Keep lines 0..11 untouched; Series-14 actuator programmable sender slots
    # normally start after device/system configuration. If memory is smaller,
    # we do not guess.
    start_line = 12
    if memory_size <= start_line:
        return None

    first_empty = None
    for memory_id in range(start_line, memory_size):
        line = await dev.read_mem_line(memory_id)
        if line == expected_line:
            return False
        if not any(line) and first_empty is None:
            first_empty = memory_id

    if first_empty is None:
        raise RuntimeError("Kein freier Speicherplatz zum Einlernen des Controller-Senders gefunden")

    await dev.write_mem_line(first_empty, expected_line)
    return True


async def ensure_programmed_for_device(fam14_base_id_int: int, dev: Any, sender_map: Dict[str, Any]) -> List[Dict[str, Any]]:
    from eltakobus.device import DimmerStyle, HasProgrammableRPS
    from eltakobus.eep import EEP
    from eltakobus.util import b2s
    from eltakobus.error import WriteError
    try:
        from eltakobus import AddressExpression
    except Exception:
        from eltakobus.util import AddressExpression

    events: List[Dict[str, Any]] = []

    size = int(getattr(dev, "size", 1) or 1)
    address = int(getattr(dev, "address", 0) or 0)
    dev_type = type(dev).__name__

    for channel in range(size):
        device_ext_id = b2s((fam14_base_id_int + address + channel).to_bytes(4, "big"))
        entry = sender_map.get(device_ext_id)
        if not entry or "sender" not in entry:
            continue

        sender_id = norm_id(entry["sender"].get("id", ""))
        sender_eep = str(entry["sender"].get("eep", "")).strip().upper()
        device_eep = str(entry.get("device_eep") or "").strip().upper()
        entry_name = str(entry.get("name") or "")
        display_name = _device_display_name(entry, dev_type, device_ext_id)
        is_frgbw = sender_eep == "07-37-F7" or device_eep == "07-37-F7" or "FRGBW" in entry_name.upper() or "FRGBW" in display_name.upper()
        if not sender_id or not sender_eep:
            continue

        retry = 3
        last_exception: Optional[Exception] = None
        update_result = None

        while retry > 0:
            try:
                if is_frgbw:
                    update_result = await _ensure_programmed_controller_profile(dev, sender_id, channel)
                elif isinstance(dev, HasProgrammableRPS) or isinstance(dev, DimmerStyle) or hasattr(dev, "ensure_programmed"):
                    sender_address = AddressExpression.parse(sender_id)
                    eep_profile = EEP.find(sender_eep)
                    update_result = await dev.ensure_programmed(channel, sender_address, eep_profile)
                else:
                    update_result = None
                last_exception = None
                time.sleep(0.2)
                break
            except (WriteError, TimeoutError, Exception) as e:
                last_exception = e
                retry -= 1
                log("retry", 3 - retry, "failed", dev_type, device_ext_id, sender_id, sender_eep, repr(e))
                time.sleep(0.2)

        if last_exception is not None:
            events.append({
                "status": "error",
                "device_id": device_ext_id,
                "device_type": _entry_device_type(entry),
                "sender_id": sender_id,
                "sender_eep": sender_eep,
                "message": f"Fehler beim Schreiben von {sender_id} ({sender_eep}) in {display_name}: {type(last_exception).__name__}: {last_exception}",
            })
            continue

        if update_result is None:
            status = "unsupported"
            message = f"Update für Gerät {display_name} nicht unterstützt."
        elif update_result is True:
            status = "updated"
            message = f"Home-Assistant Sender-ID {sender_id} für EEP {sender_eep} in {display_name} geschrieben."
        else:
            status = "exists"
            message = f"Sender-ID {sender_id} für EEP {sender_eep} in {display_name} existiert bereits."

        events.append({
            "status": status,
            "device_id": device_ext_id,
            "device_type": _entry_device_type(entry),
            "sender_id": sender_id,
            "sender_eep": sender_eep,
            "message": message,
        })
        log(message)
    return events


async def write_senders(port: str, sender_map_path: str, baud_rate: int = 57600, gateway_type: str = "fam14") -> Dict[str, Any]:
    from eltakobus import locking
    from eltakobus.device import FAM14, create_busobject
    from eltakobus.serial import RS485SerialInterfaceV2
    from eltakobus.util import b2s

    sender_map = load_sender_map(sender_map_path)
    if not sender_map:
        return {"ok": False, "error": "Keine Sender-IDs zum Schreiben vorhanden.", "events": []}

    bus = None
    locked = False
    events: List[Dict[str, Any]] = []
    try:
        delay_message = 0.001 if baud_rate == 57600 else 0.2
        log("connect", port, baud_rate, gateway_type, "sender entries", len(sender_map))
        bus = RS485SerialInterfaceV2(
            port,
            baud_rate=baud_rate,
            delay_message=delay_message,
            auto_reconnect=False,
        )
        bus.start()
        bus.is_serial_connected.wait(timeout=2)
        if not bus.is_active():
            return {"ok": False, "error": f"Port {port} geöffnet, aber Bus ist nicht aktiv.", "events": []}

        try:
            bus.set_callback(None)
        except Exception:
            pass

        locked = (await locking.lock_bus(bus)) == locking.LOCKED
        log("bus locked", locked)

        fam14: FAM14 = await create_busobject(bus=bus, id=255)
        fam14_base_id_int = await fam14.get_base_id_in_int()
        fam14_base_id = b2s(await fam14.get_base_id_in_bytes())
        log("fam14 base", fam14_base_id)

        async for dev in enumerate_bus(bus):
            device_events = await ensure_programmed_for_device(fam14_base_id_int, dev, sender_map)
            events.extend(device_events)

        counts: Dict[str, int] = {}
        for e in events:
            counts[e.get("status", "unknown")] = counts.get(e.get("status", "unknown"), 0) + 1

        return {
            "ok": True,
            "fam14_base_id": fam14_base_id,
            "events": events,
            "counts": counts,
            "message": f"Sender-ID Schreiben beendet. Aktualisiert: {counts.get('updated', 0)}, bereits vorhanden: {counts.get('exists', 0)}, nicht unterstützt: {counts.get('unsupported', 0)}, Fehler: {counts.get('error', 0)}.",
        }
    finally:
        if bus is not None:
            try:
                if locked:
                    await locking.unlock_bus(bus)
                    log("bus unlocked")
            except Exception as e:
                log("unlock failed", repr(e))
            try:
                bus.stop()
                bus.join(0.8)
            except Exception:
                pass


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", required=True)
    parser.add_argument("--sender-map", required=True)
    parser.add_argument("--baud", type=int, default=57600)
    parser.add_argument("--gateway-type", default="fam14")
    args = parser.parse_args()

    try:
        result = await write_senders(args.port, args.sender_map, args.baud, args.gateway_type)
        jprint(result)
    except Exception as e:
        log("fatal", repr(e))
        traceback.print_exc(file=sys.stderr)
        jprint({"ok": False, "error": f"Sender-ID Schreiben fehlgeschlagen: {type(e).__name__}: {e}", "events": []})


if __name__ == "__main__":
    asyncio.run(main())
