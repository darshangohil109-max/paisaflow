import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useFinance } from '../context/FinanceContext';
import { getChartThemeTokens } from '../config/env';
import {
  buildCategoryBreakdown,
  buildMonthlyCashflowSeries,
  computeAllAccountBalances,
  computeBudgetSpending,
  getDateRangeBounds,
} from '../utils/financeMath';
import { formatCurrency } from '../utils/formatters';
import { SegmentedControl } from '../components/ui';

const HORIZON_OPTIONS = [
  { id: 'monthly', label: '6-Month View' },
  { id: 'yearly', label: '12-Month Yearly' },
] as const;

export function AnalyticsPage() {
  const { state, theme, todayISO } = useFinance();
  const [horizon, setHorizon] = useState<'monthly' | 'yearly'>('monthly');

  const monthlySeries = useMemo(() => {
    if (!state) return [];
    return buildMonthlyCashflowSeries(state.transactions, todayISO, horizon === 'yearly' ? 12 : 6);
  }, [state, todayISO, horizon]);

  const cumulativeSavingsSeries = useMemo(() => {
    let running = 0;
    return monthlySeries.map((m) => {
      running += m.savings;
      return {
        label: m.label,
        monthlySavings: m.savings,
        cumulativeSavings: running,
      };
    });
  }, [monthlySeries]);

  const bounds = useMemo(
    () => getDateRangeBounds(horizon === 'yearly' ? 'year' : 'month', todayISO),
    [horizon, todayISO]
  );

  const categoryBreakdown = useMemo(() => {
    if (!state) return [];
    return buildCategoryBreakdown(state.transactions, state.categories, bounds, 'expense');
  }, [state, bounds]);

  const accountBalancesData = useMemo(() => {
    if (!state) return [];
    const balMap = computeAllAccountBalances(state.accounts, state.transactions);
    return state.accounts.map((a) => ({
      name: a.name,
      balance: Math.max(0, balMap[a.id] ?? 0),
      color: a.color,
    }));
  }, [state]);

  const budgetPerfData = useMemo(() => {
    if (!state) return [];
    const mk = todayISO.slice(0, 7);
    return state.budgets
      .filter((b) => b.categoryId !== null)
      .map((b) => {
        const stats = computeBudgetSpending(b, state.transactions, mk);
        return {
          name: b.name,
          Limit: b.limit,
          Spent: stats.spent,
        };
      });
  }, [state, todayISO]);

  if (!state) return null;

  const currency = state.preferences.currency;
  const mask = state.preferences.privacy.maskBalances;
  const {
    gridStroke,
    axisColor,
    primaryBar: primaryColor,
    expenseBar,
    tooltipBg,
  } = getChartThemeTokens(theme);

  return (
    <div className="space-y-6">
      {/* Horizon Toggle */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs sm:text-sm text-[#89918B] dark:text-[#9AA69E]">
          Deep financial trends derived live from your recorded ledger
        </p>
        <SegmentedControl
          options={HORIZON_OPTIONS}
          value={horizon}
          onChange={setHorizon}
          ariaLabel="Analytics time horizon"
        />
      </div>

      {/* Row 1: Income vs Expenses + Category-wise Spending */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-2xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] p-5 sm:p-6">
          <h2 className="text-base font-bold">Income vs Expenses Overview</h2>
          <p className="text-xs text-[#89918B] dark:text-[#9AA69E] mb-4">
            {horizon === 'yearly' ? 'Annual 12-month cashflow' : 'Last 6 months comparison'}
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySeries} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
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
                <Bar dataKey="income" name="Income" fill={primaryColor} radius={[6, 6, 0, 0]} maxBarSize={24} isAnimationActive={false} />
                <Bar dataKey="expenses" name="Expenses" fill={expenseBar} radius={[6, 6, 0, 0]} maxBarSize={24} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 rounded-2xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] p-5 sm:p-6">
          <h2 className="text-base font-bold">Category-wise Spending</h2>
          <p className="text-xs text-[#89918B] dark:text-[#9AA69E] mb-4">{bounds.label}</p>
          {categoryBreakdown.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-[#89918B]">
              No expenses recorded in this period.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="h-52 w-full min-w-[160px]">
                <ResponsiveContainer width="100%" height={208}>
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      dataKey="amount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={74}
                      paddingAngle={2}
                      isAnimationActive={false}
                    >
                      {categoryBreakdown.map((c) => (
                        <Cell key={c.categoryId} fill={c.color} />
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
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {categoryBreakdown.map((c) => (
                  <div key={c.categoryId} className="flex items-center justify-between text-xs gap-2">
                    <span className="flex items-center gap-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="truncate">{c.name}</span>
                    </span>
                    <span className="font-mono-num font-semibold shrink-0">{c.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Monthly Spending Trends + Savings Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] p-5 sm:p-6">
          <h2 className="text-base font-bold">Monthly Spending Trend</h2>
          <p className="text-xs text-[#89918B] dark:text-[#9AA69E] mb-4">
            Month-to-month expense velocity
          </p>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlySeries} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
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
                <Line
                  type="monotone"
                  dataKey="expenses"
                  name="Expenses"
                  stroke="#D9822B"
                  strokeWidth={2.5}
                  dot={{ r: 3.5 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] p-5 sm:p-6">
          <h2 className="text-base font-bold">Cumulative Savings Growth</h2>
          <p className="text-xs text-[#89918B] dark:text-[#9AA69E] mb-4">
            Net savings accumulation over the selected period
          </p>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cumulativeSavingsSeries} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="pfSavingsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={primaryColor} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
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
                  dataKey="cumulativeSavings"
                  name="Cumulative Savings"
                  stroke={primaryColor}
                  strokeWidth={2.5}
                  fill="url(#pfSavingsGrad)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Account-wise Balance + Budget Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] p-5 sm:p-6">
          <h2 className="text-base font-bold">Account-wise Balance Distribution</h2>
          <p className="text-xs text-[#89918B] dark:text-[#9AA69E] mb-4">
            Live balances across wallets and bank accounts
          </p>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={accountBalancesData} layout="vertical" margin={{ top: 4, right: 16, left: 16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: axisColor, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
                />
                <YAxis type="category" dataKey="name" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} width={96} />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value ?? 0), currency, { mask })}
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: gridStroke,
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="balance" name="Balance" radius={[0, 6, 6, 0]} maxBarSize={26} isAnimationActive={false}>
                  {accountBalancesData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] p-5 sm:p-6">
          <h2 className="text-base font-bold">Budget Performance (Current Month)</h2>
          <p className="text-xs text-[#89918B] dark:text-[#9AA69E] mb-4">
            Category limits vs actual spend
          </p>
          {budgetPerfData.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-xs text-[#89918B]">
              No category budgets configured for this month.
            </div>
          ) : (
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetPerfData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
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
                  <Bar dataKey="Limit" fill={expenseBar} radius={[6, 6, 0, 0]} maxBarSize={24} isAnimationActive={false} />
                  <Bar dataKey="Spent" fill={primaryColor} radius={[6, 6, 0, 0]} maxBarSize={24} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
