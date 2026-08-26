const BASE = process.env.NEXT_PUBLIC_API_URL || '/api';
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.json() as Promise<T>;
}
export const api = {
  get: <T>(p: string) => apiRequest<T>(p),
  post: <T>(p: string, body: unknown) =>
    apiRequest<T>(p, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(p: string, body: unknown) =>
    apiRequest<T>(p, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(p: string, body: unknown) =>
    apiRequest<T>(p, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(p: string) => apiRequest<T>(p, { method: 'DELETE' }),
};
