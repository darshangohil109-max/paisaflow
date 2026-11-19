import React, { useMemo, useState } from 'react';
import {
  ArrowLeftRight,
  CreditCard,
  Landmark,
  Pencil,
  Plus,
  ShieldAlert,
  Smartphone,
  Trash2,
  Wallet,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import type { Account, AccountType, Transaction } from '../types/finance';
import { computeAllAccountBalances } from '../utils/financeMath';
import { formatCurrency, formatDateDisplay } from '../utils/formatters';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Modal } from '../components/ui';

const ACCOUNT_TYPES: AccountType[] = [
  'Bank Account',
  'UPI',
  'Cash',
  'Savings Account',
  'Credit Card',
  'Digital Wallet',
  'Other',
];

const ACCOUNT_COLORS = ['#245C45', '#75977F', '#D9B98C', '#3B7A8C', '#7D67A8', '#D9822B'];

function AccountTypeIcon({ type }: { type: AccountType }) {
  if (type === 'Bank Account' || type === 'Savings Account') {
    return <Landmark className="w-5 h-5" />;
  }
  if (type === 'UPI' || type === 'Digital Wallet') {
    return <Smartphone className="w-5 h-5" />;
  }
  if (type === 'Credit Card') {
    return <CreditCard className="w-5 h-5" />;
  }
  return <Wallet className="w-5 h-5" />;
}

