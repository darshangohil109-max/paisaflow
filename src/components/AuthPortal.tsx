import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Moon,
  Sparkles,
  Sun,
  User,
} from 'lucide-react';
import { BrandMark } from './BrandMark';
import { useFinance } from '../context/FinanceContext';

type AuthView = 'login' | 'signup' | 'forgot';

export function AuthPortal() {
  const { theme, toggleTheme, enterDemoMode, signUp, login, resetPassword, showToast } =
    useFinance();

  const [view, setView] = useState<AuthView>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  const switchView = (next: AuthView) => {
    setView(next);
    setError(null);
    setResetSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);

    try {
      if (view === 'signup') {
        const err = await signUp({ fullName, email, password });
        if (err) setError(err);
      } else if (view === 'login') {
        const err = await login({ email, password });
        if (err) setError(err);
      } else {
        const res = await resetPassword({ email, newPassword });
        if (!res.ok) {
          setError(res.error ?? 'Could not reset password.');
        } else {
          setResetSuccess(true);
          showToast('Password updated. You can now sign in with your new password.');
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6F2] dark:bg-[#151A18] text-[#242A26] dark:text-[#F3F5F1] flex flex-col">
      {/* Top Bar */}
      <header className="w-full max-w-6xl mx-auto px-6 py-5 flex items-center justify-between gap-6">
        <BrandMark size={38} showWordmark />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#E8E7E0] dark:border-[#343D37] bg-[#FFFFFF] dark:bg-[#1F2723] text-xs font-semibold text-[#242A26] dark:text-[#F3F5F1] hover:border-[#245C45]/40 dark:hover:border-[#83B89A]/40 transition-colors whitespace-nowrap shrink-0"
          >
            {theme === 'light' ? (
              <>
                <Moon className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Dark Mode</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Light Mode</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={enterDemoMode}
            className="px-4 py-2 rounded-xl border border-[#245C45]/30 dark:border-[#83B89A]/40 bg-[#245C45]/5 dark:bg-[#83B89A]/10 text-[#245C45] dark:text-[#83B89A] text-xs font-bold hover:bg-[#245C45]/10 dark:hover:bg-[#83B89A]/20 transition-colors whitespace-nowrap shrink-0"
          >
            Explore Demo
          </button>
        </div>
      </header>

      {/* Main Split Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-8 lg:py-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left Editorial Column */}
        <section className="lg:col-span-6 space-y-6">
          <p className="text-xs font-semibold text-[#245C45] dark:text-[#83B89A] tracking-wide">
            Personal Finance Management · INR (₹)
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight leading-[1.14] text-balance text-[#242A26] dark:text-[#F3F5F1]">
            Understand Your Money. Control Your Future.
          </h1>
          <p className="text-base text-[#89918B] dark:text-[#9AA69E] leading-relaxed max-w-xl">
            Track daily INR income and expenses across bank accounts, UPI wallets, and cash. Set
            category budgets, monitor savings goals, automate recurring bills, and inspect real-time
            AI insights grounded strictly in your ledger.
          </p>

          {/* Clean Feature Summary Grid (Flat Single-Elevation) */}
          <div className="grid grid-cols-2 gap-4 pt-2 max-w-lg">
            <div className="p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37]">
              <p className="text-xs text-[#89918B] dark:text-[#9AA69E]">Sample Monthly Income</p>
              <p className="mt-1 text-xl font-bold font-mono-num text-[#245C45] dark:text-[#83B89A]">
                ₹35,000
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37]">
              <p className="text-xs text-[#89918B] dark:text-[#9AA69E]">Sample Net Savings</p>
              <p className="mt-1 text-xl font-bold font-mono-num text-[#242A26] dark:text-[#F3F5F1]">
                ₹16,500
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={enterDemoMode}
              className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl bg-[#245C45] text-white dark:bg-[#83B89A] dark:text-[#151A18] text-sm font-bold hover:bg-[#1D4A38] dark:hover:bg-[#96C7AC] transition-colors whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              <span>Try Interactive Demo Mode</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
            <span className="text-xs text-[#89918B] dark:text-[#9AA69E]">
              Isolated sample data · No sign-up required
            </span>
          </div>
        </section>

        {/* Right Auth Card */}
        <section className="lg:col-span-6 w-full max-w-md mx-auto lg:ml-auto">
          <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] p-6 sm:p-8 shadow-sm">
            {/* Segmented Mode Switch */}
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] mb-6">
              <button
                type="button"
                onClick={() => switchView('login')}
                className={`py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${
                  view === 'login'
                    ? 'bg-[#FFFFFF] dark:bg-[#1F2723] text-[#242A26] dark:text-[#F3F5F1] shadow-sm'
                    : 'text-[#89918B] dark:text-[#9AA69E] hover:text-[#242A26] dark:hover:text-[#F3F5F1]'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => switchView('signup')}
                className={`py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${
                  view === 'signup'
                    ? 'bg-[#FFFFFF] dark:bg-[#1F2723] text-[#242A26] dark:text-[#F3F5F1] shadow-sm'
                    : 'text-[#89918B] dark:text-[#9AA69E] hover:text-[#242A26] dark:hover:text-[#F3F5F1]'
                }`}
              >
                Sign Up
              </button>
            </div>

            <div className="mb-5">
              <h2 className="text-xl font-bold text-[#242A26] dark:text-[#F3F5F1]">
                {view === 'login'
                  ? 'Welcome Back'
                  : view === 'signup'
                    ? 'Create Your Account'
                    : 'Reset Password'}
              </h2>
              <p className="mt-1 text-xs text-[#89918B] dark:text-[#9AA69E]">
                {view === 'login'
                  ? 'Sign in to access your personal PaisaFlow workspace.'
                  : view === 'signup'
                    ? 'Start with a clean personal finance ledger isolated from demo data.'
                    : 'Enter your registered email and choose a new password.'}
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-medium text-red-700 dark:text-red-300"
              >
                {error}
              </div>
            )}

            {resetSuccess && (
              <div className="mb-4 p-3.5 rounded-xl bg-[#245C45]/10 dark:bg-[#83B89A]/15 border border-[#245C45]/25 text-xs font-medium text-[#245C45] dark:text-[#83B89A] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Password updated successfully. You can now sign in.</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {view === 'signup' && (
                <div>
                  <label
                    htmlFor="auth-name"
                    className="block text-xs font-semibold text-[#89918B] dark:text-[#9AA69E] mb-1.5"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#89918B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="auth-name"
                      type="text"
                      required
                      placeholder="Darshan Gohil"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-sm focus:outline-none focus:ring-2 focus:ring-[#245C45] dark:focus:ring-[#83B89A]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="auth-email"
                  className="block text-xs font-semibold text-[#89918B] dark:text-[#9AA69E] mb-1.5"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#89918B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="auth-email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-sm focus:outline-none focus:ring-2 focus:ring-[#245C45] dark:focus:ring-[#83B89A]"
                  />
                </div>
              </div>

              {view !== 'forgot' ? (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="auth-password"
                      className="block text-xs font-semibold text-[#89918B] dark:text-[#9AA69E]"
                    >
                      Password
                    </label>
                    {view === 'login' && (
                      <button
                        type="button"
                        onClick={() => switchView('forgot')}
                        className="text-xs font-semibold text-[#245C45] dark:text-[#83B89A] hover:underline"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#89918B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-sm focus:outline-none focus:ring-2 focus:ring-[#245C45] dark:focus:ring-[#83B89A]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#89918B] hover:text-[#242A26] dark:hover:text-[#F3F5F1]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <label
                    htmlFor="auth-new-password"
                    className="block text-xs font-semibold text-[#89918B] dark:text-[#9AA69E] mb-1.5"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#89918B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="auth-new-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-sm focus:outline-none focus:ring-2 focus:ring-[#245C45] dark:focus:ring-[#83B89A]"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 px-4 rounded-xl bg-[#245C45] text-white dark:bg-[#83B89A] dark:text-[#151A18] text-sm font-bold hover:bg-[#1D4A38] dark:hover:bg-[#96C7AC] disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
              >
                <span>
                  {view === 'login'
                    ? 'Sign In'
                    : view === 'signup'
                      ? 'Create Account'
                      : 'Update Password'}
                </span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </form>

            {view === 'forgot' && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => switchView('login')}
                  className="text-xs font-semibold text-[#245C45] dark:text-[#83B89A] hover:underline"
                >
                  Back to Login
                </button>
              </div>
            )}

            <div className="mt-6 pt-5 border-t border-[#E8E7E0] dark:border-[#343D37] flex items-center justify-between gap-3">
              <span className="text-xs text-[#89918B] dark:text-[#9AA69E]">
                Want to explore first?
              </span>
              <button
                type="button"
                onClick={enterDemoMode}
                className="text-xs font-bold text-[#245C45] dark:text-[#83B89A] hover:underline whitespace-nowrap"
              >
                Launch Demo Workspace →
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
