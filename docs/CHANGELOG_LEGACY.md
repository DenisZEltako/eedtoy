## v1.0.79 – FBHT55ESB, FSS12-12V DC und UTF-8

- FBH55ESB/FB55EB und FBHT55ESB sind im A5-08-01-FBH-Modus getrennt auswählbar.
- FBHT55ESB exportiert `fbht_temperature: true`, damit die Integration zusätzlich DB1 als Temperatur 0..50 °C auswertet.
- Die falsche Bezeichnung/Funktion `FSS12` als Funksteckdose wurde entfernt. Korrekt ist `FSS12-12V DC` als A5-12-01-Zählergerät.
- Windows-Bootstrap und Python-Unterprozesse verwenden konsistent UTF-8; Umlaute in der Installationskonsole werden korrekt dargestellt.

# EEDTOY – ELTAKO EnOcean Device to YAML Generator

## Version 1.0.78

- FTFSB-Auswahl präzisiert: Beide Gerätevarianten zeigen jetzt direkt die Bytebelegung und das zugehörige Lerntelegramm.
- A5-04-02: Feuchte aus DB2, Temperatur aus DB1, Lerntelegramm `10-10-0D-87`.
- A5-04-03: Feuchte aus DB3, 10-Bit-Temperatur aus DB2/DB1, Lerntelegramm `10-18-0D-80`.
- Die Home-Assistant-Integration v0.1.143 erkennt die tatsächliche FTFSB-Variante zusätzlich am Datenlayout und korrigiert eine versehentlich falsch gewählte Variante beim Empfang.

## Version 1.0.77

- Projektverwaltung ergänzt: **Projekt speichern unter …** erzeugt eine `.eedtoy`-Projektdatei; **Projekt öffnen …** stellt den vollständigen Bearbeitungsstand wieder her.
- Gespeichert werden Gateway und Base-ID, zusätzliche Gateways, importierte und manuell angelegte Geräte, Räume, EEP-Auswahl, Sender-ID-Zuordnungen, aktueller Geräte-Editor, PCT14-Gateway-Optionen und der zuletzt erzeugte YAML-Text.
- Projektdateien verwenden ein versioniertes JSON-Schema und werden vor dem Öffnen validiert. Ungültige, beschädigte oder aus einer neueren inkompatiblen Schema-Version stammende Dateien werden abgewiesen.
- FTFSB als eigener Temperatur-/Feuchtesensor ergänzt: A5-04-02 (8-Bit Temperatur/Feuchte) und A5-04-03 (10-Bit Temperatur, 8-Bit Feuchte).
- Produktbezeichnungen in der Temperatur-/Feuchtesensor-Liste auf `FFTSB` und `FFT60SB` bereinigt.


## v1.0.76 – FBH55ESB / FBHT55ESB

- FBH-Modus A5-08-01 korrigiert: Spannung, Helligkeit und Bewegung; DB1 ist unbenutzt und wird nicht mehr als Temperatur beschrieben.
- TF-Modus A5-07-01 bleibt als separater Bewegungsmodus erhalten.
- Dieselbe physische Geräte-ID kann nicht mehr gleichzeitig mit A5-07-01 und A5-08-01 angelegt oder exportiert werden; der Benutzer muss den am Gerät eingestellten Betriebsmodus auswählen.
- Export für den FBH-Modus bleibt `platform: sensor`; die Integration erzeugt daraus Helligkeit, Spannung und den Bewegungs-Binary-Sensor.

# EEDTOY – ELTAKO EnOcean Device to YAML Generator

## Version 1.0.76

- FLGTF-Namensbildung korrigiert: Beide automatisch erzeugten YAML-Einträge tragen nur noch den gemeinsamen physischen Gerätenamen `FLGTF`.
- Der TVOC-Eintrag wird nicht mehr als `FLGTF TVOC` und der Temperatur-/Feuchteeintrag nicht mehr als `FLGTF Temperatur Feuchte` exportiert.
- Dadurch kann die Home-Assistant-Integration die Entitäten eindeutig als `TVOC`, `Temperatur` und `Luftfeuchtigkeit` unter einem Gerät `FLGTF` anlegen.

## Version 1.0.74

