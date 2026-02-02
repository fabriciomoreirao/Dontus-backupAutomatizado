import { Module } from '@nestjs/common';
import { DatabaseService } from './sql.service';

@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseInfraModule {}
