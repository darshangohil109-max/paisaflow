import { useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import type { DateFilterPreset } from '../types/finance';
import {
  buildCategoryBreakdown,
  buildMonthlyCashflowSeries,
  calculateSummaryMetrics,
  getDateRangeBounds,
  isDateInRange,
} from '../utils/financeMath';

/**
 * Reusable hook that derives memoized financial summaries, chart datasets,
 * and scoped transactions from the active FinanceContext state.
 */
export function useFinanceMetrics(options?: {
  presetOverride?: DateFilterPreset;
  customStartOverride?: string;
  customEndOverride?: string;
  monthsCount?: number;
}) {
  const { state, datePreset, customStartDate, customEndDate, todayISO } = useFinance();

  const effectivePreset = options?.presetOverride ?? datePreset;
  const effectiveStart = options?.customStartOverride ?? customStartDate;
  const effectiveEnd = options?.customEndOverride ?? customEndDate;
  const effectiveMonths = options?.monthsCount ?? (effectivePreset === 'year' ? 12 : 6);

  const bounds = useMemo(
    () => getDateRangeBounds(effectivePreset, todayISO, effectiveStart, effectiveEnd),
    [effectivePreset, todayISO, effectiveStart, effectiveEnd]
  );

  const summary = useMemo(() => {
    if (!state) return null;
    return calculateSummaryMetrics(
      state.transactions,
      state.accounts,
      state.budgets,
      bounds,
      todayISO
    );
  }, [state, bounds, todayISO]);

  const cashflowSeries = useMemo(() => {
    if (!state) return [];
    return buildMonthlyCashflowSeries(state.transactions, todayISO, effectiveMonths);
  }, [state, todayISO, effectiveMonths]);

  const categoryBreakdown = useMemo(() => {
    if (!state) return [];
    return buildCategoryBreakdown(state.transactions, state.categories, bounds, 'expense');
  }, [state, bounds]);

  const scopedTransactions = useMemo(() => {
    if (!state) return [];
    return state.transactions.filter((tx) => isDateInRange(tx.date, bounds));
  }, [state, bounds]);

  return {
    bounds,
    summary,
    cashflowSeries,
    categoryBreakdown,
    scopedTransactions,
  };
}