- FKS-SV-Sender-IDs werden beim Generieren pro Gateway kollisionsfrei vergeben. Bereits belegte physische IDs und Sender-IDs werden berücksichtigt; mehrere unabhängige FKS-SV erhalten unterschiedliche, dauerhafte Offsets.
- FKS-SV-Sender-Offsets werden für FAM-USB in die jeweilige Base-ID und für FAM14/FGW14-USB in `00-00-B0-xx` umgesetzt.
- Doppelte Geräte mit identischer EnOcean-ID und identischem EEP werden beim Hinzufügen verhindert und beim Export bereinigt; der zuletzt gepflegte Eintrag bleibt erhalten. Damit überschreibt ein alter generischer Fensterkontakt den FTKE nicht mehr.
- FTKE wird als `F6-10-00` mit `device_class: opening` exportiert.
- FBH55ESB/FBHT55ESB sind klar in zwei Betriebsarten getrennt: FBH-Modus `A5-08-01` und TF-Modus `A5-07-01`.
- Die manuelle Gerätedatenbank enthält ausschließlich die freigegebene ELTAKO-Geräteliste; der nicht freigegebene generische Eintrag `FUD61` wurde entfernt.
- FLGTF kann wahlweise als reines Temperatur-/Feuchtegerät (`A5-04-02`) oder automatisch als TVOC plus Temperatur/Feuchte (`A5-09-0C` + ID+1) exportiert werden.
- Produktbezeichnung `FRGBW71L` sowie die FB55EB-Zuordnung wurden korrigiert.
- Der FBH-Modus exportiert Spannung, Helligkeit, Temperatur und Bewegung aus einem Gerät.

## Version 1.0.73


- FLGTF in der manuellen Geräteliste bereinigt: Es gibt nur noch einen auswählbaren FLGTF-Eintrag.
- Der eine FLGTF-Eintrag erzeugt beim YAML-Export weiterhin automatisch TVOC (`A5-09-0C`) und Temperatur/Feuchte (`A5-04-02`, ID + 1).
- Portable-Build aus der normalen Build-Konfiguration entfernt. Der Installer bleibt der primäre Release-Weg, weil er die Python-Laufzeit vorbereitet. Eine portable Version soll erst wieder angeboten werden, wenn Python inklusive Paketen wirklich eingebettet ist.

- Geräteliste nochmals gegen die Excel-Datei `EEDTOY Geräteliste.xlsx` geprüft.
- Kategorie `Kontakte` auf `Kontakt` vereinheitlicht.
- Device-Class-Vorgaben in der manuellen Geräteliste geprüft.
- YAML-Export ergänzt: `device_class` wird jetzt auch für `binary_sensor`-Profile exportiert, wenn im Profil eine Vorgabe vorhanden ist.
  Beispiele: Fensterkontakt `window`, Bewegungsmelder `motion`, Näherungsschalter `presence`, Rauchmelder `smoke`, Feuchtemelder `moisture`.

- Manuelle Gerätedatenbank nach Nutzerliste bereinigt.
- `Rolladen` überall zu `Rollladen` korrigiert.
- FKS-SV in `FKS-SV – Funk-Klein-Stellantrieb Smart Valve` umbenannt.
- `FUTH65D – Raumregler Temperatur + Sollwert (A5-10-03)`, generische `FSR14`, `FSR14_1x`, generische `FSR61` und `FSS14` entfernt.
- `FABH130/230V` und `FSM60B Betriebsart 1–4` ergänzt.
- `FBH55ESB/FBHT55ESB`, `FHMB`, `FWS61/FWG14MS`, `FUD61NPN`, `FSR71`-Varianten und Beschattungsnamen angepasst.

## Version 1.0.70

- FLGTF ergänzt.
- Der FLGTF wird als ein auswählbares Gerät geführt; der YAML-Export erzeugt automatisch TVOC und Temperatur/Feuchte.
- Kein zusätzlicher Versions-Changelog: Änderungen werden weiterhin zentral in dieser README.md gepflegt.


## Version 1.0.63

