/**
 * SpendWise - Master Automated Test Runner
 * Pure Node.js (Zero external dependencies)
 * 
 * Orchestrates full test suites:
 * 1. Unit & Financial Invariant Tests
 * 2. DOM & Selector Integrity Tests
 * 3. Filter, Search & Sorting Fuzz Tests
 * 4. Recursive Stress & Fuzz Testing Harness
 * 
 * Usage:
 *   node tests/master_test_runner.js [iterations]
 * Example:
 *   node tests/master_test_runner.js 5
 */

import { execSync } from 'node:child_process';
import path from 'node:path';

const iterations = parseInt(process.argv[2] || '3', 10);

console.log(`\n=============================================================`);
console.log(`🚀 SPENDWISE MASTER RECURSIVE TEST RUNNER (Iterative QA Engine)`);
console.log(`Configured Recursive Iterations: ${iterations}`);
console.log(`Timestamp: ${new Date().toISOString()}`);
console.log(`=============================================================\n`);

const testSuites = [
  { name: 'Unit & Invariant Suite', script: 'tests/storage_and_calculations.test.js' },
  { name: 'DOM & Selector Integrity', script: 'tests/dom_integrity_test.js' },
  { name: 'Filter & Search Fuzzing', script: 'tests/filter_fuzz_test.js' },
  { name: 'Recursive Stress & Security', script: 'tests/recursive_stress_test.js' }
];

let totalPasses = 0;
let totalFailures = 0;
const overallStartTime = Date.now();

for (let iter = 1; iter <= iterations; iter++) {
  console.log(`\n▶ [ITERATION ${iter}/${iterations}] Running complete test matrix...`);
  const iterStartTime = Date.now();

  for (const suite of testSuites) {
    process.stdout.write(`  ⏳ Executing ${suite.name.padEnd(32)}: `);
    try {
      execSync(`node "${path.resolve(suite.script)}"`, {
        stdio: 'pipe',
        encoding: 'utf-8'
      });
      console.log(`PASSED ✔`);
      totalPasses++;
    } catch (err) {
      console.log(`FAILED ❌`);
      console.error(`\nError details from ${suite.script}:\n`, err.stderr || err.stdout || err.message);
      totalFailures++;
    }
  }

  const iterDuration = Date.now() - iterStartTime;
  console.log(`  ⏱ Iteration ${iter} finished in ${iterDuration}ms`);
}

const overallDuration = Date.now() - overallStartTime;

console.log(`\n=============================================================`);
console.log(`📊 MASTER TEST EXECUTION SUMMARY`);
console.log(`Total Test Runs: ${totalPasses + totalFailures}`);
console.log(`Successful Passes: ${totalPasses} ✔`);
console.log(`Failed Runs: ${totalFailures} ❌`);
console.log(`Total Time: ${(overallDuration / 1000).toFixed(2)}s`);
console.log(`Health Status: ${totalFailures === 0 ? '🟢 100% HEALTHY - ALL INVARIANTS SATISFIED' : '🔴 REGRESSION DETECTED'}`);
console.log(`=============================================================\n`);

if (totalFailures > 0) {
  process.exit(1);
}
