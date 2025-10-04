import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../shared/requireAuth';
import { z } from 'zod';

const prisma = new PrismaClient();
const router = Router();

const createSchema = z.object({ content: z.string().min(1).max(1000) });

// Create a post
router.post('/', requireAuth, async (req: any, res, next) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid content' });
    const post = await prisma.post.create({
      data: { content: parsed.data.content, authorId: req.userId! },
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: { select: { id: true, username: true, discriminator: true, verified: true, badgeIcon: true } },
      },
    });
    res.status(201).json(post);
  } catch (e) {
    next(e);
  }
});

// Get posts (newest first) with simple cursor pagination
router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const cursor = req.query.cursor as string | undefined;

    const items = await prisma.post.findMany({
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: { select: { id: true, username: true, discriminator: true, verified: true, badgeIcon: true } },
      },
    });

    let nextCursor: string | null = null;
    if (items.length > limit) {
      const nextItem = items.pop();
      nextCursor = nextItem!.id;
    }

    res.json({ items, nextCursor });
  } catch (e) {
    next(e);
  }
});

// Danger: Clear all posts (dev utility)
router.delete('/', requireAuth, async (_req, res, next) => {
  try {
    const result = await prisma.post.deleteMany({});
    res.json({ deleted: result.count });
  } catch (e) {
    next(e);
  }
});

export default router;