- Gerätedatenbank fachlich bereinigt.
- Nicht bestätigte/nicht existierende Typen entfernt: FSDG14, FAFVOC, FAFT60, FAFT65, FITE, FAH60, FAH65, Außenfühler, FB65B.
- Korrekturen: FWZ12 als Funk-Wechselstromzähler, FRWB statt FRW, FHMB ergänzt, FB55EB statt FB55B, FNSN55EB statt FNS55B.
- Kontakte korrigiert: FTK/FTKB/FFKB als Fenster-/Türkontakte, FFG7B als Fenstergriff.


- FWG14MS als Wetterstation-Gateway ergänzt.
- FWG14MS nutzt wie FWS61/FWSB61 das EEP `A5-13-01`.
- PCT14-Import erkennt `FWG14MS` automatisch als `sensor`.
- Geräteauswahl zeigt `FWG14MS` in der Wetterstation-Gruppe.


## Version 1.0.57

- Hinweistext beim Schreiben der Sende Ids angepasst.
- Grimm-Erklaertext zur Sender-ID-Berechnung aus der UI entfernt.
- Warn-Popup formuliert: Das Schreiben der Sende Id in die Aktoren ist mit dem FAM-USB nicht moeglich.
- Abschlussfrage im Popup: Jetzt Wirklich in die Baureihe 14-Aktoren schreiben?

# EEDTOY – ELTAKO EnOcean Device to YAML Generator

Desktop-Konfigurator für ELTAKO/EnOcean-Gateways, PCT14-Import und Home-Assistant-YAML-Export.

## Start

```bat
npm install
npm run electron:dev
```

## Python-Bridge für FAM14- und FAM-USB-Erkennung

Die automatische Gateway-Erkennung nutzt eine Python-Bridge in `python/detect_gateway.py`.
Diese Bridge verwendet dieselbe Grundlogik wie Philipp Grimms EnOcean Device Manager:

- Ports mit `pyserial` listen
- FAM14/FAM-USB/FGW14-USB über `eltakobus.serial.RS485SerialInterfaceV2` testen
- FAM14 über `suppress_echo` erkennen
- FAM14-Base-ID über das Busobjekt Adresse `255` lesen: `create_busobject(..., id=255)` und `fam14.get_base_id()`
- FAM-USB bei 9600 baud über den Eltako-Base-ID-Request `AB 58` lesen

Einmalig Python-Abhängigkeiten installieren:

```bat
py -3 -m pip install -r python\requirements.txt
```

Falls `py` nicht verfügbar ist:

```bat
python -m pip install -r python\requirements.txt
```

Danach die App starten:

```bat
npm run electron:dev
```

## Gateway-Erkennung testen

In der App:

1. Gateway-Typ `Eltako FAM14` oder `Eltako FAM-USB` auswählen
2. Serieller Port z.B. `COM16` eintragen
3. `Gateway automatisch erkennen` klicken

Im Terminal erscheinen Zeilen mit `[python-detect]`. Bei Erfolg wird `Base-ID`, Gateway-Typ, Port und Baudrate automatisch gesetzt.

## Fallback

Wenn Python oder die Python-Pakete nicht installiert sind, fällt die App auf den bisherigen JavaScript-Rohbyte-Detector zurück. Für FAM14 und FAM-USB ist die Python-Bridge aber der bevorzugte und robustere Weg.


## PCT14-Import

Der PCT14-Import unterstützt u. a. FSB14, FUD14, FSR14, FHK14, FWZ14 und DSZ14. FHK14 wird als climate-Entität mit EEP A5-10-06 importiert. Falls in der PCT14-Datei keine passende 00-00-B0-xx Sender-ID vorhanden ist, muss die Sender-ID nach dem Import manuell geprüft/gesetzt werden.

## v14
- Grimm-Kompatibilitaet: FRGBW14/FRGBW71 werden in der YAML als A5-38-08 exportiert, weil die aktuelle grimmpp Integration fuer `light` nur A5-38-08/M5-38-08 akzeptiert.
- Climate/FHK14 bekommt jetzt `temperature_unit: "°C"`, da dieser Key in der Integration Pflicht ist.


## v16
- Climate/FHK14 YAML export now writes `temperature_unit: '°C'` plus `min_target_temperature` and `max_target_temperature`.


