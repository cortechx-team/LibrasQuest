import { getApiUrl } from './api';

export const AUTH_TOKEN_KEY = 'librasquest_access_token';
const AUTH_CHANGE_EVENT = 'librasquest-auth-change';

type AuthMode = 'login' | 'register';

type AuthPayload = {
  name?: string;
  email: string;
  password: string;
};

type TokenResponse = {
  access_token: string;
  token_type: string;
};

type ErrorResponse = {
  detail?: string | Array<{ msg?: string }>;
};

function getErrorMessage(data: ErrorResponse): string {
  if (typeof data.detail === 'string') {
    return data.detail;
  }

  const validationMessage = data.detail?.[0]?.msg;
  return validationMessage?.replace('Value error, ', '') ?? 'Não foi possível autenticar.';
}

export async function authenticate(mode: AuthMode, payload: AuthPayload): Promise<string> {
  const response = await fetch(`${getApiUrl()}/auth/${mode}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json() as TokenResponse | ErrorResponse;
  if (!response.ok) {
    throw new Error(getErrorMessage(data as ErrorResponse));
  }

  return (data as TokenResponse).access_token;
}

export function saveAuthToken(token: string): void {
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function getAuthToken(): string | null {
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function clearAuthToken(): void {
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function subscribeToAuth(callback: () => void): () => void {
  window.addEventListener('storage', callback);
  window.addEventListener(AUTH_CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(AUTH_CHANGE_EVENT, callback);
  };
}
