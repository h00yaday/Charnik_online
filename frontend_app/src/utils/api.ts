const BASE_URL = 'http://localhost/api';

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', 
  });

  if (response.status === 401) {
    window.dispatchEvent(new Event('unauthorized'));
    return Promise.reject(new Error('Unauthorized')); 
  }

  return response;
}