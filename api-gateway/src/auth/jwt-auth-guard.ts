import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
  OnModuleInit,
} from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom, Observable } from 'rxjs';

interface ValidateTokenResponse {
  isValid: boolean;
  userId?: string;
}

interface AuthService {
  ValidateToken(data: { token: string }): Observable<ValidateTokenResponse>;
}

@Injectable()
export class JwtAuthGuard implements CanActivate, OnModuleInit {
  private authService: AuthService;

  constructor(
    @Inject('AUTH_SERVICE') private client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.authService =
      this.client.getService<AuthService>('AuthService');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.replace('Bearer ', '');

    const response:ValidateTokenResponse = await lastValueFrom(
      this.authService.ValidateToken({ token }),
    );

    if (!response.isValid) {
      throw new UnauthorizedException('Invalid token');
    }

    // attach user to request (important for future)
    request.user = response.userId;

    return true;
  }
}
