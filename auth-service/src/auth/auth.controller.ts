import { Controller, Inject, OnModuleInit } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import type { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom, Observable } from 'rxjs';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { RpcException } from '@nestjs/microservices';


const SECRET = 'supersecret';

interface UserResponse {
  id: string;
  name: string;
  email: string;
  password: string;
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
  @GrpcMethod('AuthService', 'Login')
async login(data: { email: string; password: string }) {
  if (!data.email) {
    throw new RpcException('Email is required');
  }

  if (!data.password) {
    throw new RpcException('Password is required');
  }

  const user = await lastValueFrom(
    this.userService.FindUserByEmail({ email: data.email }),
  );

  if (!user || !user.id) {
    throw new RpcException('User not found');
  }

  if (!user.password) {
    throw new RpcException('User has no password set');
  }

  const isMatch = await bcrypt.compare(
    data.password,
    user.password,
  );

  if (!isMatch) {
    throw new RpcException('Invalid email or password');
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    'supersecret',
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
