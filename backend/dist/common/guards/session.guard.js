"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionGuard = void 0;
const common_1 = require("@nestjs/common");
const auth_1 = require("../../auth/auth");
let SessionGuard = class SessionGuard {
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const cookieHeader = request.headers.cookie;
        try {
            const response = await auth_1.auth.api.getSession({
                headers: new Headers(cookieHeader
                    ? {
                        cookie: cookieHeader,
                    }
                    : undefined),
            });
            const currentSession = response?.session;
            const currentUser = response?.user;
            if (!currentSession || !currentUser) {
                throw new common_1.UnauthorizedException('Authentication required');
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
                role: typeof currentUser.role === 'string' ? currentUser.role : undefined,
            };
            return true;
        }
        catch (error) {
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            console.error('SessionGuard error:', error);
            throw new common_1.InternalServerErrorException('Failed to validate session');
        }
    }
};
exports.SessionGuard = SessionGuard;
exports.SessionGuard = SessionGuard = __decorate([
    (0, common_1.Injectable)()
], SessionGuard);
//# sourceMappingURL=session.guard.js.map