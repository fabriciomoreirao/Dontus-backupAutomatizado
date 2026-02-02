import { Injectable, Logger } from '@nestjs/common';
import { RabbitMQConnection } from './rabbitmq.connection';
import { ChannelModel } from 'amqplib';

@Injectable()
export class RabbitMQService {
  private connection: ChannelModel;
  private readonly logger = new Logger(RabbitMQService.name);

  constructor(private readonly rabbitMQConnection: RabbitMQConnection) {}

  async publishToQueue(queue: string, message: any) {
    let channel: any | null = null;
    try {
      if (!this.connection) {
        this.connection = await this.rabbitMQConnection.getConnection();
      }
      channel = await this.connection.createChannel();
      await channel.assertQueue(queue, { durable: true });
      const success = channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
        persistent: true,
      });
      if (!success) {
        this.logger.warn(`⚠️ Falha ao enviar para a fila ${queue}`);
      }
    } catch (err) {
      this.logger.error(`Erro ao publicar na fila ${queue}:`, err);
      throw err;
    } finally {
      if (channel) {
        try {
          await channel.close();
        } catch (err) {
          this.logger.error(`Erro ao fechar canal:`, err);
        }
      }
    }
  }
}
