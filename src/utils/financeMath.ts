import type {
  Account,
  Budget,
  Category,
  DateFilterPreset,
  RecurringFrequency,
  Transaction,
} from '../types/finance';

export interface DateRangeBounds {
  startDate: string;
  endDate: string;
  label: string;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function parseISODateParts(isoDate: string): { year: number; month: number; day: number } {
  const [year, month, day] = isoDate.split('-').map(Number);
  return { year, month, day };
}

export function addDaysISO(isoDate: string, days: number): string {
  const { year, month, day } = parseISODateParts(isoDate);
  const d = new Date(Date.UTC(year, month - 1, day + days));
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

export function addMonthsClampedISO(isoDate: string, monthsToAdd: number): string {
  const { year, month, day } = parseISODateParts(isoDate);
  const targetZeroMonth = month - 1 + monthsToAdd;
  const targetDate = new Date(Date.UTC(year, targetZeroMonth, 1));
  const targetYear = targetDate.getUTCFullYear();
  const targetMonth = targetDate.getUTCMonth() + 1;
  const maxDaysInMonth = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate();
  const clampedDay = Math.min(day, maxDaysInMonth);
  return `${targetYear}-${pad2(targetMonth)}-${pad2(clampedDay)}`;
}

export function getDateRangeBounds(
  preset: DateFilterPreset,
  todayISO: string,
  customStart?: string,
  customEnd?: string
): DateRangeBounds {
  const { year, month } = parseISODateParts(todayISO);

  if (preset === 'today') {
    return { startDate: todayISO, endDate: todayISO, label: 'Today' };
  }

  if (preset === 'week') {
    const dt = new Date(`${todayISO}T00:00:00Z`);
    const dayOfWeek = dt.getUTCDay(); // 0 = Sun
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const startDate = addDaysISO(todayISO, diffToMonday);
    const endDate = addDaysISO(startDate, 6);
    return { startDate, endDate, label: 'This Week' };
  }

  if (preset === 'month') {
    const startDate = `${year}-${pad2(month)}-01`;
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const endDate = `${year}-${pad2(month)}-${pad2(lastDay)}`;
    return { startDate, endDate, label: 'This Month' };
  }

  if (preset === 'last_month') {
    const prevDate = new Date(Date.UTC(year, month - 2, 1));
    const py = prevDate.getUTCFullYear();
    const pm = prevDate.getUTCMonth() + 1;
    const lastDay = new Date(Date.UTC(py, pm, 0)).getUTCDate();
    return {
      startDate: `${py}-${pad2(pm)}-01`,
      endDate: `${py}-${pad2(pm)}-${pad2(lastDay)}`,
      label: 'Last Month',
    };
  }

  if (preset === 'year') {
    return {
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
      label: 'This Year',
    };
  }

  const startDate = customStart && customStart <= (customEnd || todayISO) ? customStart : todayISO;
  const endDate = customEnd && customEnd >= startDate ? customEnd : startDate;
  return { startDate, endDate, label: 'Custom Range' };
}

export function isDateInRange(dateISO: string, bounds: DateRangeBounds): boolean {
  return dateISO >= bounds.startDate && dateISO <= bounds.endDate;
}

export function computeAccountBalance(account: Account, transactions: Transaction[]): number {
  let balance = account.openingBalance;
  for (const tx of transactions) {
    if (tx.type === 'income' && tx.accountId === account.id) {
      balance += tx.amount;
    } else if (tx.type === 'expense' && tx.accountId === account.id) {
      balance -= tx.amount;
    } else if (tx.type === 'transfer') {
      if (tx.accountId === account.id) {
        balance -= tx.amount;
      }
      if (tx.toAccountId === account.id) {
        balance += tx.amount;
      }
    }
  }
  return Math.round(balance * 100) / 100;
}

export function computeAllAccountBalances(
  accounts: Account[],
  transactions: Transaction[]
): Record<string, number> {
  const balances: Record<string, number> = {};
  for (const acc of accounts) {
    balances[acc.id] = computeAccountBalance(acc, transactions);
  }
  return balances;
}

export interface FinancialSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  overallBudgetLimit: number;
  budgetUtilizationPct: number;
  transactionCount: number;
}

export function calculateSummaryMetrics(
  transactions: Transaction[],
  accounts: Account[],
  budgets: Budget[],
  bounds: DateRangeBounds,
  todayISO: string
): FinancialSummary {
  const balances = computeAllAccountBalances(accounts, transactions);
  const totalBalance = Object.values(balances).reduce((sum, val) => sum + val, 0);

  let totalIncome = 0;
  let totalExpenses = 0;
  let transactionCount = 0;

  for (const tx of transactions) {
    if (!isDateInRange(tx.date, bounds)) continue;
    transactionCount += 1;
    // Transfers MUST NOT be counted as income or expenses
    if (tx.type === 'income') {
      totalIncome += tx.amount;
    } else if (tx.type === 'expense') {
      totalExpenses += tx.amount;
    }
  }

  const netSavings = Math.round((totalIncome - totalExpenses) * 100) / 100;
  const savingsRate =
    totalIncome > 0 ? Math.round((netSavings / totalIncome) * 1000) / 10 : 0;

  const currentMonthKey = todayISO.slice(0, 7);
  const overallBudget = budgets.find(
    (b) => b.categoryId === null && (b.monthKey === currentMonthKey || !b.monthKey)
  );
  const categorySumBudget = budgets
    .filter((b) => b.categoryId !== null && (b.monthKey === currentMonthKey || !b.monthKey))
    .reduce((sum, b) => sum + b.limit, 0);

  const overallBudgetLimit = overallBudget?.limit ?? categorySumBudget;
  const budgetUtilizationPct =
    overallBudgetLimit > 0
      ? Math.round((totalExpenses / overallBudgetLimit) * 1000) / 10
      : 0;

  return {
    totalBalance: Math.round(totalBalance * 100) / 100,
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    netSavings,
    savingsRate,
    overallBudgetLimit,
    budgetUtilizationPct,
    transactionCount,
  };
}

export function computeBudgetSpending(
  budget: Budget,
  transactions: Transaction[],
  fallbackMonthKey: string
): { spent: number; remaining: number; pct: number; isOver: boolean } {
  const spent = transactions
    .filter((tx) => {
      if (tx.type !== 'expense') return false;
      if (budget.categoryId && tx.categoryId !== budget.categoryId) return false;
      if (budget.period === 'custom' && budget.startDate && budget.endDate) {
        return tx.date >= budget.startDate && tx.date <= budget.endDate;
      }
      const mk = budget.monthKey || fallbackMonthKey;
      return tx.date.startsWith(mk);
    })
    .reduce((sum, tx) => sum + tx.amount, 0);

  const remaining = Math.round((budget.limit - spent) * 100) / 100;
  const pct = budget.limit > 0 ? Math.round((spent / budget.limit) * 1000) / 10 : 0;
  return {
    spent: Math.round(spent * 100) / 100,
    remaining,
    pct,
    isOver: spent > budget.limit,
  };
}

export function calculateNextDueDate(
  currentDueISO: string,
  frequency: RecurringFrequency
): string {
  if (frequency === 'daily') return addDaysISO(currentDueISO, 1);
  if (frequency === 'weekly') return addDaysISO(currentDueISO, 7);
  if (frequency === 'monthly') return addMonthsClampedISO(currentDueISO, 1);
  return addMonthsClampedISO(currentDueISO, 12);
}

export function hasRecurringOccurrenceRecorded(
  recurringId: string,
  occurrenceDate: string,
  transactions: Transaction[]
): boolean {
  return transactions.some(
    (tx) => tx.recurringId === recurringId && tx.occurrenceDate === occurrenceDate
  );
}

export function buildMonthlyCashflowSeries(
  transactions: Transaction[],
  referenceISO: string,
  monthsCount = 6
): Array<{ monthKey: string; label: string; income: number; expenses: number; savings: number }> {
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const { year, month } = parseISODateParts(referenceISO);
  const result: Array<{ monthKey: string; label: string; income: number; expenses: number; savings: number }> = [];

  for (let i = monthsCount - 1; i >= 0; i--) {
    const dt = new Date(Date.UTC(year, month - 1 - i, 1));
    const y = dt.getUTCFullYear();
    const m = dt.getUTCMonth() + 1;
    const mk = `${y}-${pad2(m)}`;
    let income = 0;
    let expenses = 0;
    for (const tx of transactions) {
      if (!tx.date.startsWith(mk)) continue;
      if (tx.type === 'income') income += tx.amount;
      if (tx.type === 'expense') expenses += tx.amount;
    }
    result.push({
      monthKey: mk,
      label: `${MONTHS[m - 1]} ${String(y).slice(2)}`,
      income: Math.round(income),
      expenses: Math.round(expenses),
      savings: Math.round(income - expenses),
    });
  }

  return result;
}

export function buildCategoryBreakdown(
  transactions: Transaction[],
  categories: Category[],
  bounds: DateRangeBounds,
  type: 'expense' | 'income' = 'expense'
): Array<{ categoryId: string; name: string; color: string; amount: number; pct: number }> {
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const totals = new Map<string, number>();
  let grandTotal = 0;

  for (const tx of transactions) {
    if (tx.type !== type) continue;
    if (!isDateInRange(tx.date, bounds)) continue;
    totals.set(tx.categoryId, (totals.get(tx.categoryId) ?? 0) + tx.amount);
    grandTotal += tx.amount;
  }

  return Array.from(totals.entries())
    .map(([categoryId, amount]) => {
      const cat = catMap.get(categoryId);
      return {
        categoryId,
        name: cat?.name ?? 'Other',
        color: cat?.color ?? '#89918B',
        amount: Math.round(amount * 100) / 100,
        pct: grandTotal > 0 ? Math.round((amount / grandTotal) * 1000) / 10 : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount);
}

function escapeCsvField(val: string): string {
  const str = String(val ?? '');
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function transactionsToCsv(
  transactions: Transaction[],
  categories: Category[],
  accounts: Account[]
): string {
  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const accMap = new Map(accounts.map((a) => [a.id, a.name]));

  const headers = [
    'Date',
    'Title',
    'Type',
    'Amount (INR)',
    'Category',
    'Account',
    'To Account',
    'Payment Method',
    'Notes',
  ];

  const rows = transactions.map((tx) => [
    tx.date,
    tx.title,
    tx.type,
    tx.amount.toFixed(2),
    tx.type === 'transfer' ? 'Transfer' : (catMap.get(tx.categoryId) ?? 'Other'),
    accMap.get(tx.accountId) ?? 'Unknown',
    tx.toAccountId ? (accMap.get(tx.toAccountId) ?? 'Unknown') : '',
    tx.paymentMethod,
    tx.notes ?? '',
  ]);

  return [headers, ...rows]
    .map((row) => row.map(escapeCsvField).join(','))
    .join('\n');
}

export function validateTransactionInput(input: {
  title: string;
  amount: number;
  type: Transaction['type'];
  accountId: string;
  toAccountId?: string;
  categoryId: string;
  date: string;
}): string | null {
  if (!input.title.trim()) return 'Transaction title is required.';
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    return 'Amount must be greater than ₹0.';
  }
  if (!input.accountId) return 'Please select an account.';
  if (input.type === 'transfer') {
    if (!input.toAccountId) return 'Please select a destination account.';
    if (input.toAccountId === input.accountId) {
      return 'Source and destination accounts must be different.';
    }
  } else if (!input.categoryId) {
    return 'Please select a category.';
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    return 'Please enter a valid date.';
  }
  return null;
}
