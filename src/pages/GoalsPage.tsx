import React, { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Pencil, Plus, Trash2 } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import type { SavingsGoal } from '../types/finance';
import { formatCurrency, formatDateDisplay } from '../utils/formatters';
import { CategoryIcon } from '../components/CategoryIcon';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState, Modal } from '../components/ui';
import { addMonthsClampedISO } from '../utils/financeMath';

const GOAL_ICONS = ['Laptop', 'ShieldCheck', 'Plane', 'GraduationCap', 'Smartphone', 'Home', 'Car', 'Target'];
const GOAL_COLORS = ['#245C45', '#3B7A8C', '#D9822B', '#7D67A8', '#4E8B63'];

export function GoalsPage() {
  const {
    state,
    todayISO,
    addGoal,
    updateGoal,
    deleteGoal,
    recordGoalMovement,
  } = useFinance();

  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SavingsGoal | null>(null);
  const [movementGoal, setMovementGoal] = useState<SavingsGoal | null>(null);
  const [movementType, setMovementType] = useState<'contribution' | 'withdrawal'>('contribution');

  // Goal Form State
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [targetDate, setTargetDate] = useState(addMonthsClampedISO(todayISO, 6));
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Laptop');
  const [color, setColor] = useState('#245C45');
  const [formError, setFormError] = useState<string | null>(null);

  // Movement Form State
  const [moveAmount, setMoveAmount] = useState('');
  const [moveDate, setMoveDate] = useState(todayISO);
  const [moveNote, setMoveNote] = useState('');
  const [moveError, setMoveError] = useState<string | null>(null);

  if (!state) return null;

  const currency = state.preferences.currency;
  const mask = state.preferences.privacy.maskBalances;
  const dateFmt = state.preferences.dateFormat;

  const totalTarget = state.goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved = state.goals.reduce((s, g) => s + g.currentAmount, 0);

  const openCreateModal = () => {
    setEditingGoal(null);
    setName('');
    setTargetAmount('');
    setCurrentAmount('0');
    setTargetDate(addMonthsClampedISO(todayISO, 6));
    setDescription('');
    setIcon('Laptop');
    setColor('#245C45');
    setFormError(null);
    setGoalModalOpen(true);
  };

  const openEditModal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setName(goal.name);
    setTargetAmount(String(goal.targetAmount));
    setCurrentAmount(String(goal.currentAmount));
    setTargetDate(goal.targetDate);
    setDescription(goal.description);
    setIcon(goal.icon);
    setColor(goal.color);
    setFormError(null);
    setGoalModalOpen(true);
  };

  const openMovementModal = (goal: SavingsGoal, type: 'contribution' | 'withdrawal') => {
    setMovementGoal(goal);
    setMovementType(type);
    setMoveAmount('');
    setMoveDate(todayISO);
    setMoveNote('');
    setMoveError(null);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const err = editingGoal
      ? updateGoal(editingGoal.id, {
          name: name.trim(),
          targetAmount: Number(targetAmount),
          currentAmount: Number(currentAmount),
          targetDate,
          description: description.trim(),
          icon,
          color,
        })
      : addGoal({
          name: name.trim(),
          targetAmount: Number(targetAmount),
          currentAmount: Number(currentAmount),
          targetDate,
          description: description.trim(),
          icon,
          color,
        });

    if (err) {
      setFormError(err);
      return;
    }
    setGoalModalOpen(false);
  };

  const handleSaveMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementGoal) return;
    const err = recordGoalMovement({
      goalId: movementGoal.id,
      type: movementType,
      amount: Number(moveAmount),
      date: moveDate,
      note: moveNote.trim() || undefined,
    });
    if (err) {
      setMoveError(err);
      return;
    }
    setMovementGoal(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-8">
          <div>
            <p className="text-xs font-semibold text-[#89918B] dark:text-[#9AA69E]">
              Total Saved Across Goals
            </p>
            <p className="mt-1 text-2xl font-extrabold font-mono-num text-[#245C45] dark:text-[#83B89A]">
              {formatCurrency(totalSaved, currency, { mask })}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#89918B] dark:text-[#9AA69E]">
              Combined Target
            </p>
            <p className="mt-1 text-2xl font-extrabold font-mono-num">
              {formatCurrency(totalTarget, currency, { mask })}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#245C45] text-white dark:bg-[#83B89A] dark:text-[#151A18] text-xs sm:text-sm font-bold whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Add Goal</span>
        </button>
      </div>

      {/* Goals Grid */}
      {state.goals.length === 0 ? (
        <EmptyState
          title="No savings goals yet"
          description="Create goals for a laptop, emergency fund, education, or family travel."
          actionLabel="Create First Goal"
          onAction={openCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {state.goals.map((goal) => {
            const pct =
              goal.targetAmount > 0
                ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
                : 0;
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

            return (
              <div
                key={goal.id}
                className="rounded-2xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${goal.color}1C`, color: goal.color }}
                      >
                        <CategoryIcon name={goal.icon} className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-bold truncate">{goal.name}</h3>
                        <p className="text-xs text-[#89918B] dark:text-[#9AA69E]">
                          Target: {formatDateDisplay(goal.targetDate, dateFmt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditModal(goal)}
                        aria-label={`Edit ${goal.name}`}
                        className="p-1.5 rounded-lg text-[#89918B] hover:text-[#245C45]"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(goal)}
                        aria-label={`Delete ${goal.name}`}
                        className="p-1.5 rounded-lg text-[#89918B] hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {goal.description && (
                    <p className="text-xs text-[#89918B] dark:text-[#9AA69E] leading-relaxed">
                      {goal.description}
                    </p>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-lg font-extrabold font-mono-num text-[#245C45] dark:text-[#83B89A]">
                        {formatCurrency(goal.currentAmount, currency, { mask })}
                      </span>
                      <span className="text-xs font-mono-num text-[#89918B] dark:text-[#9AA69E]">
                        of {formatCurrency(goal.targetAmount, currency, { mask })} ({pct}%)
                      </span>
                    </div>

                    <div className="h-2.5 rounded-full bg-[#F7F6F2] dark:bg-[#151A18] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: goal.color }}
                      />
                    </div>

                    <p className="text-xs text-[#89918B] dark:text-[#9AA69E]">
                      {remaining === 0
                        ? 'Goal achieved!'
                        : `${formatCurrency(remaining, currency, { mask })} remaining`}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#E8E7E0] dark:border-[#343D37]">
                  <button
                    type="button"
                    onClick={() => openMovementModal(goal, 'contribution')}
                    className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#245C45] text-white dark:bg-[#83B89A] dark:text-[#151A18] text-xs font-bold"
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>Contribute</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openMovementModal(goal, 'withdrawal')}
                    disabled={goal.currentAmount <= 0}
                    className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-[#E8E7E0] dark:border-[#343D37] text-xs font-semibold disabled:opacity-40"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Withdraw</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Goal Contributions History */}
      {state.goalContributions.length > 0 && (
        <section className="rounded-2xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] p-5 sm:p-6">
          <h2 className="text-base font-bold mb-3">Recent Goal Activity</h2>
          <div className="divide-y divide-[#E8E7E0] dark:divide-[#343D37]">
            {state.goalContributions.slice(0, 8).map((c) => {
              const goal = state.goals.find((g) => g.id === c.goalId);
              return (
                <div key={c.id} className="py-2.5 flex items-center justify-between text-xs sm:text-sm">
                  <div>
                    <p className="font-semibold">
                      {goal?.name ?? 'Goal'} ·{' '}
                      <span className="capitalize">{c.type}</span>
                    </p>
                    <p className="text-xs text-[#89918B] dark:text-[#9AA69E]">
                      {formatDateDisplay(c.date, dateFmt)}
                      {c.note ? ` · ${c.note}` : ''}
                    </p>
                  </div>
                  <span
                    className={`font-mono-num font-bold ${
                      c.type === 'contribution'
                        ? 'text-[#245C45] dark:text-[#83B89A]'
                        : 'text-[#D9822B]'
                    }`}
                  >
                    {c.type === 'contribution' ? '+' : '-'}
                    {formatCurrency(c.amount, currency, { mask })}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Add/Edit Goal Modal */}
      <Modal
        open={goalModalOpen}
        title={editingGoal ? 'Edit Savings Goal' : 'Create Savings Goal'}
        onClose={() => setGoalModalOpen(false)}
      >

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-xs text-red-700 dark:text-red-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div>
                <label htmlFor="goal-name" className="block text-xs font-semibold text-[#89918B] mb-1">
                  Goal Name
                </label>
                <input
                  id="goal-name"
                  type="text"
                  required
                  placeholder="e.g., Buy a Laptop"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="goal-target" className="block text-xs font-semibold text-[#89918B] mb-1">
                    Target Amount (₹)
                  </label>
                  <input
                    id="goal-target"
                    type="number"
                    min="1"
                    required
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-sm font-mono-num"
                  />
                </div>
                <div>
                  <label htmlFor="goal-current" className="block text-xs font-semibold text-[#89918B] mb-1">
                    Current Savings (₹)
                  </label>
                  <input
                    id="goal-current"
                    type="number"
                    min="0"
                    required
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-sm font-mono-num"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="goal-date" className="block text-xs font-semibold text-[#89918B] mb-1">
                  Target Date
                </label>
                <input
                  id="goal-date"
                  type="date"
                  required
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-sm"
                />
              </div>

              <div>
                <label htmlFor="goal-desc" className="block text-xs font-semibold text-[#89918B] mb-1">
                  Description
                </label>
                <input
                  id="goal-desc"
                  type="text"
                  placeholder="Optional goal motivation or milestone"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-sm"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex gap-1.5">
                  {GOAL_ICONS.slice(0, 5).map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setIcon(ic)}
                      aria-label={`Select goal icon ${ic}`}
                      className={`p-2 rounded-lg border ${
                        icon === ic
                          ? 'border-[#245C45] bg-[#245C45]/10 text-[#245C45]'
                          : 'border-[#E8E7E0] dark:border-[#343D37] text-[#89918B]'
                      }`}
                    >
                      <CategoryIcon name={ic} className="w-4 h-4" />
                    </button>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  {GOAL_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      aria-label={`Select color ${c}`}
                      className={`w-6 h-6 rounded-full border-2 ${
                        color === c ? 'border-[#242A26] dark:border-white' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8E7E0] dark:border-[#343D37]">
                <button
                  type="button"
                  onClick={() => setGoalModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E8E7E0] dark:border-[#343D37] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#245C45] text-white dark:bg-[#83B89A] dark:text-[#151A18] text-xs font-bold"
                >
                  {editingGoal ? 'Save Changes' : 'Create Goal'}
                </button>
              </div>
            </form>
      </Modal>

      {/* Contribution / Withdrawal Modal */}
      <Modal
        open={Boolean(movementGoal)}
        title={
          movementGoal
            ? `${movementType === 'contribution' ? 'Add Contribution' : 'Record Withdrawal'} · ${movementGoal.name}`
            : ''
        }
        onClose={() => setMovementGoal(null)}
        size="sm"
      >

            {moveError && (
              <div className="mb-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-xs text-red-700 dark:text-red-300">
                {moveError}
              </div>
            )}

            <form onSubmit={handleSaveMovement} className="space-y-4">
              <div>
                <label htmlFor="move-amount" className="block text-xs font-semibold text-[#89918B] mb-1">
                  Amount (₹)
                </label>
                <input
                  id="move-amount"
                  type="number"
                  min="1"
                  required
                  placeholder="2000"
                  value={moveAmount}
                  onChange={(e) => setMoveAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-sm font-mono-num"
                />
              </div>
              <div>
                <label htmlFor="move-date" className="block text-xs font-semibold text-[#89918B] mb-1">
                  Date
                </label>
                <input
                  id="move-date"
                  type="date"
                  required
                  value={moveDate}
                  onChange={(e) => setMoveDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-sm"
                />
              </div>
              <div>
                <label htmlFor="move-note" className="block text-xs font-semibold text-[#89918B] mb-1">
                  Note (optional)
                </label>
                <input
                  id="move-note"
                  type="text"
                  placeholder="e.g., Bonus allocation"
                  value={moveNote}
                  onChange={(e) => setMoveNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-sm"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMovementGoal(null)}
                  className="px-4 py-2 rounded-xl border border-[#E8E7E0] dark:border-[#343D37] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#245C45] text-white dark:bg-[#83B89A] dark:text-[#151A18] text-xs font-bold"
                >
                  Confirm
                </button>
              </div>
            </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Savings Goal"
        description={
          deleteTarget
            ? `Delete "${deleteTarget.name}" and its contribution history?`
            : ''
        }
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) deleteGoal(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
