import type { AuthUserRecord, FinanceState, ThemeMode } from '../types/finance';
import { createDemoState, createEmptyUserState } from '../data/demoSeed';
import { getKolkataTodayISO } from '../utils/formatters';
import { clientEnv } from '../config/env';

const KEYS = {
  DEMO_STATE: 'paisaflow_demo_state_v1',
  USERS_REGISTRY: 'paisaflow_users_registry_v1',
  SESSION: 'paisaflow_session_v1',
  THEME: 'paisaflow_theme_v1',
  USER_STATE_PREFIX: 'paisaflow_user_state_v1_',
};

export interface SessionInfo {
  mode: 'demo' | 'authenticated';
  userId: string;
}

export function isSupabaseConfigured(): boolean {
  return clientEnv.isSupabaseConfigured;
}

export async function hashPassword(password: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const enc = new TextEncoder().encode(`paisaflow_salt_${password}`);
    const digest = await window.crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return `pf_${btoa(password)}`;
}

export function loadStoredTheme(): ThemeMode {
  try {
    const val = localStorage.getItem(KEYS.THEME);
    if (val === 'dark' || val === 'light') return val;
  } catch {
    // ignore storage errors
  }
  return 'light';
}

export function saveStoredTheme(theme: ThemeMode): void {
  try {
    localStorage.setItem(KEYS.THEME, theme);
  } catch {
    // ignore
  }
}

