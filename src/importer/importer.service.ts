import { Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { SheetMappingDto } from './dto';

@Injectable()
export class ImporterService {
  private readonly logger = new Logger(ImporterService.name);

  async generateInsertStatements(fileBuffer: Buffer, mappings: SheetMappingDto[]): Promise<string> {
    const workbook = new ExcelJS.Workbook();
    const arrayBuffer = fileBuffer.buffer.slice(
      fileBuffer.byteOffset,
      fileBuffer.byteOffset + fileBuffer.byteLength,
    ) as ArrayBuffer;
    await workbook.xlsx.load(arrayBuffer);

    const lines: string[] = [];

    for (const mapping of mappings) {
      const worksheet = workbook.getWorksheet(mapping.sheetName);

      if (!worksheet) {
        this.logger.warn(`Aba "${mapping.sheetName}" não encontrada no Excel. Pulando...`);
        continue;
      }

      const skipHeader = mapping.skipHeaderRow !== false;
      const startRow = skipHeader ? 2 : 1;
      const { tableName, columns } = mapping;
      const columnsSql = columns.map((c) => `[${c}]`).join(', ');

      this.logger.log(`Processando aba "${mapping.sheetName}" -> tabela "${tableName}" (${worksheet.rowCount - (skipHeader ? 1 : 0)} linhas)`);

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber < startRow) return;

        const cells = row.values as ExcelJS.CellValue[];
        // row.values é 1-indexado, então cells[0] é undefined
        const values = columns.map((_, idx) => this.formatValue(cells[idx + 1]));

        // Ignora linhas completamente vazias
        if (values.every((v) => v === 'NULL')) return;

        lines.push(`INSERT INTO ${tableName} (${columnsSql}) VALUES (${values.join(', ')});`);
      });

      lines.push(''); // linha em branco entre tabelas
    }

    return lines.join('\n');
  }

  private formatValue(value: ExcelJS.CellValue): string {
    if (value === null || value === undefined || value === '') {
      return 'NULL';
    }

    if (typeof value === 'number') {
      return String(value);
    }

    if (typeof value === 'boolean') {
      return value ? '1' : '0';
    }

    if (value instanceof Date) {
      return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
    }

    // Objeto com resultado de fórmula
    if (typeof value === 'object' && 'result' in (value as object)) {
      return this.formatValue((value as { result: ExcelJS.CellValue }).result);
    }

    // RichText
    if (typeof value === 'object' && 'richText' in (value as object)) {
      const rt = value as ExcelJS.CellRichTextValue;
      const text = rt.richText.map((r) => r.text).join('');
      return `'${text.replace(/'/g, "''")}'`;
    }

    return `'${String(value).replace(/'/g, "''")}'`;
  }
}
