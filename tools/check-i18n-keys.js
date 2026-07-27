#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const LANGS = ['it', 'en', 'de', 'fr', 'es'];
const ROOT = path.resolve(__dirname, '..');
const I18N_DIR = path.join(ROOT, 'i18n');

function flatten(obj, prefix = '', out = []) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return out;
  for (const [key, value] of Object.entries(obj)) {
    const next = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) flatten(value, next, out);
    else out.push(next);
  }
  return out;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function main() {
  const dictionaries = {};
  const keySets = {};

  for (const lang of LANGS) {
    const filePath = path.join(I18N_DIR, `${lang}.json`);
    dictionaries[lang] = readJson(filePath);
    keySets[lang] = new Set(flatten(dictionaries[lang]));
  }

  const base = keySets.it;
  const report = [];
  let failed = false;

  for (const lang of LANGS) {
    if (lang === 'it') continue;

    const missing = [...base].filter(key => !keySets[lang].has(key));
    const extra = [...keySets[lang]].filter(key => !base.has(key));

    if (missing.length || extra.length) {
      failed = true;
      report.push({ lang, missing, extra });
    }
  }

  if (!failed) {
    console.log('i18n check OK: all language files are aligned with it.json');
    process.exit(0);
  }

  console.log('i18n check FAILED: key mismatches detected');
  report.forEach(item => {
    console.log(`\n[${item.lang}]`);
    if (item.missing.length) {
      console.log('  Missing keys:');
      item.missing.forEach(key => console.log(`   - ${key}`));
    }
    if (item.extra.length) {
      console.log('  Extra keys:');
      item.extra.forEach(key => console.log(`   - ${key}`));
    }
  });

  process.exit(1);
}

main();
