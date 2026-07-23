import { useState } from "react";

const APP_VERSION = "1.0.82";

// ─────────────────────────────────────────────────────────────────
// EEP Database — Eltako Home Assistant Integration
// ─────────────────────────────────────────────────────────────────
const EEP_DB = {
  // ── Taster / Schalter ────────────────────────────────────────
  "F6-02-01-2CH": { group:"Taster / Schalter", label:"F2T55 – Taster 2-Kanal EU (F6-02-01)", platform:"binary_sensor", eep_out:"F6-02-01", eltako:"F2T55 2-Kanal" },
  "F6-02-01-4CH": { group:"Taster / Schalter", label:"FT55, F4T55E – Taster 4-Kanal EU (F6-02-01)", platform:"binary_sensor", eep_out:"F6-02-01", eltako:"FT55, F4T55E 4-Kanal" },
  "F6-02-02": { group:"Taster / Schalter", label:"Taster 2-Kanal (F6-02-02)", platform:"binary_sensor", eltako:"Taster 2-Kanal" },
  "F6-01-01": { group:"Taster / Schalter", label:"FNSN55EB, FNS65EB – Näherungsschalter (F6-01-01)", platform:"binary_sensor", device_classes:["presence"], default_dc:"presence", eltako:"FNSN55EB, FNS65EB" },

  // ── Kontakte ──────────────────────────────────────────────────
  "D5-00-01": { group:"Kontakt", label:"FTK, FTKB, FFKB, FFTE – Fenster-/Türkontakt (D5-00-01)", platform:"binary_sensor", device_classes:["window","door","opening"], default_dc:"window", eltako:"FTK, FTKB, FFKB, FFTE" },
  "F6-10-00": { group:"Kontakt", label:"FTKE, FFG7B – Fensterkontakt / Fenstergriff (F6-10-00)", platform:"binary_sensor", device_classes:["opening","window"], default_dc:"opening", eltako:"FTKE, FFG7B" },

  // ── Bewegungsmelder ───────────────────────────────────────────
  "A5-07-01": { group:"Bewegungsmelder", label:"FBH55ESB, FB55EB / FBHT55ESB – TF-Modus: Bewegungserkennung (A5-07-01)", platform:"binary_sensor", eep_out:"A5-07-01", device_classes:["motion","occupancy"], default_dc:"motion", eltako:"FBH55ESB, FB55EB, FBHT55ESB" },
  "A5-08-01-FBH": { group:"Bewegungsmelder", label:"FBH55ESB, FB55EB – FBH-Modus: Spannung + Helligkeit + Bewegung (A5-08-01)", platform:"sensor", eep_out:"A5-08-01", eltako:"FBH55ESB" },
  "A5-08-01-FBHT": { group:"Bewegungsmelder", label:"FBHT55ESB – FBH-Modus: Spannung + Helligkeit + Temperatur + Bewegung (A5-08-01)", platform:"sensor", eep_out:"A5-08-01", eltako:"FBHT55ESB", fbht_temperature:true },
  "F6-02-01-FABH130-230V": { group:"Bewegungsmelder", label:"FABH130/230V – Bewegungsmelder (F6-02-01)", platform:"binary_sensor", eep_out:"F6-02-01", device_classes:["motion","occupancy"], default_dc:"motion", eltako:"FABH130/230V" },

  // ── Rauch / Hitze ─────────────────────────────────────────────
  "A5-30-01": { group:"Rauch / Hitze", label:"FRWB – Rauchmelder (A5-30-01)", platform:"binary_sensor", device_classes:["smoke"], default_dc:"smoke", eltako:"FRWB" },
  "A5-30-03": { group:"Rauch / Hitze", label:"FHMB – Rauch-/Hitzemelder (A5-30-03)", platform:"binary_sensor", device_classes:["smoke","heat"], default_dc:"smoke", eltako:"FHMB" },

  // ── Temperatur / Feuchte ──────────────────────────────────────
  "A5-04-01": { group:"Temperatur / Feuchte", label:"FFTSB, FFT60SB – Temperatur + Feuchte 0…40 °C (A5-04-01)", platform:"sensor", eltako:"FFTSB, FFT60SB" },
  "A5-04-02": { group:"Temperatur / Feuchte", label:"FFT65B – Temperatur + Feuchte −20…60 °C (A5-04-02)", platform:"sensor", eltako:"FFT65B" },
  "A5-04-02-FTFSB": { group:"Temperatur / Feuchte", label:"FTFSB – A5-04-02: Feuchte DB2, Temperatur DB1 (Lerntelegramm 10-10-0D-87)", platform:"sensor", eep_out:"A5-04-02", eltako:"FTFSB" },
  "A5-04-03-FTFSB": { group:"Temperatur / Feuchte", label:"FTFSB – A5-04-03: Feuchte DB3, Temperatur 10 Bit DB2/DB1 (Lerntelegramm 10-18-0D-80)", platform:"sensor", eep_out:"A5-04-03", eltako:"FTFSB" },
  "A5-04-02-FLGTF": { group:"Temperatur / Feuchte", label:"FLGTF – Temperatur + Feuchte −20…60 °C / 0…100 % (A5-04-02)", platform:"sensor", eep_out:"A5-04-02", eltako:"FLGTF" },

  // ── Luftqualität ──────────────────────────────────────────────
  "A5-09-0C-FLGTF": { group:"Luftqualität", label:"FLGTF – TVOC + Temperatur + Feuchte automatisch (A5-09-0C + A5-04-02)", platform:"sensor", eep_out:"A5-09-0C", eltako:"FLGTF" },
  "A5-09-04-FCO2TF65": { group:"Luftqualität", label:"FCO2TF65 – CO2 + Temperatur + Feuchte (A5-09-04)", platform:"sensor", eep_out:"A5-09-04", eltako:"FCO2TF65" },

  // ── Raumregler / Klima ────────────────────────────────────────
  "A5-10-06": { group:"Raumregler / Klima", label:"FUTH65D / FHK14 / F4HK14 / FAE14SSR – Heizung/Klima Temperatur + Sollwert + Fan (A5-10-06)", platform:"climate", needs_sender:true, sender_eep:"A5-10-06", eltako:"FUTH65D, FHK14, F4HK14, FAE14SSR" },
  "A5-10-10": { group:"Raumregler / Klima", label:"FUTH65D – Raumregler Temperatur + Feuchte + Sollwert (A5-10-10)", platform:"sensor", eltako:"FUTH65D" },
  "A5-10-12": { group:"Raumregler / Klima", label:"FUTH65D – Raumregler Temperatur + Feuchte + Belegung (A5-10-12)", platform:"sensor", eltako:"FUTH65D" },

  // ── Heizung / Stellantrieb ───────────────────────────────────
  "A5-20-01-FKS-SV": { group:"Heizung / Stellantrieb", label:"FKS-SV – Funk-Klein-Stellantrieb Smart Valve (A5-20-01)", platform:"climate", needs_sender:true, sender_eep:"A5-20-01", eep_out:"A5-20-01", eltako:"FKS-SV" },

  // ── Zähler ────────────────────────────────────────────────────
  "A5-12-01": { group:"Zähler", label:"FWZ12, FWZ14, DSZ14 – Funk-/Wechselstromzähler kWh (A5-12-01)", platform:"sensor", eltako:"FWZ12, FWZ14, DSZ14" },
  "A5-12-01-F3Z14D": { group:"Zähler", label:"F3Z14D – 3-Kanal-S0-Drehstromzähler (A5-12-01)", platform:"sensor", eep_out:"A5-12-01", meter_tariffs:"[1]", eltako:"F3Z14D" },

  // ── Wetterstation ─────────────────────────────────────────────
  "A5-13-01": { group:"Wetterstation", label:"FWS61, FWG14MS – Wetterstation Wind + Regen + Temperatur (A5-13-01)", platform:"sensor", eltako:"FWS61, FWG14MS" },

  // ── Licht / Dimmer ────────────────────────────────────────────
  "A5-38-08-FUD14": { group:"Licht / Dimmer", label:"FUD14 – Dimmaktor (A5-38-08)", platform:"light", needs_sender:true, sender_eep:"A5-38-08", eep_out:"A5-38-08", eltako:"FUD14" },
  "A5-38-08-FUD71": { group:"Licht / Dimmer", label:"FUD71 – Dimmaktor (A5-38-08)", platform:"light", needs_sender:true, sender_eep:"A5-38-08", eep_out:"A5-38-08", eltako:"FUD71" },
  "A5-38-08-FD2G14": { group:"Licht / Dimmer", label:"FD2G14 – DALI-Gateway (A5-38-08)", platform:"light", needs_sender:true, sender_eep:"A5-38-08", eep_out:"A5-38-08", eltako:"FD2G14" },
  "A5-38-08-FUD61NP-230V": { group:"Licht / Dimmer", label:"FUD61NP-230V – Dimmaktor (A5-38-08)", platform:"light", needs_sender:true, sender_eep:"A5-38-08", eep_out:"A5-38-08", eltako:"FUD61NP-230V" },
  "A5-38-08-FUD61NPN-230V": { group:"Licht / Dimmer", label:"FUD61NPN-230V – Dimmer/Relais (A5-38-08)", platform:"light", needs_sender:true, sender_eep:"A5-38-08", eep_out:"A5-38-08", eltako:"FUD61NPN-230V" },
  "A5-38-08-FD62NP-230V": { group:"Licht / Dimmer", label:"FD62NP-230V – Dimmer/Relais (A5-38-08)", platform:"light", needs_sender:true, sender_eep:"A5-38-08", eep_out:"A5-38-08", eltako:"FD62NP-230V" },
  "A5-38-08-FD62NPN-230V": { group:"Licht / Dimmer", label:"FD62NPN-230V – Dimmer/Relais (A5-38-08)", platform:"light", needs_sender:true, sender_eep:"A5-38-08", eep_out:"A5-38-08", eltako:"FD62NPN-230V" },

  // ── Licht / RGBW ──────────────────────────────────────────────
  "07-37-F7-FRGBW14": { group:"Licht / RGBW", label:"FRGBW14 – RGBW/Farbsteuerung freies Profil (07-37-F7)", platform:"light", needs_sender:true, sender_eep:"07-37-F7", eep_out:"07-37-F7", eltako:"FRGBW14", rgbw:true },
  "07-37-F7-FRGBW71L": { group:"Licht / RGBW", label:"FRGBW71L – RGBW/Farbsteuerung freies Profil (07-37-F7)", platform:"light", needs_sender:true, sender_eep:"07-37-F7", eep_out:"07-37-F7", eltako:"FRGBW71L", rgbw:true },
  "07-37-F7-FWKKW71L": { group:"Licht / RGBW", label:"FWKKW71L – RGBW/Farbsteuerung freies Profil (07-37-F7)", platform:"light", needs_sender:true, sender_eep:"07-37-F7", eep_out:"07-37-F7", eltako:"FWKKW71L", rgbw:true },

  // ── Licht / Relais ────────────────────────────────────────────
  "M5-38-08-FSR14-2X": { group:"Licht / Relais", label:"FSR14_2x – Relais/Lichtaktor (M5-38-08)", platform:"light", needs_sender:true, sender_eep:"A5-38-08", eep_out:"M5-38-08", eltako:"FSR14_2x" },
  "M5-38-08-FSR14-4X": { group:"Licht / Relais", label:"FSR14_4x – Relais/Lichtaktor (M5-38-08)", platform:"light", needs_sender:true, sender_eep:"A5-38-08", eep_out:"M5-38-08", eltako:"FSR14_4x" },
  "M5-38-08-FSR71-2X-230V": { group:"Licht / Relais", label:"FSR71-2x-230V – Relais/Lichtaktor (M5-38-08)", platform:"light", needs_sender:true, sender_eep:"A5-38-08", eep_out:"M5-38-08", eltako:"FSR71-2x-230V" },
  "M5-38-08-FSR71NP-2X-230V": { group:"Licht / Relais", label:"FSR71NP-2x-230V – Relais/Lichtaktor (M5-38-08)", platform:"light", needs_sender:true, sender_eep:"A5-38-08", eep_out:"M5-38-08", eltako:"FSR71NP-2x-230V" },
  "M5-38-08-FSR71-4X-230V": { group:"Licht / Relais", label:"FSR71-4x-230V – Relais/Lichtaktor (M5-38-08)", platform:"light", needs_sender:true, sender_eep:"A5-38-08", eep_out:"M5-38-08", eltako:"FSR71-4x-230V" },
  "M5-38-08-FSR71NP-4X-230V": { group:"Licht / Relais", label:"FSR71NP-4x-230V – Relais/Lichtaktor (M5-38-08)", platform:"light", needs_sender:true, sender_eep:"A5-38-08", eep_out:"M5-38-08", eltako:"FSR71NP-4x-230V" },
  "M5-38-08-FMZ14": { group:"Licht / Relais", label:"FMZ14 – Relais/Lichtaktor (M5-38-08)", platform:"light", needs_sender:true, sender_eep:"F6-02-01", eep_out:"M5-38-08", eltako:"FMZ14" },
  "M5-38-08-FSR61-230V": { group:"Licht / Relais", label:"FSR61-230V – Relais/Lichtaktor (M5-38-08)", platform:"light", needs_sender:true, sender_eep:"A5-38-08", eep_out:"M5-38-08", eltako:"FSR61-230V" },
  "M5-38-08-FSR61NP-230V": { group:"Licht / Relais", label:"FSR61NP-230V – Relais/Lichtaktor (M5-38-08)", platform:"light", needs_sender:true, sender_eep:"A5-38-08", eep_out:"M5-38-08", eltako:"FSR61NP-230V" },
  "M5-38-08-FSR61-8-24VUC": { group:"Licht / Relais", label:"FSR61/8-24V UC – Relais/Lichtaktor (M5-38-08)", platform:"light", needs_sender:true, sender_eep:"A5-38-08", eep_out:"M5-38-08", eltako:"FSR61/8-24V UC" },
  "M5-38-08-FSR61G-230V": { group:"Licht / Relais", label:"FSR61G-230V – Relais/Lichtaktor (M5-38-08)", platform:"light", needs_sender:true, sender_eep:"A5-38-08", eep_out:"M5-38-08", eltako:"FSR61G-230V" },
  "M5-38-08-FSR61LN-230V": { group:"Licht / Relais", label:"FSR61LN-230V – Relais/Lichtaktor (M5-38-08)", platform:"light", needs_sender:true, sender_eep:"A5-38-08", eep_out:"M5-38-08", eltako:"FSR61LN-230V" },
  "M5-38-08-FLC61NP-230V": { group:"Licht / Relais", label:"FLC61NP-230V – Relais/Lichtaktor (M5-38-08)", platform:"light", needs_sender:true, sender_eep:"A5-38-08", eep_out:"M5-38-08", eltako:"FLC61NP-230V" },
  "M5-38-08-FR62-230V": { group:"Licht / Relais", label:"FR62-230V – Relais/Steckdosenaktor (M5-38-08)", platform:"light", needs_sender:true, sender_eep:"A5-38-08", eep_out:"M5-38-08", eltako:"FR62-230V" },
  "M5-38-08-FR62NP-230V": { group:"Licht / Relais", label:"FR62NP-230V – Relais/Steckdosenaktor (M5-38-08)", platform:"light", needs_sender:true, sender_eep:"A5-38-08", eep_out:"M5-38-08", eltako:"FR62NP-230V" },
  "M5-38-08-FL62-230V": { group:"Licht / Relais", label:"FL62-230V – Relais/Steckdosenaktor (M5-38-08)", platform:"light", needs_sender:true, sender_eep:"A5-38-08", eep_out:"M5-38-08", eltako:"FL62-230V" },
  "M5-38-08-FL62NP-230V": { group:"Licht / Relais", label:"FL62NP-230V – Relais/Steckdosenaktor (M5-38-08)", platform:"light", needs_sender:true, sender_eep:"A5-38-08", eep_out:"M5-38-08", eltako:"FL62NP-230V" },
  "M5-38-08-FSSA-230V": { group:"Licht / Relais", label:"FSSA-230V – Relais/Steckdosenaktor (M5-38-08)", platform:"light", needs_sender:true, sender_eep:"A5-38-08", eep_out:"M5-38-08", eltako:"FSSA-230V" },
  "M5-38-08-FSVA-230V-10A": { group:"Licht / Relais", label:"FSVA-230V-10A – Relais/Steckdosenaktor (M5-38-08)", platform:"light", needs_sender:true, sender_eep:"A5-38-08", eep_out:"M5-38-08", eltako:"FSVA-230V-10A" },

  // ── Schalter ─────────────────────────────────────────────────
  "A5-12-01-FSS12-12VDC": { group:"Zähler", label:"FSS12-12V DC – Zählerstand + Augenblicksleistung (A5-12-01)", platform:"sensor", eep_out:"A5-12-01", meter_tariffs:"[1]", eltako:"FSS12-12V DC" },

  // ── Jalousie / Rollladen ──────────────────────────────────────
  "G5-3F-7F-FSB14": { group:"Jalousie / Rollladen", label:"FSB14, FSB14/12-24V DC – Jalousie / Rollladen (G5-3F-7F)", platform:"cover", needs_sender:true, sender_eep:"H5-3F-7F", eep_out:"G5-3F-7F", device_classes:["shutter","blind","awning","curtain"], default_dc:"shutter", eltako:"FSB14, FSB14/12-24V DC" },
  "G5-3F-7F-FSB61-230V": { group:"Jalousie / Rollladen", label:"FSB61-230V – Jalousie / Rollladen (G5-3F-7F)", platform:"cover", needs_sender:true, sender_eep:"H5-3F-7F", eep_out:"G5-3F-7F", device_classes:["shutter","blind","awning","curtain"], default_dc:"shutter", eltako:"FSB61-230V" },
  "G5-3F-7F-FSB71-230V": { group:"Jalousie / Rollladen", label:"FSB71-230V – Jalousie / Rollladen (G5-3F-7F)", platform:"cover", needs_sender:true, sender_eep:"H5-3F-7F", eep_out:"G5-3F-7F", device_classes:["shutter","blind","awning","curtain"], default_dc:"shutter", eltako:"FSB71-230V" },
  "G5-3F-7F-FSB61NP-230V": { group:"Jalousie / Rollladen", label:"FSB61NP-230V – Jalousie / Rollladen (G5-3F-7F)", platform:"cover", needs_sender:true, sender_eep:"H5-3F-7F", eep_out:"G5-3F-7F", device_classes:["shutter","blind","awning","curtain"], default_dc:"shutter", eltako:"FSB61NP-230V" },
  "G5-3F-7F-FJ62-12-36VDC": { group:"Jalousie / Rollladen", label:"FJ62/12-36V DC – Jalousie / Rollladen (G5-3F-7F)", platform:"cover", needs_sender:true, sender_eep:"H5-3F-7F", eep_out:"G5-3F-7F", device_classes:["shutter","blind","awning","curtain"], default_dc:"shutter", eltako:"FJ62/12-36V DC" },
  "G5-3F-7F-FJ62NP-230V": { group:"Jalousie / Rollladen", label:"FJ62NP-230V – Jalousie / Rollladen (G5-3F-7F)", platform:"cover", needs_sender:true, sender_eep:"H5-3F-7F", eep_out:"G5-3F-7F", device_classes:["shutter","blind","awning","curtain"], default_dc:"shutter", eltako:"FJ62NP-230V" },

  // ── Funk-Modul ────────────────────────────────────────────────
  "F6-02-01-FSM60B-BA1": { group:"Funk-Modul", label:"FSM60B Betriebsart 1 (F6-02-01)", platform:"binary_sensor", eep_out:"F6-02-01", eltako:"FSM60B Betriebsart 1" },
  "F6-02-01-FSM60B-BA2": { group:"Funk-Modul", label:"FSM60B Betriebsart 2 (F6-02-01)", platform:"binary_sensor", eep_out:"F6-02-01", eltako:"FSM60B Betriebsart 2" },
  "A5-30-03-FSM60B-BA3": { group:"Funk-Modul", label:"FSM60B Betriebsart 3 (A5-30-03)", platform:"binary_sensor", eep_out:"A5-30-03", device_classes:["moisture"], default_dc:"moisture", eltako:"FSM60B Betriebsart 3" },
  "A5-30-01-FSM60B-BA4": { group:"Funk-Modul", label:"FSM60B Betriebsart 4 (A5-30-01)", platform:"switch", eep_out:"A5-30-01", eltako:"FSM60B Betriebsart 4" },
};

