import { Controller, Get, Post, Body, Param, Inject } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { OnModuleInit } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { CreateUserDto } from './dto/create-user.dto';
import { HttpException, HttpStatus } from '@nestjs/common';


interface UserService {
  CreateUser(data: { name: string; email: string }): any;
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
async createUser(@Body() body: CreateUserDto) {
  try {
    return await lastValueFrom(
      this.userService.CreateUser(body),
    );
  } catch (error: any) {
  console.log('GATEWAY ERROR:', error);

  if (error.details === 'Email already exists') {
    throw new HttpException(
      'Email already exists',
      HttpStatus.CONFLICT,
    );
  }

  throw new HttpException(
    'Internal server error',
    HttpStatus.INTERNAL_SERVER_ERROR,
  );
}
}

@Get()
async getUsers() {
  return await lastValueFrom(
    this.userService.GetUsers({}),
  );
}

@Get(':id')
async getUser(@Param('id') id: string) {
  return await lastValueFrom(
    this.userService.GetUserById({ id }),
  );
}

}
