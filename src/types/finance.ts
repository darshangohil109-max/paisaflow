export type ThemeMode = 'light' | 'dark';

export type TransactionType = 'income' | 'expense' | 'transfer';

export type AccountType =
  | 'Cash'
  | 'Bank Account'
  | 'Savings Account'
  | 'UPI'
  | 'Credit Card'
  | 'Digital Wallet'
  | 'Other';

export type PaymentMethod =
  | 'UPI'
  | 'Bank Transfer'
  | 'Debit Card'
  | 'Credit Card'
  | 'Cash'
  | 'Auto-Debit'
  | 'Wallet';

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type DateFilterPreset =
  | 'today'
  | 'week'
  | 'month'
  | 'last_month'
  | 'year'
  | 'custom';

export type SupportedCurrency = 'INR' | 'USD' | 'EUR';
export type SupportedLanguage = 'en-IN' | 'hi-IN' | 'gu-IN';
export type DateFormatOption = 'DD MMM YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';

export type NavSection =
  | 'overview'
  | 'transactions'
  | 'accounts'
  | 'budgets'
  | 'categories'
  | 'goals'
  | 'recurring'
  | 'analytics'
  | 'reports'
  | 'assistant'
  | 'settings';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  occupation?: string;
  monthlyIncomeTarget?: number;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  isDefault?: boolean;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  openingBalance: number;
  institution?: string;
  lastFourDigits?: string;
  color: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  accountId: string;
  toAccountId?: string;
  date: string; // YYYY-MM-DD (Asia/Kolkata)
  paymentMethod: PaymentMethod;
  notes?: string;
  attachmentName?: string;
  recurringId?: string;
  occurrenceDate?: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  name: string;
  categoryId: string | null; // null = Overall monthly budget
  limit: number;
  period: 'monthly' | 'custom';
  monthKey?: string; // YYYY-MM
  startDate?: string;
  endDate?: string;
}

export interface GoalContribution {
  id: string;
  goalId: string;
  type: 'contribution' | 'withdrawal';
  amount: number;
  accountId?: string;
  date: string;
  note?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
  description: string;
  icon: string;
  color: string;
  createdAt: string;
}

export interface RecurringTransaction {
  id: string;
  title: string;
  type: 'income' | 'expense';
  amount: number;
  categoryId: string;
  accountId: string;
  paymentMethod: PaymentMethod;
  frequency: RecurringFrequency;
  startDate: string; // YYYY-MM-DD
  nextDueDate: string; // YYYY-MM-DD
  lastProcessedDate?: string;
  active: boolean;
  notes?: string;
}

export interface UserPreferences {
  theme: ThemeMode;
  currency: SupportedCurrency;
  language: SupportedLanguage;
  dateFormat: DateFormatOption;
  notifications: {
    transactionAlerts: boolean;
    budgetAlerts: boolean;
    goalReminders: boolean;
    monthlyReports: boolean;
  };
  privacy: {
    maskBalances: boolean;
    aiContextConsent: boolean;
  };
}

export interface FinanceState {
  profile: UserProfile;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: SavingsGoal[];
  goalContributions: GoalContribution[];
  recurring: RecurringTransaction[];
  preferences: UserPreferences;
}

export interface AuthUserRecord {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}