const GROUPS = [...new Set(Object.values(EEP_DB).map(e => e.group))];

const PC = { binary_sensor:"#22c55e", sensor:"#0ea5e9", light:"#f59e0b", switch:"#a78bfa", cover:"#fb923c", climate:"#f43f5e" };
const PI = { binary_sensor:"🔔", sensor:"📊", light:"💡", switch:"🔌", cover:"🪟", climate:"🌡️" };

const GENERIC_EEP_PROFILES = {
  "A5-38-08": { platform:"light", needs_sender:true, sender_eep:"A5-38-08", eep_out:"A5-38-08" },
  "M5-38-08": { platform:"light", needs_sender:true, sender_eep:"A5-38-08", eep_out:"M5-38-08" },
  "G5-3F-7F": { platform:"cover", needs_sender:true, sender_eep:"H5-3F-7F", eep_out:"G5-3F-7F", default_dc:"shutter" },
  "A5-10-06": { platform:"climate", needs_sender:true, sender_eep:"A5-10-06", eep_out:"A5-10-06" },
  "A5-12-01": { platform:"sensor", needs_sender:false, eep_out:"A5-12-01" },
  "A5-09-0C": { platform:"sensor", needs_sender:false, eep_out:"A5-09-0C" },
  "A5-09-04": { platform:"sensor", needs_sender:false, eep_out:"A5-09-04" },
  "A5-04-02": { platform:"sensor", needs_sender:false, eep_out:"A5-04-02" },
  "A5-04-03": { platform:"sensor", needs_sender:false, eep_out:"A5-04-03" },
  "A5-07-01": { platform:"binary_sensor", needs_sender:false, eep_out:"A5-07-01", default_dc:"motion" },
  "A5-08-01": { platform:"sensor", needs_sender:false, eep_out:"A5-08-01" },
  "A5-20-01": { platform:"climate", needs_sender:true, sender_eep:"A5-20-01", eep_out:"A5-20-01" },
  "07-37-F7": { platform:"light", needs_sender:true, sender_eep:"07-37-F7", eep_out:"07-37-F7" },
};

function profileFor(eep) {
  const key = String(eep || "");
  return EEP_DB[key] || GENERIC_EEP_PROFILES[key] || {};
}

function deviceTypeForDevice(device) {
  const p = profileFor(device?.eep);
  return device?.device_type || device?.model || device?.eltako || p.eltako || String(device?.name || "").split(" ")[0] || "Gerät";
}

function isRgbwDevice(device) {
  const p = profileFor(device?.eep);
  const typeText = `${deviceTypeForDevice(device)} ${device?.name || ""} ${device?.eep || ""}`.toUpperCase();
  return Boolean(p.rgbw || typeText.includes("FRGBW") || String(device?.eep || "").toUpperCase() === "07-37-F7");
}

function orderedGatewayBlocks(gateway, extraGateways = []) {
  const gatewayOrder = { fam14: 1, "fam-usb": 2, fgw14usb: 3 };
  return [gateway, ...extraGateways]
    .filter(Boolean)
    .filter((gw, idx, arr) => arr.findIndex(x => x.type === gw.type && (x.base_id || "") === (gw.base_id || "")) === idx)
    .sort((a, b) => (gatewayOrder[a.type] || 99) - (gatewayOrder[b.type] || 99));
}

function gatewayKey(gw) {
  return `${gw?.type || ""}|${gw?.base_id || ""}`;
}


function addIdOffset(id, offset) {
  const clean = String(id || "").replace(/-/g, "");
  if (!/^[0-9a-fA-F]{8}$/.test(clean)) return "";
  const value = (parseInt(clean, 16) + Number(offset || 0)) >>> 0;
  return [24,16,8,0].map(shift => ((value >>> shift) & 0xff).toString(16).padStart(2, "0").toUpperCase()).join("-");
}

function exportEepForDevice(device) {
  const profile = profileFor(device?.eep);
  return profile.eep_out ?? String(device?.eep || "").replace(/-sw$/, "");
}

function isFlgtfDevice(device) {
  const text = `${device?.name || ""} ${device?.device_type || ""} ${device?.model || ""} ${device?.eltako || ""}`.toUpperCase();
  return text.includes("FLGTF") || String(device?.eep || "").includes("FLGTF");
}

function flgtfBaseName(name, suffix) {
  const clean = String(name || "FLGTF").replace(/\s+(TVOC|LUFTGÜTE|LUFTGUETE|TEMPERATUR\s*\+?\s*FEUCHTE|TEMPERATUR|FEUCHTE)$/i, "").trim();
  return `${clean || "FLGTF"} ${suffix}`.trim();
}


function normalizeId(id) {
  const clean = String(id || "").trim().toUpperCase();
  return /^[0-9A-F]{2}(-[0-9A-F]{2}){3}$/.test(clean) ? clean : "";
}

function isFksSvDevice(device) {
  return exportEepForDevice(device) === "A5-20-01" || String(device?.name || "").toUpperCase().includes("FKS-SV");
}

function isFbhOperatingMode(device) {
  const eep = exportEepForDevice(device);
  return eep === "A5-07-01" || eep === "A5-08-01";
}

function duplicateDeviceKey(device) {
  const id = normalizeId(device?.dev_id);
  const eep = exportEepForDevice(device);
  if (!id || !eep) return "";
  // A5-07-01 (TF mode) and A5-08-01 (FBH mode) are mutually exclusive
  // operating modes of the same FBH55ESB/FBHT55ESB transmitter. Exporting
  // both for one physical ID makes the integration lookup ambiguous.
  return isFbhOperatingMode(device) ? `${id}|FBH-BETRIEBSART` : `${id}|${eep}`;
}

function deduplicateExportDevices(devices) {
  const result = [];
  const indexByKey = new Map();
  let removed = 0;
  for (const device of devices || []) {
    const key = duplicateDeviceKey(device);
    if (!key) {
      result.push(device);
      continue;
    }
    if (indexByKey.has(key)) {
      // The last row is the deliberate user choice. This fixes cases where an
      // older generic "Fensterkontakt" row and a later FTKE row have the same
      // physical ID and EEP.
      result[indexByKey.get(key)] = device;
      removed += 1;
      continue;
    }
    indexByKey.set(key, result.length);
    result.push(device);
  }
  return { devices: result, removed };
}

function senderIdFromOffsetForGateway(gw, offset) {
  if (!Number.isInteger(offset) || offset < 1 || offset > 0x7F) return "";
  if (gw?.type === "fam14" || gw?.type === "fgw14usb") return busIdFromAddress(0xB000 + offset);
  if (gw?.base_id) return addToBaseId(gw.base_id, offset);
  return "";
}

