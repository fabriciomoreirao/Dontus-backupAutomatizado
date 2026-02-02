import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { BackupService } from './backup.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { BackupRequestDto } from './dto';

@ApiSecurity('s3-api-key')
@UseGuards(AuthGuard)
@ApiTags('backup')
@Controller('backup')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post('export')
  @ApiOperation({
    summary: 'Exportar backup completo para Excel com configuração de banco dinâmica',
  })
  @ApiResponse({
    status: 200,
    description: 'Exportação iniciada em background',
  })
  async exportBackup(@Body() dto: BackupRequestDto) {
    return this.backupService.processBackupByClinica(
      dto.clinicaId,
      dto.email,
      dto.dbConfig,
      dto.bucketName,
      dto.s3Prefix,
    );
  }
}
