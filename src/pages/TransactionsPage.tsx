import { useMemo, useState } from 'react';
import {
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Download,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import type { DateFilterPreset, Transaction, TransactionType } from '../types/finance';
import { getDateRangeBounds, isDateInRange, transactionsToCsv } from '../utils/financeMath';
import { downloadCsv } from '../utils/fileExport';
import { formatCurrency, formatDateDisplay } from '../utils/formatters';
import { CategoryIcon } from '../components/CategoryIcon';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState, SegmentedControl } from '../components/ui';

type SortOption = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';

const PAGE_SIZE = 10;

const TYPE_FILTER_OPTIONS: ReadonlyArray<{ id: 'all' | TransactionType; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'income', label: 'Income' },
  { id: 'expense', label: 'Expense' },
  { id: 'transfer', label: 'Transfer' },
];

export function TransactionsPage({
  onOpenAddTransaction,
  onEditTransaction,
}: {
  onOpenAddTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
}) {
  const { state, todayISO, deleteTransaction, showToast } = useFinance();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [datePreset, setDatePreset] = useState<DateFilterPreset | 'all'>('all');
  const [customStart, setCustomStart] = useState(todayISO.slice(0, 7) + '-01');
  const [customEnd, setCustomEnd] = useState(todayISO);
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);

  const filtered = useMemo(() => {
    if (!state) return [];
    const query = search.trim().toLowerCase();
    const bounds =
      datePreset === 'all'
        ? null
        : getDateRangeBounds(datePreset, todayISO, customStart, customEnd);

    const list = state.transactions.filter((tx) => {
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      if (categoryFilter !== 'all' && tx.categoryId !== categoryFilter) return false;
      if (
        accountFilter !== 'all' &&
        tx.accountId !== accountFilter &&
        tx.toAccountId !== accountFilter
      ) {
        return false;
      }
      if (bounds && !isDateInRange(tx.date, bounds)) return false;
      if (query) {
        const matchTitle = tx.title.toLowerCase().includes(query);
        const matchNotes = (tx.notes ?? '').toLowerCase().includes(query);
        const matchMethod = tx.paymentMethod.toLowerCase().includes(query);
        if (!matchTitle && !matchNotes && !matchMethod) return false;
      }
      return true;
    });

    list.sort((a, b) => {
      if (sortBy === 'date_desc') return b.date.localeCompare(a.date);
      if (sortBy === 'date_asc') return a.date.localeCompare(b.date);
      if (sortBy === 'amount_desc') return b.amount - a.amount;
      return a.amount - b.amount;
    });

    return list;
  }, [
    state,
    search,
    typeFilter,
    categoryFilter,
    accountFilter,
    datePreset,
    todayISO,
    customStart,
    customEnd,
    sortBy,
  ]);

  if (!state) return null;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const catMap = new Map(state.categories.map((c) => [c.id, c]));
  const accMap = new Map(state.accounts.map((a) => [a.id, a]));
  const currency = state.preferences.currency;
  const mask = state.preferences.privacy.maskBalances;
  const dateFmt = state.preferences.dateFormat;

  const handleExportCsv = () => {
    const csv = transactionsToCsv(filtered, state.categories, state.accounts);
    downloadCsv(csv, `paisaflow-transactions-${todayISO}.csv`);
    showToast(`Exported ${filtered.length} transactions to CSV.`);
  };

  return (
    <div className="space-y-5">
      {/* Toolbar Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Segmented Type Filter */}
        <SegmentedControl
          options={TYPE_FILTER_OPTIONS}
          value={typeFilter}
          onChange={(nextType) => {
            setTypeFilter(nextType);
            setPage(1);
          }}
          ariaLabel="Filter by transaction type"
        />

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#E8E7E0] dark:border-[#343D37] bg-[#FFFFFF] dark:bg-[#1F2723] text-xs font-semibold hover:border-[#245C45]/40 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddTransaction}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#245C45] text-white dark:bg-[#83B89A] dark:text-[#151A18] text-xs font-bold hover:bg-[#1D4A38] dark:hover:bg-[#96C7AC] transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Filters Row */}
      <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="relative lg:col-span-2">
          <Search className="w-4 h-4 text-[#89918B] absolute left-3 top-1/2 -translate-y-1/2" />
          <label htmlFor="tx-search" className="sr-only">
            Search transactions
          </label>
          <input
            id="tx-search"
            type="search"
            placeholder="Search title, notes, or payment method..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#245C45] dark:focus:ring-[#83B89A]"
          />
        </div>

        <div>
          <label htmlFor="tx-filter-cat" className="sr-only">
            Filter by category
          </label>
          <select
            id="tx-filter-cat"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-xs sm:text-sm"
          >
            <option value="all">All Categories</option>
            {state.categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name} ({cat.type})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="tx-filter-acc" className="sr-only">
            Filter by account
          </label>
          <select
            id="tx-filter-acc"
            value={accountFilter}
            onChange={(e) => {
              setAccountFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-xs sm:text-sm"
          >
            <option value="all">All Accounts</option>
            {state.accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <label htmlFor="tx-filter-date" className="sr-only">
            Filter by date range
          </label>
          <select
            id="tx-filter-date"
            value={datePreset}
            onChange={(e) => {
              setDatePreset(e.target.value as DateFilterPreset | 'all');
              setPage(1);
            }}
            className="w-full px-3 py-2 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-xs sm:text-sm"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="year">This Year</option>
            <option value="custom">Custom</option>
          </select>

          <label htmlFor="tx-sort" className="sr-only">
            Sort transactions
          </label>
          <select
            id="tx-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="w-full px-3 py-2 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-xs sm:text-sm"
          >
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="amount_desc">Amount High-Low</option>
            <option value="amount_asc">Amount Low-High</option>
          </select>
        </div>

        {datePreset === 'custom' && (
          <div className="sm:col-span-2 lg:col-span-5 flex flex-wrap items-center gap-3 pt-1">
            <span className="text-xs font-semibold text-[#89918B]">Custom Dates:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-xs"
            />
            <span className="text-xs text-[#89918B]">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-xs"
            />
          </div>
        )}
      </div>

      {/* Ledger Table / List */}
      {pageItems.length === 0 ? (
        <EmptyState
          title="No transactions found"
          description="Try adjusting your search filters or record a new transaction."
          actionLabel="Add Transaction"
          onAction={onOpenAddTransaction}
        />
      ) : (
        <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] overflow-hidden">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E8E7E0] dark:border-[#343D37] text-xs font-semibold text-[#89918B] dark:text-[#9AA69E]">
                    <th className="py-3.5 px-5">Transaction</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Account</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Method</th>
                    <th className="py-3.5 px-4 text-right">Amount</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E7E0] dark:divide-[#343D37] text-sm">
                  {pageItems.map((tx) => {
                    const cat = catMap.get(tx.categoryId);
                    const acc = accMap.get(tx.accountId);
                    const toAcc = tx.toAccountId ? accMap.get(tx.toAccountId) : null;
                    return (
                      <tr
                        key={tx.id}
                        className="hover:bg-[#F7F6F2]/70 dark:hover:bg-[#26302B]/50 transition-colors"
                      >
                        <td className="py-3 px-5">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                              style={{
                                backgroundColor:
                                  tx.type === 'transfer'
                                    ? '#3B7A8C18'
                                    : `${cat?.color ?? '#89918B'}1A`,
                                color: tx.type === 'transfer' ? '#3B7A8C' : (cat?.color ?? '#89918B'),
                              }}
                            >
                              {tx.type === 'transfer' ? (
                                <ArrowLeftRight className="w-4 h-4" />
                              ) : (
                                <CategoryIcon
                                  name={cat?.icon ?? 'MoreHorizontal'}
                                  className="w-4 h-4"
                                />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold truncate max-w-[220px]">{tx.title}</p>
                              {tx.notes && (
                                <p className="text-xs text-[#89918B] dark:text-[#9AA69E] truncate max-w-[220px]">
                                  {tx.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-[#89918B] dark:text-[#9AA69E]">
                          {tx.type === 'transfer' ? 'Account Transfer' : (cat?.name ?? 'Other')}
                        </td>
                        <td className="py-3 px-4 text-xs">
                          {acc?.name ?? 'Unknown'}
                          {toAcc ? ` → ${toAcc.name}` : ''}
                        </td>
                        <td className="py-3 px-4 text-xs font-mono-num text-[#89918B] dark:text-[#9AA69E] whitespace-nowrap">
                          {formatDateDisplay(tx.date, dateFmt)}
                        </td>
                        <td className="py-3 px-4 text-xs text-[#89918B] dark:text-[#9AA69E]">
                          {tx.paymentMethod}
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-mono-num font-bold whitespace-nowrap ${
                            tx.type === 'income'
                              ? 'text-[#245C45] dark:text-[#83B89A]'
                              : tx.type === 'transfer'
                                ? 'text-[#3B7A8C] dark:text-[#A6C5AF]'
                                : 'text-[#242A26] dark:text-[#F3F5F1]'
                          }`}
                        >
                          {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                          {formatCurrency(tx.amount, currency, { mask })}
                        </td>
                        <td className="py-3 px-5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onEditTransaction(tx)}
                              aria-label={`Edit ${tx.title}`}
                              className="p-1.5 rounded-lg text-[#89918B] hover:text-[#245C45] dark:hover:text-[#83B89A] hover:bg-[#F7F6F2] dark:hover:bg-[#151A18]"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(tx)}
                              aria-label={`Delete ${tx.title}`}
                              className="p-1.5 rounded-lg text-[#89918B] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Rows */}
            <div className="md:hidden divide-y divide-[#E8E7E0] dark:divide-[#343D37]">
              {pageItems.map((tx) => {
                const cat = catMap.get(tx.categoryId);
                const acc = accMap.get(tx.accountId);
                return (
                  <div key={tx.id} className="p-4 flex items-center justify-between gap-3">
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
                          {acc?.name} · {formatDateDisplay(tx.date, dateFmt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-sm font-bold font-mono-num ${
                          tx.type === 'income'
                            ? 'text-[#245C45] dark:text-[#83B89A]'
                            : tx.type === 'transfer'
                              ? 'text-[#3B7A8C]'
                              : ''
                        }`}
                      >
                        {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                        {formatCurrency(tx.amount, currency, { mask })}
                      </span>
                      <button
                        type="button"
                        onClick={() => onEditTransaction(tx)}
                        aria-label={`Edit ${tx.title}`}
                        className="p-1.5 text-[#89918B]"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(tx)}
                        aria-label={`Delete ${tx.title}`}
                        className="p-1.5 text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Footer */}
            <div className="px-5 py-3.5 border-t border-[#E8E7E0] dark:border-[#343D37] flex items-center justify-between text-xs text-[#89918B] dark:text-[#9AA69E]">
              <span>
                Showing {(safePage - 1) * PAGE_SIZE + 1}–
                {Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} transactions
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  aria-label="Previous page"
                  className="p-1.5 rounded-lg border border-[#E8E7E0] dark:border-[#343D37] disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 font-mono-num font-semibold text-[#242A26] dark:text-[#F3F5F1]">
                  {safePage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  aria-label="Next page"
                  className="p-1.5 rounded-lg border border-[#E8E7E0] dark:border-[#343D37] disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Transaction"
        description={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.title}"? Account balances and dashboard statistics will recalculate automatically.`
            : ''
        }
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) deleteTransaction(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
