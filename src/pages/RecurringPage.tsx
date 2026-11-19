import React, { useState } from 'react';
import { CalendarClock, CheckCircle2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import type { PaymentMethod, RecurringFrequency, RecurringTransaction } from '../types/finance';
import { hasRecurringOccurrenceRecorded } from '../utils/financeMath';
import { formatCurrency, formatDateDisplay } from '../utils/formatters';
import { CategoryIcon } from '../components/CategoryIcon';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState, Modal, Switch } from '../components/ui';

const FREQUENCIES: RecurringFrequency[] = ['daily', 'weekly', 'monthly', 'yearly'];
const METHODS: PaymentMethod[] = [
  'Auto-Debit',
  'UPI',
  'Bank Transfer',
  'Debit Card',
  'Credit Card',
  'Cash',
];

export function RecurringPage() {
  const {
    state,
    todayISO,
    addRecurring,
    updateRecurring,
    toggleRecurringActive,
    deleteRecurring,
    recordRecurringOccurrence,
    showToast,
  } = useFinance();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringTransaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecurringTransaction | null>(null);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Auto-Debit');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [nextDueDate, setNextDueDate] = useState(todayISO);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!state) return null;

  const currency = state.preferences.currency;
  const mask = state.preferences.privacy.maskBalances;
  const dateFmt = state.preferences.dateFormat;
  const catMap = new Map(state.categories.map((c) => [c.id, c]));
  const accMap = new Map(state.accounts.map((a) => [a.id, a]));

  const monthlyIncomeCommitted = state.recurring
    .filter((r) => r.active && r.type === 'income' && r.frequency === 'monthly')
    .reduce((s, r) => s + r.amount, 0);
  const monthlyExpenseCommitted = state.recurring
    .filter((r) => r.active && r.type === 'expense' && r.frequency === 'monthly')
    .reduce((s, r) => s + r.amount, 0);

  const openCreateModal = () => {
    setEditingItem(null);
    setTitle('');
    setType('expense');
    setAmount('');
    setCategoryId(state.categories.find((c) => c.type === 'expense')?.id ?? '');
    setAccountId(state.accounts[0]?.id ?? '');
    setPaymentMethod('Auto-Debit');
    setFrequency('monthly');
    setNextDueDate(todayISO);
    setNotes('');
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (item: RecurringTransaction) => {
    setEditingItem(item);
    setTitle(item.title);
    setType(item.type);
    setAmount(String(item.amount));
    setCategoryId(item.categoryId);
    setAccountId(item.accountId);
    setPaymentMethod(item.paymentMethod);
    setFrequency(item.frequency);
    setNextDueDate(item.nextDueDate);
    setNotes(item.notes ?? '');
    setError(null);
    setModalOpen(true);
  };

  const handleTypeChange = (nextType: 'expense' | 'income') => {
    setType(nextType);
    const firstCat = state.categories.find((c) => c.type === nextType)?.id ?? '';
    setCategoryId(firstCat);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = editingItem
      ? updateRecurring(editingItem.id, {
          title: title.trim(),
          type,
          amount: Number(amount),
          categoryId,
          accountId,
          paymentMethod,
          frequency,
          nextDueDate,
          notes: notes.trim() || undefined,
        })
      : addRecurring({
          title: title.trim(),
          type,
          amount: Number(amount),
          categoryId,
          accountId,
          paymentMethod,
          frequency,
          startDate: nextDueDate,
          nextDueDate,
          active: true,
          notes: notes.trim() || undefined,
        });

    if (err) {
      setError(err);
      return;
    }
    setModalOpen(false);
  };

  const modalCategories = state.categories.filter((c) => c.type === type);

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-8">
          <div>
            <p className="text-xs font-semibold text-[#89918B] dark:text-[#9AA69E]">
              Monthly Recurring Income
            </p>
            <p className="mt-1 text-2xl font-extrabold font-mono-num text-[#245C45] dark:text-[#83B89A]">
              {formatCurrency(monthlyIncomeCommitted, currency, { mask })}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#89918B] dark:text-[#9AA69E]">
              Monthly Recurring Bills
            </p>
            <p className="mt-1 text-2xl font-extrabold font-mono-num">
              {formatCurrency(monthlyExpenseCommitted, currency, { mask })}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#245C45] text-white dark:bg-[#83B89A] dark:text-[#151A18] text-xs sm:text-sm font-bold whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Add Recurring Rule</span>
        </button>
      </div>

      {/* Rules List */}
      {state.recurring.length === 0 ? (
        <EmptyState
          icon={<CalendarClock className="w-8 h-8" />}
          title="No recurring payments or income scheduled"
          description="Add salary, rent, internet bills, OTT subscriptions, or EMIs to track upcoming dues without duplicate entries."
          actionLabel="Schedule First Payment"
          onAction={openCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {state.recurring.map((item) => {
            const cat = catMap.get(item.categoryId);
            const acc = accMap.get(item.accountId);
            const alreadyRecorded = hasRecurringOccurrenceRecorded(
              item.id,
              item.nextDueDate,
              state.transactions
            );

            return (
              <div
                key={item.id}
                className={`rounded-2xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] p-5 flex flex-col justify-between gap-4 ${
                  !item.active ? 'opacity-70' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${cat?.color ?? '#245C45'}1C`,
                        color: cat?.color ?? '#245C45',
                      }}
                    >
                      <CategoryIcon name={cat?.icon ?? 'CalendarClock'} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{item.title}</p>
                      <p className="text-xs text-[#89918B] dark:text-[#9AA69E] capitalize">
                        {item.frequency} · {item.type} · {acc?.name ?? 'Account'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-base font-extrabold font-mono-num ${
                        item.type === 'income' ? 'text-[#245C45] dark:text-[#83B89A]' : ''
                      }`}
                    >
                      {item.type === 'income' ? '+' : '-'}
                      {formatCurrency(item.amount, currency, { mask })}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E8E7E0] dark:border-[#343D37] text-xs">
                  <div className="text-[#89918B] dark:text-[#9AA69E]">
                    <span>Next due: </span>
                    <span className="font-semibold text-[#242A26] dark:text-[#F3F5F1]">
                      {formatDateDisplay(item.nextDueDate, dateFmt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const err = recordRecurringOccurrence(item.id);
                        if (err) showToast(err, 'error');
                      }}
                      disabled={!item.active || alreadyRecorded}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#245C45]/10 text-[#245C45] dark:bg-[#83B89A]/15 dark:text-[#83B89A] font-bold disabled:opacity-40"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{alreadyRecorded ? 'Recorded' : 'Record Due'}</span>
                    </button>

                    <Switch
                      checked={item.active}
                      onChange={() => toggleRecurringActive(item.id)}
                      ariaLabel={`Toggle ${item.title} active`}
                    />

                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      aria-label={`Edit ${item.title}`}
                      className="p-1.5 text-[#89918B] hover:text-[#245C45]"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      aria-label={`Delete ${item.title}`}
                      className="p-1.5 text-[#89918B] hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal
        open={modalOpen}
        title={editingItem ? 'Edit Recurring Schedule' : 'Add Recurring Payment'}
        onClose={() => setModalOpen(false)}
      >

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-xs text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37]">
                {(['expense', 'income'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleTypeChange(t)}
                    className={`py-1.5 rounded-lg text-xs font-semibold capitalize ${
                      type === t
                        ? 'bg-[#245C45] text-white dark:bg-[#83B89A] dark:text-[#151A18]'
                        : 'text-[#89918B]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div>
                <label htmlFor="rec-title" className="block text-xs font-semibold text-[#89918B] mb-1">
                  Title
                </label>
                <input
                  id="rec-title"
                  type="text"
                  required
                  placeholder="e.g., Apartment Rent or Salary"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="rec-amount" className="block text-xs font-semibold text-[#89918B] mb-1">
                    Amount (₹)
                  </label>
                  <input
                    id="rec-amount"
                    type="number"
                    min="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-sm font-mono-num"
                  />
                </div>
                <div>
                  <label htmlFor="rec-freq" className="block text-xs font-semibold text-[#89918B] mb-1">
                    Frequency
                  </label>
                  <select
                    id="rec-freq"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-sm capitalize"
                  >
                    {FREQUENCIES.map((f) => (
                      <option key={f} value={f} className="capitalize">
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="rec-cat" className="block text-xs font-semibold text-[#89918B] mb-1">
                    Category
                  </label>
                  <select
                    id="rec-cat"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-sm"
                  >
                    {modalCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="rec-acc" className="block text-xs font-semibold text-[#89918B] mb-1">
                    Account
                  </label>
                  <select
                    id="rec-acc"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-sm"
                  >
                    {state.accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="rec-due" className="block text-xs font-semibold text-[#89918B] mb-1">
                    Next Due Date
                  </label>
                  <input
                    id="rec-due"
                    type="date"
                    required
                    value={nextDueDate}
                    onChange={(e) => setNextDueDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="rec-method" className="block text-xs font-semibold text-[#89918B] mb-1">
                    Payment Method
                  </label>
                  <select
                    id="rec-method"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-sm"
                  >
                    {METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

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
                  {editingItem ? 'Save Changes' : 'Create Rule'}
                </button>
              </div>
            </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Recurring Rule"
        description={
          deleteTarget
            ? `Delete "${deleteTarget.title}"? Previously recorded transactions will remain in your ledger.`
            : ''
        }
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) deleteRecurring(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
