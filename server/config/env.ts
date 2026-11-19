import 'dotenv/config';

export interface ServerConfig {
  readonly port: number;
  readonly nodeEnv: 'development' | 'production' | 'test';
  readonly isProduction: boolean;
  readonly appUrl: string;
  readonly geminiApiKey: string;
  readonly geminiModel: string;
  readonly apiVersion: string;
  readonly jsonBodyLimit: string;
}

function parsePort(raw: string | undefined, fallback: number): number {
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 && parsed < 65536 ? parsed : fallback;
}

const rawEnv = process.env.NODE_ENV;
const nodeEnv: ServerConfig['nodeEnv'] =
  rawEnv === 'production' || rawEnv === 'test' ? rawEnv : 'development';

export const serverConfig: ServerConfig = Object.freeze({
  port: parsePort(process.env.PORT, 3000),
  nodeEnv,
  isProduction: nodeEnv === 'production',
  appUrl: process.env.APP_URL ?? '',
  geminiApiKey: process.env.GEMINI_API_KEY ?? '',
  geminiModel: 'gemini-4-hydrogen',
  apiVersion: 'v1',
  jsonBodyLimit: '2mb',
});
