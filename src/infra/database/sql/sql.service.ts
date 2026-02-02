import { Injectable, Logger } from '@nestjs/common';
import * as mssql from 'mssql';
import { CustomException } from '../../../common/exceptions/custom.exception';

export interface DatabaseConfig {
  server: string;
  database: string;
  user: string;
  password: string;
}

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);

  async executeQueryWithConfig<T = any>(config: DatabaseConfig, query: string): Promise<T[]> {
    let pool: mssql.ConnectionPool | null = null;

    try {
      this.logger.log(`🔌 Conectando ao banco: ${config.server}/${config.database}`);

      const sqlConfig: mssql.config = {
        server: config.server,
        database: config.database,
        user: config.user,
        password: config.password,
        options: {
          encrypt: process.env.DB_ENCRYPT === 'true',
          trustServerCertificate: process.env.DB_TRUST_CERT === 'true',
        },
        pool: {
          max: 20, // Aumenta o pool de conexões
          min: 0,
          idleTimeoutMillis: 30000,
        },
        requestTimeout: 60000, // Aumenta o timeout para 60s
        connectionTimeout: 30000,
      };

      pool = await mssql.connect(sqlConfig);
      this.logger.log('✅ Conexão estabelecida');

      this.logger.log('Executando query...');
      const result = await pool.request().query(query);

      this.logger.log(`✅ Query executada: ${result.recordset.length} registros`);
      return result.recordset;
    } catch (error) {
      this.logger.error(`❌ Erro ao executar query: ${error.message}`);
      return Promise.reject(new CustomException(`Erro ao executar query: ${error.message}`, 500));
    } finally {
      if (pool) {
        await pool.close();
        this.logger.log('🔌 Conexão fechada');
      }
    }
  }

  async testConnectionWithConfig(config: DatabaseConfig): Promise<boolean> {
    try {
      await this.executeQueryWithConfig(config, 'SELECT 1 as test');
      return true;
    } catch (error) {
      this.logger.error(`❌ Teste de conexão falhou: ${error.message}`);
      return false;
    }
  }
}
