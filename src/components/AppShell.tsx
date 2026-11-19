import React, { useState } from 'react';
import {
  ArrowLeftRight,
  BarChart3,
  Bot,
  CalendarClock,
  FileSpreadsheet,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PiggyBank,
  Plus,
  RotateCcw,
  Settings,
  Sun,
  Target,
  Wallet,
  X,
} from 'lucide-react';
import type { NavSection } from '../types/finance';
import { useFinance } from '../context/FinanceContext';
import { BrandMark } from './BrandMark';
import { getGreetingKolkata } from '../utils/formatters';

interface NavItem {
  id: NavSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { id: 'accounts', label: 'Accounts', icon: Wallet },
  { id: 'budgets', label: 'Budgets', icon: PiggyBank },
  { id: 'categories', label: 'Categories', icon: FolderKanban },
  { id: 'goals', label: 'Savings Goals', icon: Target },
  { id: 'recurring', label: 'Recurring Payments', icon: CalendarClock },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
  { id: 'assistant', label: 'AI Financial Assistant', icon: Bot },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function AppShell({
  onOpenAddTransaction,
  children,
}: {
  onOpenAddTransaction: () => void;
  children: React.ReactNode;
}) {
  const {
    state,
    isDemoMode,
    theme,
    toggleTheme,
    activeNav,
    setActiveNav,
    logout,
    resetDemoData,
  } = useFinance();

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  if (!state) return null;

  const activeItem = NAV_ITEMS.find((n) => n.id === activeNav) ?? NAV_ITEMS[0];
  const greeting = getGreetingKolkata();

  const handleNavSelect = (id: NavSection) => {
    setActiveNav(id);
    setMobileDrawerOpen(false);
  };

  return (
    <div className="min-h-screen flex bg-[#F7F6F2] dark:bg-[#151A18] text-[#242A26] dark:text-[#F3F5F1]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 lg:sticky lg:top-0 lg:h-screen bg-[#FFFFFF] dark:bg-[#1F2723] border-r border-[#E8E7E0] dark:border-[#343D37]">
        <div className="px-5 py-5 border-b border-[#E8E7E0] dark:border-[#343D37]">
          <BrandMark size={34} showWordmark />
        </div>

        <nav aria-label="Primary Navigation" className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavSelect(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors text-left ${
                  isActive
                    ? 'bg-[#245C45] text-white dark:bg-[#83B89A] dark:text-[#151A18]'
                    : 'text-[#242A26]/80 dark:text-[#F3F5F1]/80 hover:bg-[#F7F6F2] dark:hover:bg-[#26302B]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#E8E7E0] dark:border-[#343D37] space-y-3">
          {isDemoMode && (
            <div className="p-3 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37]">
              <p className="text-xs font-bold text-[#245C45] dark:text-[#83B89A]">
                Demo Mode Active
              </p>
              <p className="text-[11px] text-[#89918B] dark:text-[#9AA69E] mt-0.5">
                Sample INR data · Isolated from user accounts
              </p>
              <button
                type="button"
                onClick={resetDemoData}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#245C45] dark:text-[#83B89A] hover:underline"
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                <span>Reset Demo Data</span>
              </button>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">{state.profile.fullName}</p>
              <p className="text-xs text-[#89918B] dark:text-[#9AA69E] truncate">
                {state.profile.email}
              </p>
            </div>
            <button
              type="button"
              onClick={logout}
              aria-label="Log out"
              title="Log out"
              className="p-2 rounded-xl text-[#89918B] hover:text-red-600 dark:hover:text-red-400 hover:bg-[#F7F6F2] dark:hover:bg-[#26302B] transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar (Compact 1-row contract) */}
        <header className="sticky top-0 z-30 h-14 lg:h-16 bg-[#FFFFFF]/95 dark:bg-[#1F2723]/95 backdrop-blur-sm border-b border-[#E8E7E0] dark:border-[#343D37] px-4 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 -ml-2 rounded-xl text-[#242A26] dark:text-[#F3F5F1] hover:bg-[#F7F6F2] dark:hover:bg-[#26302B]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base lg:text-lg font-bold tracking-tight truncate">
                {activeItem.label}
              </h1>
              <p className="hidden sm:block text-xs text-[#89918B] dark:text-[#9AA69E] truncate">
                {greeting}, {state.profile.fullName.split(' ')[0]}
                {isDemoMode ? ' · Demo Workspace' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
              className="p-2.5 rounded-xl border border-[#E8E7E0] dark:border-[#343D37] bg-[#F7F6F2] dark:bg-[#151A18] text-[#242A26] dark:text-[#F3F5F1] hover:border-[#245C45]/40 dark:hover:border-[#83B89A]/40 transition-colors"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Sun className="w-4 h-4" aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              onClick={onOpenAddTransaction}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#245C45] text-white dark:bg-[#83B89A] dark:text-[#151A18] text-xs sm:text-sm font-bold hover:bg-[#1D4A38] dark:hover:bg-[#96C7AC] transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Add Transaction</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-10">
          {isDemoMode && (
            <div className="mb-5 px-4 py-2.5 rounded-xl bg-[#D9B98C]/20 dark:bg-[#D9B98C]/10 border border-[#D9B98C]/40 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-medium text-[#242A26] dark:text-[#F3F5F1]">
                Demo Mode · Viewing realistic sample INR data (₹35,000 income / ₹18,500 expenses).
              </span>
              <button
                type="button"
                onClick={logout}
                className="font-bold text-[#245C45] dark:text-[#83B89A] hover:underline whitespace-nowrap"
              >
                Create Real Account →
              </button>
            </div>
          )}
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation (5 compact targets) */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 h-16 bg-[#FFFFFF]/95 dark:bg-[#1F2723]/95 backdrop-blur-sm border-t border-[#E8E7E0] dark:border-[#343D37] px-2 flex items-center justify-around"
      >
        <button
          type="button"
          onClick={() => handleNavSelect('overview')}
          className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold ${
            activeNav === 'overview'
              ? 'text-[#245C45] dark:text-[#83B89A]'
              : 'text-[#89918B] dark:text-[#9AA69E]'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Home</span>
        </button>

        <button
          type="button"
          onClick={() => handleNavSelect('transactions')}
          className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold ${
            activeNav === 'transactions'
              ? 'text-[#245C45] dark:text-[#83B89A]'
              : 'text-[#89918B] dark:text-[#9AA69E]'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>Transactions</span>
        </button>

        <button
          type="button"
          onClick={onOpenAddTransaction}
          aria-label="Add Transaction"
          className="w-11 h-11 rounded-full bg-[#245C45] dark:bg-[#83B89A] text-white dark:text-[#151A18] flex items-center justify-center shadow-md"
        >
          <Plus className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => handleNavSelect('analytics')}
          className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold ${
            activeNav === 'analytics'
              ? 'text-[#245C45] dark:text-[#83B89A]'
              : 'text-[#89918B] dark:text-[#9AA69E]'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analytics</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          className="flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-[#89918B] dark:text-[#9AA69E]"
        >
          <Menu className="w-4 h-4" />
          <span>More</span>
        </button>
      </nav>

      {/* Mobile Navigation Drawer */}
      {mobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[85vw] bg-[#FFFFFF] dark:bg-[#1F2723] h-full flex flex-col border-r border-[#E8E7E0] dark:border-[#343D37] shadow-2xl">
            <div className="px-5 py-4 border-b border-[#E8E7E0] dark:border-[#343D37] flex items-center justify-between">
              <BrandMark size={30} showWordmark />
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                aria-label="Close navigation menu"
                className="p-2 rounded-xl text-[#89918B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavSelect(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-left ${
                      isActive
                        ? 'bg-[#245C45] text-white dark:bg-[#83B89A] dark:text-[#151A18]'
                        : 'text-[#242A26] dark:text-[#F3F5F1] hover:bg-[#F7F6F2] dark:hover:bg-[#26302B]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="p-4 border-t border-[#E8E7E0] dark:border-[#343D37] flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{state.profile.fullName}</p>
                <p className="text-xs text-[#89918B] dark:text-[#9AA69E] truncate">
                  {state.profile.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMobileDrawerOpen(false);
                  logout();
                }}
                aria-label="Log out"
                className="p-2 rounded-xl text-red-600 dark:text-red-400"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
