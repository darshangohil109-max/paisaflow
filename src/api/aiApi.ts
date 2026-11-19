import { apiRequest } from './httpClient';
import type { AiFinancialContext } from '../domain/financeSelectors';

export interface AiChatMessagePayload {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiChatResponse {
  reply: string;
}

export interface HealthCheckResponse {
  ok: boolean;
  apiVersion: string;
  environment: string;
  aiConfigured: boolean;
}

export async function askFinancialAssistant(params: {
  question: string;
  history: AiChatMessagePayload[];
  financialContext: AiFinancialContext;
}): Promise<string> {
  const data = await apiRequest<AiChatResponse>('/ai/chat', {
    method: 'POST',
    body: params,
  });

  if (!data?.reply) {
    throw new Error('The AI assistant returned an empty reply.');
  }

  return data.reply;
}

export async function fetchApiHealth(): Promise<HealthCheckResponse> {
  return apiRequest<HealthCheckResponse>('/health', { method: 'GET' });
}
