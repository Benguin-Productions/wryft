// Resolve API base URL with safety:
// - In production (non-localhost), always use same-origin so Nginx proxies /api -> backend.
// - In local dev (localhost), allow VITE_API_URL override, defaulting to http://localhost:4000.
const ENV_URL = (import.meta as any).env?.VITE_API_URL as string | undefined;
const isLocalhost = typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname);
const BASE_URL = isLocalhost ? (ENV_URL || 'http://localhost:4000') : '';

export async function apiRegister(data: { username: string; email: string; password: string; inviteCode: string }) {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error?.message || 'Register failed');
  return res.json();
}

export async function apiListFollowers(username: string, opts?: { limit?: number; disc?: number }) {
  const q = new URLSearchParams();
  if (opts?.limit) q.set('limit', String(opts.limit));
  if (opts?.disc != null) q.set('disc', String(opts.disc));
  q.set('_ts', String(Date.now()));
  const res = await fetch(`${BASE_URL}/api/users/${encodeURIComponent(username)}/followers?${q.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Fetch followers failed');
  return res.json() as Promise<{ items: Array<{ id: string; username: string; discriminator: number; avatarUrl?: string }>; nextCursor: string | null }>;
}

export async function apiListFollowing(username: string, opts?: { limit?: number; disc?: number }) {
  const q = new URLSearchParams();
  if (opts?.limit) q.set('limit', String(opts.limit));
  if (opts?.disc != null) q.set('disc', String(opts.disc));
  q.set('_ts', String(Date.now()));
  const res = await fetch(`${BASE_URL}/api/users/${encodeURIComponent(username)}/following?${q.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Fetch following failed');
  return res.json() as Promise<{ items: Array<{ id: string; username: string; discriminator: number; avatarUrl?: string }>; nextCursor: string | null }>;
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

export async function apiUpdateMe(token: string, data: { bio?: string; location?: string }) {
  const res = await fetch(`${BASE_URL}/api/users/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Update profile failed');
  return res.json();
}

export async function apiSearchUsers(q: string, limit = 10) {
  const qsp = new URLSearchParams();
  if (q) qsp.set('q', q);
  if (limit) qsp.set('limit', String(limit));
  qsp.set('_ts', String(Date.now()));
  const res = await fetch(`${BASE_URL}/api/users/search?${qsp.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}

export async function apiUploadAvatar(token: string, dataUrl: string) {
  const res = await fetch(`${BASE_URL}/api/users/me/avatar`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ dataUrl }),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Upload avatar failed');
  return res.json();
}

export async function apiUploadBanner(token: string, dataUrl: string) {
  const res = await fetch(`${BASE_URL}/api/users/me/banner`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ dataUrl }),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Upload banner failed');
  return res.json();
}

// Follow APIs
export async function apiFollow(token: string, username: string, disc?: number) {
  const q = disc != null ? `?disc=${encodeURIComponent(String(disc))}` : '';
  const res = await fetch(`${BASE_URL}/api/users/${encodeURIComponent(username)}/follow${q}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Follow failed');
  return res.json();
}

export async function apiUnfollow(token: string, username: string, disc?: number) {
  const q = disc != null ? `?disc=${encodeURIComponent(String(disc))}` : '';
  const res = await fetch(`${BASE_URL}/api/users/${encodeURIComponent(username)}/follow${q}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Unfollow failed');
  return res.json();
}

export async function apiFollowStats(username: string, token?: string, disc?: number) {
  const q = disc != null ? `?disc=${encodeURIComponent(String(disc))}` : '';
  const res = await fetch(`${BASE_URL}/api/users/${encodeURIComponent(username)}/follow-stats${q}`, {
    cache: 'no-store',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) throw new Error('Fetch follow stats failed');
  return res.json() as Promise<{ followers: number; following: number; isFollowing: boolean }>;
}
