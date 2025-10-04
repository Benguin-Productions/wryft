import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const AuthService = {
  async register({ username, email, password }: { username: string; email: string; password: string }) {
    // email must be unique
    const emailExisting = await prisma.user.findUnique({ where: { email } });
    if (emailExisting) throw Object.assign(new Error('Email already in use'), { status: 409 });

    // Find the smallest available discriminator for this username
    const existingForUsername = await prisma.user.findMany({
      where: { username },
      select: { discriminator: true },
      orderBy: { discriminator: 'asc' }
    });
    let discriminator = 1;
    for (const u of existingForUsername) {
      if (u.discriminator === discriminator) discriminator++;
      else break;
      if (discriminator > 9999) throw Object.assign(new Error('Username is full'), { status: 409 });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { username, email, passwordHash, discriminator } });
    const token = sign(user.id);
    return { token, user: { id: user.id, username: user.username, email: user.email, discriminator: user.discriminator } };
  },

  async login({ email, password }: { email: string; password: string }) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw Object.assign(new Error('Invalid credentials'), { status: 401 });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw Object.assign(new Error('Invalid credentials'), { status: 401 });
    const token = sign(user.id);
    return { token, user: { id: user.id, username: user.username, email: user.email, discriminator: user.discriminator } };
  }
};

function sign(userId: string) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' });
}
