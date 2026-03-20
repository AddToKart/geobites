import { CanActivate, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
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
export declare class SessionGuard implements CanActivate {
    canActivate(context: ExecutionContext): Promise<boolean>;
}
