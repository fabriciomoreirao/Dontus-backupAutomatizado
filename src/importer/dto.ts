import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SheetMappingDto {
  @ApiProperty({ example: 'Clientes', description: 'Nome da aba no Excel' })
  @IsString()
  @IsNotEmpty()
  sheetName: string;

  @ApiProperty({ example: 'tb_clientes', description: 'Nome da tabela para o INSERT' })
  @IsString()
  @IsNotEmpty()
  tableName: string;

  @ApiProperty({
    example: ['nome', 'email', 'telefone'],
    description: 'Colunas para o INSERT (na mesma ordem das colunas do Excel)',
  })
  @IsArray()
  @IsString({ each: true })
  columns: string[];

  @ApiProperty({
    example: true,
    description: 'Se verdadeiro, ignora a primeira linha (cabeçalho). Padrão: true',
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  skipHeaderRow?: boolean;
}

export class ImportExcelDto {
  @ApiProperty({ type: [SheetMappingDto], description: 'Mapeamento das abas para tabelas SQL' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SheetMappingDto)
  mappings: SheetMappingDto[];
}
