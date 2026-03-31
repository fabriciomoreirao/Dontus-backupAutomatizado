import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
  Res,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiSecurity } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { Response } from 'express';
import { ImporterService } from './importer.service';
import { SheetMappingDto } from './dto';
import { AuthGuard } from '../common/guards/auth.guard';

@ApiSecurity('s3-api-key')
@UseGuards(AuthGuard)
@ApiTags('importer')
@Controller('importer')
export class ImporterController {
  constructor(private readonly importerService: ImporterService) {}

  @Post('excel-to-sql')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
  summary: 'Converte abas de um Excel em INSERT statements SQL e retorna um arquivo TXT',
  description: `
    Recebe um arquivo Excel (.xlsx) e um JSON de mapeamentos.

    **Formato do campo \`mappings\` (JSON string):**
    \`\`\`json
    [
    {
        "sheetName": "Clientes",
        "tableName": "tb_clientes",
        "columns": ["nome", "email", "telefone"],
        "skipHeaderRow": true
    },
    {
        "sheetName": "Produtos",
        "tableName": "tb_produtos",
        "columns": ["descricao", "preco", "estoque"],
        "skipHeaderRow": true
    }
    ]
    \`\`\`

    - **sheetName**: nome exato da aba no Excel  
    - **tableName**: nome da tabela no INSERT  
    - **columns**: colunas na ordem das colunas do Excel (da esquerda para a direita)  
    - **skipHeaderRow** *(opcional, padrão true)*: ignora a primeira linha como cabeçalho
    `,
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'mappings'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo Excel (.xlsx)',
        },
        mappings: {
          type: 'string',
          description:
            'JSON array com os mapeamentos: [{ sheetName, tableName, columns[], skipHeaderRow? }]',
          example:
            '[{"sheetName":"Clientes","tableName":"tb_clientes","columns":["nome","email"],"skipHeaderRow":true}]',
        },
      },
    },
  })
  async excelToSql(
    @UploadedFile() file: Express.Multer.File,
    @Body('mappings') mappingsJson: string,
    @Res() res: Response,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo Excel não fornecido.');
    }

    if (!mappingsJson) {
      throw new BadRequestException('Campo "mappings" é obrigatório.');
    }

    let mappings: SheetMappingDto[];
    try {
      const parsed: unknown = JSON.parse(mappingsJson);
      mappings = Array.isArray(parsed)
        ? (parsed as SheetMappingDto[])
        : (parsed as { mappings: SheetMappingDto[] }).mappings;
    } catch {
      throw new BadRequestException('Campo "mappings" deve ser um JSON válido.');
    }

    if (!Array.isArray(mappings) || mappings.length === 0) {
      throw new BadRequestException('O campo "mappings" deve ser um array com pelo menos um item.');
    }

    for (const m of mappings) {
      if (!m.sheetName || !m.tableName || !Array.isArray(m.columns) || m.columns.length === 0) {
        throw new BadRequestException(
          'Cada mapeamento deve conter "sheetName", "tableName" e "columns" (array não vazio).',
        );
      }
    }

    const sql = await this.importerService.generateInsertStatements(file.buffer, mappings);

    const filename = `inserts_${Date.now()}.txt`;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(sql);
  }
}
