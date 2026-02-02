import { Module, Global, forwardRef } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { RabbitMQConsumer } from './rabbitmq.consumer';
import { RabbitMQConnection } from './rabbitmq.connection';
import { BackupConsumer } from './consumers/backup';
import { BackupModule } from 'src/backup/backup.module';

@Global()
@Module({
  providers: [RabbitMQService, RabbitMQConsumer, RabbitMQConnection, BackupConsumer],
  exports: [RabbitMQService, RabbitMQConsumer, BackupConsumer],
  imports: [forwardRef(() => BackupModule)],
})
export class RabbitMQModule {}
