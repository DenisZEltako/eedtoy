# Drittanbieter-Komponenten

EEDTOY verwendet Open-Source-Komponenten. Die jeweils maßgeblichen Lizenztexte und Versionsangaben ergeben sich aus den installierten Paketen, `package-lock.json` und `python/requirements.txt`.

## JavaScript / Electron

Zu den direkten Abhängigkeiten gehören insbesondere:

- React und React DOM
- Electron
- Vite
- electron-builder
- serialport
- rcedit
- concurrently und wait-on

Transitive Abhängigkeiten werden vollständig in `package-lock.json` dokumentiert.

## Python / EnOcean

Die Gateway- und EnOcean-Funktionen verwenden beziehungsweise berücksichtigen insbesondere:

- `eltako14bus`
- `pyserial`
- `PyYAML`
- optional vorhandene eo-man-Komponenten beziehungsweise deren bekannte Installationspfade

Diese Projekte werden nicht als Bestandteil von EEDTOY ausgegeben. Ihre Namen werden ausschließlich zur Beschreibung technischer Abhängigkeiten und Kompatibilität verwendet.

Beim Erstellen und Verteilen eines Installers müssen die Lizenzbedingungen aller tatsächlich gebündelten oder zur Laufzeit installierten Abhängigkeiten eingehalten werden.
