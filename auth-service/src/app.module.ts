import { Module } from '@nestjs/common';
import { AuthController } from './auth/auth.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';

@Module({
  imports: [ClientsModule.register([
    {
      name:'USER_SERVICE',
      transport:Transport.GRPC,
      options:{
        package:'user',
        protoPath: join(process.cwd(),'proto/user.proto'),
        url:'localhost:50051'
      }
    }
  ])
],
  controllers: [AuthController],
})
export class AppModule {}
