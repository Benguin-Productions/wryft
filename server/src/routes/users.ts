import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// GET /api/users/:username - basic profile
router.get('/:username', async (req, res, next) => {
  try {
    const { username } = req.params;
    const user = await prisma.user.findFirst({
      where: { username },
      select: { id: true, username: true, discriminator: true, bio: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const verified = user.username === 'benguin' && user.discriminator === 1;
    res.json({ ...user, verified });
  } catch (e) {
    next(e);
  }
});

// GET /api/users/:username/posts - user's posts, newest first, optional cursor
router.get('/:username/posts', async (req, res, next) => {
  try {
    const { username } = req.params;
    const { limit = '20', cursor } = req.query as { limit?: string; cursor?: string };
    const take = Math.min(Math.max(parseInt(limit || '20', 10), 1), 50);

    const user = await prisma.user.findFirst({ where: { username }, select: { id: true } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const items = await prisma.post.findMany({
      where: { authorId: user.id },
      take: take + 1,
      ...(cursor ? { cursor: { id: String(cursor) }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: { select: { id: true, username: true, discriminator: true } },
      },
    });

    const withBadges = items.map((p: any) => ({
      ...p,
      author: {
        ...p.author,
        verified: p.author.username === 'benguin' && p.author.discriminator === 1,
      },
    }));

    let nextCursor: string | null = null;
    if (withBadges.length > take) {
      const nextItem = withBadges.pop();
      nextCursor = nextItem!.id;
    }

    res.json({ items: withBadges, nextCursor });
  } catch (e) {
    next(e);
  }
});

export default router;
