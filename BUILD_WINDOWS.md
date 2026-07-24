# EEDTOY v1.0.93 lokal unter Windows bauen

Diese Version ist für die lokale Prüfung vorgesehen und wurde nicht auf GitHub veröffentlicht.

## Voraussetzungen

- Windows 10 oder Windows 11
- Node.js 22 LTS
- PowerShell oder Eingabeaufforderung

## Installer bauen

Im entpackten Projektordner ausführen:

```powershell
npm ci
npm run build
npm run build:installer
```

Der Installer liegt danach unter:

```text
dist-exe\EEDTOY-Setup-1.0.93.exe
```

## Sprachprüfung

1. Installer einmal auf Deutsch und einmal auf Englisch starten.
2. Unter **Bearbeiten → Sprache** beziehungsweise **Edit → Language** zwischen Deutsch und Englisch wechseln.
3. In beiden Sprachen die Seiten Gateway, Geräte und YAML vollständig durchgehen.
4. Prüfen, dass Überschriften, Formulare, Schaltflächen, Hinweise, Statusmeldungen, Gerätegruppen und Gerätebeschreibungen zur gewählten Sprache passen.
5. Produktnamen, EEPs, IDs, YAML-Schlüssel und Dateinamen dürfen nicht übersetzt werden.
6. In der englischen Oberfläche ein PCT14-Projekt importieren und anschließend YAML generieren.
7. Sprache zurück auf Deutsch stellen und prüfen, dass das importierte Projekt weiterhin korrekt erkannt und exportiert wird.

## Regressionsprüfung

1. Geräte laden oder importieren: Die Geräteanzahl muss sofort korrekt angezeigt werden.
2. Auf **Kopieren / Copy** klicken: Für etwa zwei Sekunden muss **✓ Kopiert / ✓ Copied** erscheinen.
3. Projekt speichern, schließen und erneut öffnen.
4. FFG7B mit A5-14-09 prüfen: geschlossen, gekippt und offen müssen unverändert exportiert werden.
5. Geräteliste prüfen: Es müssen genau 64 freigegebene Profile vorhanden sein.

## Automatischer Test

```powershell
npm test
```

Die Tests prüfen unter anderem die Übersetzungsschlüssel und Platzhalter, alle Gerätebezeichnungen, die dynamischen Texte, die YAML-Erzeugung, die FKS-SV-Sender-ID-Vergabe, die Electron-IPC-Schnittstelle und den unveränderten Hash der freigegebenen Gerätedatenbank.
