import { useState } from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useFinanceMetrics } from '../hooks/useFinanceMetrics';
import type { DateFilterPreset } from '../types/finance';
import { transactionsToCsv } from '../utils/financeMath';
import { downloadCsv } from '../utils/fileExport';
import { formatCurrency, formatDateDisplay } from '../utils/formatters';
import { generateFinancialPdfReport } from '../services/pdfReportService';
import { SegmentedControl } from '../components/ui';

type ReportKind = 'daily' | 'weekly' | 'monthly' | 'annual' | 'custom';

const REPORT_TABS: Array<{ id: ReportKind; label: string; preset: DateFilterPreset }> = [
  { id: 'daily', label: 'Daily Report', preset: 'today' },
  { id: 'weekly', label: 'Weekly Report', preset: 'week' },
  { id: 'monthly', label: 'Monthly Report', preset: 'month' },
  { id: 'annual', label: 'Annual Report', preset: 'year' },
  { id: 'custom', label: 'Custom Range', preset: 'custom' },
];

export function ReportsPage() {
  const { state, isDemoMode, todayISO, showToast } = useFinance();

  const [reportKind, setReportKind] = useState<ReportKind>('monthly');
  const [customStart, setCustomStart] = useState(todayISO.slice(0, 7) + '-01');
  const [customEnd, setCustomEnd] = useState(todayISO);

  const activeTab = REPORT_TABS.find((t) => t.id === reportKind) ?? REPORT_TABS[2];

  const { bounds, summary, categoryBreakdown, scopedTransactions } = useFinanceMetrics({
    presetOverride: activeTab.preset,
    customStartOverride: customStart,
    customEndOverride: customEnd,
  });

  if (!state || !summary) return null;

  const currency = state.preferences.currency;
  const mask = state.preferences.privacy.maskBalances;
  const dateFmt = state.preferences.dateFormat;

  const handleCsvDownload = () => {
    const csv = transactionsToCsv(scopedTransactions, state.categories, state.accounts);
    downloadCsv(csv, `paisaflow-${reportKind}-report-${todayISO}.csv`);
    showToast(`Downloaded ${activeTab.label} (CSV).`);
  };

  const handlePdfDownload = () => {
    generateFinancialPdfReport({
      title: activeTab.label,
      periodLabel: `${formatDateDisplay(bounds.startDate, dateFmt)} – ${formatDateDisplay(bounds.endDate, dateFmt)}`,
      userName: state.profile.fullName,
      isDemoMode,
      currency,
      dateFormat: dateFmt,
      totalBalance: summary.totalBalance,
      totalIncome: summary.totalIncome,
      totalExpenses: summary.totalExpenses,
      netSavings: summary.netSavings,
      savingsRate: summary.savingsRate,
      categoryBreakdown,
      accounts: state.accounts,
      transactions: scopedTransactions,
      categories: state.categories,
    });
    showToast(`Downloaded ${activeTab.label} (PDF).`);
  };

  return (
    <div className="space-y-6">
      {/* Report Type Selector & Export Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SegmentedControl
          options={REPORT_TABS}
          value={reportKind}
          onChange={setReportKind}
          ariaLabel="Report timeframe"
        />

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleCsvDownload}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E8E7E0] dark:border-[#343D37] bg-[#FFFFFF] dark:bg-[#1F2723] text-xs font-bold hover:border-[#245C45]/40 whitespace-nowrap"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#245C45] dark:text-[#83B89A]" />
            <span>Download CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePdfDownload}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#245C45] text-white dark:bg-[#83B89A] dark:text-[#151A18] text-xs font-bold hover:bg-[#1D4A38] dark:hover:bg-[#96C7AC] whitespace-nowrap"
          >
            <FileText className="w-4 h-4" />
            <span>Download PDF Report</span>
          </button>
        </div>
      </div>

      {reportKind === 'custom' && (
        <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] p-4 flex flex-wrap items-center gap-4 text-xs">
          <span className="font-semibold text-[#89918B]">Custom Range:</span>
          <label className="flex items-center gap-2">
            <span>From</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37]"
            />
          </label>
          <label className="flex items-center gap-2">
            <span>To</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37]"
            />
          </label>
        </div>
      )}

      {/* Executive Summary Banner */}
      <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#E8E7E0] dark:border-[#343D37]">
          <div>
            <h2 className="text-lg font-bold">{activeTab.label}</h2>
            <p className="text-xs text-[#89918B] dark:text-[#9AA69E]">
              {formatDateDisplay(bounds.startDate, dateFmt)} –{' '}
              {formatDateDisplay(bounds.endDate, dateFmt)} · {scopedTransactions.length} transactions
            </p>
          </div>
          <Download className="w-4 h-4 text-[#89918B]" aria-hidden="true" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 pt-5">
          <div>
            <p className="text-xs text-[#89918B] dark:text-[#9AA69E]">Period Income</p>
            <p className="mt-1 text-xl font-extrabold font-mono-num text-[#245C45] dark:text-[#83B89A]">
              {formatCurrency(summary.totalIncome, currency, { mask })}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#89918B] dark:text-[#9AA69E]">Period Expenses</p>
            <p className="mt-1 text-xl font-extrabold font-mono-num">
              {formatCurrency(summary.totalExpenses, currency, { mask })}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#89918B] dark:text-[#9AA69E]">Net Cashflow</p>
            <p className="mt-1 text-xl font-extrabold font-mono-num">
              {formatCurrency(summary.netSavings, currency, { mask })}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#89918B] dark:text-[#9AA69E]">Savings Rate</p>
            <p className="mt-1 text-xl font-extrabold font-mono-num">{summary.savingsRate}%</p>
          </div>
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] p-6">
        <h3 className="text-base font-bold mb-4">Expense Breakdown by Category</h3>
        {categoryBreakdown.length === 0 ? (
          <p className="text-xs text-[#89918B] dark:text-[#9AA69E]">
            No expenses recorded during this report window.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#E8E7E0] dark:border-[#343D37] text-xs font-semibold text-[#89918B]">
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Share</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E7E0] dark:divide-[#343D37]">
                {categoryBreakdown.map((item) => (
                  <tr key={item.categoryId}>
                    <td className="py-2.5 px-3 font-medium flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.name}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono-num text-xs text-[#89918B]">
                      {item.pct}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono-num font-bold">
                      {formatCurrency(item.amount, currency, { mask })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
