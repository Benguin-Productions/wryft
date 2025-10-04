import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../shared/validate';
import { AuthService } from '../services/authService';
import { requireAuth } from '../shared/requireAuth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const router = Router();

const registerSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  password: z.string().min(8),
  inviteCode: z.string().min(1)
});

router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { username, email, password, inviteCode } = req.body;
    // Validate invite code from DB
    const code = await prisma.inviteCode.findUnique({ where: { code: inviteCode } });
    const now = new Date();
    if (!code || code.disabled || (code.expiresAt && code.expiresAt < now) || code.uses >= code.maxUses) {
      return res.status(403).json({ error: 'Invalid or expired invite code' });
    }
    const result = await AuthService.register({ username, email, password });
    // Increment invite usage (best-effort)
    await prisma.inviteCode.update({ where: { code: inviteCode }, data: { uses: { increment: 1 } } }).catch(() => {});
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.login({ email, password });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/me', requireAuth, async (req: any, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, username: true, email: true, discriminator: true }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const verified = user.username === 'benguin' && user.discriminator === 1;
    res.json({ ...user, verified });
  } catch (e) {
    next(e);
  }
});

export default router;
