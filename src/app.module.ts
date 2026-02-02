import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { S3Module as InfraS3Module } from './infra/s3/s3.module';
import { RabbitMQModule } from './infra/rabbitmq/rabbitmq.module';
import { DatabaseInfraModule } from './infra/database/sql/sqlModule';
import { BackupModule } from './backup/backup.module';

@Module({
  imports: [InfraS3Module, DatabaseInfraModule, BackupModule, RabbitMQModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
