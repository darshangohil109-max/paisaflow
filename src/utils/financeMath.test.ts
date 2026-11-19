import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateNextDueDate,
  calculateSummaryMetrics,
  computeAccountBalance,
  computeBudgetSpending,
  getDateRangeBounds,
  hasRecurringOccurrenceRecorded,
  transactionsToCsv,
  validateTransactionInput,
} from './financeMath';
import type { Account, Budget, Category, Transaction } from '../types/finance';

const sampleAccounts: Account[] = [
  {
    id: 'acc-hdfc',
    name: 'HDFC Bank',
    type: 'Bank Account',
    openingBalance: 10000,
    color: '#245C45',
    createdAt: '2026-01-01',
  },
  {
    id: 'acc-upi',
    name: 'UPI Wallet',
    type: 'UPI',
    openingBalance: 2000,
    color: '#75977F',
    createdAt: '2026-01-01',
  },
];

const sampleCategories: Category[] = [
  { id: 'cat-sal', name: 'Salary', type: 'income', icon: 'Briefcase', color: '#245C45' },
  { id: 'cat-food', name: 'Food & Dining', type: 'expense', icon: 'Utensils', color: '#D9B98C' },
];

const sampleTransactions: Transaction[] = [
  {
    id: 'tx-1',
    title: 'Monthly Salary',
    amount: 35000,
    type: 'income',
    categoryId: 'cat-sal',
    accountId: 'acc-hdfc',
    date: '2026-11-05',
    paymentMethod: 'Bank Transfer',
    createdAt: '2026-11-05',
  },
  {
    id: 'tx-2',
    title: 'Dinner Out',
    amount: 1500,
    type: 'expense',
    categoryId: 'cat-food',
    accountId: 'acc-upi',
    date: '2026-11-10',
    paymentMethod: 'UPI',
    createdAt: '2026-11-10',
  },
  {
    id: 'tx-3',
    title: 'Top up UPI',
    amount: 5000,
    type: 'transfer',
    categoryId: 'transfer',
    accountId: 'acc-hdfc',
    toAccountId: 'acc-upi',
    date: '2026-11-11',
    paymentMethod: 'UPI',
    createdAt: '2026-11-11',
  },
];

test('computeAccountBalance handles income, expense, and transfers accurately', () => {
  // HDFC: 10000 + 35000 - 5000 = 40000
  assert.equal(computeAccountBalance(sampleAccounts[0], sampleTransactions), 40000);
  // UPI: 2000 - 1500 + 5000 = 5500
  assert.equal(computeAccountBalance(sampleAccounts[1], sampleTransactions), 5500);
});

test('calculateSummaryMetrics excludes transfers from income and expenses', () => {
  const bounds = getDateRangeBounds('month', '2026-11-18');
  const budgets: Budget[] = [
    { id: 'b-all', name: 'Monthly Budget', categoryId: null, limit: 25000, period: 'monthly', monthKey: '2026-11' },
  ];
  const summary = calculateSummaryMetrics(
    sampleTransactions,
    sampleAccounts,
    budgets,
    bounds,
    '2026-11-18'
  );

  assert.equal(summary.totalBalance, 45500);
  assert.equal(summary.totalIncome, 35000);
  assert.equal(summary.totalExpenses, 1500);
  assert.equal(summary.netSavings, 33500);
  assert.equal(summary.budgetUtilizationPct, 6);
});

test('computeBudgetSpending detects overspending and remaining balance', () => {
  const budget: Budget = {
    id: 'b-food',
    name: 'Food Budget',
    categoryId: 'cat-food',
    limit: 1000,
    period: 'monthly',
    monthKey: '2026-11',
  };
  const result = computeBudgetSpending(budget, sampleTransactions, '2026-11');
  assert.equal(result.spent, 1500);
  assert.equal(result.remaining, -500);
  assert.equal(result.isOver, true);
});

test('recurring scheduling prevents duplicate recording and clamps month-end dates', () => {
  assert.equal(calculateNextDueDate('2026-01-31', 'monthly'), '2026-02-28');
  assert.equal(calculateNextDueDate('2026-11-18', 'weekly'), '2026-11-25');
  assert.equal(calculateNextDueDate('2026-11-18', 'yearly'), '2027-11-18');

  const recordedTx: Transaction = {
    id: 'tx-rec',
    title: 'Rent',
    amount: 8000,
    type: 'expense',
    categoryId: 'cat-food',
    accountId: 'acc-hdfc',
    date: '2026-11-01',
    paymentMethod: 'Auto-Debit',
    recurringId: 'rec-1',
    occurrenceDate: '2026-11-01',
    createdAt: '2026-11-01',
  };
  assert.equal(hasRecurringOccurrenceRecorded('rec-1', '2026-11-01', [recordedTx]), true);
  assert.equal(hasRecurringOccurrenceRecorded('rec-1', '2026-12-01', [recordedTx]), false);
});

test('transactionsToCsv escapes commas and quotes properly', () => {
  const csv = transactionsToCsv(
    [
      {
        ...sampleTransactions[1],
        title: 'Dinner, "Spice" Garden',
      },
    ],
    sampleCategories,
    sampleAccounts
  );
  assert.ok(csv.includes('"Dinner, ""Spice"" Garden"'));
  assert.ok(csv.includes('1500.00'));
});

test('validateTransactionInput rejects invalid amounts and identical transfer accounts', () => {
  assert.ok(
    validateTransactionInput({
      title: 'Test',
      amount: 0,
      type: 'expense',
      accountId: 'acc-hdfc',
      categoryId: 'cat-food',
      date: '2026-11-18',
    })
  );
  assert.ok(
    validateTransactionInput({
      title: 'Self transfer',
      amount: 500,
      type: 'transfer',
      accountId: 'acc-hdfc',
      toAccountId: 'acc-hdfc',
      categoryId: 'transfer',
      date: '2026-11-18',
    })
  );
  assert.equal(
    validateTransactionInput({
      title: 'Valid expense',
      amount: 450,
      type: 'expense',
      accountId: 'acc-hdfc',
      categoryId: 'cat-food',
      date: '2026-11-18',
    }),
    null
  );
});
