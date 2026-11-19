import { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { AuthPortal } from './components/AuthPortal';
import { AppShell } from './components/AppShell';
import { ToastBanner } from './components/ToastBanner';
import { TransactionModal } from './components/TransactionModal';
import { ErrorBoundary } from './components/ui';
import type { Transaction, TransactionType } from './types/finance';
import { OverviewPage } from './pages/OverviewPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { AccountsPage } from './pages/AccountsPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { GoalsPage } from './pages/GoalsPage';
import { RecurringPage } from './pages/RecurringPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ReportsPage } from './pages/ReportsPage';
import { AssistantPage } from './pages/AssistantPage';
import { SettingsPage } from './pages/SettingsPage';

function PaisaFlowRouter() {
  const { session, state, activeNav, toasts, dismissToast } = useFinance();

  const [txModalOpen, setTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [modalDefaultType, setModalDefaultType] = useState<TransactionType>('expense');
  const [modalDefaultAccount, setModalDefaultAccount] = useState<string | undefined>(undefined);

  const openAddTransaction = (type: TransactionType = 'expense', accountId?: string) => {
    setEditingTx(null);
    setModalDefaultType(type);
    setModalDefaultAccount(accountId);
    setTxModalOpen(true);
  };

  const openEditTransaction = (tx: Transaction) => {
    setEditingTx(tx);
    setModalDefaultType(tx.type);
    setModalDefaultAccount(tx.accountId);
    setTxModalOpen(true);
  };

  return (
    <>
      {!session || !state ? (
        <AuthPortal />
      ) : (
        <AppShell onOpenAddTransaction={() => openAddTransaction('expense')}>
          {activeNav === 'overview' && (
            <OverviewPage
              onOpenAddTransaction={() => openAddTransaction('expense')}
              onEditTransaction={openEditTransaction}
            />
          )}
          {activeNav === 'transactions' && (
            <TransactionsPage
              onOpenAddTransaction={() => openAddTransaction('expense')}
              onEditTransaction={openEditTransaction}
            />
          )}
          {activeNav === 'accounts' && (
            <AccountsPage
              onOpenTransfer={(accId) => openAddTransaction('transfer', accId)}
              onEditTransaction={openEditTransaction}
            />
          )}
          {activeNav === 'budgets' && <BudgetsPage />}
          {activeNav === 'categories' && <CategoriesPage />}
          {activeNav === 'goals' && <GoalsPage />}
          {activeNav === 'recurring' && <RecurringPage />}
          {activeNav === 'analytics' && <AnalyticsPage />}
          {activeNav === 'reports' && <ReportsPage />}
          {activeNav === 'assistant' && <AssistantPage />}
          {activeNav === 'settings' && <SettingsPage />}
        </AppShell>
      )}

      <TransactionModal
        open={txModalOpen}
        initialTransaction={editingTx}
        defaultType={modalDefaultType}
        defaultAccountId={modalDefaultAccount}
        onClose={() => setTxModalOpen(false)}
      />

      <ToastBanner toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <FinanceProvider>
        <PaisaFlowRouter />
      </FinanceProvider>
    </ErrorBoundary>
  );
}
