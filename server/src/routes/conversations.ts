import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth } from '../shared/requireAuth';

const prisma = new PrismaClient();
const router = Router();

const listSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
});

// GET /api/conversations?cursor=&limit=
router.get('/', requireAuth, async (req: any, res, next) => {
  try {
    const parsed = listSchema.safeParse({
      cursor: (req.query?.cursor as string | undefined) || undefined,
      limit: (req.query?.limit as any) || undefined,
    });
    if (!parsed.success) return res.status(400).json({ error: 'Invalid query' });
    const { cursor, limit } = parsed.data;

    const parts = await prisma.conversationParticipant.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: String(cursor) }, skip: 1 } : {}),
      select: {
        id: true,
        conversationId: true,
        userId: true,
        createdAt: true,
        lastReadMsgId: true,
        conversation: {
          select: {
            id: true,
            updatedAt: true,
            participants: {
              select: {
                userId: true,
                user: { select: { id: true, username: true, discriminator: true, avatarUrl: true } },
              },
            },
          },
        },
      },
    });

    let nextCursor: string | null = null;
    if (parts.length > limit) {
      nextCursor = parts[limit].id;
    }

    // Normalize response
    const items = parts.slice(0, limit).map((p) => ({
      id: p.conversationId,
      updatedAt: p.conversation?.updatedAt,
      participants: (p.conversation?.participants || []).map((cp) => ({
        user: cp.user,
      })),
      lastReadMsgId: p.lastReadMsgId,
    }));

    res.json({ items, nextCursor });
  } catch (e) {
    next(e);
  }
});

const createSchema = z.object({
  // Accept one of:
  // - userId
  // - username + disc
  // - target string like "username#1234"
  // - username alone (must be unique in DB)
  userId: z.string().optional(),
  username: z.string().optional(),
  disc: z.coerce.number().min(1).max(9999).optional(),
  target: z.string().optional(),
}).refine((d) => !!d.userId || !!d.target || !!d.username, { message: 'Provide userId or target or username' });

// POST /api/conversations
router.post('/', requireAuth, async (req: any, res, next) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid body' });
    const { userId, username, disc, target } = parsed.data as any;

    // Resolve target id
    let targetId = userId as string | undefined;
    let uname: string | undefined = username;
    let dnum: number | undefined = disc;
    // Parse target string if provided
    if (!targetId && target && typeof target === 'string') {
      const m = target.match(/^([^#]+)#(\d{1,4})$/);
      if (m) {
        uname = m[1];
        dnum = Number(m[2]);
      } else {
        uname = target;
      }
    }
    if (!targetId) {
      if (uname && typeof dnum === 'number') {
        const u = await prisma.user.findFirst({ where: { username: uname, discriminator: dnum }, select: { id: true } });
        if (!u) return res.status(404).json({ error: 'User not found' });
        targetId = u.id;
      } else if (uname) {
        // username only: must be unique
        const users = await prisma.user.findMany({ where: { username: uname }, select: { id: true }, take: 2 });
        if (users.length === 0) return res.status(404).json({ error: 'User not found' });
        if (users.length > 1) return res.status(409).json({ error: 'Username not unique; provide discriminator' });
        targetId = users[0].id;
      }
    }

    if (targetId === req.userId) return res.status(400).json({ error: 'Cannot DM yourself' });

    // Check existing one-on-one
    const existing = await prisma.conversationParticipant.findMany({
      where: { userId: { in: [req.userId!, targetId] } },
      select: { conversationId: true, userId: true },
    });
    const counts = new Map<string, number>();
    for (const row of existing) counts.set(row.conversationId, (counts.get(row.conversationId) || 0) + 1);
    const convoId = Array.from(counts.entries()).find(([, c]) => c === 2)?.[0];

    let conversationId = convoId;
    if (!conversationId) {
      const created = await prisma.conversation.create({ data: {} , select: { id: true } });
      conversationId = created.id;
      await prisma.conversationParticipant.createMany({
        data: [
          { conversationId, userId: req.userId! },
          { conversationId, userId: targetId },
        ],
        skipDuplicates: true,
      });
    }

    res.status(201).json({ id: conversationId });
  } catch (e) {
    next(e);
  }
});

// POST /api/conversations/:id/read
router.post('/:id/read', requireAuth, async (req: any, res, next) => {
  try {
    const conversationId = req.params.id as string;

    const isMember = await prisma.conversationParticipant.findFirst({ where: { conversationId, userId: req.userId } });
    if (!isMember) return res.status(403).json({ error: 'Forbidden' });

    const last = await prisma.message.findFirst({ where: { conversationId }, orderBy: { createdAt: 'desc' }, select: { id: true } });

    if (last) {
      await prisma.conversationParticipant.updateMany({
        where: { conversationId, userId: req.userId! },
        data: { lastReadMsgId: last.id },
      });
    }

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
