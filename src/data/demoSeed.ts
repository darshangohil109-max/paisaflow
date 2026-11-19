import type {
  Account,
  Budget,
  FinanceState,
  GoalContribution,
  RecurringTransaction,
  SavingsGoal,
  Transaction,
  UserPreferences,
} from '../types/finance';
import { ALL_DEFAULT_CATEGORIES } from './defaultCategories';
import { addDaysISO, addMonthsClampedISO, parseISODateParts } from '../utils/financeMath';
import { getKolkataTodayISO } from '../utils/formatters';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function clampDayToTodayOrMonth(year: number, month: number, desiredDay: number, maxDay?: number): string {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const limit = maxDay ? Math.min(daysInMonth, maxDay) : daysInMonth;
  const day = Math.max(1, Math.min(desiredDay, limit));
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'light',
  currency: 'INR',
  language: 'en-IN',
  dateFormat: 'DD MMM YYYY',
  notifications: {
    transactionAlerts: true,
    budgetAlerts: true,
    goalReminders: true,
    monthlyReports: false,
  },
  privacy: {
    maskBalances: false,
    aiContextConsent: true,
  },
};

export function createEmptyUserState(user: {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
}): FinanceState {
  return {
    profile: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      occupation: '',
      monthlyIncomeTarget: 0,
      createdAt: user.createdAt,
    },
    accounts: [
      {
        id: 'acc-primary-bank',
        name: 'Primary Bank Account',
        type: 'Bank Account',
        openingBalance: 0,
        institution: '',
        color: '#245C45',
        createdAt: user.createdAt,
      },
      {
        id: 'acc-cash-wallet',
        name: 'Cash Wallet',
        type: 'Cash',
        openingBalance: 0,
        color: '#75977F',
        createdAt: user.createdAt,
      },
    ],
    categories: ALL_DEFAULT_CATEGORIES.map((c) => ({ ...c })),
    transactions: [],
    budgets: [],
    goals: [],
    goalContributions: [],
    recurring: [],
    preferences: { ...DEFAULT_PREFERENCES },
  };
}

