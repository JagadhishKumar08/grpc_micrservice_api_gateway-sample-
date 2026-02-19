import { Controller, Post, Body, Inject, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

interface AuthService {
  Login(data: { email: string }): any;
}

@Controller('auth')
export class AuthController implements OnModuleInit {
  private authService: AuthService;

  constructor(@Inject('AUTH_SERVICE') private client: ClientGrpc) {}

  onModuleInit() {
    this.authService =
      this.client.getService<AuthService>('AuthService');
  }

  @Post('login')
  async login(@Body() body: { email: string }) {
    return await lastValueFrom(
      this.authService.Login(body),
    );
  }
}
