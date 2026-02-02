import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { CustomException } from 'src/common/exceptions/custom.exception';
import * as path from 'path';
import { Readable } from 'stream';
import { Upload } from '@aws-sdk/lib-storage';
import { PassThrough } from 'stream';

/**
 * Service responsável por todas as operações com AWS S3
 * Gerencia buckets, upload/download de arquivos e geração de URLs pré-assinadas
 */
@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly region: string;
  private readonly logger = new Logger(S3Service.name);

  constructor() {
    this.region = process.env.AWS_REGION || 'us-east-1';

    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!accessKeyId || !secretAccessKey) {
      throw new Error('AWS_ACCESS_KEY_ID e AWS_SECRET_ACCESS_KEY devem estar definidos no .env');
    }

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  /**
   * Cria uma "pasta" no S3 (na verdade cria um objeto vazio com / no final)
   * @param bucketName Nome do bucket S3
   * @param folderPath Caminho da pasta (ex: "backup-temp/database/")
   * @throws CustomException em caso de erro na criação
   */
  async createFolder(bucketName: string, folderPath: string): Promise<void> {
    try {
      // Garante que o caminho termina com /
      const folderKey = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;

      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: folderKey,
        Body: '',
      });

      await this.s3Client.send(command);
    } catch (err) {
      throw new CustomException(`Erro ao criar pasta ${folderPath}: ${err.message}`, 500);
    }
  }

  /**
   * Faz upload de um objeto (buffer/string) para o S3
   * @param bucketName Nome do bucket S3
   * @param key Chave do objeto (caminho completo incluindo nome do arquivo)
   * @param body Buffer, Uint8Array ou string com o conteúdo do arquivo
   * @param contentType Tipo MIME do arquivo (opcional, padrão: 'application/octet-stream')
   * @returns Objeto com a key e location (URI do S3) do arquivo enviado
   * @throws CustomException em caso de erro no upload
   */
  async uploadObject(
    bucketName: string,
    key: string,
    body: Buffer | Uint8Array | string,
    contentType?: string,
  ): Promise<{ key: string; location: string }> {
    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: body,
        ContentType: contentType || 'application/octet-stream',
      });

      await this.s3Client.send(command);

      return {
        key,
        location: `s3://${bucketName}/${key}`,
      };
    } catch (err) {
      throw new CustomException(`Erro ao fazer upload do objeto ${key}: ${err.message}`, 500);
    }
  }

  /**
   * Verifica se uma pasta/prefixo existe no S3
   * @param bucketName Nome do bucket S3
   * @param prefix Prefixo/pasta a verificar
   * @returns true se a pasta existe, false caso contrário
   * @throws CustomException em caso de erro (exceto NotFound)
   */
  async folderExists(bucketName: string, prefix: string): Promise<boolean> {
    try {
      const folderKey = prefix.endsWith('/') ? prefix : `${prefix}/`;

      const command = new HeadObjectCommand({
        Bucket: bucketName,
        Key: folderKey,
      });

      await this.s3Client.send(command);
      return true;
    } catch (err) {
      if (err.name === 'NotFound') {
        return false;
      }
      throw new CustomException(`Erro ao verificar pasta ${prefix}: ${err.message}`, 500);
    }
  }

  /**
   * Gera URL pré-assinada (presigned URL) para acesso público temporário
   * Permite que qualquer pessoa com a URL faça download do arquivo sem credenciais AWS
   * @param bucketName Nome do bucket S3
   * @param key Chave do objeto
   * @param expiresIn Tempo de validade em segundos (padrão: 7 dias = 604800 segundos)
   * @returns URL pré-assinada válida pelo tempo especificado
   * @throws CustomException em caso de erro na geração da URL
   * @example
   * const url = await getPresignedUrl('meu-bucket', 'arquivo.xlsx', 3600); // válido por 1 hora
   */
  async getPresignedUrl(
    bucketName: string,
    key: string,
    expiresIn: number = 604800,
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      // Gera URL válida por X segundos (padrão: 7 dias)
      const presignedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });

      return presignedUrl;
    } catch (err) {
      throw new CustomException(`Erro ao gerar URL pré-assinada: ${err.message}`, 500);
    }
  }

  /**
   * Faz upload de um stream diretamente para o S3 (ideal para arquivos grandes)
   * NÃO carrega o arquivo inteiro em memória
   */

  async uploadObjectStream(
    bucket: string,
    key: string,
    stream: PassThrough,
    contentType: string,
  ): Promise<void> {
    try {
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: bucket,
          Key: key,
          Body: stream,
          ContentType: contentType,
        },
      });

      await upload.done();

      this.logger.log(`✅ Upload do stream concluído: ${key}`);
    } catch (error) {
      this.logger.error(`❌ Erro ao fazer upload do stream: ${error.message}`);
      throw new Error(`Erro ao fazer upload do objeto (stream) ${key}: ${error.message}`);
    }
  }

  /**
   * Retorna um stream de leitura do objeto S3 (ideal para uso com zip/archiver)
   */
  async getObjectStream(bucketName: string, s3Prefix: string, key: string): Promise<Readable> {
    try {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: `${s3Prefix}/${key}`,
      });
      const response = await this.s3Client.send(command);
      const stream = response.Body as Readable;
      if (!stream) {
        throw new CustomException(`Objeto ${key} não possui stream`, 500);
      }
      return stream;
    } catch (err) {
      throw new CustomException(`Erro ao obter stream do objeto ${key}: ${err.message}`, 500);
    }
  }
}
