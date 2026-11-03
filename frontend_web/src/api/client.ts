import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/authStore';
import { usePrefs } from '@/store/prefsStore';
import type { ApiEnvelope, Paged } from './types';

export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5003/api/v1').replace(/\/$/, '');

export const http = axios.create({ baseURL: API_URL, timeout: 30000 });

http.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers['Accept-Language'] = usePrefs.getState().locale;
  return config;
});

// ── Single-flight refresh: concurrent 401s wait for ONE refresh call ──
let refreshing: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  const { refreshToken, setTokens, clear } = useAuthStore.getState();
  if (!refreshToken) return null;
  try {
    const res = await axios.post<ApiEnvelope<{ accessToken: string; refreshToken: string }>>(`${API_URL}/auth/refresh`, { refreshToken });
    setTokens(res.data.data.accessToken, res.data.data.refreshToken);
    return res.data.data.accessToken;
  } catch {
    clear();
    return null;
  }
};

http.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    const url = original?.url || '';
    if (error.response?.status === 401 && original && !original._retry && !url.includes('/auth/')) {
      original._retry = true;
      refreshing = refreshing || refreshAccessToken().finally(() => (refreshing = null));
      const token = await refreshing;
      if (token) {
        original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
        return http(original);
      }
    }
    return Promise.reject(error);
  }
);

/** Unwraps `{ data }` */
export const get = async <T>(url: string, params?: object): Promise<T> => (await http.get<ApiEnvelope<T>>(url, { params })).data.data;
/** Unwraps list responses into `{ items, meta }` */
export const getPaged = async <T>(url: string, params?: object): Promise<Paged<T>> => {
  const res = await http.get<ApiEnvelope<T[]>>(url, { params });
  return { items: res.data.data, meta: res.data.meta! };
};
export const post = async <T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> => (await http.post<ApiEnvelope<T>>(url, body, config)).data.data;
export const put = async <T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> => (await http.put<ApiEnvelope<T>>(url, body, config)).data.data;
export const patch = async <T>(url: string, body?: unknown): Promise<T> => (await http.patch<ApiEnvelope<T>>(url, body)).data.data;
export const del = async <T>(url: string): Promise<T> => (await http.delete<ApiEnvelope<T>>(url)).data.data;

export const errorMessage = (err: unknown, fallback = 'Something went wrong'): string => {
  const e = err as AxiosError<{ message?: string }>;
  if (e?.response?.data?.message) return e.response.data.message;
  if (e?.code === 'ERR_NETWORK') return 'Cannot reach the server';
  return fallback;
};

/** Remove undefined / empty values from query params */
export const clean = <T extends object>(o: T): Partial<T> =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== false)) as Partial<T>;
