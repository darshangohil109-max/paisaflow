import type { DateFormatOption, SupportedCurrency } from '../types/finance';

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const CURRENCY_CONFIG: Record<SupportedCurrency, { locale: string; currency: string; symbol: string }> = {
  INR: { locale: 'en-IN', currency: 'INR', symbol: '₹' },
  USD: { locale: 'en-US', currency: 'USD', symbol: '$' },
  EUR: { locale: 'de-DE', currency: 'EUR', symbol: '€' },
};

export function getKolkataTodayISO(now: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(now);
}

export function formatCurrency(
  amount: number,
  currency: SupportedCurrency = 'INR',
  options?: { mask?: boolean; compact?: boolean; showDecimals?: boolean }
): string {
  if (options?.mask) {
    const symbol = CURRENCY_CONFIG[currency].symbol;
    return `${symbol} •••••`;
  }

  const cfg = CURRENCY_CONFIG[currency];
  const absVal = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (options?.compact && absVal >= 100000) {
    if (currency === 'INR') {
      if (absVal >= 10000000) {
        return `${sign}${cfg.symbol}${(absVal / 10000000).toFixed(2)}Cr`;
      }
      return `${sign}${cfg.symbol}${(absVal / 100000).toFixed(2)}L`;
    }
    if (absVal >= 1000000) {
      return `${sign}${cfg.symbol}${(absVal / 1000000).toFixed(1)}M`;
    }
    return `${sign}${cfg.symbol}${(absVal / 1000).toFixed(1)}K`;
  }

  const hasFraction = Math.round(absVal * 100) % 100 !== 0;
  const maxFrac = options?.showDecimals || hasFraction ? 2 : 0;

  const formatted = new Intl.NumberFormat(cfg.locale, {
    style: 'currency',
    currency: cfg.currency,
    minimumFractionDigits: options?.showDecimals ? 2 : 0,
    maximumFractionDigits: maxFrac,
  }).format(absVal);

  return `${sign}${formatted}`;
}

export function formatDateDisplay(
  isoDate: string,
  format: DateFormatOption = 'DD MMM YYYY'
): string {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return isoDate || '—';
  }
  const [y, m, d] = isoDate.split('-').map(Number);
  const monthIdx = Math.max(0, Math.min(11, m - 1));
  const dd = String(d).padStart(2, '0');
  const mm = String(m).padStart(2, '0');

  if (format === 'DD/MM/YYYY') {
    return `${dd}/${mm}/${y}`;
  }
  if (format === 'YYYY-MM-DD') {
    return isoDate;
  }
  return `${dd} ${MONTHS_SHORT[monthIdx]} ${y}`;
}

export function formatMonthYear(monthKey: string): string {
  if (!/^\d{4}-\d{2}$/.test(monthKey)) return monthKey;
  const [y, m] = monthKey.split('-').map(Number);
  const monthIdx = Math.max(0, Math.min(11, m - 1));
  return `${MONTHS_SHORT[monthIdx]} ${y}`;
}

export function getGreetingKolkata(now: Date = new Date()): string {
  const hourStr = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    hour12: false,
  }).format(now);
  const hour = Number(hourStr);
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}
