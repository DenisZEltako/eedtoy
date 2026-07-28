from pathlib import Path
import json


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected exactly one match, found {count}")
    return text.replace(old, new, 1)


def replace_all_exact(text: str, old: str, new: str, expected: int, label: str) -> str:
    count = text.count(old)
    if count != expected:
        raise RuntimeError(f"{label}: expected {expected} matches, found {count}")
    return text.replace(old, new)

path = Path('src/App.jsx')
text = path.read_text(encoding='utf-8')
text = replace_once(text, 'const APP_VERSION = "1.0.94";', 'const APP_VERSION = "1.0.95";', 'App version')
old = '''function buildSenderProgrammingEntries(devices, targetGateway, pct14BaseId) {
  if (!targetGateway || !pct14BaseId) return [];
  const entries = [];
  for (const d of devices || []) {
    const p = profileFor(d.eep);
    if (!p.needs_sender || !isPct14ImportedDevice(d)) continue;
    const device_id = busDeviceIdForProgramming(d, pct14BaseId);
    const sender_id = senderIdForGateway(d, targetGateway, pct14BaseId);
    const sender_eep = d.sender_eep || p.sender_eep || p.eep_out || d.eep;
    if (device_id && sender_id && sender_eep) {
      entries.push({
        device_id,
        sender_id,
        sender_eep,
        device_eep: d.eep || p.eep_out || p.eep || "",
        device_type: deviceTypeForDevice(d),
        platform: d.platform || p.platform || "",
        name: d.name || device_id,
      });
    }
  }
  return entries;
}
'''
new = '''function buildSenderProgrammingEntries(devices, targetGateways, pct14BaseId) {
  const gateways = Array.isArray(targetGateways) ? targetGateways.filter(Boolean) : [targetGateways].filter(Boolean);
  if (!gateways.length || !pct14BaseId) return [];

  const entries = [];
  const seen = new Set();
  for (const d of devices || []) {
    const p = profileFor(d.eep);
    if (!p.needs_sender || !isPct14ImportedDevice(d)) continue;

    const device_id = busDeviceIdForProgramming(d, pct14BaseId);
    const sender_eep = String(d.sender_eep || p.sender_eep || p.eep_out || d.eep || "").trim().toUpperCase();
    if (!device_id || !sender_eep) continue;

    for (const targetGateway of gateways) {
      const sender_id = senderIdForGateway(d, targetGateway, pct14BaseId);
      if (!sender_id) continue;
      const requirementKey = `${device_id}|${sender_id}|${sender_eep}`;
      if (seen.has(requirementKey)) continue;
      seen.add(requirementKey);

      entries.push({
        device_id,
        sender_id,
        sender_eep,
        device_eep: d.eep || p.eep_out || p.eep || "",
        device_type: deviceTypeForDevice(d),
        platform: d.platform || p.platform || "",
        name: d.name || device_id,
        source_gateway_type: targetGateway.type || "",
        source_gateway_base_id: targetGateway.base_id || "",
      });
    }
  }
  return entries;
}
'''
text = replace_once(text, old, new, 'all-gateway entry planner')
old = '''  const activeGatewayBlocks = orderedGatewayBlocks(gateway, buildActiveExtraGateways());
  const selectedWriteGateway = activeGatewayBlocks.find(gw => gatewayKey(gw) === writeTargetGatewayKey) || activeGatewayBlocks[0];
  const senderProgrammingEntries = buildSenderProgrammingEntries(devices, selectedWriteGateway, pct14GatewayBaseId);
  const busWritePort = (writeBusPort || gateway.serial_path || "").trim();
  const busWriteGatewayConnected = ["fam14", "fgw14usb"].includes(gateway.type) && Boolean(busWritePort);
  const busWriteHint = t("senderWrite.hint");
  const canWriteSenderIds = !writingSenders && busWriteGatewayConnected && senderProgrammingEntries.length > 0;
'''
new = '''  const activeGatewayBlocks = orderedGatewayBlocks(gateway, buildActiveExtraGateways());
  const senderProgrammingEntries = buildSenderProgrammingEntries(devices, activeGatewayBlocks, pct14GatewayBaseId);
  const senderGatewaySummary = activeGatewayBlocks
    .map(gw => `${gw.type}${gw.base_id ? ` (${gw.base_id})` : ""}`)
    .join(" · ");
  const hasRs485Gateway = activeGatewayBlocks.some(gw => ["fam14", "fgw14usb"].includes(gw.type));
  const defaultBusWritePort = ["fam14", "fgw14usb"].includes(gateway.type) ? gateway.serial_path : "";
  const busWritePort = (writeBusPort || defaultBusWritePort || "").trim();
  const busWriteGatewayConnected = hasRs485Gateway && Boolean(busWritePort);
  const busWriteHint = t("senderWrite.hint");
  const canWriteSenderIds = !writingSenders && busWriteGatewayConnected && senderProgrammingEntries.length > 0;
'''
text = replace_once(text, old, new, 'sender write state')
text = replace_once(text, '''    if (!selectedWriteGateway) {
      setWriteSenderMsg(t("senderWrite.noGateway"));
      return;
    }
    const port = busWritePort;
    if (!["fam14", "fgw14usb"].includes(gateway.type)) {
      setWriteSenderMsg(t("senderWrite.wrongGateway"));
      return;
    }
''', '''    if (!activeGatewayBlocks.length) {
      setWriteSenderMsg(t("senderWrite.noGateway"));
      return;
    }
    const port = busWritePort;
    if (!hasRs485Gateway) {
      setWriteSenderMsg(t("senderWrite.wrongGateway"));
      return;
    }
''', 'sender write validation')
text = replace_once(text, '    const ok = window.confirm(t("senderWrite.confirm", { port, gateway: `${selectedWriteGateway.type} ${selectedWriteGateway.base_id || ""}`.trim(), count: senderProgrammingEntries.length }));\n', '    const ok = window.confirm(t("senderWrite.confirm", { port, gateway: senderGatewaySummary || "-", count: senderProgrammingEntries.length }));\n', 'sender write confirmation')
text = replace_once(text, '''      targetGateway: selectedWriteGateway,
      entries: senderProgrammingEntries,
''', '''      targetGateways: activeGatewayBlocks,
      entries: senderProgrammingEntries,
''', 'sender write payload')
old = '''              <div title={!busWriteGatewayConnected ? busWriteHint : ""} style={{opacity:busWriteGatewayConnected?1:.48,cursor:busWriteGatewayConnected?"default":"not-allowed"}}>
                <div style={{display:"grid",gridTemplateColumns:"minmax(210px,1fr) minmax(210px,1fr) auto",gap:".65rem",alignItems:"end"}}>
                  <div>
                    <label>{t("yaml.busComPort")}</label>
                    <input disabled={!busWriteGatewayConnected && !["fam14","fgw14usb"].includes(gateway.type)} value={writeBusPort || gateway.serial_path} onChange={e=>setWriteBusPort(e.target.value)} placeholder={t("gateway.serialPortPlaceholder")} list="serial-port-list"/>
                    <div style={{fontSize:".62rem",color:"#6b7280",marginTop:".2rem"}}>{t("yaml.busComPortHelp")}</div>
                  </div>
                  <div>
                    <label>{t("yaml.senderIdsFromGateway")}</label>
                    <select disabled={!busWriteGatewayConnected} value={gatewayKey(selectedWriteGateway)} onChange={e=>setWriteTargetGatewayKey(e.target.value)}>
                      {activeGatewayBlocks.map((gw, idx)=>(
                        <option key={`${gatewayKey(gw)}-${idx}`} value={gatewayKey(gw)}>{gw.type} {gw.base_id ? `(${gw.base_id})` : ""}</option>
                      ))}
                    </select>
                  </div>
                  <button className="btn pri" onClick={handleWriteSenderIds} disabled={!canWriteSenderIds} style={{whiteSpace:"nowrap"}} title={!busWriteGatewayConnected ? busWriteHint : ""}>
                    {writingSenders ? t("yaml.writing") : t("yaml.writeToActuators")}
                  </button>
                </div>
              </div>
'''
new = '''              <div title={!busWriteGatewayConnected ? busWriteHint : ""} style={{opacity:busWriteGatewayConnected?1:.48,cursor:busWriteGatewayConnected?"default":"not-allowed"}}>
                <div style={{display:"grid",gridTemplateColumns:"minmax(210px,1fr) minmax(260px,1.2fr) auto",gap:".65rem",alignItems:"start"}}>
                  <div>
                    <label>{t("yaml.busComPort")}</label>
                    <input disabled={!hasRs485Gateway} value={writeBusPort || defaultBusWritePort} onChange={e=>setWriteBusPort(e.target.value)} placeholder={t("gateway.serialPortPlaceholder")} list="serial-port-list" style={{height:42,minHeight:42}}/>
                    <div style={{fontSize:".62rem",color:"#6b7280",marginTop:".2rem"}}>{t("yaml.busComPortHelp")}</div>
                  </div>
                  <div>
                    <label>{t("yaml.senderIdsFromGateway")}</label>
                    <div style={{height:42,minHeight:42,display:"flex",alignItems:"center",padding:"0 .75rem",border:"1px solid #b9c7d3",borderRadius:7,background:"#f7f9fb",fontSize:".78rem",color:"#405061",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={senderGatewaySummary}>
                      {senderGatewaySummary || "-"}
                    </div>
                  </div>
                  <div>
                    <label style={{visibility:"hidden"}}>{t("yaml.writeToActuators")}</label>
                    <button className="btn pri" onClick={handleWriteSenderIds} disabled={!canWriteSenderIds} style={{whiteSpace:"nowrap",height:42,minHeight:42}} title={!busWriteGatewayConnected ? busWriteHint : ""}>
                      {writingSenders ? t("yaml.writing") : t("yaml.writeToActuators")}
                    </button>
                  </div>
                </div>
              </div>
'''
text = replace_once(text, old, new, 'aligned sender write controls')
path.write_text(text, encoding='utf-8')

