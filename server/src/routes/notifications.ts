import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../shared/requireAuth';

const prisma = new PrismaClient();
const router = Router();

// GET /api/notifications?limit=&cursor=
router.get('/', requireAuth, async (req: any, res, next) => {
  try {
    const limit = Math.min(Math.max(parseInt((req.query?.limit as string) || '20', 10), 1), 50);
    const cursor = (req.query?.cursor as string | undefined) || undefined;

    const found = await prisma.notification.findMany({
      where: { userId: req.userId! },
      take: limit + 1,
      ...(cursor ? { cursor: { id: String(cursor) }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        actor: { select: { id: true, username: true, discriminator: true, avatarUrl: true } },
        post: { select: { id: true, content: true, createdAt: true, authorId: true } },
      },
    });

    let nextCursor: string | null = null;
    if (found.length > limit) {
      const nextItem = found.pop();
      nextCursor = nextItem!.id;
    }

    res.json({ items: found, nextCursor });
  } catch (e) {
    next(e);
  }
});

// POST /api/notifications/:id/read
router.post('/:id/read', requireAuth, async (req: any, res, next) => {
  try {
    const { id } = req.params;
    const n = await prisma.notification.updateMany({
      where: { id, userId: req.userId!, readAt: null },
      data: { readAt: new Date() },
    });
    res.json({ updated: n.count });
  } catch (e) {
    next(e);
  }
});

// POST /api/notifications/read-all
router.post('/read-all', requireAuth, async (req: any, res, next) => {
  try {
    const n = await prisma.notification.updateMany({
      where: { userId: req.userId!, readAt: null },
      data: { readAt: new Date() },
    });
    res.json({ updated: n.count });
  } catch (e) {
    next(e);
  }
});

export default router;
