import { clientEnv } from '../config/env';

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(message: string, status: number, code = 'API_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  timeoutMs?: number;
  headers?: Record<string, string>;
}

export async function apiRequest<TResponse>(
  path: string,
  options: RequestOptions = {}
): Promise<TResponse> {
  const {
    method = 'GET',
    body,
    timeoutMs = clientEnv.requestTimeoutMs,
    headers = {},
  } = options;

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${clientEnv.apiBaseUrl}${normalizedPath}`;

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const contentType = response.headers.get('content-type') ?? '';
    const isJson = contentType.includes('application/json');
    const payload = isJson ? ((await response.json()) as Record<string, unknown>) : null;

    if (!response.ok) {
      const errMessage =
        (typeof payload?.error === 'string' && payload.error) ||
        `Request failed with status ${response.status}.`;
      const errCode =
        (typeof payload?.code === 'string' && payload.code) || 'HTTP_ERROR';
      throw new ApiError(errMessage, response.status, errCode);
    }

    return payload as TResponse;
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      throw err;
    }
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError('Request timed out. Please try again.', 408, 'REQUEST_TIMEOUT');
    }
    throw new ApiError(
      err instanceof Error ? err.message : 'Network error. Please check your connection.',
      0,
      'NETWORK_ERROR'
    );
  } finally {
    window.clearTimeout(timer);
  }
}