## v18

- UI-Schriften auf Windows-kompatible Segoe-UI-Fallbacks umgestellt.
- Dropdowns/Inputs zeigen Umlaute und ß sauber an.
- PCT14-Dateien werden beim Import explizit als UTF-8 gelesen.

## v19: ID Auto Detect beim Geräte-Anlegen

Im Schritt **Geräte** gibt es neben dem Feld **Geräte-ID** einen neuen Button **ID Auto Detect**.

Ablauf:
1. Im Gateway-Schritt muss ein serieller Port gesetzt sein.
2. Beim Gerät-Anlegen auf **ID Auto Detect** klicken.
3. Innerhalb von 15 Sekunden am EnOcean-Gerät das Teach-in/LRN-Telegramm auslösen.
4. Die erkannte Sender-ID wird automatisch in das Geräte-ID-Feld übernommen.

Unterstützt werden ESP3-Radio-Telegramme und typische ESP2/RS485-Radioframes für FAM-USB, FAM14, FGW14-USB und USB300/USB400-artige Gateways.

### v20 Hinweis
ID Auto Detect nutzt jetzt zuerst einen Python/eltakobus-Listener. Das ist fuer FAM14/FGW14/FAM-USB deutlich robuster als das reine Rohbyte-Lesen in Electron. Beim Anlernen reicht auch ein normales Taster-Telegramm; es muss nicht zwingend ein spezielles LRN-Telegramm sein.


## v28

- PCT14/XML-Import kann das FAM14 aus dem `rootdevice` inklusive Base-ID als zusätzliches Gateway übernehmen.
- Ein in der PCT14-Datei vorhandenes FGW14 kann optional ebenfalls als `fgw14usb`-Gateway übernommen werden.
- Dafür gibt es im Importbereich getrennte Checkboxen. Zusammen mit einem manuell/automatisch eingerichteten FAM-USB können dadurch drei Gateways exportiert werden.


## v33
- Base-ID-Feld im Gateway-Setup verbreitert.
- PCT14-Gateway-Optionen erscheinen erst nach erfolgreichem Import, wenn FAM14/FGW14 in der Datei erkannt wurden.
- Checkbox-Texte vereinfacht: FAM14 als Gateway nutzen / FGW14-USB als Gateway nutzen.


## Version 1.0.57

- F4HK14 und FAE14SSR werden beim PCT14-Import als climate-Geräte erkannt.
- Zusätzliche 61/62-Geräte wurden in die manuelle Gerätedatenbank aufgenommen: FSR61, FR62, FL62, FSSA, FSVA, FUD61NP, FUG61NP, FD62NP, FD62NPN, FSB61 und FJ62.


### Änderungen in 1.0.57

- Rechtsklick-Kontextmenü für Eingabefelder ergänzt: Ausschneiden, Kopieren, Einfügen, Alles auswählen.
- PCT14-Importmeldung unterscheidet jetzt korrekt zwischen Einzahl und Mehrzahl: `Gerät/Kanal` bzw. `Geräte/Kanäle`.

## Version 1.0.57

- Windows-Produktname vereinfacht auf `EEDTOY`, damit Electron-Builder die EXE-Ressourcen sauber setzen kann.
- `executableName: EEDTOY` ergänzt, damit die gebaute Datei nicht mehr als generisches `electron.exe`/`Electron` erscheint.
- `signAndEditExecutable: true` explizit gesetzt, damit Icon und Versionsinformationen in die Windows-EXE geschrieben werden.
- Erwarteter Build: `dist-exe/win-unpacked/EEDTOY.exe` oder Installation über `dist-exe/EEDTOY-Setup-1.0.57.exe`.

Wichtig: Nicht die Datei aus `node_modules/electron/dist` starten oder umbenennen. Diese zeigt immer Electron als Produktname und meist das Electron-Icon.


## Version 1.0.57

- Windows-Build: `signAndEditExecutable` deaktiviert, damit electron-builder das winCodeSign-Paket nicht entpacken muss.
- EXE-Ressourcen werden weiterhin per `build/afterPack.js` und `rcedit` gesetzt.
- `build:dir` Script für direkten win-unpacked-Test ergänzt.

