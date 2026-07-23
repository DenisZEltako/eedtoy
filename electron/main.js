const { app, BrowserWindow, shell, ipcMain, Menu, dialog } = require('electron');
const path = require('path');
const fs = require('fs/promises');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Windows uses the AppUserModelID to associate the running window/taskbar
// entry with the packaged executable and its icon. Without this, Windows can
// show a generic Electron/default icon in some places.
if (process.platform === 'win32') {
  app.setAppUserModelId('io.github.deniszeltako.eedtoy');
}

function getAppIconPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'icon.ico');
  }
  return path.join(__dirname, '../public/icon.ico');
}



const PROJECT_FORMAT = 'eedtoy-project';
const PROJECT_SCHEMA_VERSION = 1;
const MAX_PROJECT_SIZE_BYTES = 10 * 1024 * 1024;

function safeProjectFileName(value) {
  const base = String(value || 'EEDTOY-Projekt')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .trim();
  return base || 'EEDTOY-Projekt';
}

function validateProjectDocument(project) {
  if (!project || typeof project !== 'object' || Array.isArray(project)) {
    throw new Error('Die Datei enthält kein gültiges EEDTOY-Projekt.');
  }
  if (project.project_format !== PROJECT_FORMAT) {
    throw new Error('Die Datei ist kein EEDTOY-Projekt.');
  }
  const schemaVersion = Number(project.schema_version || 0);
  if (!Number.isInteger(schemaVersion) || schemaVersion < 1) {
    throw new Error('Die Projektdatei hat keine gültige Schema-Version.');
  }
  if (schemaVersion > PROJECT_SCHEMA_VERSION) {
    throw new Error(`Die Projektdatei verwendet Schema ${schemaVersion}. Diese EEDTOY-Version unterstützt maximal Schema ${PROJECT_SCHEMA_VERSION}.`);
  }
  if (!project.state || typeof project.state !== 'object' || Array.isArray(project.state)) {
    throw new Error('Der Projektzustand fehlt oder ist beschädigt.');
  }
  if (!Array.isArray(project.state.devices)) {
    throw new Error('Die Geräteliste im Projekt ist beschädigt.');
  }
  if (!project.state.gateway || typeof project.state.gateway !== 'object' || Array.isArray(project.state.gateway)) {
    throw new Error('Die Gateway-Konfiguration im Projekt ist beschädigt.');
  }
}

ipcMain.handle('save-project-as', async (_event, payload = {}) => {
  try {
    const project = payload.project;
    validateProjectDocument(project);
    const suggestedName = safeProjectFileName(payload.suggestedName || payload.currentFileName || 'EEDTOY-Projekt');
    const defaultPath = suggestedName.toLowerCase().endsWith('.eedtoy') ? suggestedName : `${suggestedName}.eedtoy`;
    const result = await dialog.showSaveDialog({
      title: 'EEDTOY-Projekt speichern unter',
      defaultPath,
      filters: [
        { name: 'EEDTOY-Projekt', extensions: ['eedtoy'] },
        { name: 'JSON-Datei', extensions: ['json'] },
      ],
      properties: ['createDirectory', 'showOverwriteConfirmation'],
    });
    if (result.canceled || !result.filePath) return { ok: false, canceled: true };

    let filePath = result.filePath;
    if (!path.extname(filePath)) filePath += '.eedtoy';
    const serialized = JSON.stringify(project, null, 2) + '\n';
    if (Buffer.byteLength(serialized, 'utf8') > MAX_PROJECT_SIZE_BYTES) {
      throw new Error('Das Projekt ist größer als 10 MB und kann nicht gespeichert werden.');
    }
    await fs.writeFile(filePath, serialized, 'utf8');
    return { ok: true, path: filePath, fileName: path.basename(filePath) };
  } catch (error) {
    console.error('[save-project-as]', error);
    return { ok: false, error: error.message || String(error) };
  }
});

ipcMain.handle('open-project', async () => {
  try {
    const result = await dialog.showOpenDialog({
      title: 'EEDTOY-Projekt öffnen',
      filters: [
        { name: 'EEDTOY-Projekt', extensions: ['eedtoy', 'json'] },
      ],
      properties: ['openFile'],
    });
    if (result.canceled || !result.filePaths?.[0]) return { ok: false, canceled: true };

    const filePath = result.filePaths[0];
    const stat = await fs.stat(filePath);
    if (stat.size > MAX_PROJECT_SIZE_BYTES) {
      throw new Error('Die Projektdatei ist größer als 10 MB und wird aus Sicherheitsgründen nicht geöffnet.');
    }
    const raw = await fs.readFile(filePath, 'utf8');
    let project;
    try {
      project = JSON.parse(raw);
    } catch (error) {
      throw new Error(`Die Projektdatei enthält ungültiges JSON: ${error.message || error}`);
    }
    validateProjectDocument(project);
    return { ok: true, path: filePath, fileName: path.basename(filePath), project };
  } catch (error) {
    console.error('[open-project]', error);
    return { ok: false, error: error.message || String(error) };
  }
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1100, height: 850, minWidth: 800, minHeight: 600,
    icon: getAppIconPath(),
    webPreferences: {
      nodeIntegration: false, contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    title: 'EEDTOY – ELTAKO EnOcean Device to YAML Generator',
    backgroundColor: '#080d18', show: false,
  });
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });

  // Native context menu for editable fields. Electron does not provide one by
  // default, so right-click paste only works when we add it explicitly.
  win.webContents.on('context-menu', (_event, params) => {
    const hasSelection = params.selectionText && params.selectionText.length > 0;
    const isEditable = params.isEditable;
    const template = [];

    if (isEditable) {
      template.push(
        { label: 'Ausschneiden', role: 'cut', enabled: hasSelection },
        { label: 'Kopieren', role: 'copy', enabled: hasSelection },
        { label: 'Einfügen', role: 'paste' },
        { type: 'separator' },
        { label: 'Alles auswählen', role: 'selectAll' },
      );
    } else if (hasSelection) {
      template.push(
        { label: 'Kopieren', role: 'copy' },
        { type: 'separator' },
        { label: 'Alles auswählen', role: 'selectAll' },
      );
    }

    if (template.length) Menu.buildFromTemplate(template).popup({ window: win });
  });

  if (isDev) { win.loadURL('http://localhost:5173'); }
  else { win.loadFile(path.join(__dirname, '../dist/index.html')); }
  win.once('ready-to-show', () => win.show());
}


let lastBusDisconnectInfo = null;

function rememberBusConnection(portPath, gatewayType, baudRate = 57600) {
  const type = String(gatewayType || '').toLowerCase();
  const port = String(portPath || '').trim();
  if (!port || !['fam14', 'fgw14usb'].includes(type)) return;
  lastBusDisconnectInfo = { portPath: port, gatewayType: type, baudRate: baudRate || 57600, at: Date.now() };
}

