import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth } from '../shared/requireAuth';
import { validate } from '../shared/validate';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const router = Router();

// GET /api/users/:username - basic profile
router.get('/:username', async (req, res, next) => {
  try {
    const { username } = req.params;
    const user = await prisma.user.findFirst({ where: { username } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { id, username: uname, discriminator, bio, createdAt, avatarUrl, bannerUrl } = user as any;
    const verified = uname === 'benguin' && discriminator === 1;
    res.json({ id, username: uname, discriminator, bio, createdAt, avatarUrl, bannerUrl, verified });
  } catch (e) {
    next(e);
  }
});

// PATCH /api/users/me - update own profile (bio only for now)
const updateMeSchema = z.object({
  bio: z.string().max(280).optional(),
  location: z.string().max(80).optional(),
});

router.patch('/me', requireAuth, validate(updateMeSchema), async (req: any, res, next) => {
  try {
    const { bio, location } = req.body as { bio?: string; location?: string };
    const updated = await prisma.user.update({
      where: { id: req.userId },
      data: { bio: bio ?? null },
      select: { id: true, username: true, discriminator: true, bio: true, createdAt: true },
    });
    const verified = updated.username === 'benguin' && updated.discriminator === 1;
    res.json({ ...updated, verified });
  } catch (e) {
    next(e);
  }
});

// Helpers for saving base64 images
function ensureUploadsDir() {
  const dir = path.join(__dirname, '..', '..', 'public', 'uploads');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

const dataUrlSchema = z.object({ dataUrl: z.string().min(1) });

function parseDataUrl(dataUrl: string) {
  const match = /^data:(.*?);base64,(.*)$/.exec(dataUrl);
  if (!match) return null;
  const mime = match[1] || 'application/octet-stream';
  const base64 = match[2];
  const buf = Buffer.from(base64, 'base64');
  let ext = 'bin';
  if (mime.includes('png')) ext = 'png';
  else if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';
  else if (mime.includes('webp')) ext = 'webp';
  return { buf, ext };
}

// PATCH /api/users/me/avatar - upload avatar via dataUrl
router.patch('/me/avatar', requireAuth, validate(dataUrlSchema), async (req: any, res, next) => {
  try {
    const { dataUrl } = req.body as { dataUrl: string };
    const parsed = parseDataUrl(dataUrl);
    if (!parsed) return res.status(400).json({ error: 'Invalid dataUrl' });
    const uploadsDir = ensureUploadsDir();
    const filename = `avatar_${req.userId}_${Date.now()}.${parsed.ext}`;
    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, parsed.buf);
    const url = `/static/uploads/${filename}`;
    const updated = await prisma.user.update({
      where: { id: req.userId },
      data: { avatarUrl: url },
      select: { id: true, username: true, discriminator: true, bio: true, createdAt: true },
    });
    const verified = updated.username === 'benguin' && updated.discriminator === 1;
    res.json({ ...updated, avatarUrl: url, verified });
  } catch (e) {
    next(e);
  }
});

// PATCH /api/users/me/banner - upload banner via dataUrl
router.patch('/me/banner', requireAuth, validate(dataUrlSchema), async (req: any, res, next) => {
  try {
    const { dataUrl } = req.body as { dataUrl: string };
    const parsed = parseDataUrl(dataUrl);
    if (!parsed) return res.status(400).json({ error: 'Invalid dataUrl' });
    const uploadsDir = ensureUploadsDir();
    const filename = `banner_${req.userId}_${Date.now()}.${parsed.ext}`;
    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, parsed.buf);
    const url = `/static/uploads/${filename}`;
    const updated = await prisma.user.update({
      where: { id: req.userId },
      data: { bannerUrl: url },
      select: { id: true, username: true, discriminator: true, bio: true, createdAt: true },
    });
    const verified = updated.username === 'benguin' && updated.discriminator === 1;
    res.json({ ...updated, bannerUrl: url, verified });
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

    const found = await prisma.post.findMany({
      where: { authorId: user.id },
      take: take + 1,
      ...(cursor ? { cursor: { id: String(cursor) }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      select: { id: true, content: true, createdAt: true, author: true },
    });

    const withBadges = (found as any[]).map((p) => ({
      id: p.id,
      content: p.content,
      createdAt: p.createdAt,
      author: {
        id: p.author?.id,
        username: p.author?.username,
        discriminator: p.author?.discriminator,
        avatarUrl: p.author?.avatarUrl,
        verified: p.author?.username === 'benguin' && p.author?.discriminator === 1,
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
