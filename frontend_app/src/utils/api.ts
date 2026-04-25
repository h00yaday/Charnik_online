const BASE_URL = '/api';
type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;
type NotifyHandler = (message: string) => void;
let notifyHandler: NotifyHandler | null = null;

export class UnauthorizedError extends Error {
  constructor() {
    super('Unauthorized');
    this.name = 'UnauthorizedError';
  }
}

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

export function setNotifyHandler(handler: NotifyHandler | null) {
  notifyHandler = handler;
}

export function getCsrfTokenFromCookie(): string | null {
  const token = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith('csrf_token='))
    ?.split('=')[1];
  return token ?? null;
}

export async function parseOrThrow(response: Response): Promise<Response> {
  if (response.ok) return response;

  let detail = `HTTP ${response.status}`;
  try {
    const data = await response.json();
    
    if (typeof data.detail === 'string') {
      detail = data.detail;
    } else if (Array.isArray(data.detail)) {
      detail = data.detail.map((err: { msg: string }) => err.msg).join(', ');
    }
  } catch {
    detail = `HTTP ${response.status}`;
  }

  const error = new ApiError(response.status, detail);
  
  if (response.status >= 500) {
    notifyHandler?.('Ошибка сервера. Повторите попытку позже.');
  }
  
  throw error;
}

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (options.method && !['GET', 'HEAD', 'OPTIONS'].includes(options.method.toUpperCase())) {
    const csrfToken = getCsrfTokenFromCookie();
    if (csrfToken && !headers.has('X-CSRF-Token')) {
      headers.set('X-CSRF-Token', csrfToken);
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', 
  });

  if (response.status === 401) {
    unauthorizedHandler?.();
    throw new UnauthorizedError();
  }

  return parseOrThrow(response);
}

export async function fetchJsonWithAuth<TResponse>(
  endpoint: string,
  options: RequestInit = {}
): Promise<TResponse> {
  const response = await fetchWithAuth(endpoint, options);
  return (await response.json()) as TResponse;
}