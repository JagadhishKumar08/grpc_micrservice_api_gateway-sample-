import { OnModuleDestroy } from '@nestjs/common';
export declare class RedisService implements OnModuleDestroy {
    private readonly client;
    constructor();
    set(key: string, value: string, ttl?: number): Promise<"OK">;
    get(key: string): Promise<string | null>;
    del(key: string): Promise<number>;
    onModuleDestroy(): Promise<void>;
}
