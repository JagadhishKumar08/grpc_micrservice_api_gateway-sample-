import { Controller, Get, Post, Body, Param, Inject } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { OnModuleInit } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { CreateUserDto } from './dto/create-user.dto';
import { HttpException, HttpStatus } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth-guard';



interface UserService {
  CreateUser(data: { name: string; email: string; password: string }): any;
  GetUserById(data: { id: string }): any;
  GetUsers(data: {}): any;
}

@Controller('users')
export class UsersController implements OnModuleInit {
  private userService: UserService;

  constructor(@Inject('USER_SERVICE') private client: ClientGrpc) {}

  onModuleInit() {
    this.userService =
      this.client.getService<UserService>('UserService');
  }

@Post()
async createUser(@Body() body: any) {
  return lastValueFrom(
    this.userService.CreateUser(body),
  );
}


@Get()
@UseGuards(JwtAuthGuard)
async getUsers() {
  return await lastValueFrom(
    this.userService.GetUsers({}),
  );
}

@Get(':id')
@UseGuards(JwtAuthGuard)
async getUser(@Param('id') id: string) {
  return await lastValueFrom(
    this.userService.GetUserById({ id }),
  );
}

}
