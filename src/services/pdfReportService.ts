import { jsPDF } from 'jspdf';
import type {
  Account,
  Category,
  DateFormatOption,
  SupportedCurrency,
  Transaction,
} from '../types/finance';
import { formatDateDisplay } from '../utils/formatters';
import { computeAllAccountBalances } from '../utils/financeMath';

function pdfAmount(amount: number, currency: SupportedCurrency): string {
  const prefix = currency === 'INR' ? 'INR ' : currency === 'USD' ? '$ ' : 'EUR ';
  const abs = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
  }).format(abs);
  return `${amount < 0 ? '-' : ''}${prefix}${formatted}`;
}

export function generateFinancialPdfReport(params: {
  title: string;
  periodLabel: string;
  userName: string;
  isDemoMode: boolean;
  currency: SupportedCurrency;
  dateFormat: DateFormatOption;
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  categoryBreakdown: Array<{ name: string; amount: number; pct: number }>;
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
}): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = 44;

  const catMap = new Map(params.categories.map((c) => [c.id, c.name]));
  const accMap = new Map(params.accounts.map((a) => [a.id, a.name]));
  const balances = computeAllAccountBalances(params.accounts, params.transactions);

  // Header
  doc.setFillColor(36, 92, 69);
  doc.rect(0, 0, pageWidth, 84, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('PaisaFlow Financial Report', margin, 38);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(
    `${params.title}  |  ${params.periodLabel}  |  ${params.userName}${params.isDemoMode ? ' (Demo Data)' : ''}`,
    margin,
    58
  );

  y = 112;
  doc.setTextColor(36, 42, 38);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Executive Summary', margin, y);
  y += 18;

  const kpis = [
    ['Total Balance', pdfAmount(params.totalBalance, params.currency)],
    ['Total Income', pdfAmount(params.totalIncome, params.currency)],
    ['Total Expenses', pdfAmount(params.totalExpenses, params.currency)],
    ['Net Savings', `${pdfAmount(params.netSavings, params.currency)} (${params.savingsRate}%)`],
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  kpis.forEach(([label, value], idx) => {
    const colX = margin + (idx % 2) * 260;
    const rowY = y + Math.floor(idx / 2) * 24;
    doc.setTextColor(120, 128, 122);
    doc.text(`${label}:`, colX, rowY);
    doc.setTextColor(36, 42, 38);
    doc.setFont('helvetica', 'bold');
    doc.text(value, colX + 95, rowY);
    doc.setFont('helvetica', 'normal');
  });

  y += 64;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Spending by Category', margin, y);
  y += 16;

  doc.setFontSize(10);
  if (params.categoryBreakdown.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 128, 122);
    doc.text('No expenses recorded in this period.', margin, y);
    y += 20;
  } else {
    params.categoryBreakdown.slice(0, 8).forEach((cat) => {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(36, 42, 38);
      doc.text(cat.name, margin, y);
      doc.text(`${cat.pct}%`, margin + 220, y);
      doc.text(pdfAmount(cat.amount, params.currency), margin + 320, y);
      y += 16;
    });
  }

  y += 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Account Balances', margin, y);
  y += 16;

  doc.setFontSize(10);
  params.accounts.forEach((acc) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(36, 42, 38);
    doc.text(`${acc.name} (${acc.type})`, margin, y);
    doc.text(pdfAmount(balances[acc.id] ?? 0, params.currency), margin + 320, y);
    y += 16;
  });

  y += 16;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Transactions Ledger', margin, y);
  y += 18;

  doc.setFontSize(9);
  doc.setTextColor(120, 128, 122);
  doc.text('Date', margin, y);
  doc.text('Title', margin + 80, y);
  doc.text('Category / Type', margin + 250, y);
  doc.text('Account', margin + 365, y);
  doc.text('Amount', pageWidth - margin, y, { align: 'right' });
  y += 8;
  doc.setDrawColor(232, 231, 224);
  doc.line(margin, y, pageWidth - margin, y);
  y += 14;

  doc.setFont('helvetica', 'normal');
  params.transactions.slice(0, 30).forEach((tx) => {
    if (y > 780) {
      doc.addPage();
      y = 48;
    }
    doc.setTextColor(36, 42, 38);
    doc.text(formatDateDisplay(tx.date, params.dateFormat), margin, y);
    doc.text(tx.title.slice(0, 28), margin + 80, y);
    const catLabel = tx.type === 'transfer' ? 'Transfer' : (catMap.get(tx.categoryId) ?? 'Other');
    doc.text(catLabel.slice(0, 20), margin + 250, y);
    doc.text((accMap.get(tx.accountId) ?? 'Account').slice(0, 16), margin + 365, y);
    const prefix = tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : '';
    doc.text(`${prefix}${pdfAmount(tx.amount, params.currency)}`, pageWidth - margin, y, {
      align: 'right',
    });
    y += 16;
  });

  const fileSlug = params.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  doc.save(`paisaflow-${fileSlug}.pdf`);
}