## Version 1.0.57

- Build-Skripte für beide Auslieferungsarten ergänzt:
  - `npm run build:installer` erzeugt den Windows-Installer in `dist-exe`.
  - `npm run build:installer` erzeugt den Windows-Installer.
  - Die portable Ausgabe ist nicht mehr Teil der normalen Releases, solange keine eingebettete Python-Laufzeit enthalten ist.
- Installer-Artefaktname: `EEDTOY-Setup-1.0.57.exe`.
- Windows-Code-Signatur-Autodiscovery wird in den Build-Skripten deaktiviert, damit der lokale Build nicht unnötig am winCodeSign-Paket hängen bleibt.


## v1.0.57

- Funktion zum Schreiben der Home-Assistant-Sender-IDs in Series-14-Aktoren ergänzt.
- Nutzt Python/eltakobus und schreibt über den FAM14/FGW14-USB Bus in die programmierbaren Aktoren.

## Version 1.0.57

- Sender-ID-Schreibfunktion abgesichert.
- Schreibbereich wird ausgegraut, wenn kein FAM14 oder FGW14-USB als RS485-Bus-Gateway verbunden ist.
- Hover-Hinweis fuer den deaktivierten Bereich ergaenzt.
- Vor dem Schreiben erscheint ein bestaetigungspflichtiger Warnhinweis: Nur FAM14/FGW14-USB, nicht FAM-USB, und PCT14/Home Assistant duerfen nicht parallel auf den Bus zugreifen.


## v57

- Disconnect/Bus-Freigabe auf der Gateway-Startseite ergänzt.
- Für FAM14/FGW14-USB wird beim Disconnect ein RS485-Bus-Unlock gesendet und der COM-Port sauber geschlossen.
- Hinweis ergänzt, vor dem Abziehen oder Wechseln eines FAM14/FGW14-USB den Disconnect auszuführen.


## Version 1.0.63

- Sender-ID-Schreiber erweitert FRGBW14/FRGBW71 mit freiem Profil 07-37-F7.
- FRGBW-Sender werden jetzt in der Sender-ID-Liste mit device_eep/device_type uebergeben.
- Der Python-Schreiber versucht fuer FRGBW einen Controller/GFVS-Speichereintrag zu setzen, statt das von eltako14bus nicht bekannte EEP 07-37-F7 ueber EEP.find zu laden.
- Nicht unterstuetzte/fehlende FRGBW-Eintraege werden jetzt im Log sichtbar statt still uebersprungen.


## Änderung v1.0.67

- FLGTF erzeugt beim YAML-Export automatisch beide Sensor-Einträge: TVOC/Luftgüte (A5-09-0C) und Temperatur/Feuchte (A5-04-02). Bei einer TVOC-ID wird die Temperatur-/Feuchte-ID als nächste EnOcean-ID (+1) erzeugt.


## Änderung v1.0.69

- EEDTOY richtet die benötigte Python-Laufzeit jetzt automatisch ein.
- Beim Windows-Installer wird eine private Python-Umgebung unter `%APPDATA%\EEDTOY\python-runtime` vorbereitet.
- Beim ersten Start beziehungsweise beim ersten Zugriff auf Gateway-Erkennung/ID-Lernen/Sender-Schreiben wird dieselbe Prüfung erneut ausgeführt.
- Falls Python 3 auf einem neuen Windows-Rechner fehlt, versucht EEDTOY die Installation über `winget` und installiert danach automatisch die Pakete aus `python/requirements.txt`.
- Die Python-Pakete werden nicht mehr global, sondern in einer privaten EEDTOY-Umgebung installiert.
- Manuelle Notfallinstallation: `python\bootstrap_runtime.cmd` ausführen.

## Änderung v1.0.70

- FBH55/FBHT55 A5-08-01 als ein Gerät in EEDTOY: Der YAML-Export erzeugt `platform: sensor`, damit die Integration automatisch Helligkeit und Bewegung aus demselben Telegramm anlegt.
- FTKE aus D5-00-01 entfernt und dem korrekten Profil F6-10-00 zugeordnet.
- D5-00-01 bleibt für FTK/FTKB/FFKB/FFTE erhalten.

