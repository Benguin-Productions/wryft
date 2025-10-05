import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '../shared/requireAdmin';

const prisma = new PrismaClient();
const router = Router();

// All routes below require admin
router.use(requireAdmin);

// GET /api/admin/stats
router.get('/stats', async (_req, res, next) => {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [totalUsers, totalPosts, users24h, posts24h] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.user.count({ where: { createdAt: { gte: since } } }),
      prisma.post.count({ where: { createdAt: { gte: since } } }),
    ]);

    res.json({
      totals: { users: totalUsers, posts: totalPosts },
      last24h: { users: users24h, posts: posts24h },
    });
  } catch (e) {
    next(e);
  }
});

export default router;
