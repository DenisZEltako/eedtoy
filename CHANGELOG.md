# Changelog

## 1.0.93

- FTR65DSB, FTR55DSB, FTR55EHB, FTR55ESB, FTR65HB, FTRF65HB, FTR55HB, FTR65SB, FTRF65SB und FTR55SB ergänzt.
- Für die FTR55/65-Familie sind die Betriebsarten TF61 (A5-38-08, Lerntelegramm `E0-40-0D-80`, EIN/AUS mit 1 K Hysterese) und FHK (A5-10-06, Lerntelegramm `40-30-0D-87`) auswählbar.
- FHK-Profile exportieren den Sollwertbereich 12–28 °C sowie 8 °C als Frostschutzwert.
- FDG14 als DALI-Gateway/Dimmaktor mit A5-38-08 FUNC=38, Command 2 ergänzt.
- Der PCT14-Import erkennt FDG14 automatisch als dimmbaren A5-38-08-Aktor.
- Deutsche und englische Gerätebezeichnungen sowie Regressionstests erweitert.

## 1.0.92

- Deutsche und englische Oberflächentexte vollständig sprachlich und technisch überarbeitet.
- Gemischte deutsche/englische Beschriftungen wie `Disconnect / Bus freigeben`, `Wireless` und der englische Fußzeilentext in der deutschen Oberfläche entfernt.
- Alle 61 freigegebenen Geräteprofile besitzen jetzt eine feste, vollständige englische Gerätebezeichnung. Die fehleranfällige Übersetzung aus einzelnen Wortfragmenten dient nur noch als Rückfall für zukünftige unbekannte Bezeichnungen.
- Technische Begriffe für Klima, RGBW, Zähler, Relais, Rollladen/Jalousie und Series-14-Sender-IDs präzisiert.
- Gateway-Beschreibungen, Projektdatei-Dialoge, Dateifilter, Kontextmenü und Info-Dialog werden vollständig in der gewählten Sprache angezeigt.
- Beim Sprachwechsel wird eine bereits erzeugte YAML-Vorschau automatisch in der gewählten Sprache neu erzeugt.
- Beim Öffnen eines Projekts wird die YAML-Vorschau mit der aktuellen EEDTOY-Version und der aktuell gewählten Sprache neu erzeugt; veraltete Kommentartexte aus älteren Projektdateien bleiben nicht erhalten.
- Zusätzliche Regressionstests für Übersetzungsschlüssel, Platzhalter, alle 61 Gerätebezeichnungen, YAML-Erzeugung, FKS-SV-Sender-ID-Kollisionen und die Electron-IPC-Schnittstelle ergänzt.
- Gerätedatenbank, EEP-Zuordnungen, Gateway-Protokolle und YAML-Maschinenschlüssel bleiben unverändert.

## 1.0.91

- Englische Oberfläche vollständig auf feste React-Übersetzungsschlüssel umgestellt.
- Gateway-, Geräte- und YAML-Seite einschließlich Formulare, Hinweise, Statusmeldungen und Schaltflächen vollständig zweisprachig.
- Gerätegruppen und alle 61 freigegebenen Gerätebezeichnungen werden in der englischen Oberfläche übersetzt; Produktnamen und EEPs bleiben unverändert.
- Dynamische Texte wie Geräteanzahl und `✓ Kopiert` bleiben unter React-Kontrolle und werden nicht mehr nachträglich im DOM überschrieben.
- Deutsch/English bleibt über das Menü umschaltbar und wird gespeichert.
- Neue Projektdateien erhalten je nach Sprache den Namen `EEDTOY-Projekt-…` oder `EEDTOY-Project-…`.
- PCT14-importierte Geräte werden unabhängig von der beim Import aktiven Sprache weiterhin korrekt als PCT14-Geräte erkannt.
- Keine Änderung an Gerätedatenbank, EEP-Zuordnung, Gateway-Protokollen oder YAML-Maschinenschlüsseln.

## 1.0.90

- FUTH55ED in fünf Betriebsarten ergänzt: FHK, FKS Kieback & Peter, FKS-H Hora, TF61R/FR62 und Hygrostat.
- Produktbezeichnung `FFT60SB` für A5-04-01 festgelegt.
- Aktorbezeichnungen `FSR14-2x` und `FSR14-4x` verwenden einen Bindestrich.
- Nur `FSR71NP-4x-230V` ist als 4-Kanal-Variante der Baureihe 71 enthalten.
- FFTE ist im gemeinsamen Profil `FTKE, FFTE, FFG7B` unter F6-10-00 enthalten.
- FFG7B bleibt für A5-14-09 und F6-10-00 als dreistufiger Fenstergriff markiert.
- Der Regressionsfix für Geräteanzahl und `✓ Kopiert` bleibt unverändert enthalten.
