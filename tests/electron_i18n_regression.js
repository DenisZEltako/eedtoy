const fs = require('fs');
const path = require('path');
const { MAIN_MESSAGES, mainText, normalizeLanguage } = require('../electron/i18n-main');

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
  console.log(`PASS: ${label}`);
}

function assert(condition, label) {
  if (!condition) throw new Error(label);
  console.log(`PASS: ${label}`);
}

assertEqual(normalizeLanguage('en-US'), 'en', 'English locale normalization');
assertEqual(normalizeLanguage('de-DE'), 'de', 'German locale normalization');
assertEqual(mainText('en', 'project.saveDialogTitle'), 'Save EEDTOY project as', 'English save dialog title');
assertEqual(mainText('de', 'project.saveDialogTitle'), 'EEDTOY-Projekt speichern unter', 'German save dialog title');
assertEqual(
  mainText('en', 'about.detail', { version: '1.0.93' }),
  'Version 1.0.93\n\nDeveloped by D. Zirnbauer\nNot an official product of ELTAKO GmbH\n\nLicense: GPL-3.0-or-later',
  'English About dialog text',
);
assertEqual(
  mainText('de', 'about.detail', { version: '1.0.93' }),
  'Version 1.0.93\n\nEntwickelt von D. Zirnbauer\nKein offizielles Produkt der ELTAKO GmbH\n\nLizenz: GPL-3.0-or-later',
  'German About dialog text',
);

const deKeys = Object.keys(MAIN_MESSAGES.de).sort();
const enKeys = Object.keys(MAIN_MESSAGES.en).sort();
assertEqual(JSON.stringify(enKeys), JSON.stringify(deKeys), 'Main-process translation key parity');

const mainSource = fs.readFileSync(path.join(__dirname, '..', 'electron', 'main.js'), 'utf8');
assert(!mainSource.includes('MENU_TEXT'), 'Legacy menu translation table removed');
assert(mainSource.includes("title: t('project.saveDialogTitle')"), 'Save dialog uses selected language');
assert(mainSource.includes("title: t('project.openDialogTitle')"), 'Open dialog uses selected language');
assert(mainSource.includes("detail: t('about.detail'"), 'About dialog uses selected language');

console.log('All Electron main-process i18n regression tests passed.');
