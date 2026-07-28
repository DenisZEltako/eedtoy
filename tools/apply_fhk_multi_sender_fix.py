from pathlib import Path


SOURCE = Path("python/write_senders.py")
TEST = Path("tests/test_write_senders_patch.py")


def replace_function(text: str) -> str:
    start = text.index("async def _ensure_programmed_fhk_controller(")
    end = text.index("\n\nasync def ensure_programmed_for_device", start)
    replacement = '''async def _ensure_programmed_fhk_controller(
    dev: Any,
    sender_id: str,
    channel: int,
    device_type: str,
) -> Optional[bool]:
    """Program one or more smart-home-controller senders for FHK14/F4HK14/FAE14SSR."""
    sender = _sender_bytes_from_id(sender_id)
    upper_type = str(device_type or "").upper()
    start_line = 16 if "F4HK14" in upper_type else 12
    memory_size = int(getattr(dev, "memory_size", 0) or 0)
    if memory_size <= start_line or not hasattr(dev, "read_mem_line") or not hasattr(dev, "write_mem_line"):
        return None

    expected_line = sender + bytes((0, 65, 1 << int(channel or 0), 0))
    first_empty = None
    for memory_line in range(start_line, memory_size):
        current_line = await dev.read_mem_line(memory_line)
        if current_line == expected_line:
            return False
        if not any(current_line) and first_empty is None:
            first_empty = memory_line

    if first_empty is None:
        raise RuntimeError("Kein freier FHK-Controller-Speicherplatz für einen weiteren Sender gefunden")

    await dev.write_mem_line(first_empty, expected_line)
    return True
'''
    return text[:start] + replacement + text[end:]


def add_regression_test(text: str) -> str:
    if "async def test_fhk_multiple_controller_senders():" in text:
        return text

    anchor = "async def test_memory_layouts():\n"
    if text.count(anchor) != 1:
        raise RuntimeError(f"test anchor: expected 1 match, found {text.count(anchor)}")

    addition = '''async def test_fhk_multiple_controller_senders():
    dev = FakeDevice(memory_size=24)
    first = module._sender_bytes_from_id("00-00-B0-01") + bytes((0, 65, 1, 0))
    second = module._sender_bytes_from_id("FF-A6-07-01") + bytes((0, 65, 1, 0))
    dev.memory[12] = first

    assert await module._ensure_programmed_fhk_controller(dev, "00-00-B0-01", 0, "FHK14") is False
    assert await module._ensure_programmed_fhk_controller(dev, "FF-A6-07-01", 0, "FHK14") is True
    assert dev.memory[13] == second
    assert await module._ensure_programmed_fhk_controller(dev, "FF-A6-07-01", 0, "FHK14") is False


'''
    text = text.replace(anchor, addition + anchor, 1)

    call_anchor = "    asyncio.run(test_memory_layouts())\n"
    if text.count(call_anchor) != 1:
        raise RuntimeError(f"test call anchor: expected 1 match, found {text.count(call_anchor)}")
    return text.replace(
        call_anchor,
        "    asyncio.run(test_fhk_multiple_controller_senders())\n" + call_anchor,
        1,
    )


def main() -> None:
    source_text = SOURCE.read_text(encoding="utf-8")
    SOURCE.write_text(replace_function(source_text), encoding="utf-8")

    test_text = TEST.read_text(encoding="utf-8")
    TEST.write_text(add_regression_test(test_text), encoding="utf-8")


if __name__ == "__main__":
    main()
