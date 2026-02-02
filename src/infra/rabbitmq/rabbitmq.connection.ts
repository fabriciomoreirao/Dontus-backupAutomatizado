import * as amqp from 'amqplib';
import { ChannelModel } from 'amqplib';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

@Injectable()
export class RabbitMQConnection implements OnModuleInit {
  private readonly logger = new Logger(RabbitMQConnection.name);
  private connection: ChannelModel | null = null;

  async onModuleInit() {
    await this.connect();
  }

  public async getConnection(): Promise<ChannelModel> {
    if (!this.connection) {
      await this.connect();
    }
    return this.connection!;
  }

  private async connect(): Promise<void> {
    if (this.connection) return;
    try {
      this.connection = await amqp.connect(process.env.RABBITMQ_URL!);

      this.connection.on('close', async () => {
        this.logger.error('Canal RabbitMQ fechado! Tentando reconectar...');
        await this.reconnect();
      });

      this.connection.on('error', async err => {
        this.logger.error('Erro no canal RabbitMQ:', err);
        await this.reconnect();
      });

      this.logger.log('✅ Conexão com RabbitMQ estabelecida com sucesso!');
    } catch (err) {
      this.logger.error('Erro ao estabelecer conexão com RabbitMQ:', err);
      this.connection = null;
      throw err;
    }
  }

  private async reconnect() {
    if (this.connection) {
      try {
        await this.connection.close();
      } catch (err) {
        this.logger.error('Erro ao fechar conexão durante reconexão:', err);
      }
      this.connection = null;
    }

    setTimeout(async () => {
      try {
        await this.connect();
        this.logger.log('♻️ Reconectado ao RabbitMQ com sucesso!');
      } catch (err) {
        this.logger.error('Falha na reconexão:', err);
      }
    }, 5000);
  }
}
