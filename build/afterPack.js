const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

function normalizeRcedit(mod) {
  if (typeof mod === 'function') return mod;
  if (mod && typeof mod.default === 'function') return mod.default;
  if (mod && typeof mod.rcedit === 'function') return mod.rcedit;
  if (mod && typeof mod.default?.rcedit === 'function') return mod.default.rcedit;
  return null;
}

function findRceditExe(projectDir) {
  const candidates = [
    path.join(projectDir, 'node_modules', 'rcedit', 'bin', 'rcedit-x64.exe'),
    path.join(projectDir, 'node_modules', 'rcedit', 'bin', 'rcedit-ia32.exe'),
    path.join(projectDir, 'node_modules', 'rcedit', 'bin', 'rcedit.exe'),
    path.join(projectDir, 'node_modules', '.bin', 'rcedit.cmd'),
    path.join(projectDir, 'node_modules', '.bin', 'rcedit')
  ];
  return candidates.find((p) => fs.existsSync(p));
}

function runRceditExe(rceditExe, exePath, iconPath, version) {
  const args = [
    exePath,
    '--set-icon', iconPath,
    '--set-file-version', version,
    '--set-product-version', version,
    '--set-version-string', 'CompanyName', 'D. Zirnbauer',
    '--set-version-string', 'FileDescription', 'EEDTOY - ELTAKO EnOcean Device to YAML Generator',
    '--set-version-string', 'ProductName', 'EEDTOY',
    '--set-version-string', 'InternalName', 'EEDTOY',
    '--set-version-string', 'OriginalFilename', 'EEDTOY.exe',
    '--set-version-string', 'LegalCopyright', 'Copyright (C) 2026 D. Zirnbauer'
  ];

  const result = spawnSync(rceditExe, args, { stdio: 'inherit', shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`rcedit.exe ist mit Code ${result.status} fehlgeschlagen.`);
  }
}

module.exports = async function afterPack(context) {
  if (context.electronPlatformName !== 'win32') return;

  const exePath = path.join(context.appOutDir, 'EEDTOY.exe');
  const iconPath = path.join(context.packager.projectDir, 'build', 'icon.ico');
  const version = context.packager.appInfo.version;

  if (!fs.existsSync(exePath)) {
    throw new Error(`EEDTOY.exe wurde nicht gefunden: ${exePath}`);
  }
  if (!fs.existsSync(iconPath)) {
    throw new Error(`Icon wurde nicht gefunden: ${iconPath}`);
  }

  try {
    const rceditModule = require('rcedit');
    const rcedit = normalizeRcedit(rceditModule);
    if (rcedit) {
      await rcedit(exePath, {
        icon: iconPath,
        'file-version': version,
        'product-version': version,
        'version-string': {
          CompanyName: 'D. Zirnbauer',
          FileDescription: 'EEDTOY - ELTAKO EnOcean Device to YAML Generator',
          ProductName: 'EEDTOY',
          InternalName: 'EEDTOY',
          OriginalFilename: 'EEDTOY.exe',
          LegalCopyright: 'Copyright (C) 2026 D. Zirnbauer'
        }
      });
      console.log(`[afterPack] Windows EXE Ressourcen gepatcht via rcedit API: ${exePath}`);
      return;
    }
  } catch (error) {
    console.warn(`[afterPack] rcedit API nicht nutzbar, versuche rcedit.exe: ${error.message}`);
  }

  const rceditExe = findRceditExe(context.packager.projectDir);
  if (!rceditExe) {
    throw new Error('rcedit.exe wurde nicht gefunden. Bitte npm install erneut ausfuehren.');
  }

  runRceditExe(rceditExe, exePath, iconPath, version);
  console.log(`[afterPack] Windows EXE Ressourcen gepatcht via rcedit.exe: ${exePath}`);
};