path = Path('python/write_senders.py')
text = path.read_text(encoding='utf-8')
old = '''def load_sender_map(path: str) -> Dict[str, Dict[str, Any]]:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    result: Dict[str, Dict[str, Any]] = {}
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
'''
new = '''def load_sender_map(path: str) -> Dict[str, List[Dict[str, Any]]]:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    result: Dict[str, List[Dict[str, Any]]] = {}
    seen: Set[tuple[str, str, str]] = set()
    for item in data.get("entries", data if isinstance(data, list) else []):
        device_id = norm_id(item.get("device_id") or item.get("id") or "")
        sender_id = norm_id(item.get("sender_id") or "")
        sender_eep = str(item.get("sender_eep") or item.get("eep") or "").strip().upper()
        name = str(item.get("name") or "")
        if not device_id or not sender_id or not sender_eep:
            continue
        key = (device_id, sender_id, sender_eep)
        if key in seen:
            continue
        seen.add(key)
        result.setdefault(device_id, []).append({
            "sender": {"id": sender_id, "eep": sender_eep},
            "name": name,
            "device_eep": str(item.get("device_eep") or item.get("device_eep_out") or "").strip().upper(),
            "device_type": str(item.get("device_type") or "").strip(),
            "platform": str(item.get("platform") or "").strip(),
            "source_gateway_type": str(item.get("source_gateway_type") or "").strip(),
            "source_gateway_base_id": norm_id(item.get("source_gateway_base_id") or ""),
        })
    return result
'''
text = replace_once(text, old, new, 'multi-sender map loader')
start = text.index('async def ensure_programmed_for_device(')
end = text.index('\n\nasync def write_senders(', start)
new = '''async def ensure_programmed_for_device(fam14_base_id_int: int, dev: Any, sender_map: Dict[str, List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
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
        entries = sender_map.get(device_ext_id) or []
        for entry in entries:
            sender_id = norm_id(entry.get("sender", {}).get("id", ""))
            sender_eep = str(entry.get("sender", {}).get("eep", "")).strip().upper()
            device_eep = str(entry.get("device_eep") or "").strip().upper()
            entry_name = str(entry.get("name") or "")
            entry_type = _entry_device_type(entry)
            combined_label = f"{entry_type} {entry_name}"
            display_name = _device_display_name(entry, dev_type, device_ext_id)
            is_frgbw = sender_eep == "07-37-F7" or device_eep == "07-37-F7" or "FRGBW" in combined_label.upper()
            is_fsr14ssr = "FSR14SSR" in combined_label.upper()
            is_fhk = any(token in combined_label.upper() for token in ("FHK14", "F4HK14", "FAE14SSR"))
            if not sender_id or not sender_eep:
                continue
            retry = 3
            last_exception: Optional[Exception] = None
            update_result = None
            while retry > 0:
                try:
                    if is_frgbw:
                        update_result = await _ensure_programmed_controller_profile(dev, sender_id, channel)
                    elif is_fsr14ssr:
                        update_result = await _ensure_programmed_fsr14ssr(dev, sender_id, channel)
                    elif is_fhk and sender_eep == "A5-10-06":
                        update_result = await _ensure_programmed_fhk_controller(dev, sender_id, channel, entry_type)
                    elif isinstance(dev, HasProgrammableRPS) or isinstance(dev, DimmerStyle) or hasattr(dev, "ensure_programmed"):
                        sender_address = AddressExpression.parse(sender_id)
                        eep_profile = EEP.find(sender_eep)
                        update_result = await dev.ensure_programmed(channel, sender_address, eep_profile)
                    else:
                        update_result = None
                    last_exception = None
                    await asyncio.sleep(0.05)
                    break
                except (WriteError, TimeoutError, Exception) as e:
                    last_exception = e
                    retry -= 1
                    log("retry", 3 - retry, "failed", dev_type, device_ext_id, sender_id, sender_eep, repr(e))
                    await asyncio.sleep(0.15)
            if last_exception is not None:
                events.append({"status": "error", "device_id": device_ext_id, "device_type": entry_type, "sender_id": sender_id, "sender_eep": sender_eep, "message": f"Fehler beim Schreiben von {sender_id} ({sender_eep}) in {display_name}: {type(last_exception).__name__}: {last_exception}"})
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
            events.append({"status": status, "device_id": device_ext_id, "device_type": entry_type, "sender_id": sender_id, "sender_eep": sender_eep, "message": message})
            log(message)
    return events'''
