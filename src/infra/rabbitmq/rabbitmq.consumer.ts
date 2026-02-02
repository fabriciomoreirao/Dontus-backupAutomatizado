import { Injectable, Logger } from '@nestjs/common';
import { ChannelModel } from 'amqplib';
import { RabbitMQConnection } from './rabbitmq.connection';

@Injectable()
export class RabbitMQConsumer {
  private connection: ChannelModel;
  private readonly logger = new Logger(RabbitMQConsumer.name);

  constructor(private readonly rabbitMQConnection: RabbitMQConnection) {}

  async consume(queue: string, callback: (msg: any) => Promise<void>) {
    if (!this.connection) {
      this.connection = await this.rabbitMQConnection.getConnection();
    }
    const channel = await this.connection.createChannel();
    await channel.assertQueue(queue, { durable: true });
    const consumerTag = `consumer-${queue}`;

    try {
      await channel.cancel(consumerTag);
    } catch (err) {
      this.logger.warn(`Nenhum consumidor anterior para cancelar na fila ${queue}`);
    }

    channel.consume(
      queue,
      async msg => {
        if (!msg) return;
        try {
          const data = JSON.parse(msg.content.toString());
          await callback(data);
          channel.ack(msg);
        } catch (err) {
          this.logger.error(`Erro ao processar mensagem da fila ${queue}:`, err);
          channel.nack(msg, false, false);
        }
      },
      { consumerTag, noAck: false },
    );

    this.logger.log(`✅ Consumidor registrado na fila ${queue}`);
  }
}
