import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport } from '@nestjs/microservices';
import { join } from 'path';

async function bootstrap() {
  const port = process.env.PORT || 6001;
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'auth',
      protoPath: join(process.cwd(), 'proto/auth.proto'),
      url: `0.0.0.0:${port}`,
    },
  });

  console.log(`Auth service started on port ${port}`);

  await app.listen();
}
bootstrap();