function sendBusDisconnect(portPath, gatewayType = 'fam14', baudRate = 57600, options = {}) {
  return new Promise((resolve) => {
    const type = String(gatewayType || '').toLowerCase();
    const portName = String(portPath || '').trim();
    if (!portName) return resolve({ ok: false, error: 'Kein COM-Port eingetragen.' });

    if (!['fam14', 'fgw14usb'].includes(type)) {
      return resolve({ ok: true, skipped: true, message: 'Für diesen Gateway-Typ ist kein RS485-Bus-Disconnect notwendig.' });
    }

    let port;
    try {
      const { SerialPort } = require('serialport');
      port = new SerialPort({ path: portName, baudRate: baudRate || 57600, autoOpen: false });
    } catch (e) {
      return resolve({ ok: false, error: 'SerialPort Fehler: ' + (e.message || e) });
    }

    let resolved = false;
    const finish = (result) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      const done = () => resolve(result);
      try {
        if (port?.isOpen) port.close(() => setTimeout(done, options.closeDelayMs || 120));
        else done();
      } catch (_) { done(); }
    };

    const timer = setTimeout(() => finish({ ok: false, error: 'Timeout beim Bus-Disconnect.' }), options.timeoutMs || 2500);

    port.on('error', err => finish({ ok: false, error: 'Serieller Fehler beim Disconnect: ' + (err.message || err) }));
    port.open((err) => {
      if (err) return finish({ ok: false, error: `Port ${portName} konnte nicht geöffnet werden: ${err.message || err}` });
      const frame = buildEltakoBusUnlock();
      console.log('[disconnect-gateway] TX bus unlock', portName, baudRate || 57600, frame.toString('hex').match(/../g).join(' '));
      port.write(frame, (writeErr) => {
        if (writeErr) return finish({ ok: false, error: 'Bus-Disconnect konnte nicht gesendet werden: ' + (writeErr.message || writeErr) });
        try {
          port.drain(() => finish({ ok: true, portPath: portName, gatewayType: type, baudRate: baudRate || 57600, message: 'RS485-Bus wurde freigegeben und der COM-Port geschlossen.' }));
        } catch (_) {
          finish({ ok: true, portPath: portName, gatewayType: type, baudRate: baudRate || 57600, message: 'RS485-Bus wurde freigegeben und der COM-Port geschlossen.' });
        }
      });
    });
  });
}

// ── List serial ports ─────────────────────────────────────────────
ipcMain.handle('list-ports', async () => {
  const { ports } = await listSerialPortsRobust();
  return ports.map(p => ({ path: p.path, manufacturer: p.manufacturer || '', vendorId: p.vendorId || '', source: p.source || '' }));
});


function normalizePortInfo(p, source = 'serialport') {
  return {
    path: p.path || p.DeviceID || p.deviceId || '',
    manufacturer: p.manufacturer || p.Manufacturer || p.Description || '',
    vendorId: p.vendorId || '',
    productId: p.productId || '',
    serialNumber: p.serialNumber || '',
    source,
  };
}