text = text[:start] + new + text[end:]
text = replace_once(text, '        log("connect", port, baud_rate, gateway_type, "sender entries", len(sender_map))', '        log("connect", port, baud_rate, gateway_type, "sender entries", sum(len(entries) for entries in sender_map.values()))', 'sender entry log count')
text = replace_once(text, '''        for device_id, entry in sender_map.items():
            if device_id in processed_ids:
                continue
            sender_id = norm_id(entry.get("sender", {}).get("id", ""))
            sender_eep = str(entry.get("sender", {}).get("eep", "")).strip().upper()
            display_name = _device_display_name(entry, "BusObject", device_id)
            events.append({
                "status": "error",
                "device_id": device_id,
                "device_type": _entry_device_type(entry),
                "sender_id": sender_id,
                "sender_eep": sender_eep,
                "message": f"Busgerät {display_name} wurde an der erwarteten Series-14-Adresse nicht gefunden.",
            })
''', '''        for device_id, entries in sender_map.items():
            if device_id in processed_ids:
                continue
            for entry in entries:
                sender_id = norm_id(entry.get("sender", {}).get("id", ""))
                sender_eep = str(entry.get("sender", {}).get("eep", "")).strip().upper()
                display_name = _device_display_name(entry, "BusObject", device_id)
                events.append({
                    "status": "error",
                    "device_id": device_id,
                    "device_type": _entry_device_type(entry),
                    "sender_id": sender_id,
                    "sender_eep": sender_eep,
                    "message": f"Busgerät {display_name} wurde an der erwarteten Series-14-Adresse nicht gefunden.",
                })
''', 'missing multi-sender device reporting')
path.write_text(text, encoding='utf-8')

