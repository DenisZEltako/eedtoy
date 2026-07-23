#!/usr/bin/env python3
"""Listen for one EnOcean radio telegram and return its sender ID as JSON.

This intentionally uses the same Python stack as the gateway detector for
Eltako/FAM14/FAM-USB paths. It is more reliable than parsing raw bytes in
Electron because FAM14/FGW14 use Eltako ESP2/RS485 specifics and echo handling.
"""
import argparse
import asyncio
import json
import sys
import threading
import time
from typing import Any, Optional


def log(*args: Any) -> None:
    print("[python-learn]", *args, file=sys.stderr, flush=True)


def fmt_id_from_int(value: int) -> Optional[str]:
    try:
        if value is None or value <= 0 or value > 0xFFFFFFFF:
            return None
        return "-".join(f"{b:02X}" for b in int(value).to_bytes(4, "big"))
    except Exception:
        return None


def fmt_id_from_bytes(value: Any) -> Optional[str]:
    try:
        b = bytes(value)
        if len(b) < 4:
            return None
        # Prefer exactly 4 bytes. If a larger buffer is passed, take the last 4
        # only as a fallback for integer-like encodings.
        if len(b) != 4:
            b = b[-4:]
        if b == b"\x00\x00\x00\x00":
            return None
        return "-".join(f"{x:02X}" for x in b)
    except Exception:
        return None


def normalize_id(value: Any) -> Optional[str]:
    if value is None:
        return None
    if isinstance(value, str):
        s = value.strip().upper().replace(":", "-").replace(" ", "-")
        parts = [p for p in s.split("-") if p]
        if len(parts) == 4 and all(len(p) <= 2 for p in parts):
            try:
                return "-".join(f"{int(p, 16):02X}" for p in parts)
            except Exception:
                return None
        return None
    if isinstance(value, int):
        return fmt_id_from_int(value)
    if isinstance(value, (bytes, bytearray, list, tuple)):
        return fmt_id_from_bytes(value)
    return None


def body_candidates(body: bytes):
    """Return plausible sender IDs from an ESP2-style body.

    Different adapters expose either the full ESP2 body or already translated
    radio payloads. We try known layouts first and then conservative fallbacks
    around EnOcean RORG markers.
    """
    if not body:
        return []
    candidates = []

    def add(label: str, b: bytes, rorg: Optional[int] = None):
        sid = fmt_id_from_bytes(b)
        if sid:
            candidates.append((label, sid, rorg))

    rorgs = {0xF6, 0xD5, 0xA5, 0xD2, 0xD4}
    n = len(body)

    # ESP2Message body often is: H_SEQ/LEN, RORG, DATA3..DATA0, ID3..ID0, STATUS
    if n >= 10 and body[1] in rorgs:
        add("esp2-body-1", body[6:10], body[1])

    # Sometimes body starts at RORG directly: RORG, DATA..., ID3..ID0, STATUS
    if n >= 9 and body[0] in rorgs:
        add("esp2-body-0", body[5:9], body[0])

    # ERP1 radio payload: RORG + variable data + SenderID(4) + STATUS
    if n >= 6 and body[0] in rorgs:
        add("erp1-body", body[-5:-1], body[0])

    # Scan for RORG marker and use the normal ERP1 convention after it.
    for pos, val in enumerate(body):
        if val in rorgs and pos + 6 <= n:
            payload = body[pos:]
            add(f"rorg-scan-{pos}", payload[-5:-1], val)

    return candidates


def extract_id_from_message(msg: Any) -> Optional[dict]:
    """Best-effort sender ID extraction from eltakobus message objects."""
    # First use public attributes/properties if the library provides them.
    attr_names = [
        "sender", "sender_id", "senderid", "address", "originator",
        "source", "source_id", "source_address", "id",
    ]
    for name in attr_names:
        try:
            if hasattr(msg, name):
                sid = normalize_id(getattr(msg, name))
                if sid:
                    return {"id": sid, "source": f"attr.{name}", "message_type": type(msg).__name__}
        except Exception:
            pass

    # Many eltakobus messages expose .body.
    try:
        body = bytes(getattr(msg, "body"))
    except Exception:
        body = b""
    for label, sid, rorg in body_candidates(body):
        return {
            "id": sid,
            "source": label,
            "rorg": f"{rorg:02X}" if rorg is not None else None,
            "message_type": type(msg).__name__,
        }

    # Last resort: try bytes(msg), repr parsing not needed unless byte-like.
    try:
        raw = bytes(msg)
    except Exception:
        raw = b""
    for label, sid, rorg in body_candidates(raw):
        return {
            "id": sid,
            "source": "raw." + label,
            "rorg": f"{rorg:02X}" if rorg is not None else None,
            "message_type": type(msg).__name__,
        }

    return None


