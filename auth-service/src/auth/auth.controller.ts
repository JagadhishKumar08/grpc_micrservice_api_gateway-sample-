import { Controller, Inject, OnModuleInit } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import type { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom, Observable } from 'rxjs';
import * as jwt from 'jsonwebtoken';

const SECRET = 'supersecret';

interface UserResponse {
  id: string;
  name: string;
  email: string;
}

interface UserService {
  FindUserByEmail(data: { email: string }): Observable<UserResponse>;
}

@Controller()
export class AuthController implements OnModuleInit {
  private userService: UserService;

  constructor(
    @Inject('USER_SERVICE') private client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.userService =
      this.client.getService<UserService>('UserService');
  }

  // 🔐 REAL LOGIN (Service-to-Service)
  @GrpcMethod('AuthService', 'Login')
  async login(data: { email: string }) {
    // SERVICE-TO-SERVICE gRPC CALL
    const user = await lastValueFrom(
      this.userService.FindUserByEmail({ email: data.email }),
    );

    // Because proto3 returns empty object, not null
    if (!user || !user.id) {
      throw new Error('User not found');
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      SECRET,
      { expiresIn: '1h' },
    );

    return { accessToken: token };
  }

  @GrpcMethod('AuthService', 'ValidateToken')
  validateToken(data: { token: string }) {
    try {
      const decoded = jwt.verify(data.token, SECRET) as any;

      return {
        userId: decoded.userId,
        isValid: true,
      };
    } catch (error) {
      return {
        userId: '',
        isValid: false,
      };
    }
  }
}
