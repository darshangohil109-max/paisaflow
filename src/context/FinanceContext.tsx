import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type {
  Account,
  Budget,
  Category,
  DateFilterPreset,
  FinanceState,
  NavSection,
  RecurringTransaction,
  SavingsGoal,
  ThemeMode,
  Transaction,
  UserPreferences,
  UserProfile,
} from '../types/finance';
import {
  deleteLocalUserAccount,
  loadDemoFinanceState,
  loadSession,
  loadStoredTheme,
  loadUserFinanceState,
  loginLocalUser,
  registerLocalUser,
  resetDemoFinanceState,
  resetLocalUserPassword,
  saveDemoFinanceState,
  saveSession,
  saveStoredTheme,
  saveUserFinanceState,
  type SessionInfo,
} from '../services/storageService';
import { getDateRangeBounds } from '../utils/financeMath';
import { getKolkataTodayISO } from '../utils/formatters';
import {
  applyFinanceDomainAction,
  type FinanceDomainAction,
} from '../domain/financeReducer';
import type { ToastMessage } from '../components/ToastBanner';

interface FinanceContextValue {
  session: SessionInfo | null;
  isDemoMode: boolean;
  state: FinanceState | null;
  theme: ThemeMode;
  activeNav: NavSection;
  setActiveNav: (nav: NavSection) => void;
  datePreset: DateFilterPreset;
  setDatePreset: (preset: DateFilterPreset) => void;
  customStartDate: string;
  customEndDate: string;
  setCustomRange: (start: string, end: string) => void;
  todayISO: string;
  toasts: ToastMessage[];
  showToast: (message: string, type?: ToastMessage['type']) => void;
  dismissToast: (id: string) => void;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;

  // Auth actions
  enterDemoMode: () => void;
  resetDemoData: () => void;
  signUp: (input: { fullName: string; email: string; password: string }) => Promise<string | null>;
  login: (input: { email: string; password: string }) => Promise<string | null>;
  logout: () => void;
  resetPassword: (input: { email: string; newPassword: string }) => Promise<{ ok: boolean; error?: string }>;
  deleteUserProfileAccount: () => void;

  // Domain CRUD actions (delegated to pure financeReducer)
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => string | null;
  updateTransaction: (id: string, updates: Omit<Transaction, 'id' | 'createdAt'>) => string | null;
  deleteTransaction: (id: string) => void;

  addAccount: (acc: Omit<Account, 'id' | 'createdAt'>) => string | null;
  updateAccount: (id: string, updates: Partial<Omit<Account, 'id' | 'createdAt'>>) => string | null;
  deleteAccount: (id: string) => string | null;

  addCategory: (cat: Omit<Category, 'id'>) => string | null;
  updateCategory: (id: string, updates: Partial<Omit<Category, 'id'>>) => string | null;
  deleteCategory: (id: string) => string | null;

  upsertBudget: (budget: Omit<Budget, 'id'> & { id?: string }) => string | null;
  deleteBudget: (id: string) => void;

  addGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt'>) => string | null;
  updateGoal: (id: string, updates: Partial<Omit<SavingsGoal, 'id' | 'createdAt'>>) => string | null;
  deleteGoal: (id: string) => void;
  recordGoalMovement: (input: {
    goalId: string;
    type: 'contribution' | 'withdrawal';
    amount: number;
    accountId?: string;
    date: string;
    note?: string;
  }) => string | null;

  addRecurring: (item: Omit<RecurringTransaction, 'id'>) => string | null;
  updateRecurring: (id: string, updates: Partial<Omit<RecurringTransaction, 'id'>>) => string | null;
  toggleRecurringActive: (id: string) => void;
  deleteRecurring: (id: string) => void;
  recordRecurringOccurrence: (id: string) => string | null;