def listen_rs485(port: str, mode: str, timeout: float) -> dict:
    from eltakobus.serial import RS485SerialInterfaceV2

    baud = 9600 if mode == "fam-usb" else 57600
    delay = 0.2 if mode == "fam-usb" else 0.001
    event = threading.Event()
    result = {"ok": False}
    seen = {"count": 0}

    def callback(message: Any) -> None:
        seen["count"] += 1
        try:
            body = getattr(message, "body", None)
            body_hex = bytes(body).hex(" ") if body is not None else ""
        except Exception:
            body_hex = ""
        log("RX", port, baud, type(message).__name__, body_hex or repr(message))
        parsed = extract_id_from_message(message)
        if parsed and parsed.get("id"):
            result.update({
                "ok": True,
                "id": parsed["id"],
                "rorg": parsed.get("rorg"),
                "protocol": "eltakobus-rs485",
                "baudRate": baud,
                "message_type": parsed.get("message_type"),
                "source": parsed.get("source"),
            })
            event.set()

    bus = None
    try:
        log("LISTEN", port, baud, "mode=", mode, "timeout=", timeout)
        bus = RS485SerialInterfaceV2(
            port,
            baud_rate=baud,
            callback=callback,
            delay_message=delay,
            auto_reconnect=False,
        )
        bus.start()
        if not bus.is_serial_connected.wait(timeout=2):
            return {"ok": False, "error": f"Port {port} konnte nicht geöffnet werden."}

        event.wait(timeout)
        if result.get("ok"):
            return result
        return {
            "ok": False,
            "error": f"Kein EnOcean-Telegramm innerhalb von {int(timeout)} Sekunden empfangen. Empfangene Busnachrichten: {seen['count']}",
            "baudRate": baud,
            "protocol": "eltakobus-rs485",
        }
    finally:
        try:
            if bus is not None:
                bus.stop()
                bus.join(0.5)
        except Exception:
            pass


def listen_usb300(port: str, timeout: float) -> dict:
    from esp2_gateway_adapter.esp3_serial_com import ESP3SerialCommunicator
    event = threading.Event()
    result = {"ok": False}
    seen = {"count": 0}

    def callback(message: Any) -> None:
        seen["count"] += 1
        parsed = extract_id_from_message(message)
        if parsed and parsed.get("id"):
            result.update({
                "ok": True,
                "id": parsed["id"],
                "rorg": parsed.get("rorg"),
                "protocol": "esp3-python-esp2-adapter",
                "baudRate": 57600,
                "message_type": parsed.get("message_type"),
                "source": parsed.get("source"),
            })
            event.set()

    bus = None
    try:
        bus = ESP3SerialCommunicator(
            port,
            callback=callback,
            baud_rate=57600,
            auto_reconnect=False,
            esp2_translation_enabled=True,
        )
        bus.start()
        if not bus.is_serial_connected.wait(timeout=2):
            return {"ok": False, "error": f"USB300 an {port} konnte nicht geoeffnet werden."}
        event.wait(timeout)
        if result.get("ok"):
            return result
        return {
            "ok": False,
            "error": f"Kein EnOcean-Telegramm innerhalb von {int(timeout)} Sekunden ueber USB300 empfangen. Empfangene Nachrichten: {seen['count']}",
            "baudRate": 57600,
            "protocol": "esp3-python-esp2-adapter",
        }
    finally:
        try:
            if bus is not None:
                bus.stop()
                bus.join(0.5)
        except Exception:
            pass


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", required=True)
    parser.add_argument("--mode", default="auto")
    parser.add_argument("--timeout", type=float, default=20.0)
    args = parser.parse_args()

    mode = (args.mode or "auto").lower().strip()
    if mode in ("fam14", "fgw14usb", "fgw14", "auto"):
        mode = "fam14"
    elif mode in ("fam-usb", "famusb"):
        mode = "fam-usb"
    elif mode in ("usb300", "esp3"):
        mode = "usb300"

    try:
        result = listen_usb300(args.port, args.timeout) if mode == "usb300" else listen_rs485(args.port, mode, args.timeout)
    except Exception as exc:
        log("fatal", repr(exc))
        import traceback
        traceback.print_exc(file=sys.stderr)
        result = {"ok": False, "error": f"Python-Lerntelegramm-Listener fehlgeschlagen: {type(exc).__name__}: {exc}"}

    print(json.dumps(result, ensure_ascii=False), flush=True)
    return 0 if result.get("ok") else 1


if __name__ == "__main__":
    raise SystemExit(main())
