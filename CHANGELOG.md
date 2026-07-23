# Changelog

## 1.0.81

- Gateway-Auswahl auf Eltako FAM-USB, FAM14, FGW14-USB und EnOcean USB300 reduziert.
- Weitere nicht praktisch getestete Gateway-Typen aus der Oberfläche entfernt.
- USB300 nutzt fuer Base-ID und Lerntelegramme Python EnOcean und `esp2_gateway_adapter`.
- USB300 wird als experimentell sowie als ESP3-Hardware mit ESP2-Funktionsumfang gekennzeichnet.

## 1.0.80

- Publisher-, CompanyName- und Copyright-Metadaten auf Denis Zirnbauer gesetzt.
- App-ID auf `io.github.deniszeltako.eedtoy` geändert.
- Hinweis ergänzt: privat entwickelt und kein offizielles Produkt der ELTAKO GmbH.
- `publisherName` aus `build.win` entfernt, da electron-builder 26.15.3 diese Eigenschaft dort nicht mehr akzeptiert und der Installer nicht signiert wird.
- GitHub-Repository-Struktur, Windows-Build-Workflow und Release-Erstellung ergänzt.
- Lizenzierung auf GPL-3.0-or-later und Drittanbieter-Hinweise ergänzt.
- Windows-Python-Startskript konsequent auf UTF-8-Ausgabe gestellt.


## 1.0.80 – GitHub- und Metadaten-Bereinigung

- Publisher und Windows-`CompanyName` auf `Denis Zirnbauer` geändert.
- Copyright auf `Denis Zirnbauer` geändert.
- App-ID auf `io.github.deniszeltako.eedtoy` geändert.
- Klarer Hinweis ergänzt: privat entwickelt und kein offizielles Produkt der ELTAKO GmbH.
- Programmtitel, ELTAKO-Gerätekompatibilität und bestehendes Icon unverändert beibehalten.
- GitHub-fertige Repository-Struktur ergänzt:
  - Windows-Build- und Release-Workflow
  - `.gitignore` und `.gitattributes`
  - Issue- und Pull-Request-Vorlagen
  - Sicherheits-, Beitrags-, Lizenz- und Markenhintergrund
- README für Installation, Entwicklung und Releases neu strukturiert.

## 1.0.79

- FBH55ESB/FB55EB und FBHT55ESB im A5-08-01-FBH-Modus getrennt auswählbar.
- FBHT55ESB exportiert die Temperaturauswertung explizit.
- `FSS12` durch `FSS12-12V DC` als A5-12-01-Zählergerät ersetzt.
- UTF-8-Ausgabe der Windows-Python-Installation verbessert.
