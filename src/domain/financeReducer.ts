import type {
  Account,
  Budget,
  Category,
  FinanceState,
  GoalContribution,
  RecurringTransaction,
  SavingsGoal,
  Transaction,
  UserPreferences,
  UserProfile,
} from '../types/finance';
import {
  calculateNextDueDate,
  hasRecurringOccurrenceRecorded,
  validateTransactionInput,
} from '../utils/financeMath';

export interface DomainResult {
  state: FinanceState;
  error?: string;
  notice?: string;
}

function generateEntityId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function sortTransactionsDesc(list: Transaction[]): Transaction[] {
  return [...list].sort((a, b) => b.date.localeCompare(a.date));
}

export type FinanceDomainAction =
  | { type: 'HYDRATE'; payload: FinanceState }
  | { type: 'ADD_TRANSACTION'; payload: Omit<Transaction, 'id' | 'createdAt'>; todayISO: string }
  | { type: 'UPDATE_TRANSACTION'; id: string; payload: Omit<Transaction, 'id' | 'createdAt'> }
  | { type: 'DELETE_TRANSACTION'; id: string }
  | { type: 'ADD_ACCOUNT'; payload: Omit<Account, 'id' | 'createdAt'>; todayISO: string }
  | { type: 'UPDATE_ACCOUNT'; id: string; updates: Partial<Omit<Account, 'id' | 'createdAt'>> }
  | { type: 'DELETE_ACCOUNT'; id: string }
  | { type: 'ADD_CATEGORY'; payload: Omit<Category, 'id'> }
  | { type: 'UPDATE_CATEGORY'; id: string; updates: Partial<Omit<Category, 'id'>> }
  | { type: 'DELETE_CATEGORY'; id: string }
  | { type: 'UPSERT_BUDGET'; payload: Omit<Budget, 'id'> & { id?: string } }
  | { type: 'DELETE_BUDGET'; id: string }
  | { type: 'ADD_GOAL'; payload: Omit<SavingsGoal, 'id' | 'createdAt'>; todayISO: string }
  | { type: 'UPDATE_GOAL'; id: string; updates: Partial<Omit<SavingsGoal, 'id' | 'createdAt'>> }
  | { type: 'DELETE_GOAL'; id: string }
  | {
      type: 'RECORD_GOAL_MOVEMENT';
      payload: {
        goalId: string;
        type: 'contribution' | 'withdrawal';
        amount: number;
        accountId?: string;
        date: string;
        note?: string;
      };
    }
  | { type: 'ADD_RECURRING'; payload: Omit<RecurringTransaction, 'id'> }
  | { type: 'UPDATE_RECURRING'; id: string; updates: Partial<Omit<RecurringTransaction, 'id'>> }
  | { type: 'TOGGLE_RECURRING_ACTIVE'; id: string }
  | { type: 'DELETE_RECURRING'; id: string }
  | { type: 'RECORD_RECURRING_OCCURRENCE'; id: string; todayISO: string }
  | { type: 'UPDATE_PROFILE'; updates: Partial<UserProfile> }
  | { type: 'UPDATE_PREFERENCES'; updates: Partial<UserPreferences> };

/**
 * Pure domain state transition function for all PaisaFlow business operations.
 * Returns the next immutable FinanceState plus optional validation error or user notice.
 */
