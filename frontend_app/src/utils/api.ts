export async function fetchWithAuth(url: string, options: RequestInit = {}) {
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