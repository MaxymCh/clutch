/**
 * Client HTTP de l'API interne Clutch.
 *
 * - Base URL : VITE_API_URL en prod, sinon `/api` (proxifié vers le backend
 *   par Vite en dev — voir vite.config.ts).
 * - Auth : Bearer token Supabase dans l'en-tête Authorization (JWT vérifié
 *   côté backend via SUPABASE_JWT_SECRET).
 */
import { supabase } from '../lib/supabase';

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

/** Erreur API : status HTTP + message `detail` renvoyé par FastAPI. */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
  });

  if (!response.ok) {
    let detail = `Erreur API (${response.status})`;
    try {
      const body = (await response.json()) as { detail?: string };
      if (body.detail) detail = body.detail;
    } catch {
      // corps non-JSON : on garde le message générique
    }
    throw new ApiError(response.status, detail);
  }
  return response.json() as Promise<T>;
};

export const apiGet = <T>(path: string): Promise<T> => request<T>(path);

export const apiPost = <T>(path: string, body: unknown): Promise<T> =>
  request<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

export const apiPatch = <T>(path: string, body: unknown): Promise<T> =>
  request<T>(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
