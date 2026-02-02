import { Injectable, OnModuleInit } from '@nestjs/common';
import { RabbitMQConsumer } from '../rabbitmq.consumer';
import { Logger } from '@nestjs/common';
import { BackupService } from 'src/backup/backup.service';
import { DatabaseConfig } from '../../database/sql/sql.service';
import { log } from 'console';

@Injectable()
export class BackupConsumer implements OnModuleInit {
  private readonly logger = new Logger(BackupConsumer.name);
  constructor(
    private readonly rabbitMQConsumer: RabbitMQConsumer,
    private readonly backupService: BackupService,
  ) {}

  async onModuleInit() {
    setTimeout(() => {
      this.rabbitMQConsumer.consume(
        'backupQueue',
        async (data: {
          clinicaId: number;
          email: string;
          dbConfig: DatabaseConfig;
          bucketName: string;
          s3Prefix?: string;
        }) => {
          try {
            this.logger.log(`📥 Recebida solicitação de backup para clinicaId: ${data.clinicaId}, email: ${data.email}`);
            await this.backupService.getBackupByClinica(
              data.clinicaId,
              data.email,
              data.dbConfig,
              data.bucketName,
              data.s3Prefix,
            );
          } catch (err) {
            this.logger.error('Erro ao processar backup:', err);
          }
        },
      );
    }, 1500);
  }
}
