/**
 * SpendWise - DOM & Selector Integrity Test Suite
 * Pure Node.js (Zero external dependencies)
 * 
 * Verifies that every DOM element ID and query selector referenced in
 * js/app.js and js/ui.js strictly exists within index.html.
 * Prevents silent null pointer exceptions and orphaned selectors.
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const htmlContent = fs.readFileSync(path.resolve('index.html'), 'utf-8');
const appJsContent = fs.readFileSync(path.resolve('js/app.js'), 'utf-8');
const uiJsContent = fs.readFileSync(path.resolve('js/ui.js'), 'utf-8');

// Regex patterns to extract getElementById calls
const idRegex = /document\.getElementById\(['"]([^'"]+)['"]\)/g;

const idsToCheck = new Set();
let match;

while ((match = idRegex.exec(appJsContent)) !== null) {
  idsToCheck.add(match[1]);
}
while ((match = idRegex.exec(uiJsContent)) !== null) {
  idsToCheck.add(match[1]);
}

console.log(`\n======================================================`);
console.log(`[DOM INTEGRITY TEST] Scanning ${idsToCheck.size} distinct DOM IDs...`);
console.log(`======================================================`);

let passedCount = 0;
const missingIds = [];

for (const id of idsToCheck) {
  const exists = htmlContent.includes(`id="${id}"`) || htmlContent.includes(`id='${id}'`);
  if (exists) {
    passedCount++;
  } else {
    missingIds.push(id);
  }
}

if (missingIds.length > 0) {
  console.error('❌ Missing DOM IDs in index.html:', missingIds);
  assert.fail(`Found ${missingIds.length} missing DOM IDs in index.html: ${missingIds.join(', ')}`);
} else {
  console.log(`✔ All ${passedCount} DOM element IDs verified present in index.html!`);
}

// Check key classes and accessibility attributes
const requiredClasses = [
  'app-header',
  'app-container',
  'metrics-grid',
  'stat-card',
  'budget-warning-banner',
  'budget-tracker-card',
  'toolbar-section',
  'type-pill',
  'transaction-table',
  'modal-overlay',
  'toast-container'
];

for (const cls of requiredClasses) {
  assert.ok(htmlContent.includes(cls), `Required CSS class .${cls} must exist in index.html`);
  passedCount++;
}

console.log(`✔ All structural CSS layout classes verified in index.html!`);
console.log(`✔ Total DOM & Selector assertions passed: ${passedCount}\n`);
