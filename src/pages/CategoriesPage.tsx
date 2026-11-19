import React, { useMemo, useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import type { Category } from '../types/finance';
import { AVAILABLE_CATEGORY_ICONS, CategoryIcon } from '../components/CategoryIcon';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Modal, SegmentedControl } from '../components/ui';

const CATEGORY_TABS = [
  { id: 'expense', label: 'Expense Categories' },
  { id: 'income', label: 'Income Categories' },
] as const;

const CATEGORY_COLORS = [
  '#245C45',
  '#4E8B63',
  '#75977F',
  '#3B7A8C',
  '#D9822B',
  '#C49A45',
  '#7D67A8',
  '#B55B75',
  '#C94D4D',
  '#2F8886',
  '#5E6873',
];

export function CategoriesPage() {
  const { state, addCategory, updateCategory, deleteCategory, showToast } = useFinance();

  const [tab, setTab] = useState<'expense' | 'income'>('expense');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const [name, setName] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [icon, setIcon] = useState('Utensils');
  const [color, setColor] = useState('#245C45');
  const [error, setError] = useState<string | null>(null);

  const usageCounts = useMemo(() => {
    const map = new Map<string, number>();
    if (!state) return map;
    for (const tx of state.transactions) {
      map.set(tx.categoryId, (map.get(tx.categoryId) ?? 0) + 1);
    }
    return map;
  }, [state]);

  if (!state) return null;

  const list = state.categories.filter(
    (c) =>
      c.type === tab &&
      (!search.trim() || c.name.toLowerCase().includes(search.trim().toLowerCase()))
  );

  const openCreateModal = () => {
    setEditingCat(null);
    setName('');
    setType(tab);
    setIcon(tab === 'expense' ? 'Utensils' : 'Briefcase');
    setColor('#245C45');
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCat(cat);
    setName(cat.name);
    setType(cat.type);
    setIcon(cat.icon);
    setColor(cat.color);
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = editingCat
      ? updateCategory(editingCat.id, { name: name.trim(), icon, color })
      : addCategory({ name: name.trim(), type, icon, color });

    if (err) {
      setError(err);
      return;
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl
          options={CATEGORY_TABS}
          value={tab}
          onChange={setTab}
          ariaLabel="Category type"
        />

        <div className="flex items-center gap-3 flex-1 sm:flex-initial justify-end">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-4 h-4 text-[#89918B] absolute left-3 top-1/2 -translate-y-1/2" />
            <label htmlFor="cat-search" className="sr-only">
              Search categories
            </label>
            <input
              id="cat-search"
              type="search"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] text-xs sm:text-sm"
            />
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#245C45] text-white dark:bg-[#83B89A] dark:text-[#151A18] text-xs font-bold whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Category Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {list.map((cat) => {
          const count = usageCounts.get(cat.id) ?? 0;
          return (
            <div
              key={cat.id}
              className="rounded-2xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] p-4 flex flex-col justify-between gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${cat.color}1C`, color: cat.color }}
                >
                  <CategoryIcon name={cat.icon} className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditModal(cat)}
                    aria-label={`Edit ${cat.name}`}
                    className="p-1.5 rounded-lg text-[#89918B] hover:text-[#245C45] dark:hover:text-[#83B89A]"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(cat)}
                    aria-label={`Delete ${cat.name}`}
                    className="p-1.5 rounded-lg text-[#89918B] hover:text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <p className="text-sm font-bold truncate">{cat.name}</p>
                <p className="text-xs text-[#89918B] dark:text-[#9AA69E]">
                  {count} {count === 1 ? 'transaction' : 'transactions'}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        open={modalOpen}
        title={editingCat ? 'Edit Category' : 'Create Category'}
        onClose={() => setModalOpen(false)}
      >

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-xs text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingCat && (
                <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37]">
                  {(['expense', 'income'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
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
              )}

              <div>
                <label htmlFor="cat-name" className="block text-xs font-semibold text-[#89918B] mb-1">
                  Category Name
                </label>
                <input
                  id="cat-name"
                  type="text"
                  required
                  placeholder="e.g., Fitness & Gym"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-sm"
                />
              </div>

              <div>
                <span className="block text-xs font-semibold text-[#89918B] mb-2">Icon</span>
                <div className="grid grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1">
                  {AVAILABLE_CATEGORY_ICONS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setIcon(ic)}
                      aria-label={`Select icon ${ic}`}
                      className={`p-2 rounded-xl border flex items-center justify-center ${
                        icon === ic
                          ? 'border-[#245C45] bg-[#245C45]/10 text-[#245C45] dark:border-[#83B89A] dark:text-[#83B89A]'
                          : 'border-[#E8E7E0] dark:border-[#343D37] text-[#89918B]'
                      }`}
                    >
                      <CategoryIcon name={ic} className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold text-[#89918B] mb-2">Color</span>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_COLORS.map((c) => (
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
                  {editingCat ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Category"
        description={
          deleteTarget
            ? `Delete "${deleteTarget.name}"? Only unused categories (not referenced by transactions, budgets, or recurring rules) can be deleted.`
            : ''
        }
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) {
            const err = deleteCategory(deleteTarget.id);
            if (err) showToast(err, 'error');
          }
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