export function loadSession(): SessionInfo | null {
  try {
    const raw = localStorage.getItem(KEYS.SESSION);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionInfo;
    if (parsed.mode === 'demo' || parsed.mode === 'authenticated') {
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

export function saveSession(session: SessionInfo | null): void {
  try {
    if (!session) {
      localStorage.removeItem(KEYS.SESSION);
    } else {
      localStorage.setItem(KEYS.SESSION, JSON.stringify(session));
    }
  } catch {
    // ignore
  }
}

export function loadUsersRegistry(): AuthUserRecord[] {
  try {
    const raw = localStorage.getItem(KEYS.USERS_REGISTRY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveUsersRegistry(users: AuthUserRecord[]): void {
  localStorage.setItem(KEYS.USERS_REGISTRY, JSON.stringify(users));
}

export async function registerLocalUser(input: {
  fullName: string;
  email: string;
  password: string;
}): Promise<{ user?: AuthUserRecord; error?: string }> {
  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim();
  if (!fullName) return { error: 'Full name is required.' };
  if (!email || !email.includes('@')) return { error: 'Please enter a valid email address.' };
  if (input.password.length < 6) return { error: 'Password must be at least 6 characters.' };

  const users = loadUsersRegistry();
  if (users.some((u) => u.email === email)) {
    return { error: 'An account with this email already exists.' };
  }

  const passwordHash = await hashPassword(input.password);
  const user: AuthUserRecord = {
    id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    fullName,
    email,
    passwordHash,
    createdAt: getKolkataTodayISO(),
  };

  saveUsersRegistry([...users, user]);
  const freshState = createEmptyUserState(user);
  saveUserFinanceState(user.id, freshState);
  saveSession({ mode: 'authenticated', userId: user.id });

  return { user };
}

export async function loginLocalUser(input: {
  email: string;
  password: string;
}): Promise<{ user?: AuthUserRecord; error?: string }> {
  const email = input.email.trim().toLowerCase();
  const users = loadUsersRegistry();
  const found = users.find((u) => u.email === email);
  if (!found) {
    return { error: 'No account found for that email address.' };
  }
  const passwordHash = await hashPassword(input.password);
  if (found.passwordHash !== passwordHash) {
    return { error: 'Incorrect password. Please try again.' };
  }
  saveSession({ mode: 'authenticated', userId: found.id });
  return { user: found };
}

export async function resetLocalUserPassword(input: {
  email: string;
  newPassword: string;
}): Promise<{ ok: boolean; error?: string }> {
  const email = input.email.trim().toLowerCase();
  if (input.newPassword.length < 6) {
    return { ok: false, error: 'New password must be at least 6 characters.' };
  }
  const users = loadUsersRegistry();
  const idx = users.findIndex((u) => u.email === email);
  if (idx === -1) {
    return { ok: false, error: 'No registered account matches this email.' };
  }
  users[idx] = {
    ...users[idx],
    passwordHash: await hashPassword(input.newPassword),
  };
  saveUsersRegistry(users);
  return { ok: true };
}

export function loadDemoFinanceState(): FinanceState {
  try {
    const raw = localStorage.getItem(KEYS.DEMO_STATE);
    if (raw) {
      return JSON.parse(raw) as FinanceState;
    }
  } catch {
    // ignore
  }
  const seeded = createDemoState();
  saveDemoFinanceState(seeded);
  return seeded;
}

export function saveDemoFinanceState(state: FinanceState): void {
  try {
    localStorage.setItem(KEYS.DEMO_STATE, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function resetDemoFinanceState(): FinanceState {
  const seeded = createDemoState();
  saveDemoFinanceState(seeded);
  return seeded;
}

export function loadUserFinanceState(userId: string): FinanceState {
  try {
    const raw = localStorage.getItem(`${KEYS.USER_STATE_PREFIX}${userId}`);
    if (raw) {
      return JSON.parse(raw) as FinanceState;
    }
  } catch {
    // ignore
  }
  const users = loadUsersRegistry();
  const found = users.find((u) => u.id === userId);
  const fresh = createEmptyUserState(
    found ?? {
      id: userId,
      fullName: 'PaisaFlow User',
      email: 'user@paisaflow.in',
      createdAt: getKolkataTodayISO(),
    }
  );
  saveUserFinanceState(userId, fresh);
  return fresh;
}

export function saveUserFinanceState(userId: string, state: FinanceState): void {
  try {
    localStorage.setItem(`${KEYS.USER_STATE_PREFIX}${userId}`, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function deleteLocalUserAccount(userId: string): void {
  const users = loadUsersRegistry().filter((u) => u.id !== userId);
  saveUsersRegistry(users);
  localStorage.removeItem(`${KEYS.USER_STATE_PREFIX}${userId}`);
  saveSession(null);
}

export const SUPABASE_SCHEMA_SQL = `-- PaisaFlow PostgreSQL + Row Level Security Schema
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  occupation text,
  monthly_income_target numeric(12,2) default 0,
  created_at timestamptz default now()
);

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('Cash','Bank Account','Savings Account','UPI','Credit Card','Digital Wallet','Other')),
  opening_balance numeric(12,2) not null default 0,
  institution text,
  last_four_digits text,
  color text not null default '#245C45',
  created_at timestamptz default now()
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income','expense')),
  icon text not null,
  color text not null,
  is_default boolean default false
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  amount numeric(12,2) not null check (amount > 0),
  type text not null check (type in ('income','expense','transfer')),
  category_id uuid references categories(id) on delete set null,
  account_id uuid not null references accounts(id) on delete cascade,
  to_account_id uuid references accounts(id) on delete set null,
  tx_date date not null,
  payment_method text not null,
  notes text,
  attachment_name text,
  recurring_id uuid,
  occurrence_date date,
  created_at timestamptz default now(),
  unique (recurring_id, occurrence_date)
);

create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category_id uuid references categories(id) on delete cascade,
  limit_amount numeric(12,2) not null check (limit_amount > 0),
  period text not null check (period in ('monthly','custom')),
  month_key text,
  start_date date,
  end_date date
);

create table if not exists savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric(12,2) not null check (target_amount > 0),
  current_amount numeric(12,2) not null default 0 check (current_amount >= 0),
  target_date date not null,
  description text,
  icon text,
  color text,
  created_at timestamptz default now()
);

create table if not exists goal_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references savings_goals(id) on delete cascade,
  type text not null check (type in ('contribution','withdrawal')),
  amount numeric(12,2) not null check (amount > 0),
  account_id uuid references accounts(id) on delete set null,
  contribution_date date not null,
  note text
);

create table if not exists recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  type text not null check (type in ('income','expense')),
  amount numeric(12,2) not null check (amount > 0),
  category_id uuid references categories(id) on delete set null,
  account_id uuid not null references accounts(id) on delete cascade,
  payment_method text not null,
  frequency text not null check (frequency in ('daily','weekly','monthly','yearly')),
  start_date date not null,
  next_due_date date not null,
  last_processed_date date,
  active boolean default true,
  notes text
);

create table if not exists user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text default 'light',
  currency text default 'INR',
  language text default 'en-IN',
  date_format text default 'DD MMM YYYY',
  notifications jsonb default '{}'::jsonb,
  privacy jsonb default '{}'::jsonb
);

-- Enable Row Level Security across all tables
alter table profiles enable row level security;
alter table accounts enable row level security;
alter table categories enable row level security;
alter table transactions enable row level security;
alter table budgets enable row level security;
alter table savings_goals enable row level security;
alter table goal_contributions enable row level security;
alter table recurring_transactions enable row level security;
alter table user_preferences enable row level security;
`;
