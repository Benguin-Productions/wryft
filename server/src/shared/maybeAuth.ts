import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Optional auth: sets req.userId if a valid Bearer token is present; never errors.
export function maybeAuth(req: Request & { userId?: string }, _res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'devsecret') as { sub: string };
    req.userId = payload.sub;
  } catch {
    // ignore invalid token
  }
  next();
}
