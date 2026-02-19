import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { PrismaService } from '../../prisma/prisma.service';

@Controller()
export class UsersController {
  constructor(private prisma: PrismaService) {}

@GrpcMethod('UserService', 'CreateUser')
async createUser(data: { name: string; email: string }) {
  try {
    return await this.prisma.user.create({ data });
  } catch (error: any) {
    console.log('PRISMA ERROR:', error);

    if (error.code === 'P2002') {
      throw new RpcException({
        status: 409,
        message: 'Email already exists',
      });
    }

    throw new RpcException({
      status: 500,
      message: 'Internal server error',
    });
  }
}


  @GrpcMethod('UserService', 'GetUserById')
  async getUserById(data: { id: string }) {
    return this.prisma.user.findUnique({
      where: { id: data.id },
    });
  }

  @GrpcMethod('UserService', 'GetUsers')
  async getUsers() {
    const users = await this.prisma.user.findMany();
    return { users };
  }

  @GrpcMethod('UserService','FindUserByEmail')
  async findUserByEmail(data:{email:string}){
    const user = await this.prisma.user.findUnique({where:{email:data.email},
    });
    if(!user){
      return {
        id:'',
        name:'',
        email:''
      };
    }

    return user;
  }
}
