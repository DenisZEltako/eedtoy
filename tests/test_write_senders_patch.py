#!/usr/bin/env python3
import asyncio
import importlib.util
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "python" / "write_senders.py"
spec = importlib.util.spec_from_file_location("write_senders_patch", SCRIPT)
module = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(module)


class FakeDevice:
    def __init__(self, memory_size=24):
        self.memory_size = memory_size
        self.memory = [bytes(8) for _ in range(memory_size)]

    async def read_mem_line(self, line):
        return self.memory[line]

    async def write_mem_line(self, line, value):
        self.memory[line] = value


async def test_memory_layouts():
    fsr = FakeDevice(20)
    assert await module._ensure_programmed_fsr14ssr(fsr, "00-00-B0-15", 0) is True
    assert fsr.memory[12] == bytes.fromhex("0000B01500330100")
    assert await module._ensure_programmed_fsr14ssr(fsr, "00-00-B0-15", 0) is False
    assert await module._ensure_programmed_fsr14ssr(fsr, "00-00-B0-16", 1) is True
    assert fsr.memory[13] == bytes.fromhex("0000B01600330200")

    fhk = FakeDevice(20)
    assert await module._ensure_programmed_fhk_controller(fhk, "00-00-B0-06", 0, "FHK14") is True
    assert fhk.memory[12] == bytes.fromhex("0000B00600410100")
    assert await module._ensure_programmed_fhk_controller(fhk, "00-00-B0-06", 0, "FHK14") is False

    f4hk = FakeDevice(24)
    assert await module._ensure_programmed_fhk_controller(f4hk, "00-00-B0-20", 2, "F4HK14") is True
    assert f4hk.memory[18] == bytes.fromhex("0000B02000410400")


def test_target_addresses():
    base = int("FFBF5C80", 16)
    sender_map = {
        "FF-BF-5C-82": {},
        "FF-BF-5C-83": {},
        "FF-BF-5C-95": {},
        "FF-BF-5C-96": {},
        "FF-BF-5C-B8": {},
    }
    assert module.target_bus_addresses(base, sender_map) == [2, 3, 21, 22, 56]


def test_full_scan_removed():
    source = SCRIPT.read_text(encoding="utf-8")
    assert "range(1, 256)" not in source
    assert "enumerate_target_devices" in source
    assert "_ensure_programmed_fsr14ssr" in source
    assert "_ensure_programmed_fhk_controller" in source


if __name__ == "__main__":
    test_target_addresses()
    test_full_scan_removed()
    asyncio.run(test_memory_layouts())
    print("R7 sender-write patch tests passed.")
