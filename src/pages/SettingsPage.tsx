import React, { useState } from 'react';
import {
  Check,
  Copy,
  Database,
  Download,
  Moon,
  RotateCcw,
  Sun,
  Trash2,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import type {
  DateFormatOption,
  SupportedCurrency,
  SupportedLanguage,
} from '../types/finance';
import {
  SUPABASE_SCHEMA_SQL,
  isSupabaseConfigured,
} from '../services/storageService';
import { transactionsToCsv } from '../utils/financeMath';
import { downloadCsv, downloadJson } from '../utils/fileExport';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Switch } from '../components/ui';

export function SettingsPage() {
  const {
    state,
    isDemoMode,
    theme,
    setTheme,
    todayISO,
    updateProfile,
    updatePreferences,
    resetDemoData,
    deleteUserProfileAccount,
    showToast,
  } = useFinance();

  const [fullName, setFullName] = useState(state?.profile.fullName ?? '');
  const [occupation, setOccupation] = useState(state?.profile.occupation ?? '');
  const [incomeTarget, setIncomeTarget] = useState(
    String(state?.profile.monthlyIncomeTarget ?? '')
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showSchema, setShowSchema] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  if (!state) return null;

  const supabaseReady = isSupabaseConfigured();

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast('Full name cannot be empty.', 'error');
      return;
    }
    updateProfile({
      fullName: fullName.trim(),
      occupation: occupation.trim() || undefined,
      monthlyIncomeTarget: Number(incomeTarget) || 0,
    });
  };

  const handleExportJson = () => {
    downloadJson(state, `paisaflow-backup-${todayISO}.json`);
    showToast('Exported complete financial backup (JSON).');
  };

  const handleExportCsv = () => {
    const csv = transactionsToCsv(state.transactions, state.categories, state.accounts);
    downloadCsv(csv, `paisaflow-all-transactions-${todayISO}.csv`);
    showToast('Exported all transactions (CSV).');
  };

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
      setCopiedSql(true);
      showToast('Copied Supabase SQL + RLS schema.');
      window.setTimeout(() => setCopiedSql(false), 2000);
    } catch {
      showToast('Could not copy to clipboard.', 'error');
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Profile Management */}
      <section className="rounded-2xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] p-6">
        <h2 className="text-base font-bold">Profile Management</h2>
        <p className="text-xs text-[#89918B] dark:text-[#9AA69E] mb-4">
          Personal details for reports and monthly income benchmarks
        </p>

        <form onSubmit={handleSaveProfile} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="set-name" className="block text-xs font-semibold text-[#89918B] mb-1">
              Full Name
            </label>
            <input
              id="set-name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-sm"
            />
          </div>

          <div>
            <label htmlFor="set-email" className="block text-xs font-semibold text-[#89918B] mb-1">
              Email Address
            </label>
            <input
              id="set-email"
              type="email"
              disabled
              value={state.profile.email}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-sm opacity-70"
            />
          </div>

          <div>
            <label htmlFor="set-occ" className="block text-xs font-semibold text-[#89918B] mb-1">
              Occupation / Profile Type
            </label>
            <input
              id="set-occ"
              type="text"
              placeholder="e.g., Freelancer, Student, Salaried"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-sm"
            />
          </div>

          <div>
            <label htmlFor="set-inc" className="block text-xs font-semibold text-[#89918B] mb-1">
              Monthly Income Target (₹)
            </label>
            <input
              id="set-inc"
              type="number"
              min="0"
              value={incomeTarget}
              onChange={(e) => setIncomeTarget(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-sm font-mono-num"
            />
          </div>

          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#245C45] text-white dark:bg-[#83B89A] dark:text-[#151A18] text-xs font-bold"
            >
              Save Profile
            </button>
          </div>
        </form>
      </section>

      {/* Appearance & Regional Preferences */}
      <section className="rounded-2xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] p-6 space-y-5">
        <div>
          <h2 className="text-base font-bold">Theme & Regional Preferences</h2>
          <p className="text-xs text-[#89918B] dark:text-[#9AA69E]">
            Customize theme, display currency, language, and Indian date formatting
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="block text-xs font-semibold text-[#89918B] mb-1.5">Theme Mode</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold inline-flex items-center justify-center gap-2 ${
                  theme === 'light'
                    ? 'border-[#245C45] bg-[#245C45]/10 text-[#245C45]'
                    : 'border-[#E8E7E0] dark:border-[#343D37]'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>Warm Light</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold inline-flex items-center justify-center gap-2 ${
                  theme === 'dark'
                    ? 'border-[#83B89A] bg-[#83B89A]/15 text-[#83B89A]'
                    : 'border-[#E8E7E0] dark:border-[#343D37]'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>Deep Pine Dark</span>
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="set-currency" className="block text-xs font-semibold text-[#89918B] mb-1.5">
              Display Currency
            </label>
            <select
              id="set-currency"
              value={state.preferences.currency}
              onChange={(e) =>
                updatePreferences({ currency: e.target.value as SupportedCurrency })
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-sm"
            >
              <option value="INR">Indian Rupee — INR (₹)</option>
              <option value="USD">US Dollar — USD ($)</option>
              <option value="EUR">Euro — EUR (€)</option>
            </select>
          </div>

          <div>
            <label htmlFor="set-language" className="block text-xs font-semibold text-[#89918B] mb-1.5">
              Language Locale
            </label>
            <select
              id="set-language"
              value={state.preferences.language}
              onChange={(e) =>
                updatePreferences({ language: e.target.value as SupportedLanguage })
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-sm"
            >
              <option value="en-IN">English (India)</option>
              <option value="hi-IN">Hindi (India) — Regional</option>
              <option value="gu-IN">Gujarati (India) — Regional</option>
            </select>
          </div>

          <div>
            <label htmlFor="set-datefmt" className="block text-xs font-semibold text-[#89918B] mb-1.5">
              Date Format
            </label>
            <select
              id="set-datefmt"
              value={state.preferences.dateFormat}
              onChange={(e) =>
                updatePreferences({ dateFormat: e.target.value as DateFormatOption })
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-sm"
            >
              <option value="DD MMM YYYY">DD MMM YYYY (18 Nov 2026)</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY (18/11/2026)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (2026-11-18)</option>
            </select>
          </div>
        </div>
      </section>

      {/* Notifications & Privacy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="rounded-2xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] p-6 space-y-4">
          <h2 className="text-base font-bold">Notification Preferences</h2>
          {(
            [
              ['transactionAlerts', 'Transaction Alerts', 'Confirmations when entries are recorded'],
              ['budgetAlerts', 'Budget Alerts', 'Warn when spending nears or crosses limits'],
              ['goalReminders', 'Goal Reminders', 'Track milestones toward savings targets'],
              ['monthlyReports', 'Monthly Reports', 'End-of-month financial summary reminders'],
            ] as const
          ).map(([key, title, desc]) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-[#89918B] dark:text-[#9AA69E]">{desc}</p>
              </div>
              <Switch
                checked={state.preferences.notifications[key]}
                ariaLabel={title}
                onChange={() =>
                  updatePreferences({
                    notifications: {
                      ...state.preferences.notifications,
                      [key]: !state.preferences.notifications[key],
                    },
                  })
                }
              />
            </div>
          ))}
        </section>

        <section className="rounded-2xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] p-6 space-y-4">
          <h2 className="text-base font-bold">Privacy & Security</h2>

          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Mask Account Balances</p>
              <p className="text-xs text-[#89918B] dark:text-[#9AA69E]">
                Hide currency amounts across dashboards in public spaces
              </p>
            </div>
            <Switch
              checked={state.preferences.privacy.maskBalances}
              ariaLabel="Mask Account Balances"
              onChange={() =>
                updatePreferences({
                  privacy: {
                    ...state.preferences.privacy,
                    maskBalances: !state.preferences.privacy.maskBalances,
                  },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">AI Financial Context</p>
              <p className="text-xs text-[#89918B] dark:text-[#9AA69E]">
                Allow the AI Assistant to read your recorded ledger summary
              </p>
            </div>
            <Switch
              checked={state.preferences.privacy.aiContextConsent}
              ariaLabel="AI Financial Context"
              onChange={() =>
                updatePreferences({
                  privacy: {
                    ...state.preferences.privacy,
                    aiContextConsent: !state.preferences.privacy.aiContextConsent,
                  },
                })
              }
            />
          </div>

          <div className="pt-2 border-t border-[#E8E7E0] dark:border-[#343D37]">
            <p className="text-xs text-[#89918B] dark:text-[#9AA69E] mb-2">
              Backend Mode:{' '}
              <span className="font-semibold text-[#242A26] dark:text-[#F3F5F1]">
                {supabaseReady ? 'Supabase Cloud Connected' : 'Local Browser Persistence (Isolated)'}
              </span>
            </p>
            <button
              type="button"
              onClick={() => setShowSchema((s) => !s)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#245C45] dark:text-[#83B89A] hover:underline"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{showSchema ? 'Hide PostgreSQL + RLS Schema' : 'View Supabase SQL + RLS Schema'}</span>
            </button>
          </div>
        </section>
      </div>

      {showSchema && (
        <section className="rounded-2xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">Supabase PostgreSQL + Row Level Security Schema</h3>
            <button
              type="button"
              onClick={handleCopySql}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8E7E0] dark:border-[#343D37] text-xs font-semibold"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'Copied' : 'Copy SQL'}</span>
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] text-xs font-mono-num overflow-x-auto max-h-64">
            {SUPABASE_SCHEMA_SQL}
          </pre>
        </section>
      )}

      {/* Data Export & Danger Zone */}
      <section className="rounded-2xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E8E7E0] dark:border-[#343D37] text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Transactions CSV</span>
          </button>
          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E8E7E0] dark:border-[#343D37] text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Full Backup (JSON)</span>
          </button>
        </div>

        {isDemoMode ? (
          <button
            type="button"
            onClick={resetDemoData}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D9B98C]/25 text-[#242A26] dark:text-[#F3F5F1] text-xs font-bold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Workspace</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setDeleteDialogOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Account</span>
          </button>
        )}
      </section>

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Your PaisaFlow Account"
        description="This permanently removes your local user profile, accounts, transactions, budgets, and goals. This action cannot be undone."
        confirmLabel="Permanently Delete"
        onConfirm={() => {
          setDeleteDialogOpen(false);
          deleteUserProfileAccount();
        }}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </div>
  );
}
