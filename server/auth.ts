import { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import { db } from './db.js';

export interface UserSession {
  token: string;
  userId: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  fullName: string;
  createdAt: number;
}

// In-memory token store mapped to sessions
const activeSessions = new Map<string, UserSession>();

export function createSession(userId: string, email: string, role: 'patient' | 'doctor' | 'admin', fullName: string): string {
  const token = `mc_${crypto.randomUUID().replace(/-/g, '')}_${Date.now()}`;
  activeSessions.set(token, {
    token,
    userId,
    email,
    role,
    fullName,
    createdAt: Date.now()
  });
  return token;
}

export function getSession(token: string): UserSession | undefined {
  if (!token) return undefined;
  return activeSessions.get(token);
}

export function removeSession(token: string): void {
  activeSessions.delete(token);
}

// Extended Express Request
export interface AuthenticatedRequest extends Request {
  user?: UserSession;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const session = getSession(token);

  if (!session) {
    res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
    return;
  }

  req.user = session;
  next();
}

export function optionalAuthenticate(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const session = getSession(token);
    if (session) {
      req.user = session;
    }
  }
  next();
}

export function requireRole(allowedRoles: Array<'patient' | 'doctor' | 'admin'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ 
        error: `Access denied. Requires role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}` 
      });
      return;
    }

    next();
  };
}

export function logAudit(
  req: AuthenticatedRequest,
  action: string,
  resourceType: string,
  resourceId: string | null = null,
  details: string = ''
): void {
  try {
    const id = `audit-${crypto.randomUUID()}`;
    const userId = req.user?.userId || null;
    const userEmail = req.user?.email || 'unauthenticated';
    const role = req.user?.role || 'guest';
    const ip = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '127.0.0.1';

    db.prepare(`
      INSERT INTO audit_logs (id, user_id, user_email, role, action, resource_type, resource_id, ip_address, details)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, userEmail, role, action, resourceType, resourceId, ip, details);
  } catch (err) {
    console.error('Audit log failure:', err);
  }
}