function uniquePorts(ports) {
  const seen = new Set();
  return ports.filter(p => {
    if (!p.path) return false;
    const key = p.path.toUpperCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function listSerialPortsRobust(extraPath = '') {
  const found = [];
  let listError = '';

  try {
    const { SerialPort } = require('serialport');
    const ports = await SerialPort.list();
    found.push(...ports.map(p => normalizePortInfo(p, 'serialport')));
  } catch (e) {
    listError = e.message || String(e);
    console.error('[list-ports] SerialPort.list failed:', e);
  }

  // Windows fallback: some USB/COM drivers are visible through WMI/CIM even when
  // serialport.list() returns an empty array.
  if (process.platform === 'win32') {
    try {
      const { execFileSync } = require('child_process');
      const ps = "Get-CimInstance Win32_SerialPort | Select-Object DeviceID,Description,Manufacturer,PNPDeviceID | ConvertTo-Json -Compress";
      const raw = execFileSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', ps], { encoding: 'utf8', timeout: 2500 });
      const trimmed = raw.trim();
      if (trimmed) {
        const parsed = JSON.parse(trimmed);
        const arr = Array.isArray(parsed) ? parsed : [parsed];
        for (const item of arr) {
          if (item?.DeviceID) found.push(normalizePortInfo({ path: item.DeviceID, manufacturer: item.Description || item.Manufacturer || '', serialNumber: item.PNPDeviceID || '' }, 'windows-cim'));
        }
      }
    } catch (e) {
      console.error('[list-ports] Windows CIM fallback failed:', e.message || e);
    }
  }

  if (extraPath && String(extraPath).trim()) {
    const manualPath = String(extraPath).trim();
    // Do not carry over Linux defaults such as /dev/ttyUSB0 on Windows.
    if (!(process.platform === 'win32' && manualPath.startsWith('/dev/'))) {
      found.unshift(normalizePortInfo({ path: manualPath, manufacturer: 'Manuell eingetragen' }, 'manual'));
    }
  }

  const ports = uniquePorts(found);
  console.log('[list-ports] found', ports.map(p => `${p.path} (${p.manufacturer || p.source})`).join(', ') || 'none');
  return { ports, error: listError };
}

// ── CRC8 table for ESP3 ───────────────────────────────────────────
// ── Helpers ───────────────────────────────────────────────────────
function fmtId(buf) {
  return Array.from(buf).map(b=>b.toString(16).toUpperCase().padStart(2,'0')).join('-');
}
function allZero(buf) { return buf.every(b=>b===0); }

function buildEsp2Message(body) {
  let cs = 0;
  for (const b of body) cs = (cs + b) & 0xFF;
  return Buffer.from([0xA5, 0x5A, ...body, cs]);
}

function isValidFixedEsp2Frame(buf, i) {
  if (i < 0 || i + 14 > buf.length) return false;
  if (buf[i] !== 0xA5 || buf[i+1] !== 0x5A) return false;
  let cs = 0;
  for (let j = i + 2; j < i + 13; j++) cs = (cs + buf[j]) & 0xFF;
  return buf[i+13] === cs;
}

// ─────────────────────────────────────────────────────────────────
// PROTOCOL 1: Eltako FAM-USB specific (from eo-man source code)
// Command: AB 58 00 00 00 00 00 00 00 00 00
// Response body[2:6] = base ID
// This is the Eltako RS485 extended ESP2 format
// ─────────────────────────────────────────────────────────────────
function buildFamUsbRdIdBase() {
  // Eltako/FAM-USB command in ESP2-style framing.
  // Frame: A5 5A | H_SEQ+LEN | payload | checksum
  // Checksum is calculated over H_SEQ+LEN plus all payload bytes.
  const payload = Buffer.from([0xAB, 0x58, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
  const lenByte = 0x2B; // H_SEQ=001, payload length=0x0B
  let cs = lenByte;
  for (const b of payload) cs = (cs + b) & 0xFF;
  return Buffer.from([0xA5, 0x5A, lenByte, ...payload, cs]);
}

// PROTOCOL 2: Standard ESP2 CO_RD_IDBASE (FAM14, FGW14-USB)
// ─────────────────────────────────────────────────────────────────
function buildEsp2RdIdBase() {
  // ESP2 fixed frame. Body is 11 bytes; first byte is H_SEQ+LEN.
  // This command is kept as fallback for ESP2-compatible transceivers.
  return buildEsp2Message(Buffer.from([0x2A, 0x05, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0x00]));
}

function buildEltakoBusLock() {
  // EltakoMessage(org=0xFF, payload=8*0, address=0xFF, request/TCT)
  return buildEsp2Message(Buffer.from([0xAB, 0xFF, 0,0,0,0,0,0,0,0, 0xFF]));
}

function buildEltakoBusUnlock() {
  // EltakoMessage(org=0xFF, payload=8*0, address=0x00, request/TCT)
  return buildEsp2Message(Buffer.from([0xAB, 0xFF, 0,0,0,0,0,0,0,0, 0x00]));
}

function buildFam14MemoryBaseIdRequest() {
  // EltakoMemoryRequest(address=255, row=1). FAM14 stores its base ID in memory row 1.
  return buildEsp2Message(Buffer.from([0xAB, 0xF1, 0,0,0,0,0,0,0,0x01, 0xFF]));
}

// ─────────────────────────────────────────────────────────────────
// PARSERS
// ─────────────────────────────────────────────────────────────────

// Parse FAM-USB Eltako response
// Response to AB 58 cmd: response.body[2:6] = base ID
// Eltako RS485 response frame: A5 5A | H_SEQ+LEN | body | CS
function tryParseEltakoFamUsb(buf) {
  for (let i = 0; i <= buf.length - 14; i++) {
    if (!isValidFixedEsp2Frame(buf, i)) continue;
    const body = buf.slice(i + 2, i + 13);

    // eo_man creates this synthetic info message after reading the FAM14 base ID.
    if (body[0] === 0x8B && body[1] === 0x98) {
      const id = body.slice(2, 6);
      if (!allZero(id)) return fmtId(id);
    }

    // Some FAM-USB variants answer the AB 58 command directly.
    if (body[0] === 0x8B && body[1] === 0xAB && body[2] === 0x58) {
      const id = body.slice(3, 7);
      if (!allZero(id)) return fmtId(id);
    }
  }
  return null;
}

function tryParseFam14MemoryResponse(buf) {
  for (let i = 0; i <= buf.length - 14; i++) {
    if (!isValidFixedEsp2Frame(buf, i)) continue;
    const body = buf.slice(i + 2, i + 13);
    // EltakoMemoryResponse(row=1): RMT=0x8B, ORG=0xF1, value in body[2:10], row/address in body[10].
    if (body[0] === 0x8B && body[1] === 0xF1 && body[10] === 0x01) {
      const id = body.slice(2, 6);
      if (!allZero(id)) return fmtId(id);
    }
  }
  return null;
}

// Parse standard ESP2 CO_RD_IDBASE response
// Response: ORG=0x02 (RCT), STATUS has bit7 set, ID at bytes 8-11
function tryParseEsp2(buf) {
  for (let i = 0; i <= buf.length - 14; i++) {
    if (!isValidFixedEsp2Frame(buf, i)) continue;
    const body = buf.slice(i + 2, i + 13);
    // Generic ESP2 base-id-info style response, if an adapter sends it in fixed ESP2 framing.
    if (body[0] === 0x8B && body[1] === 0x98) {
      const id = body.slice(2, 6);
      if (!allZero(id)) return fmtId(id);
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────
// SERIAL READ / AUTO DETECT HELPERS
// ─────────────────────────────────────────────────────────────────
function parseBaseIdFromBuffer(buffer) {
  const fam14Memory = tryParseFam14MemoryResponse(buffer);
  if (fam14Memory) return { baseId: fam14Memory, parser: 'fam14-memory-row-1' };

  const fam = tryParseEltakoFamUsb(buffer);
  if (fam) return { baseId: fam, parser: 'eltako-fam-usb' };

  const esp2 = tryParseEsp2(buffer);
  if (esp2) return { baseId: esp2, parser: 'esp2' };

  return null;
}

function buildCommandForProtocol(protocol) {
  if (protocol === 'fam14-memory') return [buildEltakoBusLock(), buildFam14MemoryBaseIdRequest()];
  if (protocol === 'esp2-fam-usb') return buildFamUsbRdIdBase();
  if (protocol === 'esp2') return buildEsp2RdIdBase();
  return null;
}

function readBaseIdFromPort(portPath, baudRate, protocol, options = {}) {
  const timeoutMs = options.timeoutMs || 1800;
  const retries = options.retries ?? 2;

  return new Promise((resolve) => {
    let port;
    try {
      const { SerialPort } = require('serialport');
      port = new SerialPort({ path: portPath, baudRate: baudRate || 57600, autoOpen: false });
    } catch (e) {
      return resolve({ ok: false, error: 'SerialPort Fehler: ' + e.message });
    }

    let buffer = Buffer.alloc(0);
    let resolved = false;
    let attempt = 0;
    let retryTimer = null;
    let finalTimer = null;
    const txFrames = [];
    const rxFrames = [];

    const done = (result) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(retryTimer);
      clearTimeout(finalTimer);

      const finish = () => resolve({ ...result, txFrames, rxFrames });
      try {
        if (port?.isOpen) {
          // Important on Windows: wait until COM port is really closed before
          // the next baud/protocol attempt opens the same port again.
          port.close(() => setTimeout(finish, 150));
        } else {
          finish();
        }
      } catch {
        finish();
      }
    };

    const send = () => {
      if (resolved) return;
      if (attempt >= retries) {
        return done({ ok: false, error: `Keine Base-ID Antwort auf ${portPath} @ ${baudRate} baud (${protocol}).` });
      }
      const cmdOrFrames = buildCommandForProtocol(protocol);
      if (!cmdOrFrames) return done({ ok: false, error: 'Unbekanntes Protokoll: ' + protocol });
      const frames = Array.isArray(cmdOrFrames) ? cmdOrFrames : [cmdOrFrames];
      attempt += 1;

      const writeFrame = (index) => {
        if (resolved || index >= frames.length) return;
        const frame = frames[index];
        const tx = frame.toString('hex').match(/../g).join(' ');
        txFrames.push(tx);
        console.log('[read-base-id] TX', portPath, baudRate, protocol, tx);
        port.write(frame, (err) => {
          if (err) return done({ ok: false, error: 'Senden fehlgeschlagen: ' + err.message });
          try { port.drain(() => {}); } catch {}
          setTimeout(() => writeFrame(index + 1), 120);
        });
      };

      writeFrame(0);
      retryTimer = setTimeout(send, timeoutMs);
    };

    port.on('error', (err) => done({ ok: false, error: err.message }));

    port.on('data', (chunk) => {
      const rx = chunk.toString('hex').match(/../g).join(' ');
      rxFrames.push(rx);
      console.log('[read-base-id] RX', portPath, baudRate, protocol, rx);
      buffer = Buffer.concat([buffer, chunk]);
      if (buffer.length > 4096) buffer = buffer.slice(-4096);

      const parsed = parseBaseIdFromBuffer(buffer);
      if (parsed) {
        return done({
          ok: true,
          baseId: parsed.baseId,
          protocol,
          parser: parsed.parser,
          baudRate,
          portPath,
        });
      }
    });

    port.open((err) => {
      if (err) return done({ ok: false, error: 'Port konnte nicht geöffnet werden: ' + err.message });
      finalTimer = setTimeout(() => done({ ok: false, error: `Timeout auf ${portPath} @ ${baudRate} baud (${protocol}).` }), timeoutMs * retries + 900);
      setTimeout(send, 250);
    });
  });
}

function guessGatewayType(candidate) {
  if (candidate.protocol === 'fam14-memory') return 'fam14';
  if (candidate.protocol === 'esp2-fam-usb') return 'fam-usb';
  if (candidate.protocol === 'esp2') return candidate.baudRate === 57600 ? 'fgw14usb' : 'fam-usb';
  return 'fam-usb';
}

function makeCandidatesForPort(portInfo) {
  const m = `${portInfo.manufacturer || ''} ${portInfo.path || ''}`.toLowerCase();
  const candidates = [];

  const add = (baudRate, protocol, label) => candidates.push({ baudRate, protocol, label });

  // Prefer likely matches first, but still try all relevant variants.
  if (m.includes('eltako') || m.includes('fam')) {
    add(9600, 'fam14-memory', 'Eltako FAM14 Base-ID aus Speicher');
    add(57600, 'fam14-memory', 'Eltako FAM14 Base-ID aus Speicher');
    add(9600, 'esp2-fam-usb', 'Eltako FAM-USB');
    add(57600, 'esp2', 'Eltako FAM14/FGW14-USB');
  }
  // Many Eltako gateways identify only as generic FTDI. Prefer Eltako
  // variants before ESP3 so a FAM/FGW is not disturbed by a wrong ESP3 query.
  if (m.includes('ftdi') || m.includes('eltako') || m.includes('fam') || m.includes('fgw')) {
    add(9600, 'esp2-fam-usb', 'Eltako FAM-USB');
    add(57600, 'esp2', 'Eltako FAM14/FGW14-USB');
  }

  add(9600, 'fam14-memory', 'Eltako FAM14 Base-ID aus Speicher');
  add(57600, 'fam14-memory', 'Eltako FAM14 Base-ID aus Speicher');
  add(9600, 'esp2-fam-usb', 'Eltako FAM-USB');
  add(57600, 'esp2', 'Eltako FAM14/FGW14-USB');
  add(9600, 'esp2', 'ESP2 9600 fallback');

  const seen = new Set();
  return candidates.filter(c => {
    const k = `${c.baudRate}:${c.protocol}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

async function detectGatewayOnSerialPorts(preferredPath = '') {
  const { ports: serialPorts, error: listError } = await listSerialPortsRobust(preferredPath);

  const attempts = [];
  for (const portInfo of serialPorts) {
    const candidates = makeCandidatesForPort(portInfo);
    for (const candidate of candidates) {
      console.log('[detect-gateway] TRY', portInfo.path, candidate.baudRate, candidate.protocol);
      const result = await readBaseIdFromPort(portInfo.path, candidate.baudRate, candidate.protocol, { timeoutMs: 2200, retries: 2 });
      attempts.push({
        path: portInfo.path,
        manufacturer: portInfo.manufacturer,
        baudRate: candidate.baudRate,
        protocol: candidate.protocol,
        label: candidate.label,
        ok: result.ok,
        error: result.error || '',
        rxFrames: result.rxFrames || [],
      });

      if (!result.ok) {
        console.log('[detect-gateway] FAIL', portInfo.path, candidate.baudRate, candidate.protocol, result.error || 'no match');
      }

      if (result.ok) {
        const type = guessGatewayType(candidate, portInfo.manufacturer);
        rememberBusConnection(portInfo.path, type, candidate.baudRate || 57600);
        return {
          ok: true,
          gateway: {
            type,
            label: candidate.label,
            serial_path: portInfo.path,
            base_id: result.baseId,
            baudRate: candidate.baudRate,
            protocol: candidate.protocol,
            parser: result.parser,
            manufacturer: portInfo.manufacturer,
          },
          ports: serialPorts,
          attempts,
        };
      }

      // Give Windows/FTDI drivers a moment before reopening the same COM port
      // at another baud rate or protocol.
      await new Promise(r => setTimeout(r, 250));
    }
  }

  return {
    ok: false,
    ports: serialPorts,
    attempts,
    error: serialPorts.length
      ? 'Serielle Ports wurden gefunden, aber keine gültige Base-ID Antwort empfangen. Prüfe Gateway-Typ, Baudrate und ob der Port von anderer Software belegt ist.'
      : 'Kein serieller Port gefunden. Trage den COM-Port manuell ein, z.B. COM3, oder prüfe Treiber/USB-Kabel/Gateway.' + (listError ? ' SerialPort.list Fehler: ' + listError : ''),
  };
}




// ─────────────────────────────────────────────────────────────────
// PYTHON RUNTIME AUTO-SETUP
// The Electron UI can run on a fresh Windows PC without the user manually
// installing the Python packages. EEDTOY creates a private venv in the user
// profile and installs python/requirements.txt automatically. If no Python is
// installed on Windows, it can bootstrap Python 3 via winget when available.
// ─────────────────────────────────────────────────────────────────
let pythonRuntimeSetupPromise = null;
let pythonRuntimeState = null;

function getPythonFolderPath() {
  const fs = require('fs');
  const candidates = app.isPackaged
    ? [
        path.join(process.resourcesPath || '', 'python'),
        path.join(process.cwd(), 'python'),
        path.join(__dirname, '..', 'python'),
      ]
    : [
        path.join(__dirname, '..', 'python'),
        path.join(process.cwd(), 'python'),
      ];
  return candidates.find(x => x && fs.existsSync(x)) || candidates[0];
}

function getPythonRequirementsPath() {
  return path.join(getPythonFolderPath(), 'requirements.txt');
}

function getPythonRuntimeDir() {
  return path.join(app.getPath('userData'), 'python-runtime');
}

function getVenvPythonPath() {
  const base = getPythonRuntimeDir();
  return process.platform === 'win32'
    ? path.join(base, 'Scripts', 'python.exe')
    : path.join(base, 'bin', 'python3');
}

function exists(p) {
  try { return require('fs').existsSync(p); } catch { return false; }
}

function runProcess(cmd, args = [], options = {}) {
  return new Promise((resolve) => {
    const { spawn } = require('child_process');
    let stdout = '';
    let stderr = '';
    let child;
    try {
      child = spawn(cmd, args, {
        cwd: options.cwd || process.cwd(),
        windowsHide: true,
        shell: !!options.shell,
        env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1', ...(options.env || {}) },
      });
    } catch (e) {
      return resolve({ ok: false, code: -1, stdout, stderr, error: e.message || String(e), cmd, args });
    }
    const timer = setTimeout(() => { try { child.kill(); } catch {} }, options.timeoutMs || 30000);
    child.stdout.on('data', d => { stdout += d.toString('utf8'); });
    child.stderr.on('data', d => { stderr += d.toString('utf8'); });
    child.on('error', e => {
      clearTimeout(timer);
      resolve({ ok: false, code: -1, stdout, stderr, error: e.message || String(e), cmd, args });
    });
    child.on('close', code => {
      clearTimeout(timer);
      resolve({ ok: code === 0, code, stdout, stderr, cmd, args });
    });
  });
}

async function pythonWorks(cmd, argsPrefix = []) {
  const r = await runProcess(cmd, [...argsPrefix, '-c', 'import sys; print(sys.version_info[0]);'], { timeoutMs: 8000 });
  return r.ok && String(r.stdout || '').trim().startsWith('3');
}

async function findSystemPython() {
  const candidates = process.platform === 'win32'
    ? [
        { cmd: 'py', argsPrefix: ['-3'] },
        { cmd: 'python', argsPrefix: [] },
        { cmd: 'python3', argsPrefix: [] },
      ]
    : [
        { cmd: 'python3', argsPrefix: [] },
        { cmd: 'python', argsPrefix: [] },
      ];
  for (const c of candidates) {
    if (await pythonWorks(c.cmd, c.argsPrefix)) return c;
  }
  return null;
}

async function tryInstallPythonWithWinget() {
  if (process.platform !== 'win32') return { ok: false, error: 'winget bootstrap is Windows-only.' };
  const wingetCheck = await runProcess('winget', ['--version'], { timeoutMs: 10000 });
  if (!wingetCheck.ok) return { ok: false, error: 'winget ist nicht verfügbar.' };
  console.log('[python-runtime] Python 3 not found. Trying winget bootstrap...');
  return runProcess('winget', [
    'install', '-e', '--id', 'Python.Python.3.12',
    '--silent', '--scope', 'user',
    '--accept-package-agreements', '--accept-source-agreements',
  ], { timeoutMs: 600000 });
}

async function validatePythonRuntime(pythonCmd, argsPrefix = []) {
  const code = 'import serial, yaml, eltakobus; print("ok")';
  const r = await runProcess(pythonCmd, [...argsPrefix, '-c', code], { timeoutMs: 15000 });
  return { ok: r.ok && String(r.stdout || '').includes('ok'), details: r };
}

async function ensurePythonRuntime() {
  if (pythonRuntimeState?.ok && pythonRuntimeState.pythonPath && exists(pythonRuntimeState.pythonPath)) return pythonRuntimeState;
  if (pythonRuntimeSetupPromise) return pythonRuntimeSetupPromise;

  pythonRuntimeSetupPromise = (async () => {
    const fs = require('fs');
    const runtimeDir = getPythonRuntimeDir();
    const venvPython = getVenvPythonPath();
    const requirements = getPythonRequirementsPath();
    const attempts = [];

    try { fs.mkdirSync(runtimeDir, { recursive: true }); } catch {}

    if (exists(venvPython)) {
      const valid = await validatePythonRuntime(venvPython, []);
      attempts.push({ step: 'validate-existing-venv', ok: valid.ok, stderr: (valid.details.stderr || '').slice(-4000) });
      if (valid.ok) {
        pythonRuntimeState = { ok: true, pythonPath: venvPython, argsPrefix: [], runtimeDir, requirements, attempts };
        return pythonRuntimeState;
      }
    }

    let systemPython = await findSystemPython();
    attempts.push({ step: 'find-system-python', ok: !!systemPython, python: systemPython });

    if (!systemPython && process.platform === 'win32') {
      const install = await tryInstallPythonWithWinget();
      attempts.push({ step: 'winget-python-install', ok: install.ok, code: install.code, stderr: (install.stderr || install.error || '').slice(-4000) });
      systemPython = await findSystemPython();
      attempts.push({ step: 'find-system-python-after-winget', ok: !!systemPython, python: systemPython });
    }

    if (!systemPython) {
      pythonRuntimeState = {
        ok: false,
        error: 'Python 3 konnte nicht automatisch gefunden oder installiert werden. Installiere Python 3 einmalig oder installiere über Microsoft Store/winget. Danach EEDTOY neu starten.',
        attempts,
      };
      return pythonRuntimeState;
    }

    if (!exists(venvPython)) {
      const create = await runProcess(systemPython.cmd, [...systemPython.argsPrefix, '-m', 'venv', runtimeDir], { timeoutMs: 120000 });
      attempts.push({ step: 'create-venv', ok: create.ok, code: create.code, stderr: (create.stderr || create.error || '').slice(-4000) });
      if (!create.ok) {
        pythonRuntimeState = { ok: false, error: 'Python-Umgebung konnte nicht erstellt werden: ' + ((create.stderr || create.error || '').slice(-1000)), attempts };
        return pythonRuntimeState;
      }
    }

    // Make pip robust in the private venv, then install EEDTOY Python requirements.
    const upgradePip = await runProcess(venvPython, ['-m', 'pip', 'install', '--upgrade', 'pip'], { timeoutMs: 180000 });
    attempts.push({ step: 'upgrade-pip', ok: upgradePip.ok, code: upgradePip.code, stderr: (upgradePip.stderr || upgradePip.error || '').slice(-4000) });

    const installReq = await runProcess(venvPython, ['-m', 'pip', 'install', '-r', requirements], { timeoutMs: 300000 });
    attempts.push({ step: 'install-requirements', ok: installReq.ok, code: installReq.code, stderr: (installReq.stderr || installReq.error || '').slice(-8000) });
    if (!installReq.ok) {
      pythonRuntimeState = { ok: false, error: 'Python-Pakete konnten nicht automatisch installiert werden: ' + ((installReq.stderr || installReq.error || '').slice(-1200)), attempts };
      return pythonRuntimeState;
    }

    const valid = await validatePythonRuntime(venvPython, []);
    attempts.push({ step: 'validate-new-venv', ok: valid.ok, stderr: (valid.details.stderr || '').slice(-4000) });
    if (!valid.ok) {
      pythonRuntimeState = { ok: false, error: 'Python-Umgebung wurde erstellt, aber die benötigten Module konnten nicht geladen werden: ' + ((valid.details.stderr || valid.details.stdout || '').slice(-1200)), attempts };
      return pythonRuntimeState;
    }

    pythonRuntimeState = { ok: true, pythonPath: venvPython, argsPrefix: [], runtimeDir, requirements, attempts };
    return pythonRuntimeState;
  })();

  const result = await pythonRuntimeSetupPromise;
  pythonRuntimeSetupPromise = null;
  return result;
}

async function getPythonCommands(script) {
  const setup = await ensurePythonRuntime();
  if (setup.ok) return { ok: true, commands: [{ cmd: setup.pythonPath, args: [script] }], setup };

  // Fall back to global commands. This preserves existing installations where
  // an administrator already installed the packages globally.
  const fallback = process.platform === 'win32'
    ? [
        { cmd: 'py', args: ['-3', script] },
        { cmd: 'python', args: [script] },
        { cmd: 'python3', args: [script] },
      ]
    : [
        { cmd: 'python3', args: [script] },
        { cmd: 'python', args: [script] },
      ];
  return { ok: false, commands: fallback, setup };
}

// ─────────────────────────────────────────────────────────────────
// PYTHON BRIDGE: preferred detector for Eltako/FAM14 and FAM-USB
// ─────────────────────────────────────────────────────────────────
function getPythonDetectorScriptPath() {
  const fs = require('fs');
  const candidates = app.isPackaged
    ? [
        // In packaged Electron builds Python cannot execute scripts inside app.asar.
        // The python folder is therefore shipped as extraResources under resources/python.
        path.join(process.resourcesPath || '', 'python', 'detect_gateway.py'),
        path.join(process.cwd(), 'python', 'detect_gateway.py'),
        path.join(__dirname, '..', 'python', 'detect_gateway.py'),
      ]
    : [
        path.join(__dirname, '..', 'python', 'detect_gateway.py'),
        path.join(process.cwd(), 'python', 'detect_gateway.py'),
      ];
  return candidates.find(p => p && fs.existsSync(p)) || candidates[0];
}

function getPythonScriptCwd(scriptPath) {
  try { return path.dirname(scriptPath); } catch { return process.cwd(); }
}

async function runPythonDetector(preferredPath = '', mode = 'auto') {
  const { spawn } = require('child_process');
  const script = getPythonDetectorScriptPath();
  const commandInfo = await getPythonCommands(script);
  return new Promise((resolve) => {
    const attempts = commandInfo.setup?.attempts ? [...commandInfo.setup.attempts] : [];
    const commands = commandInfo.commands;

    const runOne = (index) => {
      if (index >= commands.length) {
        return resolve({
          ok: false,
          error: commandInfo.setup?.error || 'Python-Detector konnte nicht gestartet werden. Die private Python-Laufzeit konnte nicht vorbereitet werden.',
          attempts,
          ports: [],
          bridge: 'python',
        });
      }

      const c = commands[index];
      const args = [...c.args, '--preferred', preferredPath || '', '--mode', mode || 'auto'];
      console.log('[python-detect] START', c.cmd, args.join(' '));

      let stdout = '';
      let stderr = '';
      let started = false;
      let child;
      try {
        child = spawn(c.cmd, args, {
          cwd: getPythonScriptCwd(script),
          windowsHide: true,
          env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
        });
        started = true;
      } catch (e) {
        attempts.push({ cmd: c.cmd, error: e.message || String(e) });
        return runOne(index + 1);
      }

      const timer = setTimeout(() => {
        try { child.kill(); } catch {}
      }, 18000);

      child.stdout.on('data', d => { stdout += d.toString('utf8'); });
      child.stderr.on('data', d => {
        const text = d.toString('utf8');
        stderr += text;
        for (const line of text.split(/\r?\n/).filter(Boolean)) console.log(line);
      });
      child.on('error', e => {
        clearTimeout(timer);
        attempts.push({ cmd: c.cmd, error: e.message || String(e), started });
        runOne(index + 1);
      });
      child.on('close', code => {
        clearTimeout(timer);
        attempts.push({ cmd: c.cmd, code, stderr: stderr.slice(-4000) });

        const jsonLine = stdout.trim().split(/\r?\n/).filter(Boolean).pop();
        if (jsonLine) {
          try {
            const result = JSON.parse(jsonLine);
            result.bridge = 'python';
            result.pythonCommand = c.cmd;
            result.pythonStderr = stderr.slice(-8000);
            console.log('[python-detect] RESULT', JSON.stringify({ ok: result.ok, gateway: result.gateway, error: result.error }));
            return resolve(result);
          } catch (e) {
            attempts[attempts.length - 1].parseError = e.message;
            attempts[attempts.length - 1].stdout = stdout.slice(-4000);
          }
        }

        // If the command existed but the script failed because dependencies are
        // missing, trying the next Python executable usually will not help much,
        // but it is harmless and catches different PATH setups.
        runOne(index + 1);
      });
    };

    runOne(0);
  });
}


function getPythonLearnScriptPath() {
  const fs = require('fs');
  const candidates = app.isPackaged
    ? [
        path.join(process.resourcesPath || '', 'python', 'learn_device_id.py'),
        path.join(process.cwd(), 'python', 'learn_device_id.py'),
        path.join(__dirname, '..', 'python', 'learn_device_id.py'),
      ]
    : [
        path.join(__dirname, '..', 'python', 'learn_device_id.py'),
        path.join(process.cwd(), 'python', 'learn_device_id.py'),
      ];
  return candidates.find(p => p && fs.existsSync(p)) || candidates[0];
}

async function runPythonLearnDeviceId(portPath = '', gatewayType = 'auto', timeoutMs = 20000) {
  const { spawn } = require('child_process');
  const script = getPythonLearnScriptPath();
  const commandInfo = await getPythonCommands(script);
  return new Promise((resolve) => {
    const attempts = commandInfo.setup?.attempts ? [...commandInfo.setup.attempts] : [];
    const mode = String(gatewayType || 'auto').toLowerCase();
    const timeoutSec = Math.max(5, Math.round((Number(timeoutMs) || 20000) / 1000));
    const commands = commandInfo.commands;

    const runOne = (index) => {
      if (index >= commands.length) {
        return resolve({
          ok: false,
          error: commandInfo.setup?.error || 'Python-Lerntelegramm-Listener konnte nicht gestartet werden. Die private Python-Laufzeit konnte nicht vorbereitet werden.',
          attempts,
          bridge: 'python',
        });
      }

      const c = commands[index];
      const args = [...c.args, '--port', String(portPath || '').trim(), '--mode', mode, '--timeout', String(timeoutSec)];
      console.log('[python-learn] START', c.cmd, args.join(' '));

      let stdout = '';
      let stderr = '';
      let child;
      try {
        child = spawn(c.cmd, args, {
          cwd: getPythonScriptCwd(script),
          windowsHide: true,
          env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
        });
      } catch (e) {
        attempts.push({ cmd: c.cmd, error: e.message || String(e) });
        return runOne(index + 1);
      }

      const timer = setTimeout(() => {
        try { child.kill(); } catch {}
      }, (timeoutSec + 8) * 1000);

      child.stdout.on('data', d => { stdout += d.toString('utf8'); });
      child.stderr.on('data', d => {
        const text = d.toString('utf8');
        stderr += text;
        for (const line of text.split(/\r?\n/).filter(Boolean)) console.log(line);
      });
      child.on('error', e => {
        clearTimeout(timer);
        attempts.push({ cmd: c.cmd, error: e.message || String(e) });
        runOne(index + 1);
      });
      child.on('close', code => {
        clearTimeout(timer);
        attempts.push({ cmd: c.cmd, code, stderr: stderr.slice(-4000) });
        const jsonLine = stdout.trim().split(/\r?\n/).filter(Boolean).pop();
        if (jsonLine) {
          try {
            const result = JSON.parse(jsonLine);
            result.bridge = 'python';
            result.pythonCommand = c.cmd;
            result.pythonStderr = stderr.slice(-8000);
            console.log('[python-learn] RESULT', JSON.stringify({ ok: result.ok, id: result.id, error: result.error }));
            return resolve(result);
          } catch (e) {
            attempts[attempts.length - 1].parseError = e.message;
            attempts[attempts.length - 1].stdout = stdout.slice(-4000);
          }
        }
        runOne(index + 1);
      });
    };

    runOne(0);
  });
}


function getPythonWriteSendersScriptPath() {
  const fs = require('fs');
  const candidates = app.isPackaged
    ? [
        path.join(process.resourcesPath || '', 'python', 'write_senders.py'),
        path.join(process.cwd(), 'python', 'write_senders.py'),
        path.join(__dirname, '..', 'python', 'write_senders.py'),
      ]
    : [
        path.join(__dirname, '..', 'python', 'write_senders.py'),
        path.join(process.cwd(), 'python', 'write_senders.py'),
      ];
  return candidates.find(p => p && fs.existsSync(p)) || candidates[0];
}

async function runPythonWriteSenders({ portPath = '', gatewayType = 'fam14', baudRate = 57600, entries = [] } = {}) {
  const { spawn } = require('child_process');
  const fs = require('fs');
  const os = require('os');
  const script = getPythonWriteSendersScriptPath();
  const commandInfo = await getPythonCommands(script);
  return new Promise((resolve) => {
    const attempts = commandInfo.setup?.attempts ? [...commandInfo.setup.attempts] : [];

    if (!portPath || !String(portPath).trim()) {
      return resolve({ ok: false, error: 'Kein Bus-COM-Port eingetragen. Bitte FAM14/FGW14-USB COM-Port wählen oder manuell eintragen.' });
    }
    if (!Array.isArray(entries) || entries.length === 0) {
      return resolve({ ok: false, error: 'Keine programmierbaren Series-14-Sender-IDs vorhanden. Importiere zuerst PCT14-Geräte und generiere die Sender-IDs.' });
    }

    let senderMapPath = '';
    try {
      senderMapPath = path.join(os.tmpdir(), `eedtoy-sender-map-${Date.now()}-${Math.random().toString(16).slice(2)}.json`);
      fs.writeFileSync(senderMapPath, JSON.stringify({ entries }, null, 2), 'utf8');
    } catch (e) {
      return resolve({ ok: false, error: 'Sender-ID-Liste konnte nicht vorbereitet werden: ' + (e.message || e) });
    }

    const commands = commandInfo.commands;

    const cleanup = () => {
      try { if (senderMapPath) fs.unlinkSync(senderMapPath); } catch {}
    };

    const runOne = (index) => {
      if (index >= commands.length) {
        cleanup();
        return resolve({
          ok: false,
          error: commandInfo.setup?.error || 'Python-Sender-Schreiber konnte nicht gestartet werden. Die private Python-Laufzeit konnte nicht vorbereitet werden.',
          attempts,
          bridge: 'python',
        });
      }

      const c = commands[index];
      const args = [
        ...c.args,
        '--port', String(portPath || '').trim(),
        '--gateway-type', String(gatewayType || 'fam14'),
        '--baud', String(baudRate || 57600),
        '--sender-map', senderMapPath,
      ];
      console.log('[python-write-senders] START', c.cmd, args.join(' '));

      let stdout = '';
      let stderr = '';
      let child;
      try {
        child = spawn(c.cmd, args, {
          cwd: getPythonScriptCwd(script),
          windowsHide: true,
          env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
        });
      } catch (e) {
        attempts.push({ cmd: c.cmd, error: e.message || String(e) });
        return runOne(index + 1);
      }

      const timer = setTimeout(() => {
        try { child.kill(); } catch {}
      }, 180000);

      child.stdout.on('data', d => { stdout += d.toString('utf8'); });
      child.stderr.on('data', d => {
        const text = d.toString('utf8');
        stderr += text;
        for (const line of text.split(/\r?\n/).filter(Boolean)) console.log(line);
      });
      child.on('error', e => {
        clearTimeout(timer);
        attempts.push({ cmd: c.cmd, error: e.message || String(e) });
        runOne(index + 1);
      });
      child.on('close', code => {
        clearTimeout(timer);
        attempts.push({ cmd: c.cmd, code, stderr: stderr.slice(-4000) });
        const jsonLine = stdout.trim().split(/\r?\n/).filter(Boolean).pop();
        if (jsonLine) {
          try {
            const result = JSON.parse(jsonLine);
            result.bridge = 'python';
            result.pythonCommand = c.cmd;
            result.pythonStderr = stderr.slice(-12000);
            cleanup();
            console.log('[python-write-senders] RESULT', JSON.stringify({ ok: result.ok, counts: result.counts, error: result.error }));
            return resolve(result);
          } catch (e) {
            attempts[attempts.length - 1].parseError = e.message;
            attempts[attempts.length - 1].stdout = stdout.slice(-4000);
          }
        }
        runOne(index + 1);
      });
    };

    runOne(0);
  });
}


// ─────────────────────────────────────────────────────────────────
// DEVICE-ID LEARN TELEGRAM LISTENER
// ─────────────────────────────────────────────────────────────────
function parseLearnIdEsp3(buf) {
  for (let i = 0; i < buf.length - 7; i++) {
    if (buf[i] !== 0x55) continue;
    if (buf.length < i + 6) continue;
    const dataLen = (buf[i + 1] << 8) | buf[i + 2];
    const optLen = buf[i + 3];
    const type = buf[i + 4];
    if (crc8(buf.slice(i + 1, i + 5)) !== buf[i + 5]) continue;
    const totalLen = 6 + dataLen + optLen + 1;
    if (buf.length < i + totalLen) continue;
    const dataStart = i + 6;
    const crcIndex = i + totalLen - 1;
    if (crc8(buf.slice(dataStart, dataStart + dataLen + optLen)) !== buf[crcIndex]) continue;

    // RADIO_ERP1: RORG + user data + SenderID(4) + STATUS.
    if (type === 0x01 && dataLen >= 6) {
      const rorg = buf[dataStart];
      if ([0xF6, 0xD5, 0xA5, 0xD2].includes(rorg)) {
        const sender = buf.slice(dataStart + dataLen - 5, dataStart + dataLen - 1);
        if (!allZero(sender)) return { id: fmtId(sender), rorg: rorg.toString(16).toUpperCase().padStart(2, '0'), protocol: 'esp3' };
      }
    }
  }
  return null;
}

function parseLearnIdEsp2(buf) {
  for (let i = 0; i <= buf.length - 14; i++) {
    if (!isValidFixedEsp2Frame(buf, i)) continue;
    const body = buf.slice(i + 2, i + 13);

    // Common ESP2 radio frame layout: H_SEQ/LEN, RORG, DATA3..DATA0, ID3..ID0, STATUS.
    const rorg = body[1];
    if ([0xF6, 0xD5, 0xA5, 0xD2].includes(rorg)) {
      const sender = body.slice(6, 10);
      if (!allZero(sender)) return { id: fmtId(sender), rorg: rorg.toString(16).toUpperCase().padStart(2, '0'), protocol: 'esp2' };
    }

    // Some translated/extended frames put the RORG at body[0]. Keep this as a safe fallback.
    const rorg0 = body[0];
    if ([0xF6, 0xD5, 0xA5, 0xD2].includes(rorg0)) {
      const sender = body.slice(5, 9);
      if (!allZero(sender)) return { id: fmtId(sender), rorg: rorg0.toString(16).toUpperCase().padStart(2, '0'), protocol: 'esp2-alt' };
    }
  }
  return null;
}

function parseLearnIdFromBuffer(buf) {
  return parseLearnIdEsp3(buf) || parseLearnIdEsp2(buf);
}

function gatewaySerialParamsForLearning(gatewayType) {
  const type = String(gatewayType || '').toLowerCase();
  if (type === 'fam-usb') return { baudRate: 9600, protocol: 'esp2' };
  if (type === 'fam14' || type === 'fgw14usb') return { baudRate: 57600, protocol: 'esp2' };
  return { baudRate: 57600, protocol: 'esp3' };
}

function listenForLearnTelegram(portPath, gatewayType, timeoutMs = 15000) {
  return new Promise((resolve) => {
    if (!portPath || !String(portPath).trim()) {
      return resolve({ ok: false, error: 'Kein serieller Port eingetragen. Bitte im Gateway-Schritt COM-Port auswählen oder manuell eintragen.' });
    }

    let port;
    const params = gatewaySerialParamsForLearning(gatewayType);
    try {
      const { SerialPort } = require('serialport');
      port = new SerialPort({ path: String(portPath).trim(), baudRate: params.baudRate, autoOpen: false });
    } catch (e) {
      return resolve({ ok: false, error: 'SerialPort Fehler: ' + e.message });
    }

    let buffer = Buffer.alloc(0);
    let resolved = false;
    const started = Date.now();

    const finish = (result) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      const done = () => resolve({ ...result, baudRate: params.baudRate, gatewayType, elapsedMs: Date.now() - started });
      try {
        if (port?.isOpen) port.close(() => done());
        else done();
      } catch (_) { done(); }
    };

    const timer = setTimeout(() => {
      finish({ ok: false, error: `Kein Lerntelegramm innerhalb von ${Math.round(timeoutMs / 1000)} Sekunden empfangen.` });
    }, Math.max(3000, Number(timeoutMs) || 15000));

    port.on('data', chunk => {
      buffer = Buffer.concat([buffer, chunk]);
      if (buffer.length > 4096) buffer = buffer.slice(-2048);
      const rx = chunk.toString('hex').match(/.{1,2}/g)?.join(' ') || '';
      console.log('[learn-device-id] RX', portPath, params.baudRate, params.protocol, rx);
      const parsed = parseLearnIdFromBuffer(buffer);
      if (parsed?.id) {
        console.log('[learn-device-id] FOUND', parsed.id, 'rorg', parsed.rorg, 'protocol', parsed.protocol);
        finish({ ok: true, id: parsed.id, rorg: parsed.rorg, protocol: parsed.protocol });
      }
    });

    port.on('error', err => finish({ ok: false, error: 'Serieller Fehler: ' + (err.message || err) }));
    port.open(err => {
      if (err) return finish({ ok: false, error: `Port ${portPath} konnte nicht geöffnet werden: ${err.message || err}` });
      console.log('[learn-device-id] LISTEN', portPath, params.baudRate, params.protocol, `${timeoutMs}ms`);
    });
  });
}

// ─────────────────────────────────────────────────────────────────
// IPC HANDLERS
// ─────────────────────────────────────────────────────────────────

ipcMain.handle('learn-device-id', async (_, portPath, gatewayType, timeoutMs) => {
  try {
    // Prefer the Python/eltakobus listener for Eltako gateways. FAM14/FGW14
    // need echo handling and ESP2 bus parsing; raw SerialPort reads in JS often
    // miss or misparse button/LRN telegrams.
    const py = await runPythonLearnDeviceId(portPath, gatewayType, timeoutMs || 20000);
    if (py.ok && py.id) return py;

    console.log('[learn-device-id] Python listener failed, falling back to JS raw listener:', py.error);
    const js = await listenForLearnTelegram(portPath, gatewayType, timeoutMs || 20000);
    if (!js.ok && py.error) {
      js.error = `${js.error || 'Keine ID erkannt.'} Python: ${py.error}`;
      js.pythonStderr = py.pythonStderr;
    }
    js.bridge = js.bridge || 'javascript-fallback';
    return js;
  } catch (e) {
    console.error('[learn-device-id]', e);
    return { ok: false, error: 'ID-Auto-Detect fehlgeschlagen: ' + (e.message || e) };
  }
});

ipcMain.handle('read-base-id', async (_, portPath, baudRate, protocol) => {
  const proto = protocol || 'esp2';

  if (proto === 'fam14-python' || proto === 'eltakobus-fam14' || proto === 'fam-usb-python' || proto === 'eltakobus-fam-usb' || proto === 'fgw14-python') {
    const isFamUsb = proto === 'fam-usb-python' || proto === 'eltakobus-fam-usb';
    const isFgw14 = proto === 'fgw14-python';
    const detectorMode = isFgw14 ? 'fgw14' : (isFamUsb ? 'fam-usb' : 'fam14');
    const expectedType = isFgw14 ? 'fgw14usb' : (isFamUsb ? 'fam-usb' : 'fam14');
    const py = await runPythonDetector(portPath || '', detectorMode);

    if (py.ok && py.gateway) {
      const detectedType = py.gateway.type || expectedType;
      rememberBusConnection(py.gateway.serial_path || portPath, detectedType, py.gateway.baudRate || 57600);

      if (py.gateway.base_id) {
        return {
          ok: true,
          baseId: py.gateway.base_id,
          gatewayType: detectedType,
          protocol: py.gateway.protocol,
          parser: py.gateway.parser,
          baudRate: py.gateway.baudRate,
          portPath: py.gateway.serial_path,
          bridge: 'python',
        };
      }

      if (detectedType === 'fgw14usb') {
        return {
          ok: true,
          baseId: '',
          gatewayType: 'fgw14usb',
          detectedWithoutBaseId: true,
          protocol: py.gateway.protocol,
          parser: py.gateway.parser,
          baudRate: py.gateway.baudRate,
          portPath: py.gateway.serial_path,
          bridge: 'python',
        };
      }
    }

    return {
      ok: false,
      error: py.error || (isFgw14
        ? 'FGW14-USB konnte auf dem angegebenen Port nicht erkannt werden.'
        : (isFamUsb ? 'FAM-USB-Erkennung lieferte keine Base-ID.' : 'FAM14-Erkennung lieferte keine Base-ID.')),
      attempts: py.attempts || [],
      bridge: 'python',
    };
  }

  const result = await readBaseIdFromPort(portPath, baudRate || 57600, proto, { timeoutMs: 1800, retries: 3 });
  if (result.ok) return result;
  return {
    ok: false,
    error: `${result.error}
Port: ${portPath}
Baudrate: ${baudRate || 57600}
Protokoll: ${proto}`,
    txFrames: result.txFrames || [],
    rxFrames: result.rxFrames || [],
  };
});

ipcMain.handle('detect-gateway', async (_, preferredPath) => {
  try {
    // Preferred path: Python detector with Philipp-Grimm/eltakobus-style FAM14/FAM-USB logic.
    const py = await runPythonDetector(preferredPath || '', 'auto');
    if (py.ok) {
      if (py.gateway) rememberBusConnection(py.gateway.serial_path, py.gateway.type, py.gateway.baudRate || 57600);
      return py;
    }

    // Keep the old JavaScript raw-byte detector as a fallback for systems where
    // Python or eltakobus are not installed yet.
    console.log('[detect-gateway] Python bridge failed, falling back to JS detector:', py.error);
    const js = await detectGatewayOnSerialPorts(preferredPath);
    if (js.ok) {
      js.bridge = 'javascript-fallback';
      js.pythonError = py.error;
      js.pythonAttempts = py.attempts || [];
      return js;
    }
    js.bridge = 'javascript-fallback';
    js.pythonError = py.error;
    return js;
  } catch (e) {
    console.error('[detect-gateway]', e);
    return { ok: false, error: 'Gateway-Erkennung fehlgeschlagen: ' + e.message, ports: [], attempts: [] };
  }
});



ipcMain.handle('disconnect-gateway', async (_, payload) => {
  try {
    const info = payload || {};
    const portPath = info.portPath || info.serial_path || lastBusDisconnectInfo?.portPath || '';
    const gatewayType = info.gatewayType || info.type || lastBusDisconnectInfo?.gatewayType || 'fam14';
    const baudRate = info.baudRate || lastBusDisconnectInfo?.baudRate || 57600;
    const result = await sendBusDisconnect(portPath, gatewayType, baudRate);
    if (result.ok) lastBusDisconnectInfo = null;
    return result;
  } catch (e) {
    console.error('[disconnect-gateway]', e);
    return { ok: false, error: 'Disconnect fehlgeschlagen: ' + (e.message || e) };
  }
});

ipcMain.handle('write-sender-ids-to-devices', async (_, payload) => {
  try {
    return await runPythonWriteSenders(payload || {});
  } catch (e) {
    console.error('[write-sender-ids-to-devices]', e);
    return { ok: false, error: 'Sender-ID Schreiben fehlgeschlagen: ' + (e.message || e) };
  }
});


app.whenReady().then(createWindow);
app.on('before-quit', () => {
  if (lastBusDisconnectInfo) {
    // Best-effort: explicit UI disconnect is preferred, but this sends an RS485
    // bus unlock when the user closes the app after using FAM14/FGW14-USB.
    sendBusDisconnect(lastBusDisconnectInfo.portPath, lastBusDisconnectInfo.gatewayType, lastBusDisconnectInfo.baudRate, { timeoutMs: 1200, closeDelayMs: 50 }).catch(() => {});
  }
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