export function createDemoState(todayISO: string = getKolkataTodayISO()): FinanceState {
  const { year, month, day } = parseISODateParts(todayISO);
  const currentMonthKey = `${year}-${pad2(month)}`;

  const prevMonth1 = addMonthsClampedISO(`${year}-${pad2(month)}-15`, -1);
  const prev1Parts = parseISODateParts(prevMonth1);
  const prevMonth2 = addMonthsClampedISO(`${year}-${pad2(month)}-15`, -2);
  const prev2Parts = parseISODateParts(prevMonth2);
  const prevMonth3 = addMonthsClampedISO(`${year}-${pad2(month)}-15`, -3);
  const prev3Parts = parseISODateParts(prevMonth3);
  const prevMonth4 = addMonthsClampedISO(`${year}-${pad2(month)}-15`, -4);
  const prev4Parts = parseISODateParts(prevMonth4);
  const prevMonth5 = addMonthsClampedISO(`${year}-${pad2(month)}-15`, -5);
  const prev5Parts = parseISODateParts(prevMonth5);

  const nextMonthFirst = addMonthsClampedISO(`${year}-${pad2(month)}-01`, 1);

  const rawAccounts: Array<Account & { targetLiveBalance: number }> = [
    {
      id: 'demo-acc-hdfc',
      name: 'HDFC Bank',
      type: 'Bank Account',
      openingBalance: 0,
      targetLiveBalance: 25000,
      institution: 'HDFC Bank',
      lastFourDigits: '4821',
      color: '#245C45',
      createdAt: `${prev5Parts.year}-${pad2(prev5Parts.month)}-01`,
    },
    {
      id: 'demo-acc-upi',
      name: 'UPI Wallet',
      type: 'UPI',
      openingBalance: 0,
      targetLiveBalance: 8500,
      institution: 'BHIM / GPay UPI',
      color: '#75977F',
      createdAt: `${prev5Parts.year}-${pad2(prev5Parts.month)}-01`,
    },
    {
      id: 'demo-acc-cash',
      name: 'Cash',
      type: 'Cash',
      openingBalance: 0,
      targetLiveBalance: 5000,
      color: '#D9B98C',
      createdAt: `${prev5Parts.year}-${pad2(prev5Parts.month)}-01`,
    },
    {
      id: 'demo-acc-savings',
      name: 'Savings Vault',
      type: 'Savings Account',
      openingBalance: 0,
      targetLiveBalance: 10000,
      institution: 'SBI Savings',
      lastFourDigits: '9104',
      color: '#3B7A8C',
      createdAt: `${prev5Parts.year}-${pad2(prev5Parts.month)}-01`,
    },
  ];

  // Current month transactions exact totals:
  // Income = 30,000 + 5,000 = ₹35,000
  // Expenses = 8,000 + 3,200 + 2,500 + 2,350 + 1,000 + 800 + 650 = ₹18,500
  // Net Savings = ₹16,500
  // Transfer = ₹3,000 (not counted in income/expenses)
  const currentMonthTransactions: Transaction[] = [
    {
      id: 'demo-tx-1',
      title: 'Monthly Salary Credit',
      amount: 30000,
      type: 'income',
      categoryId: 'inc-salary',
      accountId: 'demo-acc-hdfc',
      date: clampDayToTodayOrMonth(year, month, 1, day),
      paymentMethod: 'Bank Transfer',
      notes: 'Monthly payroll deposit (Demo)',
      recurringId: 'demo-rec-salary',
      occurrenceDate: `${currentMonthKey}-01`,
      createdAt: clampDayToTodayOrMonth(year, month, 1, day),
    },
    {
      id: 'demo-tx-2',
      title: 'Apartment Rent',
      amount: 8000,
      type: 'expense',
      categoryId: 'exp-rent',
      accountId: 'demo-acc-hdfc',
      date: clampDayToTodayOrMonth(year, month, 2, day),
      paymentMethod: 'Auto-Debit',
      notes: 'Monthly flat rent',
      recurringId: 'demo-rec-rent',
      occurrenceDate: `${currentMonthKey}-02`,
      createdAt: clampDayToTodayOrMonth(year, month, 2, day),
    },
    {
      id: 'demo-tx-3',
      title: 'UI Design Freelance Milestone',
      amount: 5000,
      type: 'income',
      categoryId: 'inc-freelance',
      accountId: 'demo-acc-upi',
      date: clampDayToTodayOrMonth(year, month, Math.min(5, day), day),
      paymentMethod: 'UPI',
      notes: 'Landing page design sprint',
      createdAt: clampDayToTodayOrMonth(year, month, Math.min(5, day), day),
    },
    {
      id: 'demo-tx-4',
      title: 'DMart & Fresh Groceries',
      amount: 3200,
      type: 'expense',
      categoryId: 'exp-groceries',
      accountId: 'demo-acc-upi',
      date: clampDayToTodayOrMonth(year, month, Math.min(7, day), day),
      paymentMethod: 'UPI',
      notes: 'Weekly household groceries & produce',
      createdAt: clampDayToTodayOrMonth(year, month, Math.min(7, day), day),
    },
    {
      id: 'demo-tx-5',
      title: 'Transfer to Savings Vault',
      amount: 3000,
      type: 'transfer',
      categoryId: 'transfer',
      accountId: 'demo-acc-hdfc',
      toAccountId: 'demo-acc-savings',
      date: clampDayToTodayOrMonth(year, month, Math.min(9, day), day),
      paymentMethod: 'Bank Transfer',
      notes: 'Monthly emergency buffer transfer',
      createdAt: clampDayToTodayOrMonth(year, month, Math.min(9, day), day),
    },
    {
      id: 'demo-tx-6',
      title: 'Apparel & Home Shopping',
      amount: 2500,
      type: 'expense',
      categoryId: 'exp-shopping',
      accountId: 'demo-acc-hdfc',
      date: clampDayToTodayOrMonth(year, month, Math.max(1, day - 3), day),
      paymentMethod: 'Debit Card',
      notes: 'Workwear shirts & desk organizer',
      createdAt: clampDayToTodayOrMonth(year, month, Math.max(1, day - 3), day),
    },
    {
      id: 'demo-tx-7',
      title: 'Fiber Internet & Mobile',
      amount: 800,
      type: 'expense',
      categoryId: 'exp-bills',
      accountId: 'demo-acc-hdfc',
      date: clampDayToTodayOrMonth(year, month, Math.max(1, day - 2), day),
      paymentMethod: 'Auto-Debit',
      notes: 'Broadband & prepaid recharge',
      createdAt: clampDayToTodayOrMonth(year, month, Math.max(1, day - 2), day),
    },
    {
      id: 'demo-tx-8',
      title: 'Metro Card & Fuel',
      amount: 1000,
      type: 'expense',
      categoryId: 'exp-transport',
      accountId: 'demo-acc-cash',
      date: clampDayToTodayOrMonth(year, month, Math.max(1, day - 1), day),
      paymentMethod: 'Cash',
      notes: 'Daily commute & petrol',
      createdAt: clampDayToTodayOrMonth(year, month, Math.max(1, day - 1), day),
    },
    {
      id: 'demo-tx-9',
      title: 'Streaming & Cloud Bundle',
      amount: 650,
      type: 'expense',
      categoryId: 'exp-subscriptions',
      accountId: 'demo-acc-upi',
      date: clampDayToTodayOrMonth(year, month, Math.max(1, day - 1), day),
      paymentMethod: 'UPI',
      notes: 'OTT & cloud storage plan',
      createdAt: clampDayToTodayOrMonth(year, month, Math.max(1, day - 1), day),
    },
    {
      id: 'demo-tx-10',
      title: 'Spice Garden & Filter Coffee',
      amount: 2350,
      type: 'expense',
      categoryId: 'exp-food',
      accountId: 'demo-acc-upi',
      date: todayISO,
      paymentMethod: 'UPI',
      notes: 'Weekend dinner with friends & cafe',
      createdAt: todayISO,
    },
  ];

  // Historical 5 months for rich Analytics, Trends & Comparison
  const historicalSpecs = [
    { y: prev1Parts.year, m: prev1Parts.month, salary: 32000, freelance: 4000, rent: 8000, food: 2900, groceries: 3400, shopping: 3100, transport: 1200, bills: 900 },
    { y: prev2Parts.year, m: prev2Parts.month, salary: 32000, freelance: 2500, rent: 8000, food: 2400, groceries: 3100, shopping: 1800, transport: 1100, bills: 850 },
    { y: prev3Parts.year, m: prev3Parts.month, salary: 30000, freelance: 5500, rent: 8000, food: 3100, groceries: 3600, shopping: 4200, transport: 1350, bills: 950 },
    { y: prev4Parts.year, m: prev4Parts.month, salary: 30000, freelance: 3000, rent: 8000, food: 2100, groceries: 2950, shopping: 2200, transport: 950, bills: 800 },
    { y: prev5Parts.year, m: prev5Parts.month, salary: 30000, freelance: 2000, rent: 8000, food: 2550, groceries: 3000, shopping: 1600, transport: 1050, bills: 800 },
  ];

  const historicalTransactions: Transaction[] = [];
  historicalSpecs.forEach((spec, idx) => {
    const mk = `${spec.y}-${pad2(spec.m)}`;
    historicalTransactions.push(
      {
        id: `demo-hist-${idx}-sal`,
        title: 'Monthly Salary Credit',
        amount: spec.salary,
        type: 'income',
        categoryId: 'inc-salary',
        accountId: 'demo-acc-hdfc',
        date: `${mk}-01`,
        paymentMethod: 'Bank Transfer',
        createdAt: `${mk}-01`,
      },
      {
        id: `demo-hist-${idx}-free`,
        title: 'Consulting Side Project',
        amount: spec.freelance,
        type: 'income',
        categoryId: 'inc-freelance',
        accountId: 'demo-acc-upi',
        date: `${mk}-12`,
        paymentMethod: 'UPI',
        createdAt: `${mk}-12`,
      },
      {
        id: `demo-hist-${idx}-rent`,
        title: 'Apartment Rent',
        amount: spec.rent,
        type: 'expense',
        categoryId: 'exp-rent',
        accountId: 'demo-acc-hdfc',
        date: `${mk}-02`,
        paymentMethod: 'Auto-Debit',
        createdAt: `${mk}-02`,
      },
      {
        id: `demo-hist-${idx}-food`,
        title: 'Dining & Cafes',
        amount: spec.food,
        type: 'expense',
        categoryId: 'exp-food',
        accountId: 'demo-acc-upi',
        date: `${mk}-15`,
        paymentMethod: 'UPI',
        createdAt: `${mk}-15`,
      },
      {
        id: `demo-hist-${idx}-groc`,
        title: 'Monthly Groceries',
        amount: spec.groceries,
        type: 'expense',
        categoryId: 'exp-groceries',
        accountId: 'demo-acc-upi',
        date: `${mk}-08`,
        paymentMethod: 'UPI',
        createdAt: `${mk}-08`,
      },
      {
        id: `demo-hist-${idx}-shop`,
        title: 'Retail & Essentials',
        amount: spec.shopping,
        type: 'expense',
        categoryId: 'exp-shopping',
        accountId: 'demo-acc-hdfc',
        date: `${mk}-19`,
        paymentMethod: 'Debit Card',
        createdAt: `${mk}-19`,
      },
      {
        id: `demo-hist-${idx}-trans`,
        title: 'Commute & Fuel',
        amount: spec.transport,
        type: 'expense',
        categoryId: 'exp-transport',
        accountId: 'demo-acc-cash',
        date: `${mk}-21`,
        paymentMethod: 'Cash',
        createdAt: `${mk}-21`,
      },
      {
        id: `demo-hist-${idx}-bill`,
        title: 'Internet & Electricity',
        amount: spec.bills,
        type: 'expense',
        categoryId: 'exp-bills',
        accountId: 'demo-acc-hdfc',
        date: `${mk}-24`,
        paymentMethod: 'Auto-Debit',
        createdAt: `${mk}-24`,
      }
    );
  });

  const transactions = [...currentMonthTransactions, ...historicalTransactions].sort((a, b) =>
    b.date.localeCompare(a.date)
  );

  // Calibrate openingBalance so each demo account's live balance hits its exact clean INR figure
  const accounts: Account[] = rawAccounts.map((acc) => {
    let netTx = 0;
    for (const tx of transactions) {
      if (tx.type === 'income' && tx.accountId === acc.id) netTx += tx.amount;
      if (tx.type === 'expense' && tx.accountId === acc.id) netTx -= tx.amount;
      if (tx.type === 'transfer') {
        if (tx.accountId === acc.id) netTx -= tx.amount;
        if (tx.toAccountId === acc.id) netTx += tx.amount;
      }
    }
    const { targetLiveBalance, ...rest } = acc;
    return {
      ...rest,
      openingBalance: targetLiveBalance - netTx,
    };
  });

  const budgets: Budget[] = [
    {
      id: 'demo-bud-overall',
      name: 'Overall Monthly Budget',
      categoryId: null,
      limit: 26000,
      period: 'monthly',
      monthKey: currentMonthKey,
    },
    {
      id: 'demo-bud-food',
      name: 'Food & Dining',
      categoryId: 'exp-food',
      limit: 3000,
      period: 'monthly',
      monthKey: currentMonthKey,
    },
    {
      id: 'demo-bud-groceries',
      name: 'Groceries',
      categoryId: 'exp-groceries',
      limit: 4000,
      period: 'monthly',
      monthKey: currentMonthKey,
    },
    {
      id: 'demo-bud-shopping',
      name: 'Shopping',
      categoryId: 'exp-shopping',
      limit: 3500,
      period: 'monthly',
      monthKey: currentMonthKey,
    },
    {
      id: 'demo-bud-transport',
      name: 'Transportation',
      categoryId: 'exp-transport',
      limit: 1500,
      period: 'monthly',
      monthKey: currentMonthKey,
    },
  ];

  const goals: SavingsGoal[] = [
    {
      id: 'demo-goal-laptop',
      name: 'Buy a Laptop',
      targetAmount: 50000,
      currentAmount: 30000,
      targetDate: addMonthsClampedISO(todayISO, 4),
      description: 'Workstation upgrade for freelance design & development',
      icon: 'Laptop',
      color: '#245C45',
      createdAt: `${prev3Parts.year}-${pad2(prev3Parts.month)}-01`,
    },
    {
      id: 'demo-goal-emergency',
      name: 'Emergency Fund',
      targetAmount: 100000,
      currentAmount: 32000,
      targetDate: addMonthsClampedISO(todayISO, 10),
      description: '6-month household contingency reserve',
      icon: 'ShieldCheck',
      color: '#3B7A8C',
      createdAt: `${prev5Parts.year}-${pad2(prev5Parts.month)}-01`,
    },
    {
      id: 'demo-goal-travel',
      name: 'Himachal Family Trip',
      targetAmount: 35000,
      currentAmount: 14000,
      targetDate: addMonthsClampedISO(todayISO, 6),
      description: 'Summer hill-station vacation fund',
      icon: 'Plane',
      color: '#D9822B',
      createdAt: `${prev2Parts.year}-${pad2(prev2Parts.month)}-01`,
    },
  ];

  const goalContributions: GoalContribution[] = [
    {
      id: 'demo-gc-1',
      goalId: 'demo-goal-laptop',
      type: 'contribution',
      amount: 10000,
      accountId: 'demo-acc-hdfc',
      date: `${prev1Parts.year}-${pad2(prev1Parts.month)}-10`,
      note: 'Monthly laptop allocation',
    },
    {
      id: 'demo-gc-2',
      goalId: 'demo-goal-emergency',
      type: 'contribution',
      amount: 3000,
      accountId: 'demo-acc-savings',
      date: clampDayToTodayOrMonth(year, month, Math.min(9, day), day),
      note: 'Emergency vault transfer',
    },
  ];

  const recurring: RecurringTransaction[] = [
    {
      id: 'demo-rec-salary',
      title: 'Monthly Salary Credit',
      type: 'income',
      amount: 30000,
      categoryId: 'inc-salary',
      accountId: 'demo-acc-hdfc',
      paymentMethod: 'Bank Transfer',
      frequency: 'monthly',
      startDate: `${prev5Parts.year}-${pad2(prev5Parts.month)}-01`,
      nextDueDate: nextMonthFirst,
      lastProcessedDate: `${currentMonthKey}-01`,
      active: true,
      notes: 'Primary monthly salary',
    },
    {
      id: 'demo-rec-rent',
      title: 'Apartment Rent',
      type: 'expense',
      amount: 8000,
      categoryId: 'exp-rent',
      accountId: 'demo-acc-hdfc',
      paymentMethod: 'Auto-Debit',
      frequency: 'monthly',
      startDate: `${prev5Parts.year}-${pad2(prev5Parts.month)}-02`,
      nextDueDate: addDaysISO(nextMonthFirst, 1),
      lastProcessedDate: `${currentMonthKey}-02`,
      active: true,
      notes: 'Landlord standing instruction',
    },
    {
      id: 'demo-rec-internet',
      title: 'Fiber Internet Bill',
      type: 'expense',
      amount: 799,
      categoryId: 'exp-bills',
      accountId: 'demo-acc-hdfc',
      paymentMethod: 'Auto-Debit',
      frequency: 'monthly',
      startDate: `${prev3Parts.year}-${pad2(prev3Parts.month)}-05`,
      nextDueDate: addDaysISO(todayISO, 4),
      active: true,
      notes: '100 Mbps broadband plan',
    },
    {
      id: 'demo-rec-ott',
      title: 'Streaming Subscription',
      type: 'expense',
      amount: 649,
      categoryId: 'exp-subscriptions',
      accountId: 'demo-acc-upi',
      paymentMethod: 'UPI',
      frequency: 'monthly',
      startDate: `${prev2Parts.year}-${pad2(prev2Parts.month)}-10`,
      nextDueDate: addDaysISO(todayISO, 8),
      active: true,
      notes: 'Family OTT plan',
    },
  ];

  return {
    profile: {
      id: 'demo-user',
      fullName: 'Darshan Gohil',
      email: 'darshan.demo@paisaflow.in',
      occupation: 'Product Designer',
      monthlyIncomeTarget: 35000,
      createdAt: `${prev5Parts.year}-${pad2(prev5Parts.month)}-01`,
    },
    accounts,
    categories: ALL_DEFAULT_CATEGORIES.map((c) => ({ ...c })),
    transactions,
    budgets,
    goals,
    goalContributions,
    recurring,
    preferences: { ...DEFAULT_PREFERENCES },
  };
}
