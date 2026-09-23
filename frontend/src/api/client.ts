const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

export function getAuthToken(): string | null {

  return localStorage.getItem('token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('token', token);
}

export function removeAuthToken() {
  localStorage.removeItem('token');
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If body is not FormData, set Content-Type to JSON
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = 'An error occurred while communicating with the server.';
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        if (typeof errJson.detail === 'string') {
          errorMessage = errJson.detail;
        } else if (Array.isArray(errJson.detail)) {
          errorMessage = errJson.detail.map((e: any) => e.msg).join(', ');
        }
      }
    } catch {
      // Fallback
    }
    throw new Error(errorMessage);
  }

  return response.json();
}
