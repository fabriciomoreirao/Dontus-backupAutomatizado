import { IsNumber, IsString, IsNotEmpty, IsOptional, IsEmail, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DatabaseConfigDto {
  @ApiProperty({ example: '172.21.32.127', description: 'Servidor SQL Server' })
  @IsString()
  @IsNotEmpty()
  server: string;

  @ApiProperty({ example: 's150004', description: 'Nome do banco de dados' })
  @IsString()
  @IsNotEmpty()
  database: string;

  @ApiProperty({ example: 's150004', description: 'Usuário do banco' })
  @IsString()
  @IsNotEmpty()
  user: string;

  @ApiProperty({ example: 's150004', description: 'Senha do banco' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class BackupRequestDto {
  @ApiProperty({ example: 21, description: 'ID da clínica' })
  @IsNumber()
  @IsNotEmpty()
  clinicaId: number;

  @ApiProperty({ example: 'dontus-meow', description: 'Nome do bucket S3' })
  @IsString()
  @IsNotEmpty()
  bucketName: string;

  @ApiProperty({ example: 'suporte@dontus.com.br', description: 'Email para receber o link' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'minha-pasta/subpasta',
    description: 'Prefixo/pasta base no S3 (opcional)',
    required: false,
  })
  @IsString()
  @IsOptional()
  s3Prefix?: string;

  @ApiProperty({
    example: false,
    description: 'Importar imagens após o backup (opcional)',
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  importarImagens?: boolean = false;

  @ApiProperty({ type: DatabaseConfigDto, description: 'Configurações do banco de dados' })
  @IsNotEmpty()
  dbConfig: DatabaseConfigDto;
}
