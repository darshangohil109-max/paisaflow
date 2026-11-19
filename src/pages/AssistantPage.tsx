import React, { useMemo, useState } from 'react';
import { AlertCircle, Bot, Send, ShieldCheck, Sparkles, User } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { buildAiFinancialContext } from '../domain/financeSelectors';
import { askFinancialAssistant } from '../api/aiApi';
import { ApiError } from '../api/httpClient';
import { formatCurrency } from '../utils/formatters';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_PROMPTS = [
  'Where did I spend the most this month?',
  'How much did I save this month?',
  'Can I reduce my monthly expenses?',
  'Compare this month with last month.',
  'Suggest category-wise budget limits based on my spending.',
  'How much can I save in six months at my current pace?',
];

export function AssistantPage() {
  const { state, isDemoMode, todayISO } = useFinance();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const financialContext = useMemo(
    () => (state ? buildAiFinancialContext(state, isDemoMode, todayISO) : null),
    [state, isDemoMode, todayISO]
  );

  if (!state || !financialContext) return null;

  const currency = state.preferences.currency;
  const mask = state.preferences.privacy.maskBalances;

  const sendQuestion = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || loading) return;

    if (!state.preferences.privacy.aiContextConsent) {
      setError(
        'AI Financial Context is currently disabled in Settings > Privacy. Enable it to allow analyzing your recorded ledger.'
      );
      return;
    }

    setError(null);
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}_u`,
      role: 'user',
      content: trimmed,
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput('');
    setLoading(true);

    try {
      const reply = await askFinancialAssistant({
        question: trimmed,
        history: messages.map((m) => ({ role: m.role, content: m.content })),
        financialContext,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now()}_a`,
          role: 'assistant',
          content: reply,
        },
      ]);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : 'Unable to reach AI Financial Assistant.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendQuestion(input);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Context Summary */}
      <aside className="lg:col-span-4 space-y-4">
        <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#245C45]/10 dark:bg-[#83B89A]/15 text-[#245C45] dark:text-[#83B89A] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold">Live Ledger Context</h2>
              <p className="text-[11px] text-[#89918B] dark:text-[#9AA69E]">
                Grounded strictly in your PaisaFlow data
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-[#E8E7E0] dark:border-[#343D37] space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[#89918B]">This Month Income</span>
              <span className="font-mono-num font-bold text-[#245C45] dark:text-[#83B89A]">
                {formatCurrency(financialContext.totals.monthlyIncome, currency, { mask })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#89918B]">This Month Expenses</span>
              <span className="font-mono-num font-bold">
                {formatCurrency(financialContext.totals.monthlyExpenses, currency, { mask })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#89918B]">Net Savings ({financialContext.totals.savingsRate}%)</span>
              <span className="font-mono-num font-bold">
                {formatCurrency(financialContext.totals.netSavings, currency, { mask })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#89918B]">Top Spending Category</span>
              <span className="font-semibold">
                {financialContext.categoryBreakdown[0]?.category ?? 'None'}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-[#F1EFE8] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] p-4 flex items-start gap-2.5 text-xs text-[#89918B] dark:text-[#9AA69E]">
          <ShieldCheck className="w-4 h-4 text-[#245C45] dark:text-[#83B89A] shrink-0 mt-0.5" />
          <span>
            Insights are informational only and are not professional investment or tax advice. PaisaFlow never connects to external bank credentials.
          </span>
        </div>
      </aside>

      {/* Main Chat Console */}
      <section className="lg:col-span-8 rounded-2xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] flex flex-col min-h-[540px] max-h-[72vh]">
        <div className="px-5 py-4 border-b border-[#E8E7E0] dark:border-[#343D37] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Bot className="w-5 h-5 text-[#245C45] dark:text-[#83B89A]" />
            <div>
              <h2 className="text-sm font-bold">PaisaFlow AI Financial Assistant</h2>
              <p className="text-[11px] text-[#89918B] dark:text-[#9AA69E]">
                Ask about spending habits, savings targets, month-over-month trends, or budgets
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37]">
                <p className="text-sm font-bold">
                  Hello {state.profile.fullName.split(' ')[0]}!
                </p>
                <p className="mt-1 text-xs text-[#89918B] dark:text-[#9AA69E] leading-relaxed">
                  I can analyze your recorded transactions, identify high-spend categories, compare
                  current and previous months, and suggest realistic INR budget limits. Choose a
                  prompt below or ask your own question.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendQuestion(prompt)}
                    className="p-3 rounded-xl border border-[#E8E7E0] dark:border-[#343D37] hover:border-[#245C45] dark:hover:border-[#83B89A] text-left text-xs font-semibold transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-[#245C45]/10 dark:bg-[#83B89A]/15 text-[#245C45] dark:text-[#83B89A] flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#245C45] text-white dark:bg-[#83B89A] dark:text-[#151A18] font-medium'
                      : 'bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37]'
                  }`}
                >
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-[#D9B98C]/25 text-[#242A26] dark:text-[#F3F5F1] flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))
          )}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#245C45]/10 dark:bg-[#83B89A]/15 text-[#245C45] dark:text-[#83B89A] flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="w-64 p-4 rounded-2xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] space-y-2 animate-pulse">
                <div className="h-3 bg-[#E8E7E0] dark:bg-[#343D37] rounded w-3/4" />
                <div className="h-3 bg-[#E8E7E0] dark:bg-[#343D37] rounded w-1/2" />
              </div>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSubmit}
          className="p-4 border-t border-[#E8E7E0] dark:border-[#343D37] flex items-center gap-2.5"
        >
          <label htmlFor="ai-question-input" className="sr-only">
            Ask the AI financial assistant
          </label>
          <input
            id="ai-question-input"
            type="text"
            placeholder="Ask about your spending, budgets, or 6-month savings..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#151A18] border border-[#E8E7E0] dark:border-[#343D37] text-sm focus:outline-none focus:ring-2 focus:ring-[#245C45] dark:focus:ring-[#83B89A]"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Send question"
            className="px-4 py-2.5 rounded-xl bg-[#245C45] text-white dark:bg-[#83B89A] dark:text-[#151A18] text-sm font-bold disabled:opacity-50 inline-flex items-center gap-2 whitespace-nowrap"
          >
            <span>Ask</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </section>
    </div>
  );
}
