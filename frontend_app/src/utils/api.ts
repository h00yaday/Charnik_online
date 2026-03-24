export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  
  // Создаем правильный объект заголовков из тех, что передали (если передали)
  const headers = new Headers(options.headers);

  // Если Content-Type не задан вручную при вызове, ставим JSON
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Если есть токен, добавляем его через метод .set()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    alert('Время сессии истекло. Пожалуйста, войдите снова.');
    localStorage.removeItem('token');
    window.location.reload(); 
    return Promise.reject(new Error('Unauthorized')); 
  }

  return response;
}