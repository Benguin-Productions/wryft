import { Request, Response, NextFunction } from 'express';

// Admin functionality removed for now. If this middleware is invoked, return 404.
export function requireAdmin(_req: Request, res: Response, _next: NextFunction) {
  return res.status(404).json({ error: 'Not Found' });
}
