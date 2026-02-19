import { OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
export declare class AuthController implements OnModuleInit {
    private client;
    private userService;
    constructor(client: ClientGrpc);
    onModuleInit(): void;
    login(data: {
        email: string;
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
