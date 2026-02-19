import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { status } from '@grpc/grpc-js';
import * as bcrypt from 'bcrypt';

@Controller()
export class UsersController {
  constructor(private prisma: PrismaService) {}

@GrpcMethod('UserService', 'CreateUser')
async createUser(data: { name: string; email: string; password: string }) {
  try {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    return await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
      },
    });
  } catch (error) {
    // 🔥 Handle duplicate email (VERY IMPORTANT)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new RpcException({
        code: status.ALREADY_EXISTS, // 🔥 KEY LINE
        message: 'Email already exists',
        });
      }
    }

    throw new RpcException({
    code: status.INTERNAL,
    message: 'Failed to create user',
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
  async findUserByEmail(data: { email: string }) {
  const user = await this.prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    return { id: '', name: '', email: '', password: '' };
  }
  return user;
}
}
