import {
  Catch,
  ArgumentsHost,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class GrpcExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    console.log('FULL EXCEPTION:', exception);
    // 🔥 FIX: read code from both locations
    const grpcCode = exception?.code || exception?.response?.code;

    const message =
      exception?.response?.message ||
      exception?.details ||
      exception?.message ||
      'Internal server error';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;

    switch (grpcCode) {
      case 3: // INVALID_ARGUMENT
        status = HttpStatus.BAD_REQUEST;
        break;
      case 5: // NOT_FOUND
        status = HttpStatus.NOT_FOUND;
        break;
      case 6: // ALREADY_EXISTS
        status = HttpStatus.CONFLICT;
        break;
      case 16: // UNAUTHENTICATED
        status = HttpStatus.UNAUTHORIZED;
        break;
      default:
        status = HttpStatus.INTERNAL_SERVER_ERROR;
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: 'Microservice Error',
    });
  }
}
