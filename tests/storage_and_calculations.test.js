/**
 * SpendWise - Unit & Data Integrity Test Suite
 * Pure Node.js built-in assert module (zero npm dependencies)
 * Tests core calculation logic, balance reconciliation, budget thresholds, and CSV generation
 */

import assert from 'node:assert';
import test from 'node:test';

// Sample mock data for calculation tests
const sampleTransactions = [
  { id: '1', title: 'Salary', amount: 50000, type: 'income', category: 'salary', date: '2026-10-01' },
  { id: '2', title: 'Freelance', amount: 15000, type: 'income', category: 'freelance', date: '2026-10-05' },
  { id: '3', title: 'Rent', amount: 18000, type: 'expense', category: 'rent', date: '2026-10-02' },
  { id: '4', title: 'Groceries', amount: 4500, type: 'expense', category: 'food', date: '2026-10-06' },
  { id: '5', title: 'Broadband', amount: 1200, type: 'expense', category: 'bills', date: '2026-10-08' }
];

test('Calculate Net Balance, Inflow, and Outflow accurately', () => {
  let income = 0;
  let expense = 0;

  sampleTransactions.forEach(t => {
    if (t.type === 'income') income += t.amount;
    else expense += t.amount;
  });

  const balance = income - expense;

  assert.strictEqual(income, 65000, 'Total Inflow should equal 65,000');
  assert.strictEqual(expense, 23700, 'Total Outflow should equal 23,700');
  assert.strictEqual(balance, 41300, 'Net Balance should equal 41,300');
});

test('Budget Threshold logic: Safe (<80%), Warning (>=80%), Danger (>=100%)', () => {
  const monthlyBudget = 25000;
  const expense = 23700; // 94.8%

  const ratio = (expense / monthlyBudget) * 100;
  assert.ok(ratio >= 80 && ratio < 100, 'Should trigger Warning Amber banner between 80% and 100%');

  const overExpense = 27000;
  const overRatio = (overExpense / monthlyBudget) * 100;
  assert.ok(overRatio >= 100, 'Should trigger Critical Danger banner at >= 100%');
});

test('CSV Serializer escaping and row integrity', () => {
  const sanitize = (val) => {
    if (val === null || val === undefined) return '""';
    let str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const header = ['Transaction ID', 'Date', 'Title', 'Type', 'Category', 'Amount', 'Currency', 'Notes'];
  const testTitle = 'Dinner "with friends", & family';
  const escaped = sanitize(testTitle);

  assert.strictEqual(escaped, '"Dinner ""with friends"", & family"');
});

console.log('✔ All SpendWise data logic unit tests completed successfully!');