path = Path('src/i18n.js')
text = path.read_text(encoding='utf-8')
for old, new in [
("'yaml.writeDescription': 'Schreibt die in der YAML erzeugten Home-Assistant-Sender-IDs direkt in die Aktoren am FAM14/FGW14-USB-Bus. Danach erkennen die Aktoren die Telegramme von Home Assistant und reagieren darauf.',", "'yaml.writeDescription': 'Prüft alle in der YAML exportierten Gateways und schreibt mit einem Klick jede erforderliche Home-Assistant-Sender-ID in die Series-14-Aktoren.',"),
("'yaml.senderIdsFromGateway': 'Gateway für die Sender-IDs',", "'yaml.senderIdsFromGateway': 'Gateways aus der YAML',"),
("'yaml.writeToActuators': 'In Aktoren schreiben',", "'yaml.writeToActuators': 'Alle Sender-IDs schreiben',"),
("'senderWrite.noGateway': '✗ Kein Quell-Gateway für die Sender-IDs ausgewählt.',", "'senderWrite.noGateway': '✗ In der YAML ist kein Gateway für die Sender-ID-Planung vorhanden.',"),
("Sender-Gateway: {{gateway}}", "Exportierte Gateways: {{gateway}}"),
("Sender-IDs jetzt wirklich in die Series-14-Aktoren schreiben?", "Alle erforderlichen Sender-IDs jetzt in die Series-14-Aktoren schreiben?"),
("'senderWrite.progress': 'Schreibe {{count}} Sender-IDs in Series-14-Aktoren …',", "'senderWrite.progress': 'Prüfe und schreibe {{count}} erforderliche Sender-IDs in Series-14-Aktoren …',"),
("'yaml.writeDescription': 'Writes the Home Assistant sender IDs generated in the YAML directly to the actuators on the FAM14/FGW14-USB bus. The actuators can then recognize and respond to Home Assistant telegrams.',", "'yaml.writeDescription': 'Checks every gateway exported in the YAML and writes every required Home Assistant sender ID to the Series 14 actuators with one click.',"),
("'yaml.senderIdsFromGateway': 'Gateway used for sender IDs',", "'yaml.senderIdsFromGateway': 'Gateways from the YAML',"),
("'yaml.writeToActuators': 'Write to actuators',", "'yaml.writeToActuators': 'Write all sender IDs',"),
("'senderWrite.noGateway': '✗ No source gateway was selected for the sender IDs.',", "'senderWrite.noGateway': '✗ The YAML does not contain a gateway for sender-ID planning.',"),
("Sender gateway: {{gateway}}", "Exported gateways: {{gateway}}"),
("Write the sender IDs to the Series 14 actuators now?", "Write all required sender IDs to the Series 14 actuators now?"),
("'senderWrite.progress': 'Writing {{count}} sender IDs to Series 14 actuators …',", "'senderWrite.progress': 'Checking and writing {{count}} required sender IDs to Series 14 actuators …',"),
]:
    text = replace_once(text, old, new, 'i18n')