function fksSenderIdForGateway(device, gw) {
  const offset = senderOffsetFromId(device?.sender_id);
  return senderIdFromOffsetForGateway(gw, offset) || normalizeId(device?.sender_id);
}

function usedControllerIdsForGateway(devices, gw, pct14BaseId = "", excludeDevice = null) {
  const used = new Set();
  for (const device of devices || []) {
    if (device === excludeDevice) continue;
    const physical = normalizeId(deviceIdForGateway(device, gw, pct14BaseId));
    if (physical) used.add(physical);
    const profile = profileFor(device?.eep);
    if (!profile.needs_sender || isFksSvDevice(device)) continue;
    const sender = normalizeId(senderIdForGateway(device, gw, pct14BaseId));
    if (sender) used.add(sender);
  }
  return used;
}

function allocateFreeSenderId(gw, used) {
  for (let offset = 1; offset <= 0x7F; offset++) {
    const candidate = normalizeId(senderIdFromOffsetForGateway(gw, offset));
    if (candidate && !used.has(candidate)) return candidate;
  }
  return "";
}

function normalizeFksSenderAssignments(gateway, devices, pct14BaseId = "") {
  const deduped = deduplicateExportDevices(devices).devices;
  const used = usedControllerIdsForGateway(deduped, gateway, pct14BaseId);
  let changed = 0;
  const normalized = deduped.map(device => {
    if (!isFksSvDevice(device)) return device;
    let candidate = normalizeId(fksSenderIdForGateway(device, gateway));
    if (!candidate || used.has(candidate)) candidate = allocateFreeSenderId(gateway, used);
    if (!candidate) return device;
    used.add(candidate);
    if (normalizeId(device.sender_id) !== candidate || String(device.sender_eep || "").toUpperCase() !== "A5-20-01") changed += 1;
    return { ...device, sender_id: candidate, sender_eep: "A5-20-01" };
  });
  return { devices: normalized, changed };
}

function expandFlgtfExportDevices(devices) {
  const result = [];
  const has = (id, eepOut) => result.some(d => String(d.dev_id || "").toUpperCase() === String(id || "").toUpperCase() && exportEepForDevice(d) === eepOut);

  for (const device of devices || []) {
    if (!isFlgtfDevice(device)) {
      result.push(device);
      continue;
    }

    const eepOut = exportEepForDevice(device);
    const baseName = flgtfBaseName(device.name, "").trim() || "FLGTF";

    if (eepOut === "A5-09-0C") {
      const tvocDevice = {
        ...device,
        name: baseName,
        device_type: "FLGTF",
        model: "FLGTF",
        eltako: "FLGTF",
      };
      if (!has(tvocDevice.dev_id, "A5-09-0C")) result.push(tvocDevice);

      const tempHumidityId = addIdOffset(device.dev_id, 1);
      if (tempHumidityId && !has(tempHumidityId, "A5-04-02")) {
        result.push({
          ...device,
          dev_id: tempHumidityId,
          eep: "A5-04-02",
          name: baseName,
          platform: "sensor",
          device_type: "FLGTF",
          model: "FLGTF",
          eltako: "FLGTF",
          sender_id: "",
          sender_eep: "",
        });
      }
      continue;
    }

    // FLGTF temperature/humidity-only mode (A5-04-02) is also selectable.
    // Keep the physical name stable so Home Assistant groups it consistently.
    result.push({
      ...device,
      name: baseName,
      device_type: "FLGTF",
      model: "FLGTF",
      eltako: "FLGTF",
    });
  }

  return result;
}

// ─── YAML Generator — grimmpp eltako: format ─────────────────────
function generateYaml(gateway, devices, extraGateways = [], pct14BaseId = "") {
  if (!devices.length) return "";
  const deduplication = deduplicateExportDevices(devices);
  const exportDevices = expandFlgtfExportDevices(deduplication.devices);

  const byPlat = {};
  for (const d of exportDevices) {
    if (!byPlat[d.platform]) byPlat[d.platform] = [];
    byPlat[d.platform].push(d);
  }

  let out = `# ============================================================\n`;
  out += `# EEDTOY – ELTAKO EnOcean Device to YAML Generator\n`;
  out += `# Author: D. Zirnbauer\n`;
  out += `# Version: ${APP_VERSION}\n`;
  out += `# Generiert: ${new Date().toLocaleString("de-DE")}\n`;
  out += `# Home Assistant ELTAKO YAML Export\n`;
  out += `# ============================================================\n\n`;

  out += `eltako:\n`;
  out += `  gateway:\n`;

  const gatewayBlocks = orderedGatewayBlocks(gateway, extraGateways);

  const writeGatewayBlock = (gw, index) => {
    // Format bewusst wie in der Grimm/Home-Assistant-Eltako-Konfiguration:
    // gateway: gefolgt von einer Sequenz auf derselben YAML-Ebene.
    out += `  - id: ${index + 1}\n`;
    out += `    device_type: ${gw.type}\n`;
    if (gw.base_id && GATEWAY_TYPES.find(g=>g.value===gw.type)?.has_base_id)
      out += `    base_id: ${gw.base_id}\n`;
    // serial_path wird nicht exportiert; der Port wird im HA-Config-Flow gewählt.
    out += `    devices:\n`;

    const ORDER = ["light","switch","cover","sensor","binary_sensor","climate"];
    for (const plat of ORDER) {
      if (!byPlat[plat]) continue;
      out += `      ${plat}:\n`;
      for (const d of byPlat[plat]) {
        const p = profileFor(d.eep);
        const eepOut = p.eep_out ?? d.eep.replace(/-sw$/, "");
        const exportDevId = deviceIdForGateway(d, gw, pct14BaseId);
        const exportSenderId = senderIdForGateway(d, gw, pct14BaseId);
        out += `      - id: "${exportDevId}"\n`;
        out += `        eep: "${eepOut}"\n`;
        out += `        name: "${d.name}"\n`;
        if (p.fbht_temperature) out += `        fbht_temperature: true\n`;
        if (isRgbwDevice(d)) {
          out += `        # FRGBW-Statussync: HA-Sender-ID in den Aktor schreiben und eingehende 07-37-F7-Bustelegramme in der HA-Integration auswerten.\n`;
          out += `        # Dadurch bleiben Eltako-GFA5-App und Home Assistant statusseitig synchron.\n`;
        }
        // Die Grimm-Integration erwartet hier keine freie comment-Eigenschaft.
        // Zur Nachvollziehbarkeit bleibt sie als YAML-Kommentar erhalten.
        if (d.room)        out += `        #comment: "${d.room}"\n`;
        if (plat === "sensor" && eepOut === "A5-12-01") {
          out += `        meter_tariffs: ${d.meter_tariffs || p.meter_tariffs || "[]"}\n`;
        }
        if (plat === "cover") {
          out += `        device_class: ${d.device_class || p.default_dc || "shutter"}\n`;
        }
        if (plat === "binary_sensor" && (d.device_class || p.default_dc)) {
          out += `        device_class: ${d.device_class || p.default_dc}\n`;
        }
        if (p.needs_sender) {
          out += `        sender:\n`;
          out += `          id: "${exportSenderId || d.sender_id || "00-00-B0-01"}"\n`;
          out += `          eep: "${d.sender_eep || p.sender_eep || eepOut}"\n`;
        }
        if (plat === "cover") {
          out += `        time_closes: ${d.time_closes || 25}\n`;
          out += `        time_opens: ${d.time_opens || 25}\n`;
        }
        if (plat === "climate") {
          // Grimm/Home-Assistant-Eltako erwartet beim FHK14 die Temperaturangaben
          // im gleichen Format wie der originale Generator, hier bewusst in Celsius.
          out += `        temperature_unit: '°C'\n`;
          out += `        min_target_temperature: ${d.min_target_temperature || 16}\n`;
          out += `        max_target_temperature: ${d.max_target_temperature || 25}\n`;
        }
        out += `\n`;
      }
    }
  };

  gatewayBlocks.forEach(writeGatewayBlock);
  return out;
}

const GATEWAY_TYPES = [
  { value:"fam-usb",  label:"Eltako FAM-USB",  desc:"ESP2 · 9600 baud · Wireless", has_base_id:true, has_serial:true, has_lan:false, baud:9600, proto:"fam-usb-python" },
  { value:"fam14",    label:"Eltako FAM14",     desc:"Eltakobus · RS485 Bus · 57600 baud", has_base_id:true, has_serial:true, has_lan:false, baud:57600, proto:"fam14-python" },
  { value:"fgw14usb", label:"Eltako FGW14-USB", desc:"ESP2 · RS485 Bus · 57600 baud", has_base_id:true, has_serial:true, has_lan:false, baud:57600, proto:"fgw14-python" },
];



// ─── PCT14 XML Import ─────────────────────────────────────────────
function byteIdFromDecimal(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  const bytes = [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >> 24) & 0xff];
  return bytes.map(b => b.toString(16).padStart(2, "0").toUpperCase()).join("-");
}

function idFromBytes(bytes) {
  return bytes.map(b => Number(b).toString(16).padStart(2, "0").toUpperCase()).join("-");
}

function addToBaseId(baseId, offset) {
  const clean = (baseId || "").replace(/-/g, "");
  if (!/^[0-9a-fA-F]{8}$/.test(clean)) return "";
  const value = (parseInt(clean, 16) + Number(offset || 0)) >>> 0;
  return [24,16,8,0].map(shift => ((value >>> shift) & 0xff).toString(16).padStart(2, "0").toUpperCase()).join("-");
}


function busIdFromAddress(offset) {
  const value = Number(offset || 0) >>> 0;
  return [24,16,8,0].map(shift => ((value >>> shift) & 0xff).toString(16).padStart(2, "0").toUpperCase()).join("-");
}

function addressFromBusId(id) {
  const clean = String(id || "").replace(/-/g, "");
  if (!/^[0-9a-fA-F]{8}$/.test(clean)) return null;
  return parseInt(clean, 16) >>> 0;
}

function isPct14ImportedDevice(device) {
  return String(device?.room || "").includes("PCT14 Adresse");
}

function deviceIdForGateway(device, gw, pct14BaseId) {
  const offset = addressFromBusId(device.dev_id);
  if (offset == null || !isPct14ImportedDevice(device)) return device.dev_id;
  if (gw?.type === "fam-usb" && pct14BaseId) {
    return addToBaseId(pct14BaseId, offset) || device.dev_id;
  }
  return busIdFromAddress(offset);
}

function senderIdForGateway(device, gw, pct14BaseId) {
  if (isFksSvDevice(device)) return fksSenderIdForGateway(device, gw);
  const offset = addressFromBusId(device.dev_id);
  if (offset == null || !isPct14ImportedDevice(device)) return device.sender_id;
  if (gw?.type === "fam-usb" && gw.base_id && pct14BaseId) {
    return addToBaseId(gw.base_id, offset) || device.sender_id;
  }
  return busIdFromAddress(0xB000 + offset);
}

function busDeviceIdForProgramming(device, pct14BaseId) {
  const offset = addressFromBusId(device.dev_id);
  if (offset == null || !isPct14ImportedDevice(device) || !pct14BaseId) return "";
  return addToBaseId(pct14BaseId, offset);
}

