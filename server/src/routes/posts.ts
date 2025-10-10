import { Router } from 'express';
import { PrismaClient, NotificationType } from '@prisma/client';
import { requireAuth } from '../shared/requireAuth';
import { z } from 'zod';

const prisma = new PrismaClient();
const router = Router();

const createSchema = z.object({
  content: z.string().min(1).max(1000),
  parentId: z.string().min(1).optional(),
});

// Create a post
router.post('/', requireAuth, async (req: any, res, next) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid content' });
    const { content, parentId } = parsed.data;
    const created = await prisma.post.create({
      data: { content, authorId: req.userId!, parentId: parentId || undefined },
      select: { id: true, content: true, createdAt: true, author: true },
    });
    const a = (created as any).author || {};
    const post = {
      id: created.id,
      content: created.content,
      createdAt: created.createdAt,
      author: {
        id: a.id,
        username: a.username,
        discriminator: a.discriminator,
        verified: a.verified,
        badgeIcon: a.badgeIcon,
        avatarUrl: a.avatarUrl,
      },
    };
    // Emit notifications
    try {
      // Followed users' posts: notify all followers except self
      const followers = await prisma.follow.findMany({
        where: { followingId: req.userId! },
        select: { followerId: true },
      });
      if (followers.length) {
        await prisma.notification.createMany({
          data: followers
            .filter((f) => f.followerId !== req.userId)
            .map((f) => ({
              userId: f.followerId,
              actorId: req.userId!,
              type: NotificationType.FOLLOWED_POST,
              postId: created.id,
            })),
          skipDuplicates: true,
        });
      }
      // Reply: notify parent author
      if (parentId) {
        const parent = await prisma.post.findUnique({ where: { id: parentId }, select: { authorId: true } });
        if (parent && parent.authorId !== req.userId) {
          await prisma.notification.create({
            data: {
              userId: parent.authorId,
              actorId: req.userId!,
              type: NotificationType.REPLY,
              postId: created.id,
            },
          });
        }
      }
    } catch {}

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

    const found = await prisma.post.findMany({
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      select: { id: true, content: true, createdAt: true, author: true },
    });
    const items = (found as any[]).map((p) => ({
      id: p.id,
      content: p.content,
      createdAt: p.createdAt,
      author: {
        id: p.author?.id,
        username: p.author?.username,
        discriminator: p.author?.discriminator,
        verified: p.author?.verified,
        badgeIcon: p.author?.badgeIcon,
        avatarUrl: p.author?.avatarUrl,
      },
    }));

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
