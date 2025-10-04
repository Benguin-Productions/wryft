const BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';

export async function apiRegister(data: { username: string; email: string; password: string; inviteCode: string }) {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error?.message || 'Register failed');
  return res.json();
}

export async function apiGetUser(username: string) {
  const res = await fetch(`${BASE_URL}/api/users/${encodeURIComponent(username)}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Fetch user failed');
  return res.json();
}

export async function apiGetUserPosts(params: { username: string; limit?: number; cursor?: string }) {
  const q = new URLSearchParams();
  if (params.limit) q.set('limit', String(params.limit));
  if (params.cursor) q.set('cursor', params.cursor);
  q.set('_ts', String(Date.now()));
  const res = await fetch(`${BASE_URL}/api/users/${encodeURIComponent(params.username)}/posts${q.toString() ? `?${q}` : ''}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Fetch user posts failed');
  return res.json();
}

export async function apiLogin(data: { email: string; password: string }) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error?.message || 'Login failed');
  return res.json();
}

export async function apiMe(token: string) {
  const res = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Auth check failed');
  return res.json();
}

export async function apiCreatePost(token: string, data: { content: string }) {
  const res = await fetch(`${BASE_URL}/api/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Create post failed');
  return res.json();
}

export async function apiListPosts(params?: { limit?: number; cursor?: string }) {
  const q = new URLSearchParams();
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.cursor) q.set('cursor', params.cursor);
  q.set('_ts', String(Date.now()));
  const res = await fetch(`${BASE_URL}/api/posts${q.toString() ? `?${q}` : ''}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Fetch posts failed');
  return res.json();
}
