import { Controller, Inject, OnModuleInit } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import type { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom, Observable } from 'rxjs';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { RpcException } from '@nestjs/microservices';
import { RedisService } from '../redis/redis.service';
const CircuitBreaker = require('opossum');

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
  private userBreaker: any;
  private userService: UserService;

  constructor(
    @Inject('USER_SERVICE') private client: ClientGrpc,
    private readonly redisService: RedisService,
  ) {}

  onModuleInit() {
    this.userService =
      this.client.getService<UserService>('UserService');

    // Initialize circuit breaker for user service calls
    const options = {
      timeout: 3000, // 3 seconds
      errorThresholdPercentage: 50,
      resetTimeout: 10000, // 10 seconds
    };
    this.userBreaker = new CircuitBreaker(
      async (email: string) => {
        return await lastValueFrom(
          this.userService.FindUserByEmail({ email }),
        );
      },
      options,
    );

    this.userBreaker.on('open', () => 
      console.log('🚨 User Service circuit breaker opened')
    );
    this.userBreaker.on('halfOpen', () => 
      console.log('🔄 User Service circuit breaker half-open')
    );
    this.userBreaker.on('close', () => 
      console.log('✅ User Service circuit breaker closed')
    );
  }
@GrpcMethod('AuthService', 'Login')
async login(data: { email: string; password: string }) {
  if (!data.email) {
    throw new RpcException('Email is required');
  }

  if (!data.password) {
    throw new RpcException('Password is required');
  }

  const cacheKey = `user:${data.email}`;
  let user: UserResponse;

  // 🔎 1️⃣ Try Redis first
  const cachedUser = await this.redisService.get(cacheKey);

  if (cachedUser) {
    console.log('⚡ User fetched from Redis');
    user = JSON.parse(cachedUser);
  } else {
    console.log('🐘 Fetching user via Circuit Breaker');

    try {
      // 2️⃣ Call User service through Circuit Breaker
      user = await this.userBreaker.fire(data.email);
    } catch (error) {
      console.error('❌ User service unavailable');
      throw new RpcException(
        'User service temporarily unavailable',
      );
    }

    if (!user || !user.id) {
      throw new RpcException('User not found');
    }

    // 3️⃣ Cache result in Redis
    await this.redisService.set(
      cacheKey,
      JSON.stringify(user),
      60, // TTL 60 seconds
    );
  }

  if (!user.password) {
    throw new RpcException('User has no password set');
  }

  // 4️⃣ Validate password
  const isMatch = await bcrypt.compare(
    data.password,
    user.password,
  );

  if (!isMatch) {
    throw new RpcException('Invalid email or password');
  }

  // 5️⃣ Generate JWT
  const token = jwt.sign(
    { userId: user.id, email: user.email },
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