export function AccountsPage({
  onOpenTransfer,
  onEditTransaction,
}: {
  onOpenTransfer: (fromAccountId?: string) => void;
  onEditTransaction: (tx: Transaction) => void;
}) {
  const { state, addAccount, updateAccount, deleteAccount, showToast } = useFinance();

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('Bank Account');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [institution, setInstitution] = useState('');
  const [lastFourDigits, setLastFourDigits] = useState('');
  const [color, setColor] = useState('#245C45');
  const [formError, setFormError] = useState<string | null>(null);

  const balances = useMemo(() => {
    if (!state) return {};
    return computeAllAccountBalances(state.accounts, state.transactions);
  }, [state]);

  if (!state) return null;

  const totalNetWorth = Object.values(balances).reduce((sum, v) => sum + v, 0);
  const currency = state.preferences.currency;
  const mask = state.preferences.privacy.maskBalances;
  const dateFmt = state.preferences.dateFormat;

  const activeAccount =
    state.accounts.find((a) => a.id === selectedAccountId) ?? state.accounts[0] ?? null;

  const accountTransactions = activeAccount
    ? state.transactions.filter(
        (tx) => tx.accountId === activeAccount.id || tx.toAccountId === activeAccount.id
      )
    : [];

  const openCreateModal = () => {
    setEditingAccount(null);
    setName('');
    setType('Bank Account');
    setOpeningBalance('0');
    setInstitution('');
    setLastFourDigits('');
    setColor('#245C45');
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (acc: Account) => {
    setEditingAccount(acc);
    setName(acc.name);
    setType(acc.type);
    setOpeningBalance(String(acc.openingBalance));
    setInstitution(acc.institution ?? '');
    setLastFourDigits(acc.lastFourDigits ?? '');
    setColor(acc.color);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedBal = Number(openingBalance);
    if (!Number.isFinite(parsedBal)) {
      setFormError('Please enter a valid numeric opening balance.');
      return;
    }

    const cleanLast4 = lastFourDigits.replace(/\D/g, '').slice(0, 4);
    const err = editingAccount
      ? updateAccount(editingAccount.id, {
          name: name.trim(),
          type,
          openingBalance: parsedBal,
          institution: institution.trim() || undefined,
          lastFourDigits: cleanLast4 || undefined,
          color,
        })
      : addAccount({
          name: name.trim(),
          type,
          openingBalance: parsedBal,
          institution: institution.trim() || undefined,
          lastFourDigits: cleanLast4 || undefined,
          color,
        });

    if (err) {
      setFormError(err);
      return;
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Summary & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] p-5 sm:p-6">
        <div>
          <p className="text-xs font-semibold text-[#89918B] dark:text-[#9AA69E]">
            Combined Liquidity Across {state.accounts.length} Accounts
          </p>
          <p className="mt-1 text-2xl sm:text-3xl font-extrabold font-mono-num text-[#245C45] dark:text-[#83B89A]">
            {formatCurrency(totalNetWorth, currency, { mask })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onOpenTransfer(activeAccount?.id)}
            disabled={state.accounts.length < 2}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8E7E0] dark:border-[#343D37] text-xs sm:text-sm font-semibold hover:bg-[#F7F6F2] dark:hover:bg-[#26302B] disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Transfer Funds</span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#245C45] text-white dark:bg-[#83B89A] dark:text-[#151A18] text-xs sm:text-sm font-bold hover:bg-[#1D4A38] dark:hover:bg-[#96C7AC] transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Account</span>
          </button>
        </div>
      </div>

      {/* Accounts Grid + Selected History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 space-y-3">
          {state.accounts.map((acc) => {
            const liveBal = balances[acc.id] ?? 0;
            const isSelected = activeAccount?.id === acc.id;
            return (
              <div
                key={acc.id}
                className={`rounded-2xl bg-[#FFFFFF] dark:bg-[#1F2723] border p-4 transition-colors ${
                  isSelected
                    ? 'border-[#245C45] dark:border-[#83B89A]'
                    : 'border-[#E8E7E0] dark:border-[#343D37]'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedAccountId(acc.id)}
                    className="flex items-center gap-3.5 min-w-0 text-left flex-1"
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${acc.color}1C`, color: acc.color }}
                    >
                      <AccountTypeIcon type={acc.type} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{acc.name}</p>
                      <p className="text-xs text-[#89918B] dark:text-[#9AA69E] truncate">
                        {acc.type}
                        {acc.institution ? ` · ${acc.institution}` : ''}
                        {acc.lastFourDigits ? ` · ••${acc.lastFourDigits}` : ''}
                      </p>
                    </div>
                  </button>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-base font-extrabold font-mono-num ${
                        liveBal < 0 ? 'text-red-600 dark:text-red-400' : ''
                      }`}
                    >
                      {formatCurrency(liveBal, currency, { mask })}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(acc)}
                        aria-label={`Edit ${acc.name}`}
                        className="p-1.5 rounded-lg text-[#89918B] hover:text-[#245C45] dark:hover:text-[#83B89A]"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(acc)}
                        aria-label={`Delete ${acc.name}`}
                        className="p-1.5 rounded-lg text-[#89918B] hover:text-red-600 dark:hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="p-3.5 rounded-xl bg-[#F1EFE8] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] flex items-start gap-2.5 text-xs text-[#89918B] dark:text-[#9AA69E]">
            <ShieldAlert className="w-4 h-4 text-[#245C45] dark:text-[#83B89A] shrink-0 mt-0.5" />
            <span>
              Security Note: PaisaFlow only records account nicknames and optional last 4 digits. Never enter bank passwords, UPI PINs, OTPs, or card CVVs.
            </span>
          </div>
        </div>

        {/* Account Transaction History */}
        <section className="lg:col-span-6 rounded-2xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold">
                {activeAccount ? `${activeAccount.name} History` : 'Account History'}
              </h2>
              <p className="text-xs text-[#89918B] dark:text-[#9AA69E]">
                {accountTransactions.length} recorded entries
              </p>
            </div>
            {activeAccount && (
              <button
                type="button"
                onClick={() => onOpenTransfer(activeAccount.id)}
                className="text-xs font-semibold text-[#245C45] dark:text-[#83B89A] hover:underline"
              >
                Transfer from here →
              </button>
            )}
          </div>

          {accountTransactions.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm font-semibold">No activity for this account yet</p>
              <p className="mt-1 text-xs text-[#89918B] dark:text-[#9AA69E]">
                Add an income, expense, or transfer linked to this account.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#E8E7E0] dark:divide-[#343D37] max-h-[460px] overflow-y-auto">
              {accountTransactions.map((tx) => {
                const isIncomingTransfer =
                  tx.type === 'transfer' && activeAccount && tx.toAccountId === activeAccount.id;
                const isPositive = tx.type === 'income' || isIncomingTransfer;
                return (
                  <button
                    key={tx.id}
                    type="button"
                    onClick={() => onEditTransaction(tx)}
                    className="w-full py-3 flex items-center justify-between gap-3 text-left hover:bg-[#F7F6F2]/70 dark:hover:bg-[#26302B]/50 -mx-2 px-2 rounded-xl transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{tx.title}</p>
                      <p className="text-xs text-[#89918B] dark:text-[#9AA69E]">
                        {formatDateDisplay(tx.date, dateFmt)} · {tx.paymentMethod}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-bold font-mono-num shrink-0 ${
                        isPositive ? 'text-[#245C45] dark:text-[#83B89A]' : ''
                      }`}
                    >
                      {isPositive ? '+' : '-'}
                      {formatCurrency(tx.amount, currency, { mask })}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Add/Edit Account Modal */}
      <Modal
        open={modalOpen}
        title={editingAccount ? 'Edit Account' : 'Add Financial Account'}
        onClose={() => setModalOpen(false)}
      >

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-xs text-red-700 dark:text-red-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label htmlFor="acc-name" className="block text-xs font-semibold text-[#89918B] mb-1">
                  Account Name
                </label>
                <input
                  id="acc-name"
                  type="text"
                  required
                  placeholder="e.g., ICICI Salary Account"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="acc-type" className="block text-xs font-semibold text-[#89918B] mb-1">
                    Account Type
                  </label>
                  <select
                    id="acc-type"
                    value={type}
                    onChange={(e) => setType(e.target.value as AccountType)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-sm"
                  >
                    {ACCOUNT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="acc-open" className="block text-xs font-semibold text-[#89918B] mb-1">
                    Opening Balance (₹)
                  </label>
                  <input
                    id="acc-open"
                    type="number"
                    step="0.01"
                    required
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-sm font-mono-num"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="acc-inst" className="block text-xs font-semibold text-[#89918B] mb-1">
                    Institution (optional)
                  </label>
                  <input
                    id="acc-inst"
                    type="text"
                    placeholder="HDFC / SBI / GPay"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="acc-last4" className="block text-xs font-semibold text-[#89918B] mb-1">
                    Last 4 Digits (optional)
                  </label>
                  <input
                    id="acc-last4"
                    type="text"
                    maxLength={4}
                    placeholder="4821"
                    value={lastFourDigits}
                    onChange={(e) => setLastFourDigits(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-sm font-mono-num"
                  />
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold text-[#89918B] mb-2">Accent Color</span>
                <div className="flex items-center gap-2">
                  {ACCOUNT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      aria-label={`Select color ${c}`}
                      className={`w-7 h-7 rounded-full border-2 ${
                        color === c ? 'border-[#242A26] dark:border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
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
                  {editingAccount ? 'Save Changes' : 'Create Account'}
                </button>
              </div>
            </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Account"
        description={
          deleteTarget
            ? `Remove "${deleteTarget.name}"? Accounts with existing transactions cannot be deleted until their transactions are moved or removed.`
            : ''
        }
        confirmLabel="Remove"
        onConfirm={() => {
          if (deleteTarget) {
            const err = deleteAccount(deleteTarget.id);
            if (err) showToast(err, 'error');
          }
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
