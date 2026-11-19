import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { serverConfig } from '../config/env';
import { AppError } from '../middleware/errorHandler';

export interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface FinancialContextPayload {
  userName?: string;
  isDemoMode?: boolean;
  currency?: string;
  dateRangeLabel?: string;
  totals?: {
    totalBalance: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    netSavings: number;
    savingsRate: number;
    previousMonthIncome?: number;
    previousMonthExpenses?: number;
  };
  categoryBreakdown?: Array<{
    category: string;
    spent: number;
    budgetLimit?: number;
  }>;
  accounts?: Array<{
    name: string;
    type: string;
    balance: number;
  }>;
  savingsGoals?: Array<{
    name: string;
    currentAmount: number;
    targetAmount: number;
    targetDate: string;
  }>;
  recurringPayments?: Array<{
    title: string;
    type: string;
    amount: number;
    frequency: string;
    nextDueDate: string;
    active: boolean;
  }>;
  recentTransactions?: Array<{
    title: string;
    type: string;
    amount: number;
    category: string;
    account: string;
    date: string;
  }>;
}

let cachedClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!serverConfig.geminiApiKey) {
    throw new AppError(
      'Gemini API key is not configured on the server. Please add GEMINI_API_KEY in Settings > Secrets.',
      503,
      'AI_NOT_CONFIGURED'
    );
  }
  if (!cachedClient) {
    cachedClient = new GoogleGenAI({
      apiKey: serverConfig.geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return cachedClient;
}

function buildFinancialSystemInstruction(financialContext: FinancialContextPayload): string {
  return `You are PaisaFlow AI Financial Assistant for an Indian personal finance application (Currency: INR ₹, Locale: English India, Date Format: DD MMM YYYY, Timezone: Asia/Kolkata).

STRICT GROUNDING RULES:
1. Use ONLY the verified user financial context JSON provided below. Never invent, extrapolate, or fabricate transaction amounts, balances, bank names, or categories that are not present in the context.
2. If the user asks about data not present in their context (e.g., stock prices, future tax rules, or unrecorded months), state clearly what is missing from their recorded PaisaFlow data.
3. Never claim to connect to live bank accounts, UPI servers, or credit card networks. State clearly that figures come strictly from the user's recorded PaisaFlow ledger.
4. Always format Indian Rupee figures cleanly using ₹ and Indian comma grouping (e.g., ₹35,000, ₹1,00,000).
5. Keep answers concise, actionable, structured with crisp bullet points, and directly answer the user's question first.
6. End financial suggestions with a brief one-line reminder that insights are informational only and not professional investment or tax advice.

USER FINANCIAL CONTEXT:
${JSON.stringify(financialContext, null, 2)}`;
}

export async function generateFinancialAssistantReply(params: {
  question: string;
  history?: ChatHistoryMessage[];
  financialContext?: FinancialContextPayload;
}): Promise<string> {
  const trimmedQuestion = params.question.trim();
  if (!trimmedQuestion) {
    throw new AppError('Please enter a valid question.', 400, 'INVALID_QUESTION');
  }

  const ai = getGeminiClient();
  const safeHistory = Array.isArray(params.history) ? params.history.slice(-8) : [];

  const contents = [
    ...safeHistory.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(msg.content ?? '') }],
    })),
    {
      role: 'user',
      parts: [{ text: trimmedQuestion }],
    },
  ];

  const response = await ai.models.generateContent({
    model: serverConfig.geminiModel,
    contents,
    config: {
      systemInstruction: buildFinancialSystemInstruction(params.financialContext ?? {}),
      thinkingConfig: {
        thinkingLevel: ThinkingLevel.LOW,
      },
    },
  });

  const reply = response.text?.trim();
  if (!reply) {
    throw new AppError(
      'The AI assistant returned an empty response. Please try asking again.',
      502,
      'EMPTY_AI_RESPONSE'
    );
  }

  return reply;
}
