import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  PiggyBank,
  Target,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useFinance } from '../context/FinanceContext';
import { useFinanceMetrics } from '../hooks/useFinanceMetrics';
import { getChartThemeTokens } from '../config/env';
import type { DateFilterPreset, Transaction } from '../types/finance';
import { computeBudgetSpending } from '../utils/financeMath';
import { formatCurrency, formatDateDisplay } from '../utils/formatters';
import { CategoryIcon } from '../components/CategoryIcon';
import { SegmentedControl } from '../components/ui';

const FILTER_OPTIONS: Array<{ id: DateFilterPreset; label: string }> = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
  { id: 'year', label: 'This Year' },
  { id: 'custom', label: 'Custom Range' },
];

export function OverviewPage({
  onOpenAddTransaction,
  onEditTransaction,
}: {
  onOpenAddTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
}) {
  const {
    state,
    theme,
    datePreset,
    setDatePreset,
    customStartDate,
    customEndDate,
    setCustomRange,
    todayISO,
    setActiveNav,
    recordRecurringOccurrence,
    showToast,
  } = useFinance();

  const { bounds, summary, cashflowSeries, categoryBreakdown, scopedTransactions } =
    useFinanceMetrics();

  if (!state || !summary) return null;

  const recentTransactions = scopedTransactions.slice(0, 6);
  const currency = state.preferences.currency;
  const mask = state.preferences.privacy.maskBalances;
  const dateFmt = state.preferences.dateFormat;
  const catMap = new Map(state.categories.map((c) => [c.id, c]));
  const accMap = new Map(state.accounts.map((a) => [a.id, a]));

  const currentMonthKey = todayISO.slice(0, 7);
  const activeBudgets = state.budgets.slice(0, 4);
  const upcomingRecurring = state.recurring
    .filter((r) => r.active)
    .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate))
    .slice(0, 4);

  const { gridStroke, axisColor, primaryBar, expenseBar, tooltipBg } = getChartThemeTokens(theme);

  return (
    <div className="space-y-6">
      {/* Date Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl
          options={FILTER_OPTIONS}
          value={datePreset}
          onChange={setDatePreset}
          ariaLabel="Date range filter"
        />

        {datePreset === 'custom' && (
          <div className="flex items-center gap-2 text-xs">
            <label className="sr-only" htmlFor="overview-start-date">
              Start date
            </label>
            <input
              id="overview-start-date"
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomRange(e.target.value, customEndDate)}
              className="px-3 py-1.5 rounded-xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] text-xs"
            />
            <span className="text-[#89918B]">to</span>
            <label className="sr-only" htmlFor="overview-end-date">
              End date
            </label>
            <input
              id="overview-end-date"
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomRange(customStartDate, e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] text-xs"
            />
          </div>
        )}
      </div>

      {/* Top Financial Summary Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Dominant Hero Balance Card */}
        <div className="lg:col-span-4 rounded-2xl bg-[#245C45] dark:bg-[#1A2D24] border border-[#245C45] dark:border-[#83B89A]/40 p-6 text-white dark:text-[#F3F5F1] flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-white/80 dark:text-[#9AA69E]">
                Total Balance ({state.accounts.length} accounts)
              </p>
              <p
                data-testid="kpi-total-balance"
                className="mt-2 text-3xl sm:text-4xl font-extrabold font-mono-num tracking-tight"
              >
                {formatCurrency(summary.totalBalance, currency, { mask })}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/15 dark:bg-[#83B89A]/15 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 text-white dark:text-[#83B89A]" aria-hidden="true" />
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-white/15 dark:border-[#343D37] flex items-center justify-between text-xs">
            <span className="text-white/80 dark:text-[#9AA69E]">
              Period: {bounds.label} ({formatDateDisplay(bounds.startDate, dateFmt)})
            </span>
            <button
              type="button"
              onClick={() => setActiveNav('accounts')}
              className="font-bold text-[#D9B98C] hover:underline whitespace-nowrap"
            >
              Accounts →
            </button>
          </div>
        </div>

        {/* 5 Secondary KPI Metrics */}
        <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#89918B] dark:text-[#9AA69E]">
                Total Income
              </span>
              <ArrowDownLeft className="w-4 h-4 text-[#245C45] dark:text-[#83B89A]" />
            </div>
            <p
              data-testid="kpi-total-income"
              className="mt-2 text-xl sm:text-2xl font-bold font-mono-num text-[#245C45] dark:text-[#83B89A]"
            >
              {formatCurrency(summary.totalIncome, currency, { mask })}
            </p>
            <p className="mt-1 text-[11px] text-[#89918B] dark:text-[#9AA69E]">{bounds.label}</p>
          </div>

          <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#89918B] dark:text-[#9AA69E]">
                Total Expenses
              </span>
              <ArrowUpRight className="w-4 h-4 text-[#D9822B]" />
            </div>
            <p
              data-testid="kpi-total-expenses"
              className="mt-2 text-xl sm:text-2xl font-bold font-mono-num text-[#242A26] dark:text-[#F3F5F1]"
            >
              {formatCurrency(summary.totalExpenses, currency, { mask })}
            </p>
            <p className="mt-1 text-[11px] text-[#89918B] dark:text-[#9AA69E]">
              Excludes transfers
            </p>
          </div>

          <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#89918B] dark:text-[#9AA69E]">
                Net Savings
              </span>
              <PiggyBank className="w-4 h-4 text-[#75977F]" />
            </div>
            <p
              data-testid="kpi-net-savings"
              className={`mt-2 text-xl sm:text-2xl font-bold font-mono-num ${
                summary.netSavings >= 0
                  ? 'text-[#245C45] dark:text-[#83B89A]'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {formatCurrency(summary.netSavings, currency, { mask })}
            </p>
            <p className="mt-1 text-[11px] text-[#89918B] dark:text-[#9AA69E]">
              Income minus expenses
            </p>
          </div>

          <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#89918B] dark:text-[#9AA69E]">
                Monthly Savings Rate
              </span>
              <TrendingUp className="w-4 h-4 text-[#245C45] dark:text-[#83B89A]" />
            </div>
            <p className="mt-2 text-xl sm:text-2xl font-bold font-mono-num">
              {summary.savingsRate}%
            </p>
            <p className="mt-1 text-[11px] text-[#89918B] dark:text-[#9AA69E]">
              Target: 20%+ recommended
            </p>
          </div>

          <div className="col-span-2 sm:col-span-2 rounded-2xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#89918B] dark:text-[#9AA69E]">
                Budget Utilization
              </span>
              <span className="text-xs font-bold font-mono-num">
                {summary.overallBudgetLimit > 0
                  ? `${summary.budgetUtilizationPct}% of ${formatCurrency(summary.overallBudgetLimit, currency, { mask })}`
                  : 'No budget set'}
              </span>
            </div>
            <div className="mt-3 w-full h-2.5 rounded-full bg-[#F7F6F2] dark:bg-[#151A18] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  summary.budgetUtilizationPct > 100
                    ? 'bg-red-500'
                    : summary.budgetUtilizationPct >= 85
                      ? 'bg-[#D9822B]'
                      : 'bg-[#245C45] dark:bg-[#83B89A]'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, summary.budgetUtilizationPct))}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-[#89918B] dark:text-[#9AA69E]">
              <span>
                {summary.budgetUtilizationPct > 100
                  ? 'Overspending detected'
                  : 'Within healthy monthly pace'}
              </span>
              <button
                type="button"
                onClick={() => setActiveNav('budgets')}
                className="font-semibold text-[#245C45] dark:text-[#83B89A] hover:underline"
              >
                Manage Budgets
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Income vs Expenses Bar Chart */}
        <div className="lg:col-span-7 rounded-2xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold">Income vs Expenses</h2>
              <p className="text-xs text-[#89918B] dark:text-[#9AA69E]">
                Monthly cashflow comparison (INR)
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#245C45] dark:bg-[#83B89A]" />
                Income
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#D9B98C]" />
                Expenses
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashflowSeries} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 12 }} axisLine={false} tickLine={false} />
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
                <Bar dataKey="income" name="Income" fill={primaryBar} radius={[6, 6, 0, 0]} maxBarSize={28} isAnimationActive={false} />
                <Bar dataKey="expenses" name="Expenses" fill={expenseBar} radius={[6, 6, 0, 0]} maxBarSize={28} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spending by Category Donut Chart */}
        <div className="lg:col-span-5 rounded-2xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] p-5 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold">Spending by Category</h2>
              <p className="text-xs text-[#89918B] dark:text-[#9AA69E]">{bounds.label}</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveNav('analytics')}
              className="text-xs font-semibold text-[#245C45] dark:text-[#83B89A] hover:underline"
            >
              Details
            </button>
          </div>

          {categoryBreakdown.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
              <p className="text-sm font-semibold">No expenses in {bounds.label.toLowerCase()}</p>
              <p className="text-xs text-[#89918B] dark:text-[#9AA69E] mt-1">
                Log an expense to see category distribution.
              </p>
              <button
                type="button"
                onClick={onOpenAddTransaction}
                className="mt-3 px-3.5 py-2 rounded-xl bg-[#245C45] text-white dark:bg-[#83B89A] dark:text-[#151A18] text-xs font-bold"
              >
                Add Expense
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center flex-1">
              <div className="h-48 w-full min-w-[160px]">
                <ResponsiveContainer width="100%" height={192}>
                  <PieChart>
                    <Pie
                      data={categoryBreakdown.slice(0, 6)}
                      dataKey="amount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={76}
                      paddingAngle={2}
                      isAnimationActive={false}
                    >
                      {categoryBreakdown.slice(0, 6).map((entry) => (
                        <Cell key={entry.categoryId} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value ?? 0), currency, { mask })}
                      contentStyle={{
                        backgroundColor: tooltipBg,
                        borderColor: gridStroke,
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2.5">
                {categoryBreakdown.slice(0, 5).map((item) => (
                  <div key={item.categoryId} className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="truncate font-medium">{item.name}</span>
                    </div>
                    <span className="font-mono-num font-semibold shrink-0">
                      {item.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Expense Trend */}
      <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold">Monthly Expense Trend</h2>
            <p className="text-xs text-[#89918B] dark:text-[#9AA69E]">
              Spending trajectory over recent months
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveNav('reports')}
            className="text-xs font-semibold text-[#245C45] dark:text-[#83B89A] hover:underline"
          >
            View Reports →
          </button>
        </div>

        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cashflowSeries} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="pfExpenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={primaryBar} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={primaryBar} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 12 }} axisLine={false} tickLine={false} />
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
              <Area
                type="monotone"
                dataKey="expenses"
                name="Expenses"
                stroke={primaryBar}
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#pfExpenseGrad)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom 2x2 Operational Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <section className="rounded-2xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold">Recent Transactions</h2>
            <button
              type="button"
              onClick={() => setActiveNav('transactions')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#245C45] dark:text-[#83B89A] hover:underline"
            >
              <span>See All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm font-medium text-[#89918B] dark:text-[#9AA69E]">
                No transactions recorded for {bounds.label.toLowerCase()}.
              </p>
              <button
                type="button"
                onClick={onOpenAddTransaction}
                className="mt-3 px-4 py-2 rounded-xl bg-[#245C45] text-white dark:bg-[#83B89A] dark:text-[#151A18] text-xs font-bold"
              >
                Log First Transaction
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#E8E7E0] dark:divide-[#343D37]">
              {recentTransactions.map((tx) => {
                const cat = catMap.get(tx.categoryId);
                const acc = accMap.get(tx.accountId);
                return (
                  <button
                    key={tx.id}
                    type="button"
                    onClick={() => onEditTransaction(tx)}
                    className="w-full py-3 flex items-center justify-between gap-3 text-left hover:bg-[#F7F6F2]/70 dark:hover:bg-[#26302B]/50 -mx-2 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor:
                            tx.type === 'transfer' ? '#3B7A8C18' : `${cat?.color ?? '#89918B'}1A`,
                          color: tx.type === 'transfer' ? '#3B7A8C' : (cat?.color ?? '#89918B'),
                        }}
                      >
                        {tx.type === 'transfer' ? (
                          <ArrowLeftRight className="w-4 h-4" />
                        ) : (
                          <CategoryIcon name={cat?.icon ?? 'MoreHorizontal'} className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{tx.title}</p>
                        <p className="text-xs text-[#89918B] dark:text-[#9AA69E] truncate">
                          {tx.type === 'transfer' ? 'Transfer' : (cat?.name ?? 'Other')} ·{' '}
                          {acc?.name ?? 'Account'} · {formatDateDisplay(tx.date, dateFmt)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-bold font-mono-num shrink-0 ${
                        tx.type === 'income'
                          ? 'text-[#245C45] dark:text-[#83B89A]'
                          : tx.type === 'transfer'
                            ? 'text-[#3B7A8C] dark:text-[#A6C5AF]'
                            : 'text-[#242A26] dark:text-[#F3F5F1]'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                      {formatCurrency(tx.amount, currency, { mask })}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Upcoming Recurring Payments */}
        <section className="rounded-2xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold">Upcoming Recurring Payments</h2>
            <button
              type="button"
              onClick={() => setActiveNav('recurring')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#245C45] dark:text-[#83B89A] hover:underline"
            >
              <span>Manage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {upcomingRecurring.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-[#89918B] dark:text-[#9AA69E]">
                No active recurring schedules yet.
              </p>
              <button
                type="button"
                onClick={() => setActiveNav('recurring')}
                className="mt-3 px-4 py-2 rounded-xl border border-[#E8E7E0] dark:border-[#343D37] text-xs font-bold"
              >
                Schedule Bill or Salary
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#E8E7E0] dark:divide-[#343D37]">
              {upcomingRecurring.map((item) => {
                const isDue = item.nextDueDate <= todayISO;
                return (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] flex items-center justify-center text-[#245C45] dark:text-[#83B89A] shrink-0">
                        <CalendarClock className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{item.title}</p>
                        <p className="text-xs text-[#89918B] dark:text-[#9AA69E]">
                          {item.frequency} · Next: {formatDateDisplay(item.nextDueDate, dateFmt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`text-sm font-bold font-mono-num ${
                          item.type === 'income'
                            ? 'text-[#245C45] dark:text-[#83B89A]'
                            : 'text-[#242A26] dark:text-[#F3F5F1]'
                        }`}
                      >
                        {item.type === 'income' ? '+' : '-'}
                        {formatCurrency(item.amount, currency, { mask })}
                      </span>
                      {isDue && (
                        <button
                          type="button"
                          onClick={() => {
                            const err = recordRecurringOccurrence(item.id);
                            if (err) showToast(err, 'error');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#245C45] text-white dark:bg-[#83B89A] dark:text-[#151A18] text-xs font-bold"
                        >
                          Record
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Budget Progress */}
        <section className="rounded-2xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold">Budget Progress</h2>
            <button
              type="button"
              onClick={() => setActiveNav('budgets')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#245C45] dark:text-[#83B89A] hover:underline"
            >
              <span>All Budgets</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {activeBudgets.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-[#89918B] dark:text-[#9AA69E]">
                No budgets configured yet.
              </p>
              <button
                type="button"
                onClick={() => setActiveNav('budgets')}
                className="mt-3 px-4 py-2 rounded-xl border border-[#E8E7E0] dark:border-[#343D37] text-xs font-bold"
              >
                Set Monthly Budget
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {activeBudgets.map((b) => {
                const stats = computeBudgetSpending(b, state.transactions, currentMonthKey);
                return (
                  <div key={b.id} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold flex items-center gap-1.5">
                        {b.name}
                        {stats.isOver && (
                          <AlertTriangle className="w-3.5 h-3.5 text-red-500" aria-label="Over budget" />
                        )}
                      </span>
                      <span className="font-mono-num text-[#89918B] dark:text-[#9AA69E]">
                        {formatCurrency(stats.spent, currency, { mask })} /{' '}
                        {formatCurrency(b.limit, currency, { mask })} ({Math.round(stats.pct)}%)
                      </span>
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
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Savings Goals Progress */}
        <section className="rounded-2xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold">Savings Goals Progress</h2>
            <button
              type="button"
              onClick={() => setActiveNav('goals')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#245C45] dark:text-[#83B89A] hover:underline"
            >
              <span>Manage Goals</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {state.goals.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-[#89918B] dark:text-[#9AA69E]">
                No savings goals added yet.
              </p>
              <button
                type="button"
                onClick={() => setActiveNav('goals')}
                className="mt-3 px-4 py-2 rounded-xl border border-[#E8E7E0] dark:border-[#343D37] text-xs font-bold"
              >
                Create First Goal
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {state.goals.slice(0, 3).map((goal) => {
                const pct =
                  goal.targetAmount > 0
                    ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
                    : 0;
                return (
                  <div key={goal.id} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold flex items-center gap-2">
                        <Target className="w-3.5 h-3.5 text-[#245C45] dark:text-[#83B89A]" />
                        {goal.name}
                      </span>
                      <span className="font-mono-num text-[#89918B] dark:text-[#9AA69E]">
                        {formatCurrency(goal.currentAmount, currency, { mask })} /{' '}
                        {formatCurrency(goal.targetAmount, currency, { mask })} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[#F7F6F2] dark:bg-[#151A18] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#245C45] dark:bg-[#83B89A]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
