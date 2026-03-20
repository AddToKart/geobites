import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestWithSession } from '../guards/session.guard';

export const CurrentUser = createParamDecorator(
  (property: string | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<RequestWithSession>();
    const user = request.user;

    if (!user) {
      return null;
    }

    if (!property) {
      return user;
    }

    return user[property as keyof typeof user];
  },
);
