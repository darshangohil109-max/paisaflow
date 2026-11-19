import React, { useMemo, useState } from 'react';
import { AlertTriangle, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useFinance } from '../context/FinanceContext';
import { getChartThemeTokens } from '../config/env';
import type { Budget } from '../types/finance';
import { addMonthsClampedISO, computeBudgetSpending } from '../utils/financeMath';
import { formatCurrency, formatDateDisplay, formatMonthYear } from '../utils/formatters';
import { CategoryIcon } from '../components/CategoryIcon';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Modal } from '../components/ui';

export function BudgetsPage() {
  const { state, theme, todayISO, upsertBudget, deleteBudget } = useFinance();

  const currentMonthKey = todayISO.slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Budget | null>(null);

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<string>('overall');
  const [limit, setLimit] = useState('');
  const [period, setPeriod] = useState<'monthly' | 'custom'>('monthly');
  const [startDate, setStartDate] = useState(`${currentMonthKey}-01`);
  const [endDate, setEndDate] = useState(todayISO);
  const [error, setError] = useState<string | null>(null);

  const monthOptions = useMemo(() => {
    const opts: string[] = [];
    for (let i = 0; i < 6; i++) {
      opts.push(addMonthsClampedISO(`${currentMonthKey}-01`, -i).slice(0, 7));
    }
    return opts;
  }, [currentMonthKey]);

  const budgetRows = useMemo(() => {
    if (!state) return [];
    return state.budgets.map((b) => {
      const effectiveBudget: Budget =
        b.period === 'monthly' ? { ...b, monthKey: selectedMonth } : b;
      const stats = computeBudgetSpending(effectiveBudget, state.transactions, selectedMonth);
      return { budget: b, stats };
    });
  }, [state, selectedMonth]);

  if (!state) return null;

  const currency = state.preferences.currency;
  const mask = state.preferences.privacy.maskBalances;
  const dateFmt = state.preferences.dateFormat;
  const catMap = new Map(state.categories.map((c) => [c.id, c]));
  const expenseCategories = state.categories.filter((c) => c.type === 'expense');

  const overallRow = budgetRows.find((r) => r.budget.categoryId === null);
  const categoryRows = budgetRows.filter((r) => r.budget.categoryId !== null);

  const chartData = categoryRows.map((r) => ({
    name: r.budget.name,
    Limit: r.budget.limit,
    Spent: r.stats.spent,
  }));

  const { gridStroke, axisColor, primaryBar, expenseBar, tooltipBg } = getChartThemeTokens(theme);

  const openCreateModal = (presetCategory?: string) => {
    setEditingBudget(null);
    setCategoryId(presetCategory ?? 'overall');
    setName(
      presetCategory
        ? (catMap.get(presetCategory)?.name ?? 'Category Budget')
        : 'Overall Monthly Budget'
    );
    setLimit('');
    setPeriod('monthly');
    setStartDate(`${selectedMonth}-01`);
    setEndDate(todayISO);
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (b: Budget) => {
    setEditingBudget(b);
    setName(b.name);
    setCategoryId(b.categoryId ?? 'overall');
    setLimit(String(b.limit));
    setPeriod(b.period);
    setStartDate(b.startDate ?? `${selectedMonth}-01`);
    setEndDate(b.endDate ?? todayISO);
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = upsertBudget({
      id: editingBudget?.id,
      name: name.trim(),
      categoryId: categoryId === 'overall' ? null : categoryId,
      limit: Number(limit),
      period,
      monthKey: period === 'monthly' ? selectedMonth : undefined,
      startDate: period === 'custom' ? startDate : undefined,
      endDate: period === 'custom' ? endDate : undefined,
    });
    if (err) {
      setError(err);
      return;
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label htmlFor="budget-month-select" className="text-xs font-semibold text-[#89918B]">
            Period:
          </label>
          <select
            id="budget-month-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] text-xs font-semibold"
          >
            {monthOptions.map((mk) => (
              <option key={mk} value={mk}>
                {formatMonthYear(mk)}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => openCreateModal()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#245C45] text-white dark:bg-[#83B89A] dark:text-[#151A18] text-xs sm:text-sm font-bold hover:bg-[#1D4A38] dark:hover:bg-[#96C7AC] transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Set Budget</span>
        </button>
      </div>

      {/* Overall Monthly Budget Spotlight */}
      <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] p-5 sm:p-6">
        {overallRow ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-[#89918B] dark:text-[#9AA69E]">
                  {overallRow.budget.name} · {formatMonthYear(selectedMonth)}
                </p>
                <div className="mt-1 flex items-baseline gap-2.5">
                  <span className="text-2xl sm:text-3xl font-extrabold font-mono-num">
                    {formatCurrency(overallRow.stats.spent, currency, { mask })}
                  </span>
                  <span className="text-sm text-[#89918B] dark:text-[#9AA69E] font-mono-num">
                    of {formatCurrency(overallRow.budget.limit, currency, { mask })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(overallRow.budget)}
                  className="px-3 py-1.5 rounded-xl border border-[#E8E7E0] dark:border-[#343D37] text-xs font-semibold"
                >
                  Edit Limit
                </button>
              </div>
            </div>

            <div className="h-3 rounded-full bg-[#F7F6F2] dark:bg-[#151A18] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  overallRow.stats.isOver
                    ? 'bg-red-500'
                    : overallRow.stats.pct >= 85
                      ? 'bg-[#D9822B]'
                      : 'bg-[#245C45] dark:bg-[#83B89A]'
                }`}
                style={{ width: `${Math.min(100, overallRow.stats.pct)}%` }}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span
                className={`font-semibold ${
                  overallRow.stats.isOver
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-[#245C45] dark:text-[#83B89A]'
                }`}
              >
                {overallRow.stats.isOver
                  ? `Overspent by ${formatCurrency(Math.abs(overallRow.stats.remaining), currency, { mask })}`
                  : `${formatCurrency(overallRow.stats.remaining, currency, { mask })} remaining`}
              </span>
              <span className="font-mono-num text-[#89918B] dark:text-[#9AA69E]">
                {overallRow.stats.pct}% utilized
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold">No Overall Monthly Budget Set</h2>
              <p className="text-xs text-[#89918B] dark:text-[#9AA69E] mt-1">
                Set a master monthly spending ceiling to track utilization across all categories.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openCreateModal('overall')}
              className="px-4 py-2 rounded-xl bg-[#245C45] text-white dark:bg-[#83B89A] dark:text-[#151A18] text-xs font-bold"
            >
              Create Overall Budget
            </button>
          </div>
        )}
      </div>

      {/* Category Budgets + Utilization Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 space-y-3">
          <h2 className="text-base font-bold">Category Budgets</h2>
          {categoryRows.length === 0 ? (
            <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] p-8 text-center">
              <p className="text-sm font-semibold">No category budgets yet</p>
              <p className="text-xs text-[#89918B] dark:text-[#9AA69E] mt-1">
                Assign spending limits to Food & Dining, Groceries, Shopping, or Travel.
              </p>
              <button
                type="button"
                onClick={() => openCreateModal(expenseCategories[0]?.id)}
                className="mt-4 px-4 py-2 rounded-xl bg-[#245C45] text-white dark:bg-[#83B89A] dark:text-[#151A18] text-xs font-bold"
              >
                Add Category Budget
              </button>
            </div>
          ) : (
            categoryRows.map(({ budget, stats }) => {
              const cat = budget.categoryId ? catMap.get(budget.categoryId) : null;
              return (
                <div
                  key={budget.id}
                  className="rounded-2xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] p-4 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: `${cat?.color ?? '#245C45'}1A`,
                          color: cat?.color ?? '#245C45',
                        }}
                      >
                        <CategoryIcon name={cat?.icon ?? 'MoreHorizontal'} className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate flex items-center gap-1.5">
                          {budget.name}
                          {stats.isOver && (
                            <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          )}
                        </p>
                        <p className="text-xs text-[#89918B] dark:text-[#9AA69E]">
                          {budget.period === 'custom' && budget.startDate && budget.endDate
                            ? `${formatDateDisplay(budget.startDate, dateFmt)} – ${formatDateDisplay(budget.endDate, dateFmt)}`
                            : formatMonthYear(selectedMonth)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-mono-num font-bold">
                        {formatCurrency(stats.spent, currency, { mask })} /{' '}
                        {formatCurrency(budget.limit, currency, { mask })}
                      </span>
                      <button
                        type="button"
                        onClick={() => openEditModal(budget)}
                        aria-label={`Edit ${budget.name} budget`}
                        className="p-1.5 rounded-lg text-[#89918B] hover:text-[#245C45] dark:hover:text-[#83B89A]"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(budget)}
                        aria-label={`Delete ${budget.name} budget`}
                        className="p-1.5 rounded-lg text-[#89918B] hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="h-2 rounded-full bg-[#F7F6F2] dark:bg-[#151A18] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        stats.isOver
                          ? 'bg-red-500'
                          : stats.pct >= 80
                            ? 'bg-[#D9822B]'
                            : 'bg-[#245C45] dark:bg-[#83B89A]'
                      }`}
                      style={{ width: `${Math.min(100, stats.pct)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#89918B] dark:text-[#9AA69E]">
                    <span>
                      {stats.isOver
                        ? `Over by ${formatCurrency(Math.abs(stats.remaining), currency, { mask })}`
                        : `${formatCurrency(stats.remaining, currency, { mask })} left`}
                    </span>
                    <span className="font-mono-num">{stats.pct}%</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Budget Utilization Chart */}
        <div className="lg:col-span-6 rounded-2xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] p-5 sm:p-6">
          <h2 className="text-base font-bold">Budget vs Actual Spending</h2>
          <p className="text-xs text-[#89918B] dark:text-[#9AA69E] mb-4">
            Utilization across configured categories ({formatMonthYear(selectedMonth)})
          </p>

          {chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-[#89918B]">
              Add category budgets to compare planned limits vs actual spending.
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fill: axisColor, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₹${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value ?? 0), currency, { mask })}
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      borderColor: gridStroke,
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="Limit" fill={expenseBar} radius={[6, 6, 0, 0]} maxBarSize={26} isAnimationActive={false} />
                  <Bar
                    dataKey="Spent"
                    fill={primaryBar}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={26}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Budget History Comparison Table */}
      <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] p-5 sm:p-6">
        <h2 className="text-base font-bold mb-1">Recent Months Budget History</h2>
        <p className="text-xs text-[#89918B] dark:text-[#9AA69E] mb-4">
          How your monthly expenses performed against your overall monthly budget limit
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#E8E7E0] dark:border-[#343D37] text-xs font-semibold text-[#89918B]">
                <th className="py-2.5 px-3">Month</th>
                <th className="py-2.5 px-3 text-right">Budget Limit</th>
                <th className="py-2.5 px-3 text-right">Actual Spent</th>
                <th className="py-2.5 px-3 text-right">Variance</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E7E0] dark:divide-[#343D37]">
              {monthOptions.slice(0, 4).map((mk) => {
                const limitVal = overallRow?.budget.limit ?? 0;
                const spentVal = state.transactions
                  .filter((tx) => tx.type === 'expense' && tx.date.startsWith(mk))
                  .reduce((sum, tx) => sum + tx.amount, 0);
                const diff = limitVal - spentVal;
                return (
                  <tr key={mk}>
                    <td className="py-2.5 px-3 font-semibold">{formatMonthYear(mk)}</td>
                    <td className="py-2.5 px-3 text-right font-mono-num">
                      {limitVal > 0 ? formatCurrency(limitVal, currency, { mask }) : 'Not set'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono-num">
                      {formatCurrency(spentVal, currency, { mask })}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-mono-num font-semibold ${
                        limitVal > 0 && diff < 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-[#245C45] dark:text-[#83B89A]'
                      }`}
                    >
                      {limitVal > 0 ? formatCurrency(diff, currency, { mask }) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right text-xs">
                      {limitVal === 0
                        ? 'No limit'
                        : diff >= 0
                          ? 'Under Budget'
                          : 'Over Budget'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Budget Modal */}
      <Modal
        open={modalOpen}
        title={editingBudget ? 'Edit Budget' : 'Set Budget Limit'}
        onClose={() => setModalOpen(false)}
      >

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-xs text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="bud-cat" className="block text-xs font-semibold text-[#89918B] mb-1">
                  Scope
                </label>
                <select
                  id="bud-cat"
                  value={categoryId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCategoryId(val);
                    setName(
                      val === 'overall'
                        ? 'Overall Monthly Budget'
                        : (catMap.get(val)?.name ?? 'Category Budget')
                    );
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-sm"
                >
                  <option value="overall">Overall Monthly Budget</option>
                  {expenseCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="bud-name" className="block text-xs font-semibold text-[#89918B] mb-1">
                  Budget Name
                </label>
                <input
                  id="bud-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="bud-limit" className="block text-xs font-semibold text-[#89918B] mb-1">
                    Limit (₹)
                  </label>
                  <input
                    id="bud-limit"
                    type="number"
                    min="1"
                    step="1"
                    required
                    placeholder="5000"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-sm font-mono-num"
                  />
                </div>

                <div>
                  <label htmlFor="bud-period" className="block text-xs font-semibold text-[#89918B] mb-1">
                    Period Type
                  </label>
                  <select
                    id="bud-period"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as 'monthly' | 'custom')}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-sm"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="custom">Custom Period</option>
                  </select>
                </div>
              </div>

              {period === 'custom' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="bud-start" className="block text-xs font-semibold text-[#89918B] mb-1">
                      Start Date
                    </label>
                    <input
                      id="bud-start"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-xs"
                    />
                  </div>
                  <div>
                    <label htmlFor="bud-end" className="block text-xs font-semibold text-[#89918B] mb-1">
                      End Date
                    </label>
                    <input
                      id="bud-end"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-xs"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8E7E0] dark:border-[#343D37]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E8E7E0] dark:border-[#343D37] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#245C45] text-white dark:bg-[#83B89A] dark:text-[#151A18] text-xs font-bold"
                >
                  Save Budget
                </button>
              </div>
            </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Budget"
        description={deleteTarget ? `Remove the "${deleteTarget.name}" budget?` : ''}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) deleteBudget(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
