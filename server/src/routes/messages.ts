import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth } from '../shared/requireAuth';
import { encryptAesGcm, decryptAesGcm } from '../shared/crypto';

const prisma = new PrismaClient();
const router = Router();

const listSchema = z.object({
  conversationId: z.string(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(30),
});

const createSchema = z.object({
  conversationId: z.string(),
  content: z.string().min(1).max(8000),
});

// GET /api/conversations/:id/messages?cursor=&limit=
router.get('/conversations/:id/messages', requireAuth, async (req: any, res, next) => {
  try {
    const parsed = listSchema.safeParse({
      conversationId: req.params.id,
      cursor: (req.query?.cursor as string | undefined) || undefined,
      limit: (req.query?.limit as any) || undefined,
    });
    if (!parsed.success) return res.status(400).json({ error: 'Invalid query' });
    const { conversationId, cursor, limit } = parsed.data;

    // Ensure user is a participant
    const isMember = await prisma.conversationParticipant.findFirst({ where: { conversationId, userId: req.userId } });
    if (!isMember) return res.status(403).json({ error: 'Forbidden' });

    const rows = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: String(cursor) }, skip: 1 } : {}),
    });

    const items = rows.slice(0, limit).map((m) => {
      const pt = decryptAesGcm({ ct: Buffer.from(m.bodyCt), iv: Buffer.from(m.bodyIv), tag: Buffer.from(m.bodyTag) }).toString('utf8');
      return { id: m.id, conversationId: m.conversationId, senderUserId: m.senderUserId, createdAt: m.createdAt, content: pt, hasAttachments: m.hasAttachments };
    });

    let nextCursor: string | null = null;
    if (rows.length > limit) nextCursor = rows[limit].id;

    res.json({ items, nextCursor });
  } catch (e) {
    next(e);
  }
});

// POST /api/messages
router.post('/messages', requireAuth, async (req: any, res, next) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid body' });
    const { conversationId, content } = parsed.data;

    const isMember = await prisma.conversationParticipant.findFirst({ where: { conversationId, userId: req.userId } });
    if (!isMember) return res.status(403).json({ error: 'Forbidden' });

    const enc = encryptAesGcm(content);
    const msg = await prisma.message.create({
      data: {
        conversationId,
        senderUserId: req.userId,
        bodyCt: enc.ct,
        bodyIv: enc.iv,
        bodyTag: enc.tag,
        bodyAlgo: enc.algo,
        hasAttachments: false,
      },
      select: { id: true, createdAt: true },
    });

    // bump conversation updatedAt
    await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });

    res.json({ id: msg.id, createdAt: msg.createdAt });
  } catch (e) {
    next(e);
  }
});

export default router;
