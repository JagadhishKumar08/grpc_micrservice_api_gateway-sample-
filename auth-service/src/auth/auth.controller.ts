import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import * as jwt from 'jsonwebtoken';

const SECRET = 'supersecret';

@Controller()
export class AuthController {

  @GrpcMethod('AuthService', 'Login')
  login(data: { email: string }) {
    // For now: fake login (later we connect DB)
    const token = jwt.sign(
      { userId: data.email },
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