  updateProfile: (updates: Partial<UserProfile>) => void;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

function resolveInitialSession(): SessionInfo | null {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      const demoSession: SessionInfo = { mode: 'demo', userId: 'demo-user' };
      saveSession(demoSession);
      return demoSession;
    }
  }
  return loadSession();
}

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const todayISO = useMemo(() => getKolkataTodayISO(), []);

  const [session, setSession] = useState<SessionInfo | null>(() => resolveInitialSession());
  const [state, setState] = useState<FinanceState | null>(() => {
    const initial = resolveInitialSession();
    if (!initial) return null;
    return initial.mode === 'demo'
      ? loadDemoFinanceState()
      : loadUserFinanceState(initial.userId);
  });

  const [theme, setThemeState] = useState<ThemeMode>(() => loadStoredTheme());
  const [activeNav, setActiveNav] = useState<NavSection>('overview');
  const [datePreset, setDatePreset] = useState<DateFilterPreset>('month');
  const initialBounds = useMemo(() => getDateRangeBounds('month', todayISO), [todayISO]);
  const [customStartDate, setCustomStartDate] = useState(initialBounds.startDate);
  const [customEndDate, setCustomEndDate] = useState(initialBounds.endDate);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    saveStoredTheme(theme);
  }, [theme]);

  const showToast = useCallback((message: string, type: ToastMessage['type'] = 'success') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-3), { id, type, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const persistState = useCallback(
    (next: FinanceState) => {
      setState(next);
      if (!session) return;
      if (session.mode === 'demo') {
        saveDemoFinanceState(next);
      } else {
        saveUserFinanceState(session.userId, next);
      }
    },
    [session]
  );

  const dispatchDomain = useCallback(
    (action: FinanceDomainAction): string | null => {
      if (!state) return 'No active workspace.';
      const result = applyFinanceDomainAction(state, action);
      if (result.error) {
        return result.error;
      }
      persistState(result.state);
      if (result.notice) {
        showToast(result.notice);
      }
      return null;
    },
    [state, persistState, showToast]
  );

  const setTheme = useCallback(
    (nextTheme: ThemeMode) => {
      setThemeState(nextTheme);
      if (state) {
        persistState({
          ...state,
          preferences: { ...state.preferences, theme: nextTheme },
        });
      }
    },
    [state, persistState]
  );

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  const setCustomRange = useCallback((start: string, end: string) => {
    setCustomStartDate(start);
    setCustomEndDate(end);
    setDatePreset('custom');
  }, []);

  // --- Authentication & Session Management ---
  const enterDemoMode = useCallback(() => {
    const demoSess: SessionInfo = { mode: 'demo', userId: 'demo-user' };
    saveSession(demoSess);
    setSession(demoSess);
    setState(loadDemoFinanceState());
    setActiveNav('overview');
    showToast('Entered Demo Mode with sample INR financial data.', 'info');
  }, [showToast]);

  const resetDemoData = useCallback(() => {
    setState(resetDemoFinanceState());
    showToast('Demo data restored to original sample figures.');
  }, [showToast]);

  const signUp = useCallback(
    async (input: { fullName: string; email: string; password: string }) => {
      const res = await registerLocalUser(input);
      if (res.error || !res.user) return res.error ?? 'Could not create account.';
      setSession({ mode: 'authenticated', userId: res.user.id });
      setState(loadUserFinanceState(res.user.id));
      setActiveNav('overview');
      showToast(`Welcome to PaisaFlow, ${res.user.fullName}!`);
      return null;
    },
    [showToast]
  );

  const login = useCallback(
    async (input: { email: string; password: string }) => {
      const res = await loginLocalUser(input);
      if (res.error || !res.user) return res.error ?? 'Login failed.';
      setSession({ mode: 'authenticated', userId: res.user.id });
      const loaded = loadUserFinanceState(res.user.id);
      setState(loaded);
      setThemeState(loaded.preferences.theme || loadStoredTheme());
      setActiveNav('overview');
      showToast(`Welcome back, ${res.user.fullName}.`);
      return null;
    },
    [showToast]
  );

  const logout = useCallback(() => {
    saveSession(null);
    setSession(null);
    setState(null);
    setActiveNav('overview');
  }, []);

  const resetPassword = useCallback(
    async (input: { email: string; newPassword: string }) => resetLocalUserPassword(input),
    []
  );

  const deleteUserProfileAccount = useCallback(() => {
    if (!session || session.mode !== 'authenticated') return;
    deleteLocalUserAccount(session.userId);
    setSession(null);
    setState(null);
    setActiveNav('overview');
    showToast('Account and local financial records deleted.', 'info');
  }, [session, showToast]);

  // --- Domain Action Dispatchers ---
  const addTransaction = useCallback(
    (payload: Omit<Transaction, 'id' | 'createdAt'>) =>
      dispatchDomain({ type: 'ADD_TRANSACTION', payload, todayISO }),
    [dispatchDomain, todayISO]
  );

  const updateTransaction = useCallback(
    (id: string, payload: Omit<Transaction, 'id' | 'createdAt'>) =>
      dispatchDomain({ type: 'UPDATE_TRANSACTION', id, payload }),
    [dispatchDomain]
  );

  const deleteTransaction = useCallback(
    (id: string) => {
      dispatchDomain({ type: 'DELETE_TRANSACTION', id });
    },
    [dispatchDomain]
  );

  const addAccount = useCallback(
    (payload: Omit<Account, 'id' | 'createdAt'>) =>
      dispatchDomain({ type: 'ADD_ACCOUNT', payload, todayISO }),
    [dispatchDomain, todayISO]
  );

  const updateAccount = useCallback(
    (id: string, updates: Partial<Omit<Account, 'id' | 'createdAt'>>) =>
      dispatchDomain({ type: 'UPDATE_ACCOUNT', id, updates }),
    [dispatchDomain]
  );

  const deleteAccount = useCallback(
    (id: string) => dispatchDomain({ type: 'DELETE_ACCOUNT', id }),
    [dispatchDomain]
  );

  const addCategory = useCallback(
    (payload: Omit<Category, 'id'>) => dispatchDomain({ type: 'ADD_CATEGORY', payload }),
    [dispatchDomain]
  );

  const updateCategory = useCallback(
    (id: string, updates: Partial<Omit<Category, 'id'>>) =>
      dispatchDomain({ type: 'UPDATE_CATEGORY', id, updates }),
    [dispatchDomain]
  );

  const deleteCategory = useCallback(
    (id: string) => dispatchDomain({ type: 'DELETE_CATEGORY', id }),
    [dispatchDomain]
  );

  const upsertBudget = useCallback(
    (payload: Omit<Budget, 'id'> & { id?: string }) =>
      dispatchDomain({ type: 'UPSERT_BUDGET', payload }),
    [dispatchDomain]
  );

  const deleteBudget = useCallback(
    (id: string) => {
      dispatchDomain({ type: 'DELETE_BUDGET', id });
    },
    [dispatchDomain]
  );

  const addGoal = useCallback(
    (payload: Omit<SavingsGoal, 'id' | 'createdAt'>) =>
      dispatchDomain({ type: 'ADD_GOAL', payload, todayISO }),
    [dispatchDomain, todayISO]
  );

  const updateGoal = useCallback(
    (id: string, updates: Partial<Omit<SavingsGoal, 'id' | 'createdAt'>>) =>
      dispatchDomain({ type: 'UPDATE_GOAL', id, updates }),
    [dispatchDomain]
  );

  const deleteGoal = useCallback(
    (id: string) => {
      dispatchDomain({ type: 'DELETE_GOAL', id });
    },
    [dispatchDomain]
  );

  const recordGoalMovement = useCallback(
    (payload: {
      goalId: string;
      type: 'contribution' | 'withdrawal';
      amount: number;
      accountId?: string;
      date: string;
      note?: string;
    }) => dispatchDomain({ type: 'RECORD_GOAL_MOVEMENT', payload }),
    [dispatchDomain]
  );

  const addRecurring = useCallback(
    (payload: Omit<RecurringTransaction, 'id'>) =>
      dispatchDomain({ type: 'ADD_RECURRING', payload }),
    [dispatchDomain]
  );

  const updateRecurring = useCallback(
    (id: string, updates: Partial<Omit<RecurringTransaction, 'id'>>) =>
      dispatchDomain({ type: 'UPDATE_RECURRING', id, updates }),
    [dispatchDomain]
  );

  const toggleRecurringActive = useCallback(
    (id: string) => {
      dispatchDomain({ type: 'TOGGLE_RECURRING_ACTIVE', id });
    },
    [dispatchDomain]
  );

  const deleteRecurring = useCallback(
    (id: string) => {
      dispatchDomain({ type: 'DELETE_RECURRING', id });
    },
    [dispatchDomain]
  );

  const recordRecurringOccurrence = useCallback(
    (id: string) => dispatchDomain({ type: 'RECORD_RECURRING_OCCURRENCE', id, todayISO }),
    [dispatchDomain, todayISO]
  );

  const updateProfile = useCallback(
    (updates: Partial<UserProfile>) => {
      dispatchDomain({ type: 'UPDATE_PROFILE', updates });
    },
    [dispatchDomain]
  );

  const updatePreferences = useCallback(
    (updates: Partial<UserPreferences>) => {
      if (updates.theme) setThemeState(updates.theme);
      dispatchDomain({ type: 'UPDATE_PREFERENCES', updates });
    },
    [dispatchDomain]
  );

  const contextValue = useMemo<FinanceContextValue>(
    () => ({
      session,
      isDemoMode: session?.mode === 'demo',
      state,
      theme,
      activeNav,
      setActiveNav,
      datePreset,
      setDatePreset,
      customStartDate,
      customEndDate,
      setCustomRange,
      todayISO,
      toasts,
      showToast,
      dismissToast,
      toggleTheme,
      setTheme,
      enterDemoMode,
      resetDemoData,
      signUp,
      login,
      logout,
      resetPassword,
      deleteUserProfileAccount,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addAccount,
      updateAccount,
      deleteAccount,
      addCategory,
      updateCategory,
      deleteCategory,
      upsertBudget,
      deleteBudget,
      addGoal,
      updateGoal,
      deleteGoal,
      recordGoalMovement,
      addRecurring,
      updateRecurring,
      toggleRecurringActive,
      deleteRecurring,
      recordRecurringOccurrence,
      updateProfile,
      updatePreferences,
    }),
    [
      session,
      state,
      theme,
      activeNav,
      datePreset,
      customStartDate,
      customEndDate,
      setCustomRange,
      todayISO,
      toasts,
      showToast,
      dismissToast,
      toggleTheme,
      setTheme,
      enterDemoMode,
      resetDemoData,
      signUp,
      login,
      logout,
      resetPassword,
      deleteUserProfileAccount,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addAccount,
      updateAccount,
      deleteAccount,
      addCategory,
      updateCategory,
      deleteCategory,
      upsertBudget,
      deleteBudget,
      addGoal,
      updateGoal,
      deleteGoal,
      recordGoalMovement,
      addRecurring,
      updateRecurring,
      toggleRecurringActive,
      deleteRecurring,
      recordRecurringOccurrence,
      updateProfile,
      updatePreferences,
    ]
  );

  return <FinanceContext.Provider value={contextValue}>{children}</FinanceContext.Provider>;
}

export function useFinance(): FinanceContextValue {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used inside FinanceProvider');
  return ctx;
}
