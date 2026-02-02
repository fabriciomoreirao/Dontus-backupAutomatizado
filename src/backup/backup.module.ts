import { Module, forwardRef } from '@nestjs/common';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';
import { BackupRepository } from './backup.repository';
import { DatabaseInfraModule } from '../infra/database/sql/sqlModule';
import { S3Module } from '../infra/s3/s3.module';
import { EmailService } from '../infra/email/email.service';
import { RabbitMQModule } from 'src/infra/rabbitmq/rabbitmq.module';

@Module({
  imports: [DatabaseInfraModule, S3Module, forwardRef(() => RabbitMQModule)],
  controllers: [BackupController],
  providers: [BackupService, BackupRepository, EmailService],
  exports: [BackupService],
})
export class BackupModule {}
