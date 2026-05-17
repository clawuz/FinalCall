const SESSION_KEY = 'fc_admin_auth';

export function login(password: string): boolean {
  const expected = import.meta.env.VITE_ADMIN_PASSWORD as string;
  if (password !== expected) return false;
  sessionStorage.setItem(SESSION_KEY, '1');
  return true;
}

export function logout(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function isAuthenticated(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === '1';
}