path.write_text(text, encoding='utf-8')

path = Path('tests/yaml_generation_regression.js')
text = path.read_text(encoding='utf-8')
text = replace_once(text, 'this.__api = { APP_VERSION, EEP_DB, generateYaml, normalizeFksSenderAssignments, getPct14Mapping, deduplicateExportDevices };', 'this.__api = { APP_VERSION, EEP_DB, generateYaml, normalizeFksSenderAssignments, getPct14Mapping, deduplicateExportDevices, buildSenderProgrammingEntries };', 'test helper exports')
text = replace_all_exact(text, '1.0.94', '1.0.95', 2, 'test version references')
anchor = "assert(api.getPct14Mapping('FDG14')?.eep === 'A5-38-08-FDG14', 'PCT14 maps FDG14 to the dedicated profile');\n"
addition = anchor + '''\nconst allGatewaySenderEntries = api.buildSenderProgrammingEntries([{name:'FSB14 Kanal 1',eep:'G5-3F-7F',platform:'cover',dev_id:'00-00-00-0B',sender_id:'00-00-B0-0B',sender_eep:'H5-3F-7F',room:'PCT14 Adresse 11 · Kanal 1',device_type:'FSB14'}],[{type:'fam14',base_id:'FF-F2-6C-80'},{type:'fgw14usb',base_id:'FF-F2-6C-80'},{type:'fam-usb',base_id:'FF-A6-07-00'}],'FF-F2-6C-80');
assert(allGatewaySenderEntries.length === 2, 'FAM14 and FGW14 duplicate controller IDs are programmed only once');
assert(allGatewaySenderEntries.some(entry => entry.sender_id === '00-00-B0-0B'), 'Internal Series-14 controller sender is included');
assert(allGatewaySenderEntries.some(entry => entry.sender_id === 'FF-A6-07-0B'), 'Dynamic FAM-USB sender is included');
'''
text = replace_once(text, anchor, addition, 'all-gateway JS regression')
path.write_text(text, encoding='utf-8')

