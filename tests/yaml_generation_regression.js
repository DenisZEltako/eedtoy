const fs = require('fs');
const path = require('path');
const vm = require('vm');

function assert(condition, label) {
  if (!condition) throw new Error(label);
  console.log(`PASS: ${label}`);
}

function assertIncludes(value, expected, label) {
  if (!String(value).includes(expected)) {
    throw new Error(`${label}: missing ${JSON.stringify(expected)}`);
  }
  console.log(`PASS: ${label}`);
}

function assertNotIncludes(value, expected, label) {
  if (String(value).includes(expected)) {
    throw new Error(`${label}: unexpectedly contains ${JSON.stringify(expected)}`);
  }
  console.log(`PASS: ${label}`);
}

const appPath = path.join(__dirname, '..', 'src', 'App.jsx');
const appSource = fs.readFileSync(appPath, 'utf8');
const start = appSource.indexOf('const APP_VERSION');
const end = appSource.indexOf('export default function App()');
if (start < 0 || end < 0) throw new Error('Could not isolate App.jsx helper functions');

const helperSource = `${appSource.slice(start, end)}\nthis.__api = { APP_VERSION, EEP_DB, generateYaml, normalizeFksSenderAssignments, getPct14Mapping, deduplicateExportDevices };`;
const context = {
  console,
  Date,
  DOMParser: class UnsupportedDOMParser {},
  Blob: class UnsupportedBlob {},
  URL: {},
};
vm.createContext(context);
vm.runInContext(helperSource, context, { filename: 'src/App.helpers.jsx' });
const api = context.__api;

assert(api.APP_VERSION === '1.0.93', 'Application version is 1.0.93');
assert(Object.keys(api.EEP_DB).length === 64, 'Approved device profile count is 64');

const gateway = {
  type: 'fam14',
  base_id: 'FF-AA-BB-00',
  serial_path: 'COM9',
};

const devices = [
  {
    name: 'Wohnzimmer Dimmer',
    eep: 'A5-38-08-FUD14',
    platform: 'light',
    dev_id: '00-00-00-01',
    sender_id: 'FF-AA-BB-01',
    sender_eep: 'A5-38-08',
    room: 'Wohnzimmer',
  },
  {
    name: 'Heizkreis',
    eep: 'A5-10-06',
    platform: 'climate',
    dev_id: '00-00-00-02',
    sender_id: 'FF-AA-BB-02',
    sender_eep: 'A5-10-06',
    min_target_temperature: 16,
    max_target_temperature: 25,
  },
  {
    name: 'RGBW',
    eep: '07-37-F7-FRGBW14',
    platform: 'light',
    dev_id: '00-00-00-03',
    sender_id: 'FF-AA-BB-03',
    sender_eep: '07-37-F7',
  },
  {
    name: 'Raumregler FTR55ESB',
    eep: 'A5-10-06-FTR-FHK',
    platform: 'sensor',
    dev_id: '01-02-03-10',
  },
  {
    name: 'Heizanforderung FTR55ESB',
    eep: 'A5-38-08-FTR-TF61',
    platform: 'binary_sensor',
    dev_id: '01-02-03-11',
  },
  {
    name: 'FDG14 DALI',
    eep: 'A5-38-08-FDG14',
    platform: 'light',
    dev_id: '00-00-00-04',
    sender_id: 'FF-AA-BB-04',
    sender_eep: 'A5-38-08',
  },
];

const deYaml = api.generateYaml(gateway, devices, [], '', 'de');
assertIncludes(deYaml, '# Version: 1.0.93', 'German YAML version header');
assertIncludes(deYaml, '# Generiert:', 'German YAML timestamp label');
assertIncludes(deYaml, 'device_type: fam14', 'Gateway type export');
assertIncludes(deYaml, 'base_id: FF-AA-BB-00', 'Gateway base ID export');
assertIncludes(deYaml, 'temperature_unit: \'°C\'', 'Climate temperature unit remains Celsius');
assertIncludes(deYaml, 'min_target_temperature: 16', 'Climate minimum temperature');
assertIncludes(deYaml, 'max_target_temperature: 25', 'Climate maximum temperature');
assertIncludes(deYaml, '# FRGBW-Statussync:', 'German RGBW synchronization comment');
assertNotIncludes(deYaml, 'serial_path:', 'Serial path is not exported');
assertIncludes(deYaml, 'room_controller_mode: "fhk"', 'FTR FHK mode export');
assertIncludes(deYaml, 'min_target_temperature: 12', 'FTR minimum setpoint export');
assertIncludes(deYaml, 'max_target_temperature: 28', 'FTR maximum setpoint export');
assertIncludes(deYaml, 'frost_temperature: 8', 'FTR frost protection setpoint export');
assertIncludes(deYaml, 'room_controller_mode: "tf61"', 'FTR TF61 mode export');
assertIncludes(deYaml, 'hysteresis: 1', 'FTR TF61 hysteresis export');
assertIncludes(deYaml, 'name: "FDG14 DALI"', 'FDG14 device export');
assertIncludes(deYaml, 'dimming_speed: 0', 'FDG14 uses actuator-internal dimming speed by default');
assertIncludes(deYaml, 'eep: "A5-38-08"', 'FDG14 A5-38-08 export');
assert(api.getPct14Mapping('FDG14')?.eep === 'A5-38-08-FDG14', 'PCT14 maps FDG14 to the dedicated profile');
const roomControllerDedup = api.deduplicateExportDevices([
  { name: 'FTR FHK', eep: 'A5-10-06-FTR-FHK', dev_id: '01-02-03-20' },
  { name: 'FTR TF61', eep: 'A5-38-08-FTR-TF61', dev_id: '01-02-03-20' },
]);
assert(roomControllerDedup.devices.length === 1, 'Only one FTR operating mode is exported per physical ID');
assert(roomControllerDedup.devices[0].name === 'FTR TF61', 'The last selected FTR operating mode wins');

const enYaml = api.generateYaml(gateway, devices, [], '', 'en');
assertIncludes(enYaml, '# Generated:', 'English YAML timestamp label');
assertIncludes(enYaml, '# FRGBW status sync:', 'English RGBW synchronization comment');
assertIncludes(enYaml, '# This keeps the ELTAKO GFA5 app and Home Assistant synchronized.', 'English RGBW synchronization explanation');
assertNotIncludes(enYaml, '# FRGBW-Statussync:', 'English YAML contains no German RGBW comment');
assertNotIncludes(enYaml, 'serial_path:', 'English export also omits serial path');

const fksDevices = [
  {
    name: 'Valve 1',
    eep: 'A5-20-01-FKS-SV',
    platform: 'climate',
    dev_id: '01-02-03-04',
    sender_id: '',
    sender_eep: 'A5-20-01',
  },
  {
    name: 'Valve 2',
    eep: 'A5-20-01-FKS-SV',
    platform: 'climate',
    dev_id: '01-02-03-05',
    sender_id: '',
    sender_eep: 'A5-20-01',
  },
];
const normalized = api.normalizeFksSenderAssignments(gateway, fksDevices, '');
const ids = normalized.devices.map((device) => device.sender_id);
assert(ids.every(Boolean), 'FKS-SV devices receive persistent sender IDs');
assert(new Set(ids).size === ids.length, 'FKS-SV sender IDs are collision-free');

console.log('All YAML generation regression tests passed.');
