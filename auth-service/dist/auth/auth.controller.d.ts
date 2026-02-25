import { OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { RedisService } from '../redis/redis.service';
export declare class AuthController implements OnModuleInit {
    private client;
    private readonly redisService;
    private userBreaker;
    private userService;
    constructor(client: ClientGrpc, redisService: RedisService);
    onModuleInit(): void;
    login(data: {
        email: string;
        password: string;
    }): Promise<{
        accessToken: string;
    }>;
    validateToken(data: {
        token: string;
    }): {
        userId: any;
        isValid: boolean;
    };
}
