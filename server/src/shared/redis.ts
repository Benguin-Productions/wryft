import Redis from 'ioredis';

let client: Redis | null = null;

export function getRedis(): Redis | null {
  if (!process.env.REDIS_URL) return null;
  if (!client) {
    client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableOfflineQueue: false,
    });
    client.on('error', (err: unknown) => {
      // Keep errors from crashing the process; health endpoint will reflect status
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[redis] error:', msg);
    });
  }
  return client;
}

export async function pingRedis(timeoutMs = 500): Promise<boolean> {
  const r = getRedis();
  if (!r) return false;
  try {
    const p = r.ping();
    const t = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), timeoutMs));
    const res = await Promise.race([p, t]);
    return res === 'PONG';
  } catch (_e) {
    return false;
  }
}
