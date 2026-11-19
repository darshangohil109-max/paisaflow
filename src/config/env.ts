import type { ThemeMode } from '../types/finance';

export interface ClientEnvConfig {
  readonly apiBaseUrl: string;
  readonly supabaseUrl: string;
  readonly supabaseAnonKey: string;
  readonly isSupabaseConfigured: boolean;
  readonly defaultTimezone: string;
  readonly defaultLocale: string;
  readonly requestTimeoutMs: number;
}

const rawEnv =
  typeof import.meta !== 'undefined' && import.meta.env
    ? (import.meta.env as Record<string, string | undefined>)
    : {};

const supabaseUrl = rawEnv.VITE_SUPABASE_URL?.trim() ?? '';
const supabaseAnonKey = rawEnv.VITE_SUPABASE_ANON_KEY?.trim() ?? '';

export const clientEnv: ClientEnvConfig = Object.freeze({
  apiBaseUrl: (rawEnv.VITE_API_BASE_URL?.trim() || '/api/v1').replace(/\/$/, ''),
  supabaseUrl,
  supabaseAnonKey,
  isSupabaseConfigured: Boolean(supabaseUrl && supabaseAnonKey),
  defaultTimezone: 'Asia/Kolkata',
  defaultLocale: 'en-IN',
  requestTimeoutMs: 30_000,
});

export function getChartThemeTokens(theme: ThemeMode) {
  return {
    gridStroke: theme === 'dark' ? '#343D37' : '#E8E7E0',
    axisColor: theme === 'dark' ? '#9AA69E' : '#89918B',
    primaryBar: theme === 'dark' ? '#83B89A' : '#245C45',
    expenseBar: '#D9B98C',
    tooltipBg: theme === 'dark' ? '#1F2723' : '#FFFFFF',
  } as const;
}
