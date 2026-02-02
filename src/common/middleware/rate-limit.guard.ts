import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { Observable } from 'rxjs';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private rateLimiter = new RateLimiterMemory({
    points: 500, // 500 requisições
    duration: 60, // por minuto
    blockDuration: 300, // 5 minutos
  });

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();

    return this.rateLimiter
      .consume(request.ip)
      .then(() => true)
      .catch(() => false);
  }
}