function buildSenderProgrammingEntries(devices, targetGateway, pct14BaseId) {
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

function senderOffsetFromId(id) {
  const clean = String(id || "").replace(/-/g, "");
  if (!/^[0-9a-fA-F]{8}$/.test(clean)) return null;
  return parseInt(clean.slice(-2), 16);
}

function nextFreeSenderOffset(deviceList) {
  const used = new Set();
  for (const device of deviceList || []) {
    for (const value of [device?.sender_id, device?.dev_id]) {
      const offset = senderOffsetFromId(value);
      if (Number.isInteger(offset) && offset > 0 && offset <= 0x7F) used.add(offset);
    }
  }
  for (let i = 1; i <= 0x7F; i++) {
    if (!used.has(i)) return i;
  }
  return 1;
}

function autoSenderIdForGateway(gw, deviceList) {
  const offset = nextFreeSenderOffset(deviceList);
  if (gw?.type === "fam14" || gw?.type === "fgw14usb") return busIdFromAddress(0xB000 + offset);
  if (gw?.base_id) return addToBaseId(gw.base_id, offset);
  return "";
}

function textOf(node, selector, fallback = "") {
  return node.querySelector(selector)?.textContent?.trim() ?? fallback;
}

function getPct14Mapping(modelName) {
  const name = (modelName || "").toUpperCase();
  if (name.startsWith("FGW14")) return { gateway:"fgw14usb" };
  if (name.startsWith("FSB14")) return { eep:"G5-3F-7F", platform:"cover", time_opens:"25", time_closes:"25" };
  if (name.startsWith("FD2G14")) return { eep:"A5-38-08", platform:"light", dali:true };
  if (name.startsWith("FRGBW14") || name.startsWith("FRGBW71")) return { eep:"07-37-F7", platform:"light", sender_eep:"07-37-F7", channels:1, rgbw:true };
  if (name.startsWith("FUD14")) return { eep:"A5-38-08", platform:"light" };
  if (name.startsWith("F4SR14")) return { eep:"M5-38-08", platform:"light" };
  if (name.startsWith("FSR14")) return { eep:"M5-38-08", platform:"light" };
  if (name.startsWith("FMZ14")) return { eep:"M5-38-08", platform:"light", sender_eep:"F6-02-01" };
  if (name.startsWith("FHK14") || name.startsWith("F4HK14") || name.startsWith("FAE14SSR")) return { eep:"A5-10-06", platform:"climate", min_target_temperature:16, max_target_temperature:25 };
  if (name.startsWith("FWG14MS")) return { eep:"A5-13-01", platform:"sensor", weather:true };
  if (name.startsWith("F3Z14D")) return { eep:"A5-12-01-F3Z14D", platform:"sensor", channels:3, meter_tariffs:"[1]" };
  if (name.startsWith("FWZ14") || name.startsWith("DSZ14")) return { eep:"A5-12-01", platform:"sensor" };
  return null;
}

function normalizePct14ModelName(modelName) {
  const upper = String(modelName || "").toUpperCase();
  if (upper.startsWith("FSR14-4") || upper.startsWith("FSR14_4")) return "FSR14_4X";
  if (upper.startsWith("FSR14-2") || upper.startsWith("FSR14_2")) return "FSR14_2X";
  if (upper.startsWith("FSR14-1") || upper.startsWith("FSR14_1")) return "FSR14_1X";
  if (upper.startsWith("F4SR14")) return "F4SR14_LED";
  if (upper.startsWith("FWG14MS")) return "FWG14MS";
  if (upper.startsWith("F3Z14D")) return "F3Z14D";
  return modelName || "Gerät";
}

function parsePct14Xml(text, currentBaseId = "", options = {}) {
  const doc = new DOMParser().parseFromString(text, "application/xml");
  const parserError = doc.querySelector("parsererror");
  if (parserError) throw new Error("Die Datei ist keine gültige PCT14-XML-Datei.");

  const rootBase = doc.querySelector("rootdevice rootdevicedata baseid");
  const baseId = rootBase ? idFromBytes([
    textOf(rootBase, "baseid_byte_0", "0"),
    textOf(rootBase, "baseid_byte_1", "0"),
    textOf(rootBase, "baseid_byte_2", "0"),
    textOf(rootBase, "baseid_byte_3", "0"),
  ]) : currentBaseId;

  const imported = [];
  const unsupported = [];
  const extraGateways = [];
  let missingSender = 0;
  const hasFam14Gateway = Boolean(rootBase && baseId);
  let hasFgw14Gateway = false;

  if (options.includeFam14Gateway && hasFam14Gateway) {
    extraGateways.push({ type:"fam14", base_id: baseId, source:"pct14-rootdevice" });
  }

  for (const device of Array.from(doc.querySelectorAll("devices > device"))) {
    const model = textOf(device, "name");
    const mapping = getPct14Mapping(model);
    const address = Number(textOf(device, "header > address", "0"));

    // Robustheit: Unbekannte oder noch nicht gemappte PCT14-Geräte dürfen den
    // kompletten Import nicht abbrechen. Vor v1.0.61 wurde hier bereits auf
    // mapping.channels zugegriffen, obwohl mapping bei unbekannten Geräten null
    // sein kann. Das führte zu: Cannot read properties of null (reading 'channels').
    if (!mapping) {
      unsupported.push(model || `Adresse ${address}`);
      continue;
    }

    const addressRange = Math.max(1, Number(textOf(device, "header > addressrange", "1")) || 1);
    const channels = Array.from(device.querySelectorAll("channels > channel"));
    const groups = Array.from(device.querySelectorAll("groups > group"));
    const channelCount = Number(mapping.channels || 0) || Math.max(addressRange, channels.length || groups.length || 1);

    if (mapping.gateway === "fgw14usb") {
      hasFgw14Gateway = true;
      if (options.includeFgw14Gateway) {
        extraGateways.push({ type:"fgw14usb", base_id: baseId || currentBaseId, source:"pct14-fgw14" });
      }
      continue;
    }

    const senderByChannel = new Map();
    for (const entry of Array.from(device.querySelectorAll("rangeofid > entry"))) {
      const raw = textOf(entry, "entry_id", "");
      const id = byteIdFromDecimal(raw);
      let ch = Number(textOf(entry, "entry_channel", "0"));
      if (mapping.dali) {
        const group = textOf(entry, "entry_group", "");
        if (group !== "") ch = Number(group) + 1;
      }
      if (/^00-00-B0-[0-9A-F]{2}$/.test(id) && ch > 0 && !senderByChannel.has(ch)) {
        senderByChannel.set(ch, id);
      }
    }

    for (let i = 0; i < channelCount; i++) {
      const channelNumber = i + 1;
      const channel = channels.find(c => Number(c.getAttribute("channelnumber")) === channelNumber);
      const group = groups.find(g => Number(g.getAttribute("groupnumber")) === i);
      const channelDesc = channel?.getAttribute("description")?.trim() || group?.getAttribute("description")?.trim() || "";
      // PCT14-Series-14-Geräte werden in der grimmpp-Integration als Busadresse
      // 00-00-00-xx geführt. Die Gateway-base_id bleibt beim Gateway selbst.
      const devId = busIdFromAddress(address + i);
      const p = profileFor(mapping.eep);
      const fallbackSenderId = p.needs_sender ? busIdFromAddress(0xB000 + address + i) : "";
      // Für Series-14-Busgeräte muss die Sender-ID dem Bus-Offset entsprechen.
      // PCT14-Einträge können bei Mehrkanalgeräten je nach Funktion mehrfach vorkommen
      // und sind dafür nicht zuverlässiger als Adresse + Kanaloffset.
      const senderId = fallbackSenderId || senderByChannel.get(channelNumber) || "";
      if (p.needs_sender && !senderId) missingSender++;

      imported.push({
        ...emptyForm,
        name: channelDesc || `${normalizePct14ModelName(model)} ${devId}${channelCount > 1 ? ` (${channelNumber}/${channelCount})` : ""}`,
        dev_id: devId,
        eep: mapping.eep,
        platform: mapping.platform,
        device_type: normalizePct14ModelName(model),
        model: normalizePct14ModelName(model),
        eltako: normalizePct14ModelName(model),
        room: `PCT14 Adresse ${address}${channelCount > 1 ? ` · Kanal ${channelNumber}` : ""}${mapping.dali ? " · DALI-Gateway" : ""}${mapping.rgbw ? " · RGBW-Profil" : ""}`,
        sender_id: senderId,
        sender_eep: mapping.sender_eep ?? p.sender_eep ?? "",
        device_class: mapping.platform === "cover" ? "shutter" : "",
        time_opens: mapping.time_opens ?? "",
        time_closes: mapping.time_closes ?? "",
        min_target_temperature: mapping.min_target_temperature ?? "",
        max_target_temperature: mapping.max_target_temperature ?? "",
        meter_tariffs: mapping.meter_tariffs ?? "",
      });
    }
  }

  return {
    baseId,
    devices: imported.filter(d => d.dev_id),
    unsupported,
    missingSender,
    extraGateways,
    hasFam14Gateway,
    hasFgw14Gateway,
  };
}

// ─── Empty form ───────────────────────────────────────────────────
const emptyForm = { name:"", dev_id:"", eep:"A5-04-02", room:"", device_class:"", sender_id:"", sender_eep:"", time_opens:"", time_closes:"", min_target_temperature:"", max_target_temperature:"", device_type:"", model:"", eltako:"" };
const emptyGW   = { type:"fam-usb", base_id:"", serial_path:"", lan_address:"" };

// ─── App ──────────────────────────────────────────────────────────
export default function App() {
  const [step, setStep]       = useState(1); // 1=gateway, 2=devices, 3=yaml
  const [gateway, setGateway] = useState(emptyGW);
  const [devices, setDevices] = useState([]);
  const [extraGateways, setExtraGateways] = useState([]);
  const [form, setForm]       = useState(emptyForm);
  const [editIdx, setEditIdx] = useState(null);
  const [errors, setErrors]   = useState({});
  const [yaml, setYaml]       = useState("");
  const [copied, setCopied]   = useState(false);
  const [ports, setPorts]     = useState([]);
  const [detecting, setDetecting] = useState(false);
  const [disconnectingGateway, setDisconnectingGateway] = useState(false);
  const [detectMsg, setDetectMsg] = useState("");
  const [importMsg, setImportMsg] = useState("");
  const [learningId, setLearningId] = useState(false);
  const [learnMsg, setLearnMsg] = useState("");
  const [importFam14Gateway, setImportFam14Gateway] = useState(true);
  const [importFgw14Gateway, setImportFgw14Gateway] = useState(true);
  const [pct14DetectedFam14, setPct14DetectedFam14] = useState(false);
  const [pct14DetectedFgw14, setPct14DetectedFgw14] = useState(false);
  const [pct14GatewayBaseId, setPct14GatewayBaseId] = useState("");
  const [writeBusPort, setWriteBusPort] = useState("");
  const [writeTargetGatewayKey, setWriteTargetGatewayKey] = useState("");
  const [writingSenders, setWritingSenders] = useState(false);
  const [writeSenderMsg, setWriteSenderMsg] = useState("");
  const [writeSenderLog, setWriteSenderLog] = useState([]);
  const [projectMsg, setProjectMsg] = useState("");
  const [projectFileName, setProjectFileName] = useState("");

  const isElectron = typeof window !== "undefined" && window.electronAPI?.isElectron;

  const buildProjectDocument = () => ({
    project_format: "eedtoy-project",
    schema_version: 1,
    app_version: APP_VERSION,
    saved_at: new Date().toISOString(),
    state: {
      step,
      gateway,
      devices,
      extraGateways,
      form,
      editIdx,
      yaml,
      importFam14Gateway,
      importFgw14Gateway,
      pct14DetectedFam14,
      pct14DetectedFgw14,
      pct14GatewayBaseId,
      writeBusPort,
      writeTargetGatewayKey,
    },
  });

  const showProjectMessage = (message, timeout = 10000) => {
    setProjectMsg(message);
    if (timeout > 0) setTimeout(() => setProjectMsg(""), timeout);
  };

  const handleSaveProjectAs = async () => {
    if (!isElectron) {
      showProjectMessage("✗ Projektdateien können nur in der installierten EEDTOY-Desktop-App gespeichert werden.");
      return;
    }
    const suggestedName = projectFileName
      ? projectFileName.replace(/\.(eedtoy|json)$/i, "")
      : `EEDTOY-Projekt-${new Date().toISOString().slice(0, 10)}`;
    const result = await window.electronAPI.saveProjectAs({
      project: buildProjectDocument(),
      suggestedName,
      currentFileName: projectFileName,
    });
    if (result?.canceled) return;
    if (!result?.ok) {
      showProjectMessage(`✗ Projekt konnte nicht gespeichert werden: ${result?.error || "Unbekannter Fehler"}`);
      return;
    }
    setProjectFileName(result.fileName || "EEDTOY-Projekt.eedtoy");
    showProjectMessage(`✓ Projekt gespeichert: ${result.fileName || result.path}`);
  };

  const handleOpenProject = async () => {
    if (!isElectron) {
      showProjectMessage("✗ Projektdateien können nur in der installierten EEDTOY-Desktop-App geöffnet werden.");
      return;
    }
    const result = await window.electronAPI.openProject();
    if (result?.canceled) return;
    if (!result?.ok) {
      showProjectMessage(`✗ Projekt konnte nicht geöffnet werden: ${result?.error || "Unbekannter Fehler"}`);
      return;
    }

    const project = result.project || {};
    const state = project.state || {};
    const loadedDevices = Array.isArray(state.devices) ? state.devices : [];
    const loadedGateways = Array.isArray(state.extraGateways) ? state.extraGateways : [];
    const loadedStep = [1, 2, 3].includes(Number(state.step)) ? Number(state.step) : 1;
    const loadedEditIdx = Number.isInteger(state.editIdx) && state.editIdx >= 0 && state.editIdx < loadedDevices.length
      ? state.editIdx
      : null;

    setGateway(state.gateway && typeof state.gateway === "object" ? { ...emptyGW, ...state.gateway } : emptyGW);
    setDevices(loadedDevices);
    setExtraGateways(loadedGateways);
    setForm(state.form && typeof state.form === "object" ? { ...emptyForm, ...state.form } : emptyForm);
    setEditIdx(loadedEditIdx);
    setYaml(typeof state.yaml === "string" ? state.yaml : "");
    setImportFam14Gateway(state.importFam14Gateway !== false);
    setImportFgw14Gateway(state.importFgw14Gateway !== false);
    setPct14DetectedFam14(Boolean(state.pct14DetectedFam14));
    setPct14DetectedFgw14(Boolean(state.pct14DetectedFgw14));
    setPct14GatewayBaseId(typeof state.pct14GatewayBaseId === "string" ? state.pct14GatewayBaseId : "");
    setWriteBusPort(typeof state.writeBusPort === "string" ? state.writeBusPort : "");
    setWriteTargetGatewayKey(typeof state.writeTargetGatewayKey === "string" ? state.writeTargetGatewayKey : "");
    setErrors({});
    setCopied(false);
    setImportMsg("");
    setDetectMsg("");
    setLearnMsg("");
    setWriteSenderMsg("");
    setWriteSenderLog([]);
    setStep(loadedStep === 3 && !state.yaml ? 2 : loadedStep);
    setProjectFileName(result.fileName || "EEDTOY-Projekt.eedtoy");

    const sourceVersion = project.app_version && project.app_version !== APP_VERSION
      ? ` (erstellt mit v${project.app_version}, in v${APP_VERSION} geöffnet)`
      : "";
    showProjectMessage(`✓ Projekt geöffnet: ${result.fileName}${sourceVersion}`, 14000);
  };

  const handleScanPorts = async () => {
    if (!isElectron) return;
    const found = await window.electronAPI.listPorts();
    setPorts(found);
    if (found.length > 0) {
      setGateway(g => ({ ...g, serial_path: found[0].path }));
      setDetectMsg(`✓ ${found.length} serieller Port gefunden: ${found.map(p => p.path).join(', ')}`);
    } else {
      setDetectMsg('✗ Kein serieller Port gefunden. Du kannst COM-Port manuell eintippen, z.B. COM3.');
    }
    setTimeout(() => setDetectMsg(''), 8000);
  };

  const handleDetectBaseId = async () => {
  if (!isElectron) return;
  setDetecting(true);
  setDetectMsg("Verbinde mit Gateway...");
  const gw = GATEWAY_TYPES.find(g => g.value === gateway.type);
  const baud = gw?.baud || 57600;
  const proto = gw?.proto || "auto";
  const result = await window.electronAPI.readBaseId(gateway.serial_path, baud, proto);
  setDetecting(false);
  if (result.ok && result.baseId) {
    setGateway(g => ({ ...g, base_id: result.baseId, serial_path: result.portPath || g.serial_path }));
    setDetectMsg(`✓ Base-ID erkannt: ${result.baseId} (${result.protocol || proto}, ${result.baudRate || baud} baud${result.bridge ? ", " + result.bridge : ""})`);
  } else if (result.ok && (result.gatewayType === "fgw14usb" || result.detectedWithoutBaseId)) {
    setGateway(g => ({ ...g, type:"fgw14usb", serial_path: result.portPath || g.serial_path }));
    setDetectMsg(`✓ FGW14-USB erkannt auf ${result.portPath || gateway.serial_path}. Die Base-ID bitte aus PCT14 übernehmen oder manuell eintragen.`);
  } else {
    setDetectMsg("✗ " + result.error);
  }
  setTimeout(() => setDetectMsg(""), 12000);
};

  const handleAutoDetectGateway = async () => {
  if (!isElectron) return;
  setDetecting(true);
  setDetectMsg("Suche Gateway auf allen seriellen Ports...");
  const result = await window.electronAPI.detectGateway(gateway.serial_path);
  setDetecting(false);

  if (result.ports) setPorts(result.ports);

  if (result.ok) {
    const gw = result.gateway;
    setGateway(g => ({
      ...g,
      type: gw.type,
      serial_path: gw.serial_path,
      base_id: gw.base_id || g.base_id,
    }));
    const baseText = gw.base_id ? `, Base-ID ${gw.base_id}` : "";
    const baseHint = gw.type === "fgw14usb" && !gw.base_id
      ? " · Base-ID bitte aus PCT14 übernehmen oder manuell eintragen."
      : "";
    setDetectMsg(`✓ Gateway erkannt: ${gw.label} auf ${gw.serial_path}${baseText} (${gw.protocol}, ${gw.baudRate} baud${result.bridge ? ", " + result.bridge : ""})${baseHint}`);
  } else {
    const tried = result.attempts?.length ? ` Getestete Varianten: ${result.attempts.length}.` : "";
    setDetectMsg("✗ " + result.error + tried);
  }
  setTimeout(() => setDetectMsg(""), 12000);
};

  const handleDisconnectGateway = async () => {
    if (!isElectron) return;
    const port = (gateway.serial_path || "").trim();
    if (!port) {
      setDetectMsg("✗ Kein COM-Port eingetragen. Bitte zuerst den FAM14/FGW14-USB Port auswählen oder eintragen.");
      setTimeout(() => setDetectMsg(""), 9000);
      return;
    }

    if (!["fam14", "fgw14usb"].includes(gateway.type)) {
      setDetectMsg("ℹ Für diesen Gateway-Typ ist kein RS485-Bus-Disconnect notwendig. Ein Disconnect ist vor allem für FAM14/FGW14-USB vorgesehen.");
      setTimeout(() => setDetectMsg(""), 9000);
      return;
    }

    setDisconnectingGateway(true);
    setDetectMsg("Trenne RS485-Bus sauber und gebe den COM-Port frei …");
    const result = await window.electronAPI.disconnectGateway({
      portPath: port,
      gatewayType: gateway.type,
      baudRate: 57600,
    });
    setDisconnectingGateway(false);

    if (result.ok) {
      setDetectMsg("✓ RS485-Bus wurde sauber freigegeben. COM-Port ist geschlossen.");
    } else {
      setDetectMsg("✗ Disconnect fehlgeschlagen: " + (result.error || "Unbekannter Fehler"));
    }
    setTimeout(() => setDetectMsg(""), 10000);
  };

  const handleLearnDeviceId = async () => {
    if (!isElectron) {
      setLearnMsg("✗ ID Auto Detect funktioniert nur in der Electron-App, nicht im Browser.");
      return;
    }
    if (!gateway.serial_path?.trim()) {
      setLearnMsg("✗ Kein serieller Port eingetragen. Bitte zuerst im Gateway-Schritt COM-Port auswählen oder manuell eintragen.");
      return;
    }
    setLearningId(true);
    setLearnMsg("Höre 20 Sekunden auf EnOcean-Telegramme … jetzt Taste drücken oder Teach-in/LRN auslösen.");
    const result = await window.electronAPI.learnDeviceId(gateway.serial_path, gateway.type, 20000);
    setLearningId(false);
    if (result.ok && result.id) {
      setForm(f => ({ ...f, dev_id: result.id }));
      setLearnMsg(`✓ Geräte-ID erkannt: ${result.id}${result.rorg ? ` (RORG ${result.rorg})` : ""}`);
      setTimeout(() => setLearnMsg(""), 10000);
    } else {
      setLearnMsg("✗ " + (result.error || "Keine Geräte-ID erkannt."));
      setTimeout(() => setLearnMsg(""), 12000);
    }
  };

  const profile = profileFor(form.eep);

  const changeEep = (eep) => {
    const p = profileFor(eep);
    setForm(f => ({
      ...f,
      eep,
      device_class: p.default_dc ?? "",
      sender_eep: p.sender_eep ?? "",
      sender_id: p.needs_sender ? (f.sender_id || autoSenderIdForGateway(gateway, devices)) : ""
    }));
    setErrors({});
  };

  const validate = (f) => {
    const e = {};
    if (!f.name.trim()) e.name = "Pflichtfeld";
    if (!f.dev_id.trim()) e.dev_id = "Pflichtfeld";
    else if (!/^[0-9a-fA-F]{2}(-[0-9a-fA-F]{2}){3}$/.test(f.dev_id.trim()))
      e.dev_id = "Format: FF-AA-BB-CC";
    if (profile.needs_sender) {
      if (!f.sender_id.trim()) e.sender_id = "Keine Base-ID für automatische Sender-ID gesetzt";
      else if (!/^[0-9a-fA-F]{2}(-[0-9a-fA-F]{2}){3}$/.test(f.sender_id.trim()))
        e.sender_id = "Format: FF-AA-BB-CC";
    }
    return e;
  };

  const handleAdd = () => {
    const autoSender = profile.needs_sender ? autoSenderIdForGateway(gateway, devices) : "";
    const entry = {
      ...form,
      sender_id: profile.needs_sender ? (form.sender_id.trim() || autoSender) : "",
      sender_eep: profile.needs_sender ? (form.sender_eep || profile.sender_eep || "") : "",
      platform: profile.platform ?? "sensor",
      device_type: form.device_type || profile.eltako || "",
      model: form.model || profile.eltako || "",
      eltako: form.eltako || profile.eltako || ""
    };
    const e = validate(entry);
    const duplicateIndex = devices.findIndex((existing, index) =>
      index !== editIdx && duplicateDeviceKey(existing) && duplicateDeviceKey(existing) === duplicateDeviceKey(entry)
    );
    if (duplicateIndex >= 0) {
      e.dev_id = isFbhOperatingMode(entry)
        ? `Diese Geräte-ID ist bereits mit dem anderen FBH/TF-Betriebsmodus als „${devices[duplicateIndex].name}“ vorhanden. Pro physischem Gerät darf nur ein Modus exportiert werden.`
        : `Diese Geräte-ID mit EEP ${exportEepForDevice(entry)} ist bereits als „${devices[duplicateIndex].name}“ vorhanden.`;
    }
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});

    const nextDevices = editIdx !== null
      ? devices.map((x,i) => i===editIdx ? entry : x)
      : [...devices, entry];
    setDevices(nextDevices);

    if (editIdx !== null) setEditIdx(null);

    const nextEmpty = { ...emptyForm, eep: form.eep };
    const nextProfile = profileFor(form.eep);
    if (nextProfile.needs_sender) {
      nextEmpty.sender_eep = nextProfile.sender_eep ?? "";
      nextEmpty.sender_id = autoSenderIdForGateway(gateway, nextDevices);
    }
    setForm(nextEmpty);
  };



  const handleImportFam14GatewayToggle = (checked) => {
    setImportFam14Gateway(checked);
    setExtraGateways(existing => {
      let next = existing.filter(gw => gw.source !== "pct14-rootdevice");
      if (checked && pct14DetectedFam14 && pct14GatewayBaseId) {
        next = [...next, { type:"fam14", base_id:pct14GatewayBaseId, source:"pct14-rootdevice" }];
      }
      return next;
    });
  };

  const handleImportFgw14GatewayToggle = (checked) => {
    setImportFgw14Gateway(checked);
    setExtraGateways(existing => {
      let next = existing.filter(gw => gw.source !== "pct14-fgw14");
      if (checked && pct14DetectedFgw14 && pct14GatewayBaseId) {
        next = [...next, { type:"fgw14usb", base_id:pct14GatewayBaseId, source:"pct14-fgw14" }];
      }
      return next;
    });
  };

  const readTextFileUtf8 = async (file) => {
    const buffer = await file.arrayBuffer();
    return new TextDecoder("utf-8", { fatal: false }).decode(buffer);
  };

  const handlePct14Import = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const text = await readTextFileUtf8(file);
      const result = parsePct14Xml(text, gateway.base_id, {
        includeFam14Gateway: importFam14Gateway,
        includeFgw14Gateway: importFgw14Gateway,
      });
      setPct14DetectedFam14(Boolean(result.hasFam14Gateway));
      setPct14DetectedFgw14(Boolean(result.hasFgw14Gateway));
      setPct14GatewayBaseId(result.baseId || "");
      if (result.baseId && !gateway.base_id && gateway.type === "fam14" && !importFam14Gateway) {
        setGateway(g => ({ ...g, base_id: result.baseId }));
      }
      setExtraGateways(existing => {
        // PCT14-importierte Gateways werden bei jedem Import neu aus der XML-Option gebildet.
        // Damit wirkt die Checkbox zuverlässig: Ist sie aus, wird ein zuvor importiertes FAM14
        // aus dem YAML-Export wieder entfernt. Manuell/anderweitig gesetzte Gateways bleiben erhalten.
        const merged = existing.filter(gw => gw.source !== "pct14-rootdevice" && gw.source !== "pct14-fgw14");
        for (const gw of (result.extraGateways || [])) {
          if (!merged.some(x => x.type === gw.type && (x.base_id || "") === (gw.base_id || ""))) merged.push(gw);
        }
        return merged;
      });
      if (!result.devices.length) {
        setImportMsg(`✗ Keine unterstützten Geräte in ${file.name} gefunden.`);
        return;
      }
      setDevices(existing => [...existing, ...result.devices]);
      const unsupportedText = result.unsupported.length ? ` Nicht importiert: ${[...new Set(result.unsupported)].slice(0, 8).join(", ")}${result.unsupported.length > 8 ? " …" : ""}.` : "";
      const senderText = result.missingSender ? ` Bei ${result.missingSender} Aktor-Kanälen wurde keine 00-00-B0-xx Sender-ID in PCT14 gefunden.` : "";
      const importNoun = result.devices.length === 1 ? "Gerät/Kanal" : "Geräte/Kanäle";
      setImportMsg(`✓ ${result.devices.length} ${importNoun} aus ${file.name} importiert.${result.baseId ? ` Base-ID: ${result.baseId}.` : ""}${senderText}${unsupportedText}`);
      setTimeout(() => setImportMsg(""), 20000);
    } catch (err) {
      setImportMsg(`✗ Import fehlgeschlagen: ${err.message || err}`);
    }
  };

  const handleEdit   = (i) => { setForm({...devices[i]}); setEditIdx(i); setErrors({}); window.scrollTo({top:0,behavior:"smooth"}); };
  const handleDelete = (i) => { setDevices(d => d.filter((_,j)=>j!==i)); if(editIdx===i){setEditIdx(null);setForm(emptyForm);} };
  const handleDeleteAllDevices = () => {
    if (!devices.length) return;
    const ok = window.confirm(`Alle ${devices.length} Geräte aus der Liste löschen? Die Gateway-Einstellungen bleiben erhalten.`);
    if (!ok) return;
    setDevices([]);
    setEditIdx(null);
    setForm(emptyForm);
    setErrors({});
    setImportMsg("✓ Geräteliste wurde geleert.");
    setTimeout(() => setImportMsg(""), 6000);
  };

  const buildActiveExtraGateways = () => {
    const active = extraGateways.filter(gw => gw.source !== "pct14-rootdevice" && gw.source !== "pct14-fgw14");
    if (importFam14Gateway && pct14DetectedFam14 && pct14GatewayBaseId) {
      active.push({ type:"fam14", base_id:pct14GatewayBaseId, source:"pct14-rootdevice" });
    }
    if (importFgw14Gateway && pct14DetectedFgw14 && pct14GatewayBaseId) {
      active.push({ type:"fgw14usb", base_id:pct14GatewayBaseId, source:"pct14-fgw14" });
    }
    return active;
  };

  const handleGenerate = () => {
    const normalized = normalizeFksSenderAssignments(gateway, devices, pct14GatewayBaseId);
    if (normalized.changed || normalized.devices.length !== devices.length) setDevices(normalized.devices);
    setYaml(generateYaml(gateway, normalized.devices, buildActiveExtraGateways(), pct14GatewayBaseId));
    setStep(3);
  };
  const handleCopy = () => { navigator.clipboard.writeText(yaml); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  const handleDL   = () => {
    const b = new Blob([yaml],{type:"text/yaml"});
    const u = URL.createObjectURL(b);
    const a = document.createElement("a"); a.href=u; a.download="eltako_config.yaml"; a.click();
    URL.revokeObjectURL(u);
  };

  const activeGatewayBlocks = orderedGatewayBlocks(gateway, buildActiveExtraGateways());
  const selectedWriteGateway = activeGatewayBlocks.find(gw => gatewayKey(gw) === writeTargetGatewayKey) || activeGatewayBlocks[0];
  const senderProgrammingEntries = buildSenderProgrammingEntries(devices, selectedWriteGateway, pct14GatewayBaseId);
  const busWritePort = (writeBusPort || gateway.serial_path || "").trim();
  const busWriteGatewayConnected = ["fam14", "fgw14usb"].includes(gateway.type) && Boolean(busWritePort);
  const busWriteHint = "Sender-IDs können nur über einen verbundenen FAM14 oder FGW14-USB am RS485-Bus geschrieben werden. Der COM-Port muss dieser RS485-Busanschluss sein. Das Schreiben der Sende Id in die Aktoren ist mit dem FAM-USB nicht möglich. PCT14 und Home Assistant dürfen den Bus währenddessen nicht verwenden.";
  const canWriteSenderIds = !writingSenders && busWriteGatewayConnected && senderProgrammingEntries.length > 0;

  const handleWriteSenderIds = async () => {
    if (!isElectron) {
      setWriteSenderMsg("✗ Sender-IDs schreiben funktioniert nur in der Electron-App.");
      return;
    }
    if (!selectedWriteGateway) {
      setWriteSenderMsg("✗ Kein Gateway für die Sender-IDs ausgewählt.");
      return;
    }
    const port = busWritePort;
    if (!["fam14", "fgw14usb"].includes(gateway.type)) {
      setWriteSenderMsg("✗ Sender-IDs können nur über einen verbundenen FAM14 oder FGW14-USB am RS485-Bus geschrieben werden. Bitte im Gateway-Schritt FAM14/FGW14-USB auswählen und verbinden.");
      return;
    }
    if (!port) {
      setWriteSenderMsg("✗ Kein Bus-COM-Port eingetragen. Bitte den COM-Port vom FAM14/FGW14-USB eintragen.");
      return;
    }
    if (!pct14GatewayBaseId) {
      setWriteSenderMsg("✗ Keine PCT14/FAM14-Base-ID vorhanden. Bitte zuerst PCT14-XML importieren.");
      return;
    }
    if (!senderProgrammingEntries.length) {
      setWriteSenderMsg("✗ Keine Series-14-Aktoren mit Sender-ID gefunden.");
      return;
    }
    const ok = window.confirm(`Wichtiger Hinweis vor dem Schreiben der Sender-IDs\n\nDiese Funktion funktioniert nur mit einem verbundenen FAM14 oder FGW14-USB am RS485-Bus.\nDer COM-Port muss der RS485-Busanschluss sein.\nDas Schreiben der Sende Id in die Aktoren ist mit dem FAM-USB nicht möglich.\n\nPCT14 und Home Assistant müssen während des Schreibens geschlossen bzw. getrennt sein, damit niemand parallel auf den Bus zugreift.\n\nBus-Port: ${port}\nSender-Gateway: ${selectedWriteGateway.type} ${selectedWriteGateway.base_id || ""}\nEinträge: ${senderProgrammingEntries.length}\n\nJetzt Wirklich in die Baureihe 14-Aktoren schreiben?`);
    if (!ok) return;

    setWritingSenders(true);
    setWriteSenderLog([]);
    setWriteSenderMsg(`Schreibe ${senderProgrammingEntries.length} Sender-IDs in Baureihe-14-Aktoren …`);
    const result = await window.electronAPI.writeSenderIdsToDevices({
      portPath: port,
      gatewayType: "fam14",
      baudRate: 57600,
      targetGateway: selectedWriteGateway,
      entries: senderProgrammingEntries,
    });
    setWritingSenders(false);
    setWriteSenderLog(result.events || []);
    if (result.ok) {
      const c = result.counts || {};
      setWriteSenderMsg(`✓ Fertig. Geschrieben: ${c.updated || 0}, bereits vorhanden: ${c.exists || 0}, nicht unterstützt: ${c.unsupported || 0}, Fehler: ${c.error || 0}.`);
    } else {
      setWriteSenderMsg("✗ " + (result.error || "Sender-ID Schreiben fehlgeschlagen."));
    }
  };

  return (
    <div className="appShell">
      <style>{`
        :root{
          --bg:#eef2f5;
          --sidebar:#003b5c;
          --sidebar-2:#005f8f;
          --panel:#ffffff;
          --panel-soft:#f7f9fb;
          --line:#d6dee6;
          --line-strong:#b9c7d3;
          --text:#1f2937;
          --muted:#667485;
          --muted-2:#8a96a3;
          --brand:#0079a9;
          --brand-dark:#005c82;
          --brand-soft:#e6f6fb;
          --accent:#f2a900;
          --ok:#20845a;
          --danger:#b42318;
        }
        *{box-sizing:border-box}
        body{margin:0;background:var(--bg);font-family:'Segoe UI','Segoe UI Symbol',Arial,sans-serif;color:var(--text)}
        ::-webkit-scrollbar{width:8px;height:8px}
        ::-webkit-scrollbar-track{background:#edf1f4}
        ::-webkit-scrollbar-thumb{background:#aebbc7;border-radius:8px}
        .appShell{min-height:100vh;display:grid;grid-template-columns:280px minmax(0,1fr);background:var(--bg)}
        .sidebar{background:linear-gradient(180deg,var(--sidebar),#002d46);color:#dbe5ee;display:flex;flex-direction:column;border-right:1px solid #00263a;min-height:100vh;position:sticky;top:0}
        .brandBlock{padding:1.35rem 1.25rem 1.1rem;border-bottom:1px solid rgba(255,255,255,.08)}
        .brandKicker{font-size:.68rem;text-transform:uppercase;letter-spacing:.16em;color:#7fb2c7;font-weight:700;margin-bottom:.45rem}
        .brandTitle{font-size:1.2rem;font-weight:800;letter-spacing:-.02em;color:#fff}
        .brandSub{margin-top:.35rem;font-size:.76rem;color:#98a9b8;line-height:1.45}
        .navSteps{padding:1rem .85rem;display:flex;flex-direction:column;gap:.35rem}
        .step{display:grid;grid-template-columns:28px 1fr;align-items:center;gap:.65rem;padding:.7rem .75rem;border-radius:10px;cursor:pointer;color:#a8b7c5;border:1px solid transparent;transition:background .15s,border .15s,color .15s}
        .step:hover{background:rgba(255,255,255,.06);color:#fff}
        .step.active{background:#243344;border-color:#33536a;color:#fff}
        .step.done{color:#bde8d3;background:rgba(32,132,90,.12)}
        .stepBadge{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:800;background:#0f1720;border:1px solid rgba(255,255,255,.12);color:#91a2b3}
        .step.active .stepBadge{background:#00a3d7;color:white;border-color:#7bd7f2}
        .step.done .stepBadge{background:var(--ok);color:white;border-color:#51b686}
        .stepText{font-size:.86rem;font-weight:700}.stepHint{font-size:.68rem;color:#7f91a2;margin-top:.15rem;font-weight:500}
        .sideStatus{margin-top:auto;padding:1rem 1.25rem;border-top:1px solid rgba(255,255,255,.08);font-size:.72rem;color:#95a7b7;line-height:1.6}
        .workspace{min-width:0;display:flex;flex-direction:column}
        .topbar{height:74px;background:#fff;border-bottom:3px solid var(--brand);display:flex;align-items:center;justify-content:space-between;padding:0 1.75rem;position:sticky;top:0;z-index:5}
        .pageTitle{font-size:1.05rem;font-weight:800;color:#111827}.pageSub{font-size:.76rem;color:var(--muted);margin-top:.18rem}
        .topMeta{display:flex;align-items:center;gap:.5rem;font-size:.72rem;color:var(--muted)}
        .projectActions{flex-wrap:wrap;justify-content:flex-end}.projectActions .btn{white-space:nowrap;padding:.48rem .72rem;font-size:.76rem}
        .statusPill{border:1px solid var(--line);background:var(--panel-soft);border-radius:999px;padding:.32rem .62rem;color:#405061;font-weight:700}
        .content{padding:1.5rem 1.75rem 2rem;max-width:1260px;width:100%;margin:0 auto}
        input,select{font-family:'Segoe UI','Segoe UI Symbol',Arial,sans-serif;background:#fff;border:1px solid var(--line-strong);color:var(--text);padding:.62rem .75rem;border-radius:7px;font-size:.88rem;width:100%;outline:none;transition:border .15s,box-shadow .15s;text-rendering:optimizeLegibility;-webkit-font-smoothing:antialiased}
        input:focus,select:focus{border-color:var(--brand);box-shadow:0 0 0 3px rgba(0,107,143,.13)}
        input.err{border-color:var(--danger);box-shadow:0 0 0 3px rgba(180,35,24,.10)}
        label{display:block;font-size:.72rem;color:#53616f;margin-bottom:.32rem;letter-spacing:.02em;font-weight:700}
        code{font-family:'Cascadia Mono','Consolas',monospace;background:#eef2f5;border:1px solid #d9e0e7;border-radius:4px;padding:.05rem .25rem;color:#245873}
        .em{color:var(--danger);font-size:.7rem;margin-top:.25rem}
        .card{background:var(--panel)!important;border:1px solid var(--line)!important;border-radius:12px!important;overflow:hidden;box-shadow:0 2px 10px rgba(22,34,45,.05)}
        .sectionHead{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1rem 1.15rem;border-bottom:1px solid var(--line);background:#fbfcfd}
        .sectionTitle{font-size:.86rem;font-weight:800;color:#1f2937}.sectionText{font-size:.72rem;color:var(--muted);margin-top:.15rem}
        .btn{font-family:'Segoe UI','Segoe UI Symbol',Arial,sans-serif;cursor:pointer;border-radius:7px;font-size:.82rem;padding:.58rem 1rem;transition:background .15s,border .15s,transform .08s,box-shadow .15s;border:1px solid transparent;font-weight:700;background:#fff}
        .btn:hover{transform:translateY(-1px)}.btn:disabled{opacity:.55;cursor:not-allowed;transform:none}
        .pri{background:var(--brand);color:#fff;box-shadow:none}.pri:hover{background:var(--brand-dark)}
        .ghost{background:#fff;color:var(--brand);border:1px solid #b9cbd6}.ghost:hover{background:var(--brand-soft);border-color:#8fb0c2}
        .del{background:#fff;color:var(--danger);border:1px solid #f1b7b1;padding:.32rem .7rem;font-size:.75rem}.del:hover{background:#fff0ee;border-color:#e2857a}
        .edit{background:#fff;color:#53616f;border:1px solid var(--line);padding:.32rem .7rem;font-size:.75rem}.edit:hover{border-color:#8fb0c2;color:var(--brand);background:var(--brand-soft)}
        .rh:hover{background:#f8fafb!important}
        select optgroup{color:var(--brand);font-style:normal;font-weight:800;background:#fff}
        select option{background:#fff;color:var(--text);font-family:'Segoe UI','Segoe UI Symbol',Arial,sans-serif}
        .gatewayGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:.75rem}
        .gatewayTile{padding:.85rem;border-radius:9px;cursor:pointer;transition:all .15s;border:1px solid var(--line);background:#fff;color:var(--text)}
        .gatewayTile:hover{border-color:#8fb0c2;background:#f8fbfd}
        .gatewayTile.active{border-color:var(--brand);background:var(--brand-soft);box-shadow:inset 4px 0 0 var(--brand)}
        .gatewayName{font-weight:800;font-size:.82rem;color:#17212b;margin-bottom:.22rem}
        .gatewayDesc{font-size:.67rem;color:#607080;line-height:1.35}
        .gatewayTile.active .gatewayName{color:#003f55}
        .gatewayTile.active .gatewayDesc{color:#426273}
        .twoCol{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:1rem;align-items:start}
        @media (max-width: 920px){.appShell{grid-template-columns:1fr}.sidebar{position:relative;min-height:auto}.navSteps{flex-direction:row;overflow:auto}.sideStatus{display:none}.twoCol{grid-template-columns:1fr}.topbar{position:relative;height:auto;min-height:74px;align-items:flex-start;gap:.75rem;padding-top:.85rem;padding-bottom:.85rem;flex-direction:column}.projectActions{justify-content:flex-start}.content{padding:1rem}}
      `}</style>

      <aside className="sidebar">
        <div className="brandBlock">
          <div className="brandKicker">ELTAKO · ENOCEAN · YAML</div>
          <div className="brandTitle">EEDTOY</div>
          <div className="brandSub">ELTAKO EnOcean Device to YAML Generator</div>
        </div>
        <div className="navSteps">
          {[
            {n:1,label:"Gateway",hint:"Port & Base-ID"},
            {n:2,label:"Geräte",hint:"Import & Zuordnung"},
            {n:3,label:"YAML",hint:"Export für HA"},
          ].map(s=>(
            <div key={s.n} className={`step ${step===s.n?"active":step>s.n?"done":"inactive"}`} onClick={()=>{ if(s.n<3||yaml) setStep(s.n); }}>
              <span className="stepBadge">{step>s.n?"✓":s.n}</span>
              <span><div className="stepText">{s.label}</div><div className="stepHint">{s.hint}</div></span>
            </div>
          ))}
        </div>
        <div className="sideStatus">
          <div><strong>Gateway:</strong> {gateway.type}</div>
          <div><strong>Base-ID:</strong> {gateway.base_id || "nicht gesetzt"}</div>
          <div><strong>Geräte:</strong> {devices.length}</div>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <div className="pageTitle">{step===1?"Gateway einrichten":step===2?"Geräte verwalten":"YAML exportieren"}</div>
            <div className="pageSub">{step===1?"Automatische Erkennung oder manuelle Auswahl":step===2?"PCT14 importieren, IDs erkennen und Geräte bearbeiten":"Konfiguration für Home Assistant prüfen und herunterladen"}</div>
          </div>
          <div className="topMeta projectActions">
            {projectFileName&&<span className="statusPill" title="Geöffnete oder zuletzt gespeicherte Projektdatei">{projectFileName}</span>}
            <button className="btn ghost" onClick={handleOpenProject} disabled={!isElectron} title="Gespeichertes EEDTOY-Projekt öffnen">Projekt öffnen</button>
            <button className="btn pri" onClick={handleSaveProjectAs} disabled={!isElectron} title="Aktuellen Bearbeitungsstand als EEDTOY-Projekt speichern">Projekt speichern unter …</button>
            <span className="statusPill">{devices.length} Geräte</span>
          </div>
        </header>
        <div className="content">
        {projectMsg&&(
          <div style={{marginBottom:"1rem",padding:".72rem .9rem",borderRadius:8,border:`1px solid ${projectMsg.startsWith("✓")?"#9fd3b7":projectMsg.startsWith("✗")?"#f1b7b1":"#b9cbd6"}`,background:projectMsg.startsWith("✓")?"#effaf4":projectMsg.startsWith("✗")?"#fff0ee":"#eef5f8",color:projectMsg.startsWith("✓")?"#17633d":projectMsg.startsWith("✗")?"#9c251c":"#245873",fontSize:".76rem",fontWeight:650,lineHeight:1.5}}>
            {projectMsg}
          </div>
        )}
        {/* ─── STEP 1: GATEWAY ─── */}
        {step===1&&(
          <div className="card" style={{padding:"1.25rem"}}>
            <div style={{fontSize:".72rem",color:"#53616f",marginBottom:"1rem",fontWeight:600}}>Gateway auswählen</div>

            {/* Gateway type cards */}
            <div className="gatewayGrid" style={{marginBottom:"1rem"}}>
              {GATEWAY_TYPES.map(gw=>(
                <div key={gw.value} onClick={()=>setGateway(g=>({...g,type:gw.value}))}
                  className={`gatewayTile ${gateway.type===gw.value ? "active" : ""}`}>
                  <div className="gatewayName">{gw.label}</div>
                  <div className="gatewayDesc">{gw.desc}</div>
                </div>
              ))}
            </div>

            {isElectron && (
              <div style={{margin:".8rem 0 1rem",display:"flex",gap:".6rem",alignItems:"center",flexWrap:"wrap"}}>
                <button className="btn ghost" onClick={handleAutoDetectGateway} disabled={detecting || disconnectingGateway}>
                  {detecting ? "Suche Gateway..." : "Gateway automatisch erkennen"}
                </button>
                <button
                  className="btn ghost"
                  onClick={handleDisconnectGateway}
                  disabled={detecting || disconnectingGateway || !gateway.serial_path?.trim() || !["fam14","fgw14usb"].includes(gateway.type)}
                  title={!["fam14","fgw14usb"].includes(gateway.type)
                    ? "Disconnect ist für FAM14 oder FGW14-USB am RS485-Bus vorgesehen."
                    : !gateway.serial_path?.trim()
                      ? "Bitte zuerst den COM-Port vom FAM14/FGW14-USB eintragen."
                      : "Sendet Bus-Disconnect/Bus-Freigabe und schließt den COM-Port sauber."}
                >
                  {disconnectingGateway ? "Trenne..." : "Disconnect / Bus freigeben"}
                </button>
                <div style={{fontSize:".68rem",color:"#64748b"}}>
                  Testet alle erkannten seriellen Ports. Ein manuell eingetragener COM-Port wird zuerst geprüft. Vor dem Abziehen oder Wechseln eines FAM14 oder FGW14-USB bitte „Disconnect / Bus freigeben“ ausführen.
                </div>
              </div>
            )}

            {/* Dynamic fields based on selected gateway */}
            {(()=>{
              const gw = GATEWAY_TYPES.find(g=>g.value===gateway.type);
              return (
                <div style={{display:"grid",gridTemplateColumns:"minmax(300px,1fr) minmax(360px,1.2fr) minmax(260px,1fr)",gap:".75rem",marginBottom:"1rem",alignItems:"start"}}>
                  {gw?.has_serial&&(
                    <div>
                      <label>Serieller Port</label>
                      <div style={{display:"flex",gap:".4rem"}}>
                        <input
                          value={gateway.serial_path}
                          onChange={e=>setGateway(g=>({...g,serial_path:e.target.value}))}
                          placeholder="z.B. COM3"
                          list="serial-port-list"
                          style={{flex:1}}
                        />
                        <datalist id="serial-port-list">
                          {ports.map(p=>(
                            <option key={p.path} value={p.path}>{p.manufacturer?`${p.path} — ${p.manufacturer}`:p.path}</option>
                          ))}
                        </datalist>
                        {isElectron&&(
                          <button className="btn ghost" style={{padding:".4rem .7rem",fontSize:".7rem",whiteSpace:"nowrap"}} onClick={handleScanPorts}>Suchen</button>
                        )}
                      </div>
                      <div style={{fontSize:".62rem",color:"#6b7280",marginTop:".2rem"}}>
                        {isElectron ? "Suchen Klicken um alle Ports zu suchen" : "z.B. /dev/ttyUSB0 oder COM3"}
                      </div>
                    </div>
                  )}
                  {gw?.has_base_id&&(
                    <div>
                      <label>Base-ID</label>
                      <div style={{display:"flex",gap:".4rem"}}>
                        <input value={gateway.base_id} onChange={e=>setGateway(g=>({...g,base_id:e.target.value}))} placeholder="FF-AA-80-00" style={{flex:"0 0 150px",minWidth:150}}/>
                        {isElectron&&(
                          <button className="btn ghost" style={{padding:".4rem .9rem",fontSize:".72rem",whiteSpace:"nowrap",minWidth:142}} onClick={handleDetectBaseId} disabled={detecting}>
                            {detecting ? (gateway.type==="fgw14usb" ? "Prüfe Gateway..." : "Lese Base ID...") : (gateway.type==="fgw14usb" ? "Gateway prüfen" : "Base ID auslesen")}
                          </button>
                        )}
                      </div>
                      <div style={{fontSize:".62rem",color:"#6b7280",marginTop:".2rem"}}>
                        {isElectron ? (gateway.type==="fgw14usb" ? "Gateway prüfen; Base-ID aus PCT14 übernehmen oder manuell eintragen" : "Automatisch vom Gateway auslesen") : "Steht auf der Rückseite des Geräts"}
                      </div>
                    </div>
                  )}
                  {gw?.has_lan&&(
                    <div>
                      <label>IP-Adresse</label>
                      <input value={gateway.lan_address} onChange={e=>setGateway(g=>({...g,lan_address:e.target.value}))} placeholder="192.168.1.100"/>
                      <div style={{fontSize:".62rem",color:"#6b7280",marginTop:".2rem"}}>Port 5100 wird automatisch gesetzt</div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Detect status message */}
            {detectMsg&&(
              <div style={{fontSize:".72rem",padding:".5rem .75rem",borderRadius:5,marginBottom:"1rem",
                background: detectMsg.startsWith("✓")?"#14532d22":"#450a0a22",
                color: detectMsg.startsWith("✓")?"#22c55e":"#f87171",
                border: `1px solid ${detectMsg.startsWith("✓")?"#14532d":"#450a0a"}`}}>
                {detectMsg}
              </div>
            )}

            <div style={{background:"#eef5f8",border:"1px solid #c6d9e4",borderRadius:7,padding:".75rem",marginBottom:"1.2rem",fontSize:".7rem",color:"#64748b",lineHeight:1.8}}>
              <strong style={{color:"#53616f"}}>Setup in Home Assistant:</strong><br/>
              1. HACS installieren (falls noch nicht vorhanden)<br/>
              2. Eltako Integration über HACS als Custom Repository hinzufügen<br/>
              3. Integration "Eltako" in HA aktivieren → Gateway wird erkannt<br/>
              4. Generierte YAML in <code style={{color:"#245873"}}>/config/configuration.yaml</code> einfügen
            </div>

            <button className="btn pri" onClick={()=>setStep(2)}>Weiter → Geräte hinzufügen</button>
          </div>
        )}

        {/* ─── STEP 2: DEVICES ─── */}
        {step===2&&(
          <>

            {/* PCT14 Import */}
            <div className="card" style={{padding:"1.1rem",marginBottom:"1rem"}}>
              <div style={{fontSize:".72rem",color:"#53616f",marginBottom:".7rem",fontWeight:600}}>⬆ PCT14-Export importieren</div>
              <div style={{fontSize:".68rem",color:"#64748b",lineHeight:1.7,marginBottom:".8rem"}}>
                Importiert unterstützte Series-14-Aktoren aus einer PCT14-XML/HTML-Exportdatei und fügt sie unten als Geräte hinzu. Unterstützt u. a. FSB14, FUD14, FRGBW14, FSR14, FHK14, FD2G14, FWG14MS, FWZ14 und DSZ14. Wenn die Datei ein FAM14 oder ein FGW14 enthält, erscheinen danach passende Gateway-Optionen.
              </div>
              {(pct14DetectedFam14 || pct14DetectedFgw14) && (
                <div style={{border:"1px solid #c6d9e4",background:"#f2f8fb",borderRadius:8,padding:".7rem .8rem",marginBottom:".85rem"}}>
                  <div style={{fontSize:".68rem",color:"#53616f",fontWeight:800,marginBottom:".55rem"}}>Aus PCT14 erkannt</div>
                  {pct14DetectedFam14 && (
                    <label style={{display:"flex",alignItems:"center",gap:".55rem",fontSize:".72rem",color:"#405061",fontWeight:700,marginBottom:pct14DetectedFgw14?".55rem":0}}>
                      <input
                        type="checkbox"
                        checked={importFam14Gateway}
                        onChange={e=>handleImportFam14GatewayToggle(e.target.checked)}
                        style={{width:"auto",margin:0}}
                      />
                      FAM14 als Gateway nutzen
                    </label>
                  )}
                  {pct14DetectedFgw14 && (
                    <label style={{display:"flex",alignItems:"center",gap:".55rem",fontSize:".72rem",color:"#405061",fontWeight:700,marginBottom:0}}>
                      <input
                        type="checkbox"
                        checked={importFgw14Gateway}
                        onChange={e=>handleImportFgw14GatewayToggle(e.target.checked)}
                        style={{width:"auto",margin:0}}
                      />
                      FGW14-USB als Gateway nutzen
                    </label>
                  )}
                </div>
              )}
              <label className="btn ghost" style={{display:"inline-block",width:"auto"}}>
                Datei auswählen
                <input type="file" accept=".xml,.html,.htm,text/xml,text/html" onChange={handlePct14Import} style={{display:"none"}} />
              </label>
              {importMsg&&(
                <div style={{fontSize:".72rem",padding:".5rem .75rem",borderRadius:5,marginTop:".8rem",
                  background: importMsg.startsWith("✓")?"#14532d22":"#450a0a22",
                  color: importMsg.startsWith("✓")?"#22c55e":"#f87171",
                  border: `1px solid ${importMsg.startsWith("✓")?"#14532d":"#450a0a"}`}}>
                  {importMsg}
                </div>
              )}
            </div>

            {/* Form */}
            <div className="card" style={{padding:"1.1rem",marginBottom:"1rem"}}>
              <div style={{fontSize:".72rem",color:"#53616f",marginBottom:".9rem",fontWeight:600}}>
                {editIdx!==null ? `✏️  Gerät #${editIdx+1} bearbeiten` : "＋  Gerät hinzufügen"}
              </div>

              {/* Name · ID · Raum */}
              <div style={{display:"grid",gridTemplateColumns:"minmax(180px,1fr) minmax(340px,1.4fr) minmax(180px,1fr)",gap:".65rem",marginBottom:".65rem"}}>
                <div>
                  <label>Name</label>
                  <input className={errors.name?"err":""} value={form.name} onChange={e=>{setForm(f=>({...f,name:e.target.value})); setErrors({});}} placeholder="z.B. Wohnzimmer Fenster"/>
                  {errors.name&&<div className="em">{errors.name}</div>}
                </div>
                <div>
                  <label>Geräte-ID</label>
                  <div style={{display:"flex",gap:".35rem"}}>
                    <input className={errors.dev_id?"err":""} value={form.dev_id} onChange={e=>{setForm(f=>({...f,dev_id:e.target.value})); setErrors({});}} placeholder="FF-AA-BB-CC" style={{flex:1,minWidth:170}}/>
                    <button className="btn ghost" onClick={handleLearnDeviceId} disabled={learningId} title="Hört auf ein EnOcean-Telegramm und übernimmt die Sender-ID" style={{width:"auto",whiteSpace:"nowrap",padding:".55rem .7rem"}}>
                      {learningId ? "…" : "ID Auto Detect"}
                    </button>
                  </div>
                  {errors.dev_id&&<div className="em">{errors.dev_id}</div>}
                  {learnMsg&&<div style={{fontSize:".65rem",marginTop:".35rem",color:learnMsg.startsWith("✓")?"#22c55e":learnMsg.startsWith("✗")?"#f87171":"#2f6f8f",lineHeight:1.45}}>{learnMsg}</div>}
                </div>
                <div>
                  <label>Raum (optional)</label>
                  <input value={form.room} onChange={e=>setForm(f=>({...f,room:e.target.value}))} placeholder="z.B. Wohnzimmer"/>
                </div>
              </div>

              {/* EEP */}
              <div style={{marginBottom:".65rem"}}>
                <label>Gerät / EEP — alle Eltako-Geräte</label>
                <select value={form.eep} onChange={e=>changeEep(e.target.value)}>
                  {GROUPS.map(g=>(
                    <optgroup key={g} label={`── ${g}`}>
                      {Object.entries(EEP_DB).filter(([,v])=>v.group===g).map(([k,v])=>(
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Info */}
              {profile.eltako&&(
                <div style={{fontSize:".7rem",color:"#2f6f8f",background:"#eef5f8",border:"1px solid #c6d9e4",borderRadius:5,padding:".38rem .7rem",marginBottom:".65rem",lineHeight:1.5}}>
                   <strong>{profile.eltako}</strong>
                  {"  "}<span style={{color:PC[profile.platform]??""}}>{PI[profile.platform]??""} {profile.platform}</span>
                </div>
              )}

              {/* device_class */}
              {profile.device_classes&&(
                <div style={{maxWidth:220,marginBottom:".65rem"}}>
                  <label>Device Class</label>
                  <select value={form.device_class} onChange={e=>setForm(f=>({...f,device_class:e.target.value}))}>
                    {profile.device_classes.map(dc=><option key={dc} value={dc}>{dc}</option>)}
                  </select>
                </div>
              )}

              {/* Sender */}
              {profile.needs_sender&&(
                <div style={{background:"#eef5f8",border:"1px solid #c6d9e4",borderRadius:7,padding:".75rem",marginBottom:".65rem"}}>
                  <div style={{fontSize:".66rem",color:"#2f6f8f",marginBottom:".5rem",fontWeight:600}}>
                    Sender-ID — automatisch vergeben
                  </div>
                  <div style={{fontSize:".65rem",color:"#6b7280",marginBottom:".5rem"}}>
                    Wird aus der Gateway-Base-ID automatisch hochgezählt. Du kannst den Wert bei Bedarf manuell ändern.
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:".6rem"}}>
                    <div>
                      <label>Sender-ID</label>
                      <input className={errors.sender_id?"err":""} value={form.sender_id || (profile.needs_sender ? autoSenderIdForGateway(gateway, devices) : "")} onChange={e=>{setForm(f=>({...f,sender_id:e.target.value})); setErrors({});}} placeholder={autoSenderIdForGateway(gateway, devices) || `${gateway.base_id.slice(0,-2)}01`}/>
                      {errors.sender_id&&<div className="em">{errors.sender_id}</div>}
                    </div>
                    <div>
                      <label>Sender EEP</label>
                      <input value={form.sender_eep||profile.sender_eep||""} onChange={e=>setForm(f=>({...f,sender_eep:e.target.value}))} placeholder={profile.sender_eep}/>
                    </div>
                    {profile.platform==="cover"&&<>
                      <div><label>Zeit Öffnen (s)</label><input type="number" value={form.time_opens} onChange={e=>setForm(f=>({...f,time_opens:e.target.value}))} placeholder="25"/></div>
                      <div><label>Zeit Schließen (s)</label><input type="number" value={form.time_closes} onChange={e=>setForm(f=>({...f,time_closes:e.target.value}))} placeholder="24"/></div>
                    </>}
                  </div>
                </div>
              )}

              <div style={{display:"flex",gap:".55rem"}}>
                <button className="btn pri" onClick={handleAdd}>{editIdx!==null?"Speichern":"Hinzufügen"}</button>
                {editIdx!==null&&<button className="btn ghost" onClick={()=>{setEditIdx(null);setForm(emptyForm);setErrors({});}}>Abbrechen</button>}
              </div>
            </div>

            {/* Device list */}
            {devices.length>0?(
              <div className="card" style={{marginBottom:"1rem"}}>
                <div style={{padding:".8rem 1.1rem",borderBottom:"1px solid #d9e0e7",display:"flex",justifyContent:"space-between",alignItems:"center",gap:".75rem"}}>
                  <span style={{fontSize:".75rem",color:"#53616f"}}>
                    Geräte <strong style={{color:"#2f6f8f"}}>{devices.length}</strong>
                  </span>
                  <div style={{display:"flex",gap:".45rem",alignItems:"center"}}>
                    <button className="btn del" onClick={handleDeleteAllDevices}>Alles löschen</button>
                    <button className="btn pri" onClick={handleGenerate}>YAML generieren</button>
                  </div>
                </div>
                {devices.map((d,i)=>{
                  const col = PC[d.platform]??"#2f6f8f";
                  return(
                    <div key={i} className="rh" style={{display:"flex",alignItems:"center",gap:".65rem",padding:".65rem 1.1rem",borderBottom:i<devices.length-1?"1px solid #d9e0e7":"none"}}>
                      <span style={{fontSize:".6rem",padding:".12rem .4rem",borderRadius:3,background:col+"20",color:col,fontWeight:600,flexShrink:0,whiteSpace:"nowrap"}}>{PI[d.platform]} {d.platform}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{color:"#111827",fontWeight:600,fontSize:".82rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.name}</div>
                        <div style={{color:"#6b7280",fontSize:".68rem"}}>{d.dev_id} · {d.eep.replace(/-sw$/,"")}{d.room?" · "+d.room:""}</div>
                      </div>
                      <div style={{display:"flex",gap:".35rem",flexShrink:0}}>
                        <button className="btn edit" onClick={()=>handleEdit(i)}>Edit</button>
                        <button className="btn del" onClick={()=>handleDelete(i)}>✕</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ):(
              <div style={{textAlign:"center",padding:"2rem",border:"1px dashed #b9c7d3",borderRadius:10,marginBottom:"1rem",color:"#8a96a3"}}>
                <div style={{fontSize:"1.8rem",marginBottom:".3rem"}}>📡</div>
                <div style={{fontSize:".78rem"}}>Noch keine Geräte. Oben eintragen.</div>
              </div>
            )}

            <div style={{display:"flex",gap:".5rem"}}>
              <button className="btn ghost" onClick={()=>setStep(1)}>← Gateway</button>
              {devices.length>0&&<button className="btn pri" onClick={handleGenerate}>YAML generieren</button>}
            </div>
          </>
        )}

        {/* ─── STEP 3: YAML ─── */}
        {step===3&&(
          <>
            <div className="card" style={{marginBottom:"1rem",padding:"1rem 1.1rem"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"1rem",flexWrap:"wrap",marginBottom:".8rem"}}>
                <div>
                  <div style={{fontSize:".82rem",fontWeight:700,color:"#1f2937"}}>HA Sender-IDs in Series-14-Aktoren schreiben</div>
                  <div style={{fontSize:".68rem",color:"#667485",marginTop:".25rem",lineHeight:1.55}}>
                    Schreibt die Sender-IDs aus dem YAML direkt in die Aktoren am FAM14/FGW14-USB Bus. Danach kennen die Aktoren Home Assistant und reagieren auf die HA-Telegramme.
                  </div>
                </div>
                <span className="statusPill">{senderProgrammingEntries.length} Sender</span>
              </div>
              <div title={!busWriteGatewayConnected ? busWriteHint : ""} style={{opacity:busWriteGatewayConnected?1:.48,cursor:busWriteGatewayConnected?"default":"not-allowed"}}>
                <div style={{display:"grid",gridTemplateColumns:"minmax(210px,1fr) minmax(210px,1fr) auto",gap:".65rem",alignItems:"end"}}>
                  <div>
                    <label>Bus-COM-Port FAM14/FGW14-USB</label>
                    <input disabled={!busWriteGatewayConnected && !["fam14","fgw14usb"].includes(gateway.type)} value={writeBusPort || gateway.serial_path} onChange={e=>setWriteBusPort(e.target.value)} placeholder="z.B. COM3" list="serial-port-list"/>
                    <div style={{fontSize:".62rem",color:"#6b7280",marginTop:".2rem"}}>Nicht der FAM-USB Funkstick, sondern der RS485-Busanschluss.</div>
                  </div>
                  <div>
                    <label>Sender-IDs aus Gateway</label>
                    <select disabled={!busWriteGatewayConnected} value={gatewayKey(selectedWriteGateway)} onChange={e=>setWriteTargetGatewayKey(e.target.value)}>
                      {activeGatewayBlocks.map((gw, idx)=>(
                        <option key={`${gatewayKey(gw)}-${idx}`} value={gatewayKey(gw)}>{gw.type} {gw.base_id ? `(${gw.base_id})` : ""}</option>
                      ))}
                    </select>
                  </div>
                  <button className="btn pri" onClick={handleWriteSenderIds} disabled={!canWriteSenderIds} style={{whiteSpace:"nowrap"}} title={!busWriteGatewayConnected ? busWriteHint : ""}>
                    {writingSenders ? "Schreibe …" : "In Aktoren schreiben"}
                  </button>
                </div>
              </div>
              {!busWriteGatewayConnected&&<div style={{fontSize:".68rem",marginTop:".65rem",padding:".5rem .7rem",borderRadius:5,background:"#fff7ed",color:"#9a3412",border:"1px solid #fed7aa"}}>⚠ Sender-IDs schreiben ist deaktiviert: Es muss ein FAM14 oder FGW14-USB als RS485-Bus-Gateway verbunden und ein COM-Port eingetragen sein. Das Schreiben der Sende Id in die Aktoren ist mit dem FAM-USB nicht möglich.</div>}
              {writeSenderMsg&&<div style={{fontSize:".72rem",marginTop:".75rem",padding:".5rem .7rem",borderRadius:5,background:writeSenderMsg.startsWith("✓")?"#14532d22":writeSenderMsg.startsWith("✗")?"#450a0a22":"#eef5f8",color:writeSenderMsg.startsWith("✓")?"#166534":writeSenderMsg.startsWith("✗")?"#b42318":"#2f6f8f",border:"1px solid #c6d9e4"}}>{writeSenderMsg}</div>}
              {writeSenderLog.length>0&&(
                <div style={{marginTop:".75rem",maxHeight:170,overflowY:"auto",fontSize:".66rem",lineHeight:1.5,color:"#53616f",background:"#f7f9fb",border:"1px solid #d9e0e7",borderRadius:6,padding:".55rem .7rem"}}>
                  {writeSenderLog.slice(-80).map((e,i)=><div key={i}>{e.message || `${e.status}: ${e.device_id}`}</div>)}
                </div>
              )}
            </div>

            <div className="card" style={{marginBottom:"1rem"}}>
              <div style={{padding:".8rem 1.1rem",borderBottom:"1px solid #d9e0e7",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:".5rem"}}>
                <span style={{fontSize:".8rem",color:"#53616f"}}>eltako_config.yaml — {devices.length} Gerät{devices.length!==1?"e":""}</span>
                <div style={{display:"flex",gap:".5rem"}}>
                  <button className="btn ghost" onClick={handleCopy}>{copied?"✓ Kopiert":"Kopieren"}</button>
                  <button className="btn pri"   onClick={handleDL}>↓ Download</button>
                </div>
              </div>

              {/* Hint */}
              <div style={{padding:".7rem 1.1rem",borderBottom:"1px solid #d9e0e7",background:"#eef5f8",fontSize:".7rem",color:"#53616f",lineHeight:1.7}}>
                Inhalt in <code style={{color:"#245873"}}>/config/configuration.yaml</code> einfügen · danach HA neu starten
              </div>

              <pre style={{margin:0,padding:"1.1rem",fontSize:".73rem",lineHeight:1.85,color:"#53616f",overflowX:"auto",maxHeight:540,overflowY:"auto"}}>
                {yaml.split("\n").map((line,i)=>{
                  let c="#53616f";
                  if(line.startsWith("#")) c="#7c8794";
                  else if(/^eltako:/.test(line)) c="#2f6f8f";
                  else if(/^\s+(gateway|devices|binary_sensor|sensor|light|switch|cover|climate):/.test(line)) c="#2f6f8f";
                  else if(/^\s+- id:|^\s+eep:|^\s+name:|^\s+device_class:|^\s+base_id:|^\s+device_type:/.test(line)) c="#245873";
                  else if(/^\s+(sender|comment|time_):/.test(line)) c="#2f6f8f";
                  else if(line.includes(":")) c="#53616f";
                  return <span key={i} style={{color:c}}>{line}{"\n"}</span>;
                })}
              </pre>
            </div>

            <button className="btn ghost" onClick={()=>setStep(2)}>← Geräte bearbeiten</button>
          </>
        )}

        <div style={{marginTop:"1.2rem",fontSize:".68rem",color:"#8a96a3",lineHeight:1.55}}>
          <div>EEDTOY – ELTAKO EnOcean Device to YAML Generator</div>
          <div>Developed by D. Zirnbauer · Not an official product of ELTAKO GmbH</div>
        </div>
        </div>
      </main>
    </div>
  );
}
