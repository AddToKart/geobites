import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { auth } from '../../auth/auth';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role?: string;
}

export interface RequestWithSession extends Request {
  user?: SessionUser;
  session?: {
    id: string;
    userId: string;
    expiresAt: Date;
  };
}

@Injectable()
export class SessionGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithSession>();

    // Build headers for Better Auth session lookup.
    // Flutter mobile sends the session token as Authorization: Bearer <token>
    // Web browser sends it as a cookie. We support both.
    const authHeader = request.headers.authorization;
    const cookieHeader = request.headers.cookie;

    const headersMap: Record<string, string> = {};

    if (authHeader?.startsWith('Bearer ')) {
      // Reconstruct cookie header from Bearer token so Better Auth can validate it
      const token = authHeader.slice(7);
      const existingCookie = cookieHeader ? `${cookieHeader}; ` : '';
      headersMap['cookie'] = `${existingCookie}better-auth.session_token=${token}`;
    } else if (cookieHeader) {
      headersMap['cookie'] = cookieHeader;
    }

    try {
      const response = await auth.api.getSession({
        headers: new Headers(
          Object.keys(headersMap).length > 0 ? headersMap : undefined,
        ),
      });

      const currentSession = response?.session;
      const currentUser = response?.user;

      if (!currentSession || !currentUser) {
        throw new UnauthorizedException('Authentication required');
      }

      request.session = {
        id: currentSession.id,
        userId: currentSession.userId,
        expiresAt: new Date(currentSession.expiresAt),
      };
      request.user = {
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.name,
        role:
          typeof currentUser.role === 'string' ? currentUser.role : undefined,
      };

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.warn('SessionGuard validation failure:', error);
      throw new UnauthorizedException('Invalid session or session expired');
    }
  }
}
