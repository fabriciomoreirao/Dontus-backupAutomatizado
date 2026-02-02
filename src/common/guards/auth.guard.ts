import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['s3-api-key'];

    console.log('API Key recebida:', apiKey);
    try {
      if (!apiKey) {
        throw new UnauthorizedException('API Key não fornecida');
      }
      if (apiKey !== process.env.S3_API_SECRET_KEY) {
        throw new UnauthorizedException('API Key inválida');
      }
      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException('Erro durante autenticação');
    }
  }
}
