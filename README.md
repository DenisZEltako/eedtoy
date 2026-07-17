# EEDTOY – ELTAKO EnOcean Device to YAML Generator

EEDTOY ist ein Desktop-Konfigurator für EnOcean-Geräte, ELTAKO-Gateways, PCT14-Import und den YAML-Export für Home Assistant.

> **Hinweis:** EEDTOY wird ausschließlich privat entwickelt und ist kein offizielles Produkt der ELTAKO GmbH. ELTAKO-Produktnamen werden ausschließlich zur Beschreibung der Gerätekompatibilität verwendet.

## Funktionen

- FAM14-, FAM-USB- und FGW14-USB-Unterstützung
- automatische Gateway- und Base-ID-Erkennung
- PCT14/XML-Import
- automatische Geräte-ID-Erkennung über EnOcean-Telegramme
- verwaltete Sender-IDs und Kollisionsprüfung
- Home-Assistant-YAML-Export
- EEDTOY-Projekte speichern und später wieder öffnen
- Windows-Installer mit eigener Python-Laufzeitumgebung

## Installation unter Windows

1. Die aktuelle Datei `EEDTOY-Setup-<Version>.exe` aus den GitHub Releases herunterladen.
2. Installer starten und Zielverzeichnis auswählen.
3. Beim ersten Start richtet EEDTOY eine private Python-Umgebung im Benutzerprofil ein und installiert die benötigten Pakete.

Die Anwendung und der Installer sind derzeit nicht digital signiert. Windows kann deshalb eine SmartScreen-Warnung anzeigen.

## Manuelle Installation

### Voraussetzungen

- Node.js 20 oder neuer
- npm
- Python 3 für die Gateway-Funktionen
- Windows für den vollständigen NSIS-Installer-Build

### Projekt starten

```powershell
npm ci
npm run electron:dev
```

### Frontend bauen

```powershell
npm run build
```

### Windows-Installer bauen

```powershell
npm run build:installer
```

Der Installer wird unter `dist-exe/` erzeugt.

### Python-Abhängigkeiten lokal installieren

```powershell
py -3 -m pip install -r python/requirements.txt
```

## GitHub-Veröffentlichung

Das Repository ist ohne `node_modules`, lokale Build-Ausgaben und ausführbare Dateien vorbereitet. Es enthält einen GitHub-Actions-Workflow unter `.github/workflows/build-windows.yml`.

- Pushes und Pull Requests prüfen den Windows-Build.
- Ein Tag im Format `v1.0.80` baut den Installer und erstellt automatisch ein GitHub Release mit SHA-256-Prüfsumme.

Beispiel:

```powershell
git tag v1.0.80
git push origin v1.0.80
```

## Projektstruktur

```text
src/                 React-Oberfläche und Gerätedatenbank
electron/            Electron-Hauptprozess und sichere IPC-Bridge
python/              Gateway-Erkennung, Teach-in und Sender-ID-Werkzeuge
build/               Windows-Icons, NSIS- und afterPack-Konfiguration
public/               statische Anwendungsressourcen
.github/              Build-Workflow und Vorlagen für GitHub
```

## Datenschutz und Sicherheit

EEDTOY verarbeitet Konfigurationen lokal. Serielle Gerätezugriffe und Python-Unterprozesse werden auf dem Rechner des Benutzers ausgeführt. Projektdateien können Geräte-IDs, Gateway-Daten und lokale COM-Port-Angaben enthalten und sollten entsprechend geschützt werden.

Sicherheitsprobleme bitte über eine private GitHub Security Advisory melden. Details stehen in [SECURITY.md](SECURITY.md).

## Rechte und Marken

Copyright © 2026 Denis Zirnbauer. Der Quellcode steht unter der Lizenz **GPL-3.0-or-later**. Siehe [LICENSE](LICENSE), [NOTICE.md](NOTICE.md) und [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

ELTAKO ist eine Marke der ELTAKO GmbH. Dieses Projekt ist weder mit der ELTAKO GmbH verbunden noch von ihr herausgegeben oder bestätigt.

## Versionshinweise

Die Änderungen der aktuellen Version stehen in [CHANGELOG.md](CHANGELOG.md). Frühere interne Versionsnotizen wurden unter [docs/CHANGELOG_LEGACY.md](docs/CHANGELOG_LEGACY.md) archiviert.
