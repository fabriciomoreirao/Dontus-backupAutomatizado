import { Injectable, Logger } from '@nestjs/common';
import { BackupRepository } from './backup.repository';
import { DatabaseConfig } from '../infra/database/sql/sql.service';
import { S3Service } from '../infra/s3/s3.service';
import { EmailService } from '../infra/email/email.service';
import * as ExcelJS from 'exceljs';
import { CustomException } from '../common/exceptions/custom.exception';
import * as interfaces from '../common/interfaces';
import { createWriteStream } from 'fs';
import { mkdir, rename, rm } from 'fs/promises';
import { homedir } from 'os';
import { basename, join } from 'path';
import { PassThrough } from 'stream';
import { pipeline } from 'stream/promises';
import { subHours } from 'date-fns';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  constructor(
    private readonly backupRepository: BackupRepository,
    private readonly s3Service: S3Service,
    private readonly emailService: EmailService,
  ) {}

  async processBackupByClinica(
    clinicaId: number,
    email: string,
    dbConfig: DatabaseConfig,
    bucketName: string,
    s3Prefix?: string,
    importarImagens?: boolean,
  ) {
    return this.getBackupByClinica(
      clinicaId,
      email,
      dbConfig,
      bucketName,
      s3Prefix,
      importarImagens,
    );
  }

  async getBackupByClinica(
    clinicaId: number,
    email: string,
    dbConfig: DatabaseConfig,
    bucketName: string,
    s3Prefix?: string,
    importarImagens?: boolean,
  ) {
    try {
      this.logger.log(`🔄 Iniciando backup completo da clínica ${clinicaId}...`);

      const response = {
        success: true,
        message: 'Backup completo iniciado em background',
        clinicaId,
        email,
        bucketName,
        s3Prefix: s3Prefix || '',
        dbServer: dbConfig.server,
        dbDatabase: dbConfig.database,
      };

      this.processBackupCompleto(clinicaId, email, dbConfig, bucketName, s3Prefix, importarImagens);

      return response;
    } catch (error) {
      this.logger.error(`❌ Erro ao iniciar backup: ${error.message}`);
    }
  }

  private async processBackupCompleto(
    clinicaId: number,
    email: string,
    dbConfig: DatabaseConfig,
    bucketName: string,
    s3Prefix?: string,
    importarImagens?: boolean,
  ) {
    try {
      this.logger.log('\n🔍 Iniciando backup sequencial (uma tabela por vez)...');

      // Criar stream do Excel ANTES de começar
      const excelStream = await this.generateExcelSequential(clinicaId, dbConfig, importarImagens);
      let imagensPacientes: interfaces.ImagemPaciente[] | undefined;
      if (importarImagens) {
        // Buscar apenas as imagens para processar depois
        imagensPacientes = await this.backupRepository.backupImagensPacientes(clinicaId, dbConfig);
        this.logger.log(`📊 Imagens: ${imagensPacientes.length}`);
      }

      // Faz upload do Excel e processa imagens
      await this.uploadToS3(
        excelStream,
        email,
        clinicaId,
        bucketName,
        dbConfig.database,
        s3Prefix,
        imagensPacientes,
        importarImagens,
      );

      this.logger.log('\n✅ Backup completo concluído com sucesso!');
    } catch (error) {
      this.logger.error(`❌ Erro no backup completo: ${error.message}`);
    }
  }

  private async generateExcelSequential(
    clinicaId: number,
    dbConfig: DatabaseConfig,
    importarImagens?: boolean,
  ): Promise<PassThrough> {
    try {
      this.logger.log('\n📝 Gerando Excel sequencial (STREAMING)...');

      const passThroughStream = new PassThrough();

      const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
        stream: passThroughStream,
        useStyles: true,
        useSharedStrings: true,
      });

      const tablesToProcess = [
        { name: 'Pacientes', method: 'backupPacientes' },
        { name: 'Origem Pacientes', method: 'backupOrigemPacientes' },
        { name: 'Imagens', method: 'backupImagensPacientes' },
        { name: 'Agendamentos', method: 'backupAgendamentos' },
        { name: 'Atendimentos Orto', method: 'backupAtendimentosRealizadosOrto' },
        { name: 'Atendimentos', method: 'backupAtendimentosRealizados' },
        { name: 'Contas Recebidas', method: 'backupContasRecebidas' },
        { name: 'Lançamentos Futuros', method: 'backupLancamentosFuturos' },
        { name: 'Contas Rec. Lanç.', method: 'backupContasRecebidasLancamentosFuturos' },
        { name: 'Proc. Orçamento', method: 'backupProcedimentosOrcamento' },
        { name: 'Proc. Conta Avulsa e Orto', method: 'backupProcedimentosContaAvulsaEOrto' },
        { name: 'Orçamentos', method: 'backupOrcamentos' },
        { name: 'Orto', method: 'backupOrto' },
        { name: 'Retornos', method: 'backupRetornos' },
        { name: 'Contas Pagas', method: 'backupContasPagas' },
        { name: 'Contas a Pagar', method: 'backupContasAPagar' },
      ];

      (async () => {
        try {
          for (const table of tablesToProcess) {
            this.logger.log(`🔍 Processando tabela: ${table.name}...`);

            if (!importarImagens && table.name === 'Imagens') {
              this.logger.log(
                `⚠️ Aba "${table.name}" pulada porque importarImagens está desativado.`,
              );
              continue;
            }

            const data = await this.backupRepository[table.method](clinicaId, dbConfig);

            this.logger.log(`📊 ${table.name}: ${data.length} registros`);

            if (!data || data.length === 0) {
              this.logger.log(`⚠️ Aba "${table.name}" vazia, pulando...`);
              continue;
            }

            // Cria a aba no Excel
            const worksheet = workbook.addWorksheet(table.name, {
              views: [{ state: 'frozen', ySplit: 1 }],
            });

            const headers = Object.keys(data[0]);

            // Header
            const headerRow = worksheet.addRow(headers);
            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            headerRow.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FF4472C4' },
            };
            headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
            headerRow.commit();

            // Largura das colunas
            headers.forEach((header, index) => {
              const column = worksheet.getColumn(index + 1);
              column.width = Math.max(header.length + 2, 15);
            });

            // Filtro
            worksheet.autoFilter = {
              from: { row: 1, column: 1 },
              to: { row: 1, column: headers.length },
            };

            // Adiciona os dados linha por linha
            for (const row of data) {
              const excelRow = worksheet.addRow(headers.map(h => row[h]));

              headers.forEach((header, index) => {
                const value = row[header];

                if (value instanceof Date) {
                  excelRow.getCell(index + 1).numFmt = 'dd/mm/yyyy hh:mm';
                }
              });

              excelRow.commit();
            }

            worksheet.commit();

            this.logger.log(`✅ Aba "${table.name}" criada com ${data.length} registros`);

            // Limpa os dados da memória
            data.length = 0;
          }

          await workbook.commit();
          this.logger.log('✅ Excel finalizado com sucesso (streaming sequencial)');
        } catch (error) {
          this.logger.error(`❌ Erro ao gerar Excel: ${error.message}`);
          passThroughStream.destroy(error);
        }
      })();

      return passThroughStream;
    } catch (error) {
      this.logger.error(`❌ Erro ao gerar Excel: ${error.message}`);
      throw new CustomException('Erro ao gerar arquivo Excel', 500);
    }
  }

  private async uploadToS3(
    excelStream: PassThrough,
    email: string,
    clinicaId: number,
    bucketName: string,
    database: string,
    s3Prefix?: string,
    imagensPacientes?: interfaces.ImagemPaciente[] | undefined,
    importarImagens?: boolean,
  ): Promise<void> {
    try {
      this.logger.log('\n☁️ Preparando upload para S3 (STREAM)...');

      let bucket = bucketName;
      let basePrefix = '';

      if (bucketName.includes('/')) {
        const parts = bucketName.split('/');
        bucket = parts[0];
        basePrefix = parts.slice(1).join('/');
      }

      if (s3Prefix) {
        basePrefix = s3Prefix;
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const backupFolderName = `BACKUP_CLINICA_${clinicaId}_${timestamp}`;
      const folderPath = basePrefix
        ? `${basePrefix}/backup-temp/${database}/${backupFolderName}`
        : `backup-temp/${database}/${backupFolderName}`;

      this.logger.log(`📁 Pasta do backup: ${folderPath}`);

      const folderExists = await this.s3Service.folderExists(bucket, folderPath);
      if (!folderExists) {
        await this.s3Service.createFolder(bucket, folderPath);
      }

      this.logger.log(`📤 Enviando Excel via stream...`);

      const excelKey = `${folderPath}/BACKUP_COMPLETO.xlsx`;

      await this.s3Service.uploadObjectStream(
        bucket,
        excelKey,
        excelStream,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );

      const excelUrl = await this.s3Service.getPresignedUrl(bucket, excelKey, 604800);

      this.logger.log(`✅ Excel enviado com sucesso`);

      // 2️⃣ Imagens
      let imagensResult: {
        totalImages: number;
        uploadedImages: number;
        localFolderPath?: string;
      } | null = null;

      if (importarImagens) {
        if (imagensPacientes?.length) {
          imagensResult = await this.processImagensPacientesLocal(
            imagensPacientes,
            bucket,
            s3Prefix!,
            backupFolderName,
          );
        }
      }

      // 3️⃣ README (sem tamanho do Excel)
      const readmeKey = `${folderPath}/README.txt`;
      const dataHora = subHours(new Date(), 3).toISOString().replace('T', ' ').substring(0, 16);

      const readmeContent = `
        BACKUP COMPLETO - CLÍNICA ${clinicaId}
        Base de Dados: ${database}
        Data/Hora: ${dataHora}

        📄 Arquivos:
        - BACKUP_COMPLETO.xlsx
        ${importarImagens && imagensResult ? `- Imagens salvas localmente em: ${imagensResult.localFolderPath} (${imagensResult.uploadedImages} arquivos)` : ''}
        `.trim();

      await this.s3Service.uploadObject(
        bucket,
        readmeKey,
        Buffer.from(readmeContent),
        'text/plain',
      );

      // 4️⃣ Email
      await this.emailService.sendBackupEmail(
        email,
        clinicaId,
        excelUrl,
        database,
        importarImagens && imagensResult
          ? { totalImages: imagensResult.totalImages, uploadedImages: imagensResult.uploadedImages }
          : undefined,
      );

      this.logger.log('✅ Backup finalizado e email enviado');
    } catch (error) {
      this.logger.error(`❌ Erro no upload para S3: ${error.message}`);
      throw error;
    }
  }

  /**
   * Baixa as imagens sequencialmente para a pasta Downloads local.
   */
  private async processImagensPacientesLocal(
    imagensPacientes: interfaces.ImagemPaciente[],
    bucket: string,
    s3prefix: string,
    backupFolderName: string,
  ): Promise<{ totalImages: number; uploadedImages: number; localFolderPath?: string }> {
    try {
      this.logger.log(`\n🖼️  Baixando imagens dos pacientes uma por vez...`);

      const imageKeys = imagensPacientes
        .filter(img => img.FOTO && typeof img.FOTO === 'string')
        .map(img => img.FOTO.trim());

      const uniqueKeys = [...new Set(imageKeys)];
      this.logger.log(`📸 Total de imagens únicas: ${uniqueKeys.length}`);

      if (uniqueKeys.length === 0) {
        return { totalImages: 0, uploadedImages: 0 };
      }

      const localFolderPath = join(homedir(), 'Downloads', backupFolderName, 'imagens');
      await mkdir(localFolderPath, { recursive: true });
      let uploadedCount = 0;

      for (const key of uniqueKeys) {
        const originalFileName = basename(key.replace(/\\/g, '/')) || 'imagem.jpg';
        const safeFileName = originalFileName.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
        const destinationPath = join(localFolderPath, safeFileName);
        const temporaryPath = `${destinationPath}.part`;

        try {
          const imageStream = await this.s3Service.getObjectStream(bucket, s3prefix, key);
          await pipeline(imageStream, createWriteStream(temporaryPath));
          await rename(temporaryPath, destinationPath);
          uploadedCount++;
          this.logger.log(`📸 ${uploadedCount}/${uniqueKeys.length} - ${safeFileName}`);
        } catch (error) {
          await rm(temporaryPath, { force: true });
          this.logger.warn(`⚠️  Erro ao processar ${key}: ${error.message}`);
        }
      }

      this.logger.log(
        `✅ ${uploadedCount}/${uniqueKeys.length} imagens salvas em ${localFolderPath}`,
      );

      return {
        totalImages: uniqueKeys.length,
        uploadedImages: uploadedCount,
        localFolderPath,
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao processar imagens: ${error.message}`);
      return { totalImages: 0, uploadedImages: 0 };
    }
  }
}
