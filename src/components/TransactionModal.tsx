import React, { useEffect, useState } from 'react';
import { Paperclip } from 'lucide-react';
import type { PaymentMethod, Transaction, TransactionType } from '../types/finance';
import { useFinance } from '../context/FinanceContext';
import { CategoryIcon } from './CategoryIcon';
import { Modal } from './ui';

const PAYMENT_METHODS: PaymentMethod[] = [
  'UPI',
  'Bank Transfer',
  'Debit Card',
  'Credit Card',
  'Cash',
  'Auto-Debit',
  'Wallet',
];

interface TransactionModalProps {
  open: boolean;
  initialTransaction?: Transaction | null;
  defaultType?: TransactionType;
  defaultAccountId?: string;
  onClose: () => void;
}

export function TransactionModal({
  open,
  initialTransaction,
  defaultType = 'expense',
  defaultAccountId,
  onClose,
}: TransactionModalProps) {
  const { state, todayISO, addTransaction, updateTransaction } = useFinance();

  const [type, setType] = useState<TransactionType>(defaultType);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [date, setDate] = useState(todayISO);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [notes, setNotes] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !state) return;
    setError(null);
    setSubmitting(false);

    if (initialTransaction) {
      setType(initialTransaction.type);
      setTitle(initialTransaction.title);
      setAmount(String(initialTransaction.amount));
      setCategoryId(initialTransaction.categoryId);
      setAccountId(initialTransaction.accountId);
      setToAccountId(initialTransaction.toAccountId ?? '');
      setDate(initialTransaction.date);
      setPaymentMethod(initialTransaction.paymentMethod);
      setNotes(initialTransaction.notes ?? '');
      setAttachmentName(initialTransaction.attachmentName ?? '');
    } else {
      const nextType = defaultType;
      setType(nextType);
      setTitle('');
      setAmount('');
      const cats = state.categories.filter((c) => c.type === (nextType === 'income' ? 'income' : 'expense'));
      setCategoryId(cats[0]?.id ?? '');
      const firstAcc = defaultAccountId || state.accounts[0]?.id || '';
      const secondAcc = state.accounts.find((a) => a.id !== firstAcc)?.id ?? '';
      setAccountId(firstAcc);
      setToAccountId(secondAcc);
      setDate(todayISO);
      setPaymentMethod('UPI');
      setNotes('');
      setAttachmentName('');
    }
  }, [open, initialTransaction, defaultType, defaultAccountId, state, todayISO]);

  if (!open || !state) return null;

  const filteredCategories = state.categories.filter(
    (c) => c.type === (type === 'income' ? 'income' : 'expense')
  );

  const handleTypeSwitch = (nextType: TransactionType) => {
    setType(nextType);
    setError(null);
    if (nextType !== 'transfer') {
      const cats = state.categories.filter((c) => c.type === nextType);
      if (!cats.some((c) => c.id === categoryId)) {
        setCategoryId(cats[0]?.id ?? '');
      }
    } else {
      if (!toAccountId || toAccountId === accountId) {
        const alt = state.accounts.find((a) => a.id !== accountId)?.id ?? '';
        setToAccountId(alt);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    const parsedAmount = Number(amount);
    const payload = {
      title: title.trim(),
      amount: parsedAmount,
      type,
      categoryId: type === 'transfer' ? 'transfer' : categoryId,
      accountId,
      toAccountId: type === 'transfer' ? toAccountId : undefined,
      date,
      paymentMethod,
      notes: notes.trim() || undefined,
      attachmentName: attachmentName || undefined,
    };

    const errMsg = initialTransaction
      ? updateTransaction(initialTransaction.id, payload)
      : addTransaction(payload);

    if (errMsg) {
      setError(errMsg);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    onClose();
  };

  return (
    <Modal
      open={open}
      title={initialTransaction ? 'Edit Transaction' : 'Add Transaction'}
      onClose={onClose}
      size="lg"
    >

        {/* Segmented Type Control */}
        <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] mb-5">
          {(['expense', 'income', 'transfer'] as TransactionType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleTypeSwitch(t)}
              className={`py-2 px-3 rounded-lg text-sm font-semibold capitalize transition-colors whitespace-nowrap ${
                type === t
                  ? 'bg-[#245C45] text-white dark:bg-[#83B89A] dark:text-[#151A18] shadow-sm'
                  : 'text-[#89918B] dark:text-[#9AA69E] hover:text-[#242A26] dark:hover:text-[#F3F5F1]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-medium text-red-700 dark:text-red-300"
            >
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="tx-amount"
                className="block text-xs font-semibold text-[#89918B] dark:text-[#9AA69E] mb-1.5"
              >
                Amount (₹)
              </label>
              <input
                id="tx-amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="1250"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-[#242A26] dark:text-[#F3F5F1] font-mono-num text-lg font-bold focus:outline-none focus:ring-2 focus:ring-[#245C45] dark:focus:ring-[#83B89A]"
              />
            </div>

            <div>
              <label
                htmlFor="tx-date"
                className="block text-xs font-semibold text-[#89918B] dark:text-[#9AA69E] mb-1.5"
              >
                Date
              </label>
              <input
                id="tx-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-[#242A26] dark:text-[#F3F5F1] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#245C45] dark:focus:ring-[#83B89A]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="tx-title"
              className="block text-xs font-semibold text-[#89918B] dark:text-[#9AA69E] mb-1.5"
            >
              Transaction Title
            </label>
            <input
              id="tx-title"
              type="text"
              required
              placeholder={
                type === 'income'
                  ? 'e.g., Monthly Salary Credit'
                  : type === 'transfer'
                    ? 'e.g., Transfer to Savings Vault'
                    : 'e.g., Dinner at Spice Garden'
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-[#242A26] dark:text-[#F3F5F1] text-sm focus:outline-none focus:ring-2 focus:ring-[#245C45] dark:focus:ring-[#83B89A]"
            />
          </div>

          {type !== 'transfer' && (
            <div>
              <label
                htmlFor="tx-category"
                className="block text-xs font-semibold text-[#89918B] dark:text-[#9AA69E] mb-1.5"
              >
                Category
              </label>
              <div className="relative">
                <select
                  id="tx-category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-[#242A26] dark:text-[#F3F5F1] text-sm focus:outline-none focus:ring-2 focus:ring-[#245C45] dark:focus:ring-[#83B89A]"
                >
                  {filteredCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              {categoryId && (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[#89918B] dark:text-[#9AA69E]">
                  <CategoryIcon
                    name={filteredCategories.find((c) => c.id === categoryId)?.icon ?? 'MoreHorizontal'}
                    className="w-3.5 h-3.5"
                  />
                  <span>Selected: {filteredCategories.find((c) => c.id === categoryId)?.name}</span>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="tx-account"
                className="block text-xs font-semibold text-[#89918B] dark:text-[#9AA69E] mb-1.5"
              >
                {type === 'transfer' ? 'From Account' : 'Account'}
              </label>
              <select
                id="tx-account"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-[#242A26] dark:text-[#F3F5F1] text-sm focus:outline-none focus:ring-2 focus:ring-[#245C45] dark:focus:ring-[#83B89A]"
              >
                {state.accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.type})
                  </option>
                ))}
              </select>
            </div>

            {type === 'transfer' ? (
              <div>
                <label
                  htmlFor="tx-to-account"
                  className="block text-xs font-semibold text-[#89918B] dark:text-[#9AA69E] mb-1.5"
                >
                  To Account
                </label>
                <select
                  id="tx-to-account"
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-[#242A26] dark:text-[#F3F5F1] text-sm focus:outline-none focus:ring-2 focus:ring-[#245C45] dark:focus:ring-[#83B89A]"
                >
                  {state.accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.type})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label
                  htmlFor="tx-method"
                  className="block text-xs font-semibold text-[#89918B] dark:text-[#9AA69E] mb-1.5"
                >
                  Payment Method
                </label>
                <select
                  id="tx-method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-[#242A26] dark:text-[#F3F5F1] text-sm focus:outline-none focus:ring-2 focus:ring-[#245C45] dark:focus:ring-[#83B89A]"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="tx-notes"
              className="block text-xs font-semibold text-[#89918B] dark:text-[#9AA69E] mb-1.5"
            >
              Notes (optional)
            </label>
            <input
              id="tx-notes"
              type="text"
              placeholder="Add merchant or context notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-[#242A26] dark:text-[#F3F5F1] text-sm focus:outline-none focus:ring-2 focus:ring-[#245C45] dark:focus:ring-[#83B89A]"
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-[#89918B] dark:text-[#9AA69E] cursor-pointer hover:text-[#245C45] dark:hover:text-[#83B89A]">
              <Paperclip className="w-3.5 h-3.5" />
              <span>{attachmentName ? `Attached: ${attachmentName}` : 'Attach receipt filename (optional)'}</span>
              <input
                type="file"
                accept="image/*,.pdf"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setAttachmentName(file.name);
                }}
              />
            </label>
            {attachmentName && (
              <button
                type="button"
                onClick={() => setAttachmentName('')}
                className="text-xs text-red-600 dark:text-red-400 hover:underline"
              >
                Remove
              </button>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8E7E0] dark:border-[#343D37]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-[#E8E7E0] dark:border-[#343D37] text-[#242A26] dark:text-[#F3F5F1] hover:bg-[#F7F6F2] dark:hover:bg-[#26302B] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#245C45] text-white hover:bg-[#1D4A38] dark:bg-[#83B89A] dark:text-[#151A18] dark:hover:bg-[#96C7AC] disabled:opacity-60 transition-colors whitespace-nowrap"
            >
              {initialTransaction ? 'Save Changes' : 'Add Transaction'}
            </button>
          </div>
        </form>
    </Modal>
  );
}
