import * as dotenv from 'dotenv';
import { Logger } from '@nestjs/common';

dotenv.config();
const logger = new Logger('Environment');

export class EnvironmentValidator {
  static validate(): void {
    logger.log('🔍 Validando variáveis de ambiente...');

    const requiredVars = [
      'PORT',
      'NODE_ENV',
      'S3_API_SECRET_KEY',
      'DB_SERVER',
      'DB_DATABASE',
      'DB_USER',
      'DB_PASSWORD',
      'SMTP_HOST',
      'SMTP_PORT',
      'SMTP_USER',
      'SMTP_PASS',
      'EMAIL_FROM',
    ];

    const missingVars: string[] = [];

    requiredVars.forEach(envVar => {
      if (!process.env[envVar]) {
        missingVars.push(envVar);
      }
    });

    if (missingVars.length > 0) {
      const errorMessage = `❌ Variáveis obrigatórias não encontradas: ${missingVars.join(', ')}`;
      logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    logger.log('✅ Variáveis de ambiente validadas!');
    this.logConfig();
  }

  private static logConfig(): void {
    logger.log('🔧 Configuração:');
    logger.log(`  🚀 Porta: ${process.env.PORT}`);
    logger.log(`  🌍 Ambiente: ${process.env.NODE_ENV}`);
  }
}
