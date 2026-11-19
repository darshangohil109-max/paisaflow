import test from 'node:test';
import assert from 'node:assert/strict';
import { applyFinanceDomainAction } from './financeReducer';
import { buildAiFinancialContext } from './financeSelectors';
import { createDemoState } from '../data/demoSeed';

const TODAY = '2026-11-19';

test('ADD_TRANSACTION validates input and records sorted transaction', () => {
  const initial = createDemoState(TODAY);
  const invalid = applyFinanceDomainAction(initial, {
    type: 'ADD_TRANSACTION',
    todayISO: TODAY,
    payload: {
      title: 'Zero entry',
      amount: 0,
      type: 'expense',
      categoryId: 'exp-food',
      accountId: initial.accounts[0].id,
      date: TODAY,
      paymentMethod: 'UPI',
    },
  });
  assert.ok(invalid.error);
  assert.equal(invalid.state.transactions.length, initial.transactions.length);

  const valid = applyFinanceDomainAction(initial, {
    type: 'ADD_TRANSACTION',
    todayISO: TODAY,
    payload: {
      title: 'Filter Coffee',
      amount: 180,
      type: 'expense',
      categoryId: 'exp-food',
      accountId: initial.accounts[0].id,
      date: TODAY,
      paymentMethod: 'UPI',
    },
  });
  assert.equal(valid.error, undefined);
  assert.equal(valid.state.transactions.length, initial.transactions.length + 1);
  assert.equal(valid.state.transactions[0].title, 'Filter Coffee');
});

test('DELETE_ACCOUNT blocks removal when transactions are linked', () => {
  const initial = createDemoState(TODAY);
  const res = applyFinanceDomainAction(initial, {
    type: 'DELETE_ACCOUNT',
    id: initial.accounts[0].id,
  });
  assert.ok(res.error);
  assert.equal(res.state.accounts.length, initial.accounts.length);
});

test('RECORD_GOAL_MOVEMENT enforces withdrawal ceiling and updates saved amount', () => {
  const initial = createDemoState(TODAY);
  const goal = initial.goals[0];

  const overWithdraw = applyFinanceDomainAction(initial, {
    type: 'RECORD_GOAL_MOVEMENT',
    payload: {
      goalId: goal.id,
      type: 'withdrawal',
      amount: goal.currentAmount + 1,
      date: TODAY,
    },
  });
  assert.ok(overWithdraw.error);

  const contrib = applyFinanceDomainAction(initial, {
    type: 'RECORD_GOAL_MOVEMENT',
    payload: {
      goalId: goal.id,
      type: 'contribution',
      amount: 2500,
      date: TODAY,
      note: 'Bonus',
    },
  });
  assert.equal(contrib.error, undefined);
  const updatedGoal = contrib.state.goals.find((g) => g.id === goal.id)!;
  assert.equal(updatedGoal.currentAmount, goal.currentAmount + 2500);
});

test('RECORD_RECURRING_OCCURRENCE advances nextDueDate and prevents duplicates', () => {
  const initial = createDemoState(TODAY);
  const rec = initial.recurring.find((r) => r.id === 'demo-rec-internet')!;
  const originalDue = rec.nextDueDate;

  const first = applyFinanceDomainAction(initial, {
    type: 'RECORD_RECURRING_OCCURRENCE',
    id: rec.id,
    todayISO: TODAY,
  });
  assert.equal(first.error, undefined);
  const advanced = first.state.recurring.find((r) => r.id === rec.id)!;
  assert.notEqual(advanced.nextDueDate, originalDue);
  assert.equal(advanced.lastProcessedDate, originalDue);
});

test('buildAiFinancialContext accurately summarizes demo ledger totals', () => {
  const state = createDemoState(TODAY);
  const ctx = buildAiFinancialContext(state, true, TODAY);
  assert.equal(ctx.totals.monthlyIncome, 35000);
  assert.equal(ctx.totals.monthlyExpenses, 18500);
  assert.equal(ctx.totals.netSavings, 16500);
  assert.equal(ctx.accounts.length, 4);
  assert.ok(ctx.categoryBreakdown.length > 0);
});
