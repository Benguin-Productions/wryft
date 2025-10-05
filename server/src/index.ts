import 'dotenv/config';
import express from 'express';
import path from 'path';
import cors from 'cors';
import authRouter from './routes/auth';
import postsRouter from './routes/posts';
import usersRouter from './routes/users';
import { pingRedis } from './shared/redis';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
// Serve static assets (e.g., badge icons) from server/public
app.use('/static', express.static(path.join(__dirname, '..', 'public')));

app.get('/api/health', async (_req, res) => {
  const redisOk = await pingRedis().catch(() => false);
  res.json({ ok: true, service: 'wryft-server', redis: redisOk ? 'up' : 'down' });
});

app.use('/api/auth', authRouter);
app.use('/api/posts', postsRouter);
app.use('/api/users', usersRouter);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
