import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
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
    const cookieHeader = request.headers.cookie;

    const authHeader = request.headers.authorization;
    
    const headers = new Headers();
    if (cookieHeader) headers.append('cookie', cookieHeader);
    if (authHeader) headers.append('authorization', authHeader);

    try {
      const response = await auth.api.getSession({
        headers: headers,
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
      console.error('SessionGuard error:', error);
      throw new InternalServerErrorException('Failed to validate session');
    }
  }
}