export function applyFinanceDomainAction(
  state: FinanceState,
  action: FinanceDomainAction
): DomainResult {
  switch (action.type) {
    case 'HYDRATE':
      return { state: action.payload };

    case 'ADD_TRANSACTION': {
      const tx = action.payload;
      const err = validateTransactionInput({
        title: tx.title,
        amount: tx.amount,
        type: tx.type,
        accountId: tx.accountId,
        toAccountId: tx.toAccountId,
        categoryId: tx.categoryId,
        date: tx.date,
      });
      if (err) return { state, error: err };

      const created: Transaction = {
        ...tx,
        title: tx.title.trim(),
        id: generateEntityId('tx'),
        createdAt: action.todayISO,
      };
      return {
        state: {
          ...state,
          transactions: sortTransactionsDesc([created, ...state.transactions]),
        },
        notice:
          tx.type === 'transfer'
            ? `Transferred "${created.title}" successfully.`
            : `${tx.type === 'income' ? 'Income' : 'Expense'} "${created.title}" recorded.`,
      };
    }

    case 'UPDATE_TRANSACTION': {
      const updates = action.payload;
      const err = validateTransactionInput({
        title: updates.title,
        amount: updates.amount,
        type: updates.type,
        accountId: updates.accountId,
        toAccountId: updates.toAccountId,
        categoryId: updates.categoryId,
        date: updates.date,
      });
      if (err) return { state, error: err };

      const updatedList = sortTransactionsDesc(
        state.transactions.map((t) =>
          t.id === action.id ? { ...t, ...updates, title: updates.title.trim() } : t
        )
      );
      return {
        state: { ...state, transactions: updatedList },
        notice: `Updated "${updates.title.trim()}".`,
      };
    }

    case 'DELETE_TRANSACTION': {
      const target = state.transactions.find((t) => t.id === action.id);
      return {
        state: {
          ...state,
          transactions: state.transactions.filter((t) => t.id !== action.id),
        },
        notice: target ? `Deleted "${target.title}".` : 'Transaction deleted.',
      };
    }

    case 'ADD_ACCOUNT': {
      const acc = action.payload;
      if (!acc.name.trim()) return { state, error: 'Account name is required.' };
      if (!Number.isFinite(acc.openingBalance)) {
        return { state, error: 'Enter a valid opening balance.' };
      }

      const created: Account = {
        ...acc,
        name: acc.name.trim(),
        id: generateEntityId('acc'),
        createdAt: action.todayISO,
      };
      return {
        state: { ...state, accounts: [...state.accounts, created] },
        notice: `Account "${created.name}" added.`,
      };
    }

    case 'UPDATE_ACCOUNT': {
      if (action.updates.name !== undefined && !action.updates.name.trim()) {
        return { state, error: 'Account name is required.' };
      }
      return {
        state: {
          ...state,
          accounts: state.accounts.map((a) =>
            a.id === action.id
              ? {
                  ...a,
                  ...action.updates,
                  name: action.updates.name !== undefined ? action.updates.name.trim() : a.name,
                }
              : a
          ),
        },
        notice: 'Account updated.',
      };
    }

    case 'DELETE_ACCOUNT': {
      const hasLinkedTx = state.transactions.some(
        (t) => t.accountId === action.id || t.toAccountId === action.id
      );
      if (hasLinkedTx) {
        return {
          state,
          error:
            'This account has linked transactions. Delete or move its transactions before removing it.',
        };
      }
      if (state.accounts.length <= 1) {
        return { state, error: 'At least one account is required.' };
      }
      return {
        state: {
          ...state,
          accounts: state.accounts.filter((a) => a.id !== action.id),
        },
        notice: 'Account removed.',
      };
    }

    case 'ADD_CATEGORY': {
      const name = action.payload.name.trim();
      if (!name) return { state, error: 'Category name is required.' };
      const duplicate = state.categories.some(
        (c) => c.type === action.payload.type && c.name.toLowerCase() === name.toLowerCase()
      );
      if (duplicate) return { state, error: 'A category with this name already exists.' };

      const created: Category = {
        ...action.payload,
        name,
        id: generateEntityId('cat'),
        isDefault: false,
      };
      return {
        state: { ...state, categories: [...state.categories, created] },
        notice: `Category "${name}" created.`,
      };
    }

    case 'UPDATE_CATEGORY': {
      if (action.updates.name !== undefined && !action.updates.name.trim()) {
        return { state, error: 'Category name is required.' };
      }
      return {
        state: {
          ...state,
          categories: state.categories.map((c) =>
            c.id === action.id
              ? {
                  ...c,
                  ...action.updates,
                  name: action.updates.name !== undefined ? action.updates.name.trim() : c.name,
                }
              : c
          ),
        },
        notice: 'Category updated.',
      };
    }

    case 'DELETE_CATEGORY': {
      const inUse =
        state.transactions.some((t) => t.categoryId === action.id) ||
        state.budgets.some((b) => b.categoryId === action.id) ||
        state.recurring.some((r) => r.categoryId === action.id);
      if (inUse) {
        return {
          state,
          error:
            'Cannot delete a category currently used by transactions, budgets, or recurring rules.',
        };
      }
      return {
        state: {
          ...state,
          categories: state.categories.filter((c) => c.id !== action.id),
        },
        notice: 'Unused category deleted.',
      };
    }

    case 'UPSERT_BUDGET': {
      const budget = action.payload;
      if (!budget.name.trim()) return { state, error: 'Budget title is required.' };
      if (!Number.isFinite(budget.limit) || budget.limit <= 0) {
        return { state, error: 'Budget limit must be greater than ₹0.' };
      }
      if (
        budget.period === 'custom' &&
        (!budget.startDate || !budget.endDate || budget.startDate > budget.endDate)
      ) {
        return { state, error: 'Please select a valid custom start and end date.' };
      }

      if (budget.id) {
        return {
          state: {
            ...state,
            budgets: state.budgets.map((b) =>
              b.id === budget.id ? { ...b, ...budget, name: budget.name.trim(), id: b.id } : b
            ),
          },
          notice: `Budget "${budget.name.trim()}" updated.`,
        };
      }

      const existingSame = state.budgets.find(
        (b) =>
          b.categoryId === budget.categoryId &&
          b.period === budget.period &&
          b.monthKey === budget.monthKey
      );
      if (existingSame) {
        return {
          state: {
            ...state,
            budgets: state.budgets.map((b) =>
              b.id === existingSame.id
                ? { ...b, ...budget, name: budget.name.trim(), id: existingSame.id }
                : b
            ),
          },
          notice: `Updated existing "${budget.name.trim()}" budget limit.`,
        };
      }

      const created: Budget = {
        ...budget,
        name: budget.name.trim(),
        id: generateEntityId('bud'),
      };
      return {
        state: { ...state, budgets: [...state.budgets, created] },
        notice: `Budget "${created.name}" saved.`,
      };
    }

    case 'DELETE_BUDGET':
      return {
        state: { ...state, budgets: state.budgets.filter((b) => b.id !== action.id) },
        notice: 'Budget removed.',
      };

    case 'ADD_GOAL': {
      const goal = action.payload;
      if (!goal.name.trim()) return { state, error: 'Goal name is required.' };
      if (!Number.isFinite(goal.targetAmount) || goal.targetAmount <= 0) {
        return { state, error: 'Target amount must be greater than ₹0.' };
      }
      if (!Number.isFinite(goal.currentAmount) || goal.currentAmount < 0) {
        return { state, error: 'Current savings cannot be negative.' };
      }

      const created: SavingsGoal = {
        ...goal,
        name: goal.name.trim(),
        id: generateEntityId('goal'),
        createdAt: action.todayISO,
      };
      return {
        state: { ...state, goals: [...state.goals, created] },
        notice: `Savings goal "${created.name}" created.`,
      };
    }

    case 'UPDATE_GOAL': {
      if (action.updates.name !== undefined && !action.updates.name.trim()) {
        return { state, error: 'Goal name is required.' };
      }
      return {
        state: {
          ...state,
          goals: state.goals.map((g) =>
            g.id === action.id
              ? {
                  ...g,
                  ...action.updates,
                  name: action.updates.name !== undefined ? action.updates.name.trim() : g.name,
                }
              : g
          ),
        },
        notice: 'Savings goal updated.',
      };
    }

    case 'DELETE_GOAL':
      return {
        state: {
          ...state,
          goals: state.goals.filter((g) => g.id !== action.id),
          goalContributions: state.goalContributions.filter((c) => c.goalId !== action.id),
        },
        notice: 'Savings goal deleted.',
      };

    case 'RECORD_GOAL_MOVEMENT': {
      const input = action.payload;
      const goal = state.goals.find((g) => g.id === input.goalId);
      if (!goal) return { state, error: 'Goal not found.' };
      if (!Number.isFinite(input.amount) || input.amount <= 0) {
        return { state, error: 'Amount must be greater than ₹0.' };
      }
      if (input.type === 'withdrawal' && input.amount > goal.currentAmount) {
        return { state, error: 'Withdrawal exceeds current saved amount for this goal.' };
      }

      const nextAmount =
        input.type === 'contribution'
          ? goal.currentAmount + input.amount
          : goal.currentAmount - input.amount;

      const movement: GoalContribution = {
        id: generateEntityId('gc'),
        goalId: input.goalId,
        type: input.type,
        amount: input.amount,
        accountId: input.accountId,
        date: input.date,
        note: input.note,
      };

      return {
        state: {
          ...state,
          goals: state.goals.map((g) =>
            g.id === input.goalId ? { ...g, currentAmount: nextAmount } : g
          ),
          goalContributions: [movement, ...state.goalContributions],
        },
        notice:
          input.type === 'contribution'
            ? `Added contribution to "${goal.name}".`
            : `Recorded withdrawal from "${goal.name}".`,
      };
    }

    case 'ADD_RECURRING': {
      const item = action.payload;
      if (!item.title.trim()) return { state, error: 'Title is required.' };
      if (!Number.isFinite(item.amount) || item.amount <= 0) {
        return { state, error: 'Amount must be greater than ₹0.' };
      }

      const created: RecurringTransaction = {
        ...item,
        title: item.title.trim(),
        id: generateEntityId('rec'),
      };
      return {
        state: { ...state, recurring: [...state.recurring, created] },
        notice: `Recurring ${item.type} "${created.title}" scheduled.`,
      };
    }

    case 'UPDATE_RECURRING':
      return {
        state: {
          ...state,
          recurring: state.recurring.map((r) =>
            r.id === action.id ? { ...r, ...action.updates } : r
          ),
        },
        notice: 'Recurring payment updated.',
      };

    case 'TOGGLE_RECURRING_ACTIVE':
      return {
        state: {
          ...state,
          recurring: state.recurring.map((r) =>
            r.id === action.id ? { ...r, active: !r.active } : r
          ),
        },
      };

    case 'DELETE_RECURRING':
      return {
        state: {
          ...state,
          recurring: state.recurring.filter((r) => r.id !== action.id),
        },
        notice: 'Recurring payment deleted.',
      };

    case 'RECORD_RECURRING_OCCURRENCE': {
      const item = state.recurring.find((r) => r.id === action.id);
      if (!item) return { state, error: 'Recurring rule not found.' };
      if (hasRecurringOccurrenceRecorded(item.id, item.nextDueDate, state.transactions)) {
        return { state, error: 'This scheduled occurrence has already been recorded.' };
      }

      const newTx: Transaction = {
        id: generateEntityId('tx'),
        title: item.title,
        amount: item.amount,
        type: item.type,
        categoryId: item.categoryId,
        accountId: item.accountId,
        date: item.nextDueDate,
        paymentMethod: item.paymentMethod,
        notes: item.notes ? `${item.notes} (Recurring)` : 'Recurring schedule entry',
        recurringId: item.id,
        occurrenceDate: item.nextDueDate,
        createdAt: action.todayISO,
      };
      const advancedDue = calculateNextDueDate(item.nextDueDate, item.frequency);

      return {
        state: {
          ...state,
          transactions: sortTransactionsDesc([newTx, ...state.transactions]),
          recurring: state.recurring.map((r) =>
            r.id === item.id
              ? { ...r, lastProcessedDate: item.nextDueDate, nextDueDate: advancedDue }
              : r
          ),
        },
        notice: `Recorded "${item.title}" and advanced next due date.`,
      };
    }

    case 'UPDATE_PROFILE':
      return {
        state: {
          ...state,
          profile: { ...state.profile, ...action.updates },
        },
        notice: 'Profile updated.',
      };

    case 'UPDATE_PREFERENCES':
      return {
        state: {
          ...state,
          preferences: {
            ...state.preferences,
            ...action.updates,
            notifications: {
              ...state.preferences.notifications,
              ...(action.updates.notifications ?? {}),
            },
            privacy: {
              ...state.preferences.privacy,
              ...(action.updates.privacy ?? {}),
            },
          },
        },
        notice: 'Preferences saved.',
      };

    default:
      return { state };
  }
}
