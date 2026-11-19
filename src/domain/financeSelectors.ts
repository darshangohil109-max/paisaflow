import type { FinanceState } from '../types/finance';
import {
  addMonthsClampedISO,
  buildCategoryBreakdown,
  calculateSummaryMetrics,
  computeAllAccountBalances,
  getDateRangeBounds,
} from '../utils/financeMath';

export interface AiFinancialContext {
  userName: string;
  isDemoMode: boolean;
  currency: string;
  dateRangeLabel: string;
  totals: {
    totalBalance: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    netSavings: number;
    savingsRate: number;
    previousMonthIncome: number;
    previousMonthExpenses: number;
  };
  categoryBreakdown: Array<{
    category: string;
    spent: number;
    budgetLimit?: number;
  }>;
  accounts: Array<{
    name: string;
    type: string;
    balance: number;
  }>;
  savingsGoals: Array<{
    name: string;
    currentAmount: number;
    targetAmount: number;
    targetDate: string;
  }>;
  recurringPayments: Array<{
    title: string;
    type: string;
    amount: number;
    frequency: string;
    nextDueDate: string;
    active: boolean;
  }>;
  recentTransactions: Array<{
    title: string;
    type: string;
    amount: number;
    category: string;
    account: string;
    date: string;
  }>;
}

/**
 * Pure selector that assembles a strictly grounded, privacy-safe summary of the user's ledger
 * for the server-side AI Financial Assistant.
 */
export function buildAiFinancialContext(
  state: FinanceState,
  isDemoMode: boolean,
  todayISO: string
): AiFinancialContext {
  const monthBounds = getDateRangeBounds('month', todayISO);
  const prevMonthBounds = getDateRangeBounds('last_month', todayISO);

  const currentSummary = calculateSummaryMetrics(
    state.transactions,
    state.accounts,
    state.budgets,
    monthBounds,
    todayISO
  );
  const prevSummary = calculateSummaryMetrics(
    state.transactions,
    state.accounts,
    state.budgets,
    prevMonthBounds,
    addMonthsClampedISO(todayISO, -1)
  );

  const catBreakdown = buildCategoryBreakdown(
    state.transactions,
    state.categories,
    monthBounds,
    'expense'
  );
  const balances = computeAllAccountBalances(state.accounts, state.transactions);
  const catMap = new Map(state.categories.map((c) => [c.id, c.name]));
  const accMap = new Map(state.accounts.map((a) => [a.id, a.name]));

  return {
    userName: state.profile.fullName,
    isDemoMode,
    currency: state.preferences.currency,
    dateRangeLabel: monthBounds.label,
    totals: {
      totalBalance: currentSummary.totalBalance,
      monthlyIncome: currentSummary.totalIncome,
      monthlyExpenses: currentSummary.totalExpenses,
      netSavings: currentSummary.netSavings,
      savingsRate: currentSummary.savingsRate,
      previousMonthIncome: prevSummary.totalIncome,
      previousMonthExpenses: prevSummary.totalExpenses,
    },
    categoryBreakdown: catBreakdown.map((c) => {
      const budget = state.budgets.find((b) => b.categoryId === c.categoryId);
      return {
        category: c.name,
        spent: c.amount,
        budgetLimit: budget?.limit,
      };
    }),
    accounts: state.accounts.map((a) => ({
      name: a.name,
      type: a.type,
      balance: balances[a.id] ?? 0,
    })),
    savingsGoals: state.goals.map((g) => ({
      name: g.name,
      currentAmount: g.currentAmount,
      targetAmount: g.targetAmount,
      targetDate: g.targetDate,
    })),
    recurringPayments: state.recurring.map((r) => ({
      title: r.title,
      type: r.type,
      amount: r.amount,
      frequency: r.frequency,
      nextDueDate: r.nextDueDate,
      active: r.active,
    })),
    recentTransactions: state.transactions.slice(0, 20).map((t) => ({
      title: t.title,
      type: t.type,
      amount: t.amount,
      category: t.type === 'transfer' ? 'Transfer' : (catMap.get(t.categoryId) ?? 'Other'),
      account: accMap.get(t.accountId) ?? 'Account',
      date: t.date,
    })),
  };
}
