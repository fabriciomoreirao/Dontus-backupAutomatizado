import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { S3Module as InfraS3Module } from './infra/s3/s3.module';
import { DatabaseInfraModule } from './infra/database/sql/sqlModule';
import { BackupModule } from './backup/backup.module';
import { ImporterModule } from './importer/importer.module';

@Module({
  imports: [InfraS3Module, DatabaseInfraModule, BackupModule, ImporterModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