path = Path('tests/test_write_senders_patch.py')
text = path.read_text(encoding='utf-8')
text = replace_once(text, 'import importlib.util\n', 'import importlib.util\nimport json\nimport tempfile\n', 'python test imports')
anchor = '''def test_full_scan_removed():
    source = SCRIPT.read_text(encoding="utf-8")
    assert "range(1, 256)" not in source
    assert "enumerate_target_devices" in source
    assert "_ensure_programmed_fsr14ssr" in source
    assert "_ensure_programmed_fhk_controller" in source


'''
addition = anchor + '''def test_multiple_senders_per_device_are_preserved():
    payload = {"entries": [{"device_id":"FF-F2-6C-8B","sender_id":"00-00-B0-0B","sender_eep":"H5-3F-7F","name":"FSB14 Kanal 1"},{"device_id":"FF-F2-6C-8B","sender_id":"FF-A6-07-0B","sender_eep":"H5-3F-7F","name":"FSB14 Kanal 1"},{"device_id":"FF-F2-6C-8B","sender_id":"00-00-B0-0B","sender_eep":"H5-3F-7F","name":"duplicate"}]}
    with tempfile.TemporaryDirectory() as directory:
        path = Path(directory) / "senders.json"
        path.write_text(json.dumps(payload), encoding="utf-8")
        sender_map = module.load_sender_map(str(path))
    entries = sender_map["FF-F2-6C-8B"]
    assert len(entries) == 2
    assert {entry["sender"]["id"] for entry in entries} == {"00-00-B0-0B", "FF-A6-07-0B"}


'''
text = replace_once(text, anchor, addition, 'multi-sender Python regression')
text = replace_once(text, '    test_full_scan_removed()\n    asyncio.run(test_memory_layouts())\n', '    test_full_scan_removed()\n    test_multiple_senders_per_device_are_preserved()\n    asyncio.run(test_memory_layouts())\n', 'python test runner')
path.write_text(text, encoding='utf-8')

path = Path('package.json')
data = json.loads(path.read_text(encoding='utf-8'))
data['version'] = '1.0.95'
if 'python tests/test_write_senders_patch.py' not in data['scripts']['test']:
    data['scripts']['test'] += ' && python tests/test_write_senders_patch.py'
path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

path = Path('package-lock.json')
text = path.read_text(encoding='utf-8')
text = replace_all_exact(text, '"version": "1.0.94"', '"version": "1.0.95"', 2, 'package-lock version')
path.write_text(text, encoding='utf-8')

path = Path('CHANGELOG.md')
text = path.read_text(encoding='utf-8')
text = replace_once(text, '# Changelog\n\n', '''# Changelog\n\n## 1.0.95\n\n- Ein Klick prüft und programmiert jetzt die erforderlichen Sender-IDs aller Gateways, die in die YAML exportiert werden.\n- FAM14 und FGW14-USB werden auf den gemeinsamen internen `00-00-B0-xx`-Sender dedupliziert.\n- Die Sender-ID eines FAM-USB wird weiterhin dynamisch aus dessen tatsächlicher Base-ID und dem Aktor-/Kanaloffset gebildet.\n- Mehrere erforderliche Sender für denselben Series-14-Aktorkanal bleiben in der Schreibliste erhalten und werden einzeln geprüft.\n- Bus-COM-Port, Gatewayübersicht und Schreibschaltfläche sind im YAML-Schreibbereich auf gleicher Höhe dargestellt.\n- Python-Regressionstest für mehrere Sender pro Aktorkanal in den normalen Testlauf aufgenommen.\n\n''', 'changelog')
path.write_text(text, encoding='utf-8')
print('EEDTOY 1.0.95 source migration completed')
