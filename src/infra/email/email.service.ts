import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { CustomException } from 'src/common/exceptions/custom.exception';
import { subHours } from 'date-fns';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    const smtpHost = process.env.SMTP_HOST || 'email-smtp.us-east-1.amazonaws.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpUser || !smtpPass) {
      throw new Error('SMTP_USER e SMTP_PASS devem estar definidos no .env');
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: false, // true para 465, false para outras portas
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }

  /**
   * Envia email simples
   * @param to Email do destinatário
   * @param subject Assunto do email
   * @param body Corpo do email (HTML)
   */
  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    try {
      this.logger.log(`📧 Enviando email para: ${to}`);

      await this.transporter.sendMail({
        from: '"Equipe Dontus" <acesso@dontus.com.br>',
        to,
        subject,
        html: body,
      });

      this.logger.log(`✅ Email enviado com sucesso para: ${to}`);
    } catch (error) {
      this.logger.error(`❌ Erro ao enviar email: ${error.message}`);
      throw new CustomException(`Erro ao enviar email: ${error.message}`, 500);
    }
  }
  /**
   * Envia email com link de backup completo
   * @param to Email do destinatário
   * @param clinicaId ID da clínica
   * @param downloadUrl Link de download do backup
   * @param database Nome do banco de dados
   * @param totalRecords Total de registros no backup
   */
  async sendBackupEmail(
    to: string,
    clinicaId: number,
    downloadUrl: string,
    database?: string,
    imagensResult?: { totalImages: number; uploadedImages: number; folderUrl?: string },
  ): Promise<void> {
    const dataAtual = subHours(new Date(), 3).toISOString().replace('T', ' ').substring(0, 16);

    const subject = `Backup Completo - Clínica ${clinicaId} (${database || 'Base de Dados'})`;
    const body = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 650px; margin: 30px auto; background: #fff; border-radius: 10px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); overflow: hidden; }
          .header { background: linear-gradient(135deg, #4472C4 0%, #2c5aa0 100%); color: #fff; padding: 32px 20px 18px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .header p { margin: 10px 0 0 0; font-size: 15px; opacity: 0.92; }
          .content { padding: 38px 30px; }
          .greeting { font-size: 16px; margin-bottom: 18px; }
          .highlight { background: #f0f7ff; border-left: 4px solid #4472C4; padding: 18px; margin: 22px 0; border-radius: 5px; }
          .highlight h3 { margin: 0 0 13px 0; color: #4472C4; font-size: 18px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 13px; margin-top: 10px; }
          .info-item { background: #fff; padding: 10px; border-radius: 4px; border: 1px solid #e0e0e0; }
          .info-item strong { display: block; color: #666; font-size: 12px; margin-bottom: 4px; text-transform: uppercase; }
          .info-item span { color: #333; font-size: 16px; font-weight: 600; }
          .button-container { text-align: center; margin: 32px 0 0 0; }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #6fa8dc 0%, #b4c7e7 100%);
            color: #fff;
            padding: 15px 38px;
            text-decoration: none;
            border-radius: 7px;
            font-weight: 700;
            font-size: 16px;
            box-shadow: 0 4px 15px rgba(68, 114, 196, 0.12);
            transition: all 0.2s;
            border: none;
            outline: none;
          }
          .button[style*="background: linear-gradient(135deg, #28a745"] {
            background: linear-gradient(135deg, #7dd87d 0%, #b6e6b6 100%) !important;
          }
          .button:hover {
            filter: brightness(1.08);
            box-shadow: 0 6px 22px rgba(68, 114, 196, 0.28);
            transform: translateY(-2px) scale(1.03);
          }
          .warning { background: #fff9e6; border-left: 4px solid #ffc107; padding: 13px; margin: 22px 0; border-radius: 4px; }
          .warning p { margin: 0; font-size: 14px; color: #856404; }
          .footer { background: #f9f9f9; padding: 22px 30px; text-align: center; border-top: 1px solid #e0e0e0; }
          .footer p { margin: 5px 0; font-size: 13px; color: #666; }
          .footer a { color: #4472C4; text-decoration: none; }
          .divider { height: 1px; background: linear-gradient(to right, transparent, #e0e0e0, transparent); margin: 25px 0; }
          @media (max-width: 600px) {
            .info-grid { grid-template-columns: 1fr; }
            .content { padding: 22px 10px; }
            .container { margin: 0; border-radius: 0; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏥 Backup Completo Gerado</h1>
            <p>Seus dados estão seguros e disponíveis para download</p>
          </div>
          <div class="content">
            <p class="greeting">Olá,</p>
            <p class="greeting">O backup completo da sua clínica foi gerado com sucesso! 🎉</p>
            <div class="highlight">
              <h3>📊 Detalhes do Backup</h3>
              <div class="info-grid">
                <div class="info-item">
                  <strong>🏢 Clínica</strong>
                  <span>#${clinicaId}</span>
                </div>
                <div class="info-item">
                  <strong>💾 Base de Dados</strong>
                  <span>${database || 'N/A'}</span>
                </div>
                <div class="info-item">
                  <strong>📅 Data e Hora</strong>
                  <span>${dataAtual}</span>
                </div>
                ${
                  imagensResult
                    ? `<div class="info-item">
                        <strong>🖼️ Imagens</strong>
                        <span>${imagensResult.uploadedImages}/${imagensResult.totalImages}</span>
                      </div>`
                    : ''
                }
              </div>
              <div class="divider"></div>
              <p style="margin: 15px 0 0 0; font-size: 14px; color: #666;">
                ✅ Formato: Excel (.xlsx) com múltiplas abas<br>
                ✅ Conteúdo: Dados completos da clínica incluindo pacientes, agendamentos, atendimentos, contas, orçamentos e muito mais
              </p>
            </div>
            <div class="button-container">
              <a href="${downloadUrl}" class="button">📥 BAIXAR BACKUP AGORA</a>
            </div>
            ${
              imagensResult && imagensResult.folderUrl
                ? `<div class="button-container">
                    <a href="${imagensResult.folderUrl}" class="button" style="background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%);">
                      🖼️ ACESSAR PASTA DE IMAGENS
                    </a>
                  </div>`
                : ''
            }
            <div class="warning">
              <p>⚠️ <strong>Importante:</strong> Este link é válido por 7 dias. Faça o download e armazene o arquivo em local seguro.</p>
            </div>
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              Se tiver alguma dúvida ou precisar de suporte, nossa equipe está à disposição.
            </p>
          </div>
          <div class="footer">
            <p><strong>Equipe Dontus</strong></p>
            <p>📧 <a href="mailto:acesso@dontus.com.br">acesso@dontus.com.br</a></p>
            <p style="margin-top: 15px; font-size: 12px; color: #999;">
              Este é um email automático, por favor não responda.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

    await this.sendEmail(to, subject, body);
  }
}
