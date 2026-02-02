import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService, DatabaseConfig } from '../infra/database/sql/sql.service';
import * as interfaces from '../common/interfaces';

@Injectable()
export class BackupRepository {
  private readonly logger = new Logger(BackupRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async backupPacientes(
    clinicaId: number,
    dbConfig: DatabaseConfig,
  ): Promise<interfaces.Paciente[]> {
    const query = `
      SELECT 
        PACIENTES.NOME, 
        PACIENTES.CPF, 
        PACIENTES.RG, 
        PACIENTES.CEP, 
        PACIENTES.DATADENASCIMENTO, 
        PACIENTES.EMAIL, 
        PACIENTES.STATUS, 
        PACIENTES.UF, 
        PACIENTES.CIDADE,
        PACIENTES.LOGRADOURO, 
        PACIENTES.BAIRRO, 
        PACIENTES.NUMERO, 
        PACIENTES.TEL1, 
        PACIENTES.TEL2, 
        PACIENTES.CEL, 
        PACIENTES.DATACRIACAO, 
        PACIENTES.SEXO, 
        PACIENTES.COMPLEMENTO, 
        PACIENTES.NUMEROFICHA, 
        PACIENTES.FOTO, 
        PACIENTES.OBSERVACAO,
        PACIENTES.NOME_RESPONSAVEL, 
        PACIENTES.CPF_RESPONSAVEL  
      FROM PACIENTES
      JOIN CLINICAS ON PACIENTES.ID_CLINICA = CLINICAS.ID
      WHERE PACIENTES.ID_CLINICA = ${clinicaId}
    `;

    return await this.databaseService.executeQueryWithConfig<interfaces.Paciente>(dbConfig, query);
  }

  async backupOrigemPacientes(
    clinicaId: number,
    dbConfig: DatabaseConfig,
  ): Promise<interfaces.PacienteOrigem[]> {
    const query = `
      SELECT 
        PACIENTES.NOME, 
        PACIENTE_ORIGEM.DESCRICAO 
      FROM PACIENTES 
      JOIN PACIENTE_ORIGEM ON PACIENTES.ID_ORIGEM = PACIENTE_ORIGEM.ID
      JOIN CLINICAS ON PACIENTES.ID_CLINICA = CLINICAS.ID
      WHERE PACIENTES.ID_CLINICA = ${clinicaId}
    `;

    return await this.databaseService.executeQueryWithConfig<interfaces.PacienteOrigem>(
      dbConfig,
      query,
    );
  }

  async backupImagensPacientes(
    clinicaId: number,
    dbConfig: DatabaseConfig,
  ): Promise<interfaces.ImagemPaciente[]> {
    const query = `
      SELECT 
        CLINICAS.RAZAOSOCIAL AS CLINICA, 
        PACIENTES.NOME, 
        ALBUM_IMAGEM.FOTO  
      FROM ALBUM_IMAGEM
      JOIN PACIENTE_ALBUM ON ALBUM_IMAGEM.ID_ALBUM = PACIENTE_ALBUM.ID
      JOIN PACIENTES ON PACIENTE_ALBUM.ID_PACIENTE = PACIENTES.ID
      JOIN CLINICAS ON PACIENTES.ID_CLINICA = CLINICAS.ID
      WHERE PACIENTES.ID_CLINICA = ${clinicaId}
    `;

    return await this.databaseService.executeQueryWithConfig<interfaces.ImagemPaciente>(
      dbConfig,
      query,
    );
  }

  async backupAgendamentos(
    clinicaId: number,
    dbConfig: DatabaseConfig,
  ): Promise<interfaces.Agendamento[]> {
    const query = `
      SELECT  
        PACIENTES.NOME AS PACIENTES, 
        FUNCIONARIOS.NOME AS PROFISSIONAL, 
        A.DATAAGENDAMENTO, 
        A.TEMPO, 
        A.OBSERVACAO, 
        ESPECIALIDADES.DESCRICAO AS ESPECIALIDADE,
        SERVICOS.DESCRICAO AS PROCEDIMENTO  
      FROM AGENDAMENTOS AS A
      INNER JOIN CLINICAS ON A.ID_CLINICA = CLINICAS.ID
      INNER JOIN PACIENTES ON A.ID_PACIENTE = PACIENTES.ID
      LEFT JOIN FUNCIONARIOS ON A.ID_FUNCIONARIO = FUNCIONARIOS.ID
      LEFT JOIN ESPECIALIDADES ON A.ID_ESPECIALIDADE = ESPECIALIDADES.ID
      LEFT JOIN SERVICOS ON A.ID_SERVICO = SERVICOS.ID
      WHERE A.ID_CLINICA = ${clinicaId}
    `;

    return await this.databaseService.executeQueryWithConfig<interfaces.Agendamento>(
      dbConfig,
      query,
    );
  }

  async backupAtendimentosRealizadosOrto(
    clinicaId: number,
    dbConfig: DatabaseConfig,
  ): Promise<interfaces.AtendimentoRealizadoOrto[]> {
    const query = `
      SELECT 
        SERVICOS.DESCRICAO,
        CONTAS_RECEBER.VALOR_TOTAL, 
        PACIENTES.NOME AS PACIENTE, 
        FUNCIONARIOS.NOME AS PROFISSIONAL, 
        ATENDIMENTOS_ITENS.DATA, 
        ATENDIMENTOS_ITENS.OBSERVACAO 
      FROM ATENDIMENTOS_ITENS 
      JOIN FUNCIONARIOS ON ATENDIMENTOS_ITENS.ID_FUNCIONARIO = FUNCIONARIOS.ID
      JOIN ATENDIMENTOS ON ATENDIMENTOS_ITENS.ID_ATENDIMENTO = ATENDIMENTOS.ID
      JOIN PACIENTES ON ATENDIMENTOS.ID_PACIENTE = PACIENTES.ID
      JOIN SERVICOS ON ATENDIMENTOS.ID_SERVICO = SERVICOS.ID
      JOIN CONTAS_RECEBER ON ATENDIMENTOS.ID_CONTAS_RECEBER = CONTAS_RECEBER.ID
      WHERE PACIENTES.ID_CLINICA = ${clinicaId}
    `;

    return await this.databaseService.executeQueryWithConfig<interfaces.AtendimentoRealizadoOrto>(
      dbConfig,
      query,
    );
  }

  async backupAtendimentosRealizados(
    clinicaId: number,
    dbConfig: DatabaseConfig,
  ): Promise<interfaces.AtendimentoRealizado[]> {
    const query = `
      SELECT 
        SERVICOS.DESCRICAO, 
        PACIENTES.NOME AS PACIENTE, 
        FUNCIONARIOS.NOME AS PROFISSIONAL, 
        ATENDIMENTOS_ITENS.DATA, 
        ATENDIMENTOS_ITENS.OBSERVACAO 
      FROM ATENDIMENTOS_ITENS 
      JOIN FUNCIONARIOS ON ATENDIMENTOS_ITENS.ID_FUNCIONARIO = FUNCIONARIOS.ID
      JOIN ATENDIMENTOS ON ATENDIMENTOS_ITENS.ID_ATENDIMENTO = ATENDIMENTOS.ID
      JOIN PACIENTES ON ATENDIMENTOS.ID_PACIENTE = PACIENTES.ID
      JOIN SERVICOS ON ATENDIMENTOS.ID_SERVICO = SERVICOS.ID
      WHERE PACIENTES.ID_CLINICA = ${clinicaId}
    `;

    return await this.databaseService.executeQueryWithConfig<interfaces.AtendimentoRealizado>(
      dbConfig,
      query,
    );
  }

  async backupContasRecebidas(
    clinicaId: number,
    dbConfig: DatabaseConfig,
  ): Promise<interfaces.ContaRecebida[]> {
    const query = `
      SELECT  
        CONTAS_RECEBER_PAGAMENTOS.VALOR, 
        CONTAS_RECEBER_PAGAMENTOS.DATA, 
        FORMASPAGAMENTO.DESCRICAO AS FORMAPAGAMENTO, 
        CONTAS_RECEBER_PACIENTE.QTD, 
        ESPECIALIDADES.DESCRICAO AS ESPECIALIDADE, 
        PACIENTES.NOME AS PACIENTE  
      FROM CONTAS_RECEBER_PAGAMENTOS
      JOIN CONTAS_RECEBER_PACIENTE ON CONTAS_RECEBER_PAGAMENTOS.ID_CONTAS_RECEBER_PACIENTE = CONTAS_RECEBER_PACIENTE.ID
      JOIN FORMASPAGAMENTO ON CONTAS_RECEBER_PACIENTE.ID_FORMA_PAGAMENTO = FORMASPAGAMENTO.ID
      LEFT JOIN ESPECIALIDADES ON CONTAS_RECEBER_PACIENTE.ID_ESPECIALIDADE = ESPECIALIDADES.ID
      LEFT JOIN FUNCIONARIOS ON CONTAS_RECEBER_PACIENTE.ID_FUNCIONARIO = FUNCIONARIOS.ID
      JOIN CONTAS_RECEBER ON CONTAS_RECEBER_PACIENTE.ID_CONTAS_RECEBER = CONTAS_RECEBER.ID
      JOIN PACIENTES ON CONTAS_RECEBER.ID_PACIENTE = PACIENTES.ID
      WHERE PACIENTES.ID_CLINICA = ${clinicaId}
      ORDER BY CONTAS_RECEBER_PAGAMENTOS.DATA DESC
    `;

    return await this.databaseService.executeQueryWithConfig<interfaces.ContaRecebida>(
      dbConfig,
      query,
    );
  }

  async backupLancamentosFuturos(
    clinicaId: number,
    dbConfig: DatabaseConfig,
  ): Promise<interfaces.LancamentoFuturo[]> {
    const query = `
      SELECT 
        PACIENTES.NOME, 
        CONTAS_RECEBER_LANCAMENTOS_FUTUROS.VALOR, 
        CONTAS_RECEBER_LANCAMENTOS_FUTUROS.PARCELA, 
        FORMASPAGAMENTO.DESCRICAO, 
        CONTAS_RECEBER_LANCAMENTOS_FUTUROS.DATA AS DATA_LANCAMENTOS, 
        CONTAS_RECEBER_LANCAMENTOS_FUTUROS.DATA_BAIXA AS DATA_BAIXA    
      FROM CONTAS_RECEBER_LANCAMENTOS_FUTUROS
      JOIN CONTAS_RECEBER_PACIENTE ON CONTAS_RECEBER_LANCAMENTOS_FUTUROS.ID_CONTAS_RECEBER_PACIENTE = CONTAS_RECEBER_PACIENTE.ID
      JOIN CONTAS_RECEBER ON CONTAS_RECEBER_PACIENTE.ID_CONTAS_RECEBER = CONTAS_RECEBER.ID
      JOIN FORMASPAGAMENTO ON CONTAS_RECEBER_PACIENTE.ID_FORMA_PAGAMENTO = FORMASPAGAMENTO.ID
      JOIN PACIENTES ON CONTAS_RECEBER.ID_PACIENTE = PACIENTES.ID
      WHERE PACIENTES.ID_CLINICA = ${clinicaId}
    `;

    return await this.databaseService.executeQueryWithConfig<interfaces.LancamentoFuturo>(
      dbConfig,
      query,
    );
  }

  async backupContasRecebidasLancamentosFuturos(
    clinicaId: number,
    dbConfig: DatabaseConfig,
  ): Promise<interfaces.ContaRecebidaLancamentoFuturo[]> {
    const query = `
      SELECT  
        PACIENTES.NOME, 
        CONTAS_RECEBER_LANCAMENTOS_FUTUROS.ID AS ID_LANCAMENTO_FUTURO, 
        CONTAS_RECEBER_LANCAMENTOS_FUTUROS.ID_CONTAS_RECEBER_PACIENTE AS ID_CONTAS_RECEBER_PACIENTE, 
        CONTAS_RECEBER_LANCAMENTOS_FUTUROS.VALOR,
        CONTAS_RECEBER_PACIENTE.VALOR AS VALOR_PARCELADO,
        CONTAS_RECEBER_PACIENTE.DATA AS DATA_PAGAMENTO,
        CONTAS_RECEBER_LANCAMENTOS_FUTUROS.DATA AS DATA_PARCELA, 
        CONTAS_RECEBER_LANCAMENTOS_FUTUROS.DATA_BAIXA,
        CONTAS_RECEBER_LANCAMENTOS_FUTUROS.BAIXA,
        CONTAS_RECEBER_LANCAMENTOS_FUTUROS.PARCELA 
      FROM CONTAS_RECEBER_LANCAMENTOS_FUTUROS 
      JOIN CONTAS_RECEBER_PACIENTE ON CONTAS_RECEBER_LANCAMENTOS_FUTUROS.ID_CONTAS_RECEBER_PACIENTE = CONTAS_RECEBER_PACIENTE.ID
      JOIN CONTAS_RECEBER ON CONTAS_RECEBER_PACIENTE.ID_CONTAS_RECEBER = CONTAS_RECEBER.ID
      JOIN PACIENTES ON CONTAS_RECEBER.ID_PACIENTE = PACIENTES.ID
      WHERE PACIENTES.ID_CLINICA = ${clinicaId}
    `;

    return await this.databaseService.executeQueryWithConfig<interfaces.ContaRecebidaLancamentoFuturo>(
      dbConfig,
      query,
    );
  }

  async backupProcedimentosOrcamento(
    clinicaId: number,
    dbConfig: DatabaseConfig,
  ): Promise<interfaces.ProcedimentoOrcamento[]> {
    const query = `
      SELECT 
        PACIENTES.NOME AS PACIENTES, 
        ORCAMENTOSITENS.VALOR, 
        TABELA_SERVICO.DESCRICAO AS TABELA, 
        ESPECIALIDADES.DESCRICAO AS ESPECIALIDADE, 
        SERVICOS.DESCRICAO AS PROCEDIMENTO, 
        DENTE, 
        FACE, 
        ARCADA, 
        FACE_DISTAL, 
        FACE_LINGUAL, 
        FACE_MESIAL, 
        FACE_OCLUSAL, 
        FACE_VESTIBULAR, 
        ATENDIMENTOS.STATUS 
      FROM ORCAMENTOSITENS
      JOIN ORCAMENTOS ON ORCAMENTOSITENS.ID_ORCAMENTO = ORCAMENTOS.ID
      JOIN ATENDIMENTOS ON ORCAMENTOSITENS.ID = ATENDIMENTOS.ID_ORCAMENTOS_ITENS
      INNER JOIN PACIENTES ON ORCAMENTOS.ID_PACIENTE = PACIENTES.ID
      INNER JOIN SERVICOS ON ORCAMENTOSITENS.ID_SERVICO = SERVICOS.ID
      INNER JOIN TABELA_SERVICO ON SERVICOS.ID_TABELA_SERVICO = TABELA_SERVICO.ID
      INNER JOIN ESPECIALIDADES ON SERVICOS.ID_ESPECIALIDADE = ESPECIALIDADES.ID
      WHERE PACIENTES.ID_CLINICA = ${clinicaId}
    `;

    return await this.databaseService.executeQueryWithConfig<interfaces.ProcedimentoOrcamento>(
      dbConfig,
      query,
    );
  }

  async backupProcedimentosContaAvulsaEOrto(
    clinicaId: number,
    dbConfig: DatabaseConfig,
  ): Promise<interfaces.ProcedimentoContaAvulsaEOrto[]> {
    const query = `
      SELECT 
        PACIENTES.NOME AS PACIENTES, 
        CONTAS_RECEBER.VALOR_TOTAL, 
        TABELA_SERVICO.DESCRICAO AS TABELA, 
        ESPECIALIDADES.DESCRICAO AS ESPECIALIDADE, 
        SERVICOS.DESCRICAO AS PROCEDIMENTOS, 
        DENTE, 
        FACE,
        ARCADA, 
        FACE_DISTAL, 
        FACE_LINGUAL, 
        FACE_MESIAL, 
        FACE_OCLUSAL, 
        FACE_VESTIBULAR, 
        ATENDIMENTOS.STATUS  
      FROM ATENDIMENTOS
      JOIN CONTAS_RECEBER ON ATENDIMENTOS.ID_CONTAS_RECEBER = CONTAS_RECEBER.ID
      INNER JOIN PACIENTES ON CONTAS_RECEBER.ID_PACIENTE = PACIENTES.ID
      INNER JOIN SERVICOS ON CONTAS_RECEBER.ID_SERVICO = SERVICOS.ID
      INNER JOIN TABELA_SERVICO ON SERVICOS.ID_TABELA_SERVICO = TABELA_SERVICO.ID
      INNER JOIN ESPECIALIDADES ON SERVICOS.ID_ESPECIALIDADE = ESPECIALIDADES.ID
      WHERE PACIENTES.ID_CLINICA = ${clinicaId}
    `;

    return await this.databaseService.executeQueryWithConfig<interfaces.ProcedimentoContaAvulsaEOrto>(
      dbConfig,
      query,
    );
  }

  async backupOrcamentos(
    clinicaId: number,
    dbConfig: DatabaseConfig,
  ): Promise<interfaces.Orcamento[]> {
    const query = `
      SELECT 
        PACIENTES.NOME, 
        VALOR_TOTAL, 
        ORCAMENTOS.DATACRIACAO AS CRIADO, 
        DATA_CONTRATACAO AS CONTRATACAO, 
        FUNCIONARIOS.NOME AS PROFISSIONAL 
      FROM ORCAMENTOS
      JOIN PACIENTES ON ORCAMENTOS.ID_PACIENTE = PACIENTES.ID
      JOIN FUNCIONARIOS ON ORCAMENTOS.ID_PROFISSIONAL = FUNCIONARIOS.ID
      WHERE PACIENTES.ID_CLINICA = ${clinicaId}
    `;

    return await this.databaseService.executeQueryWithConfig<interfaces.Orcamento>(dbConfig, query);
  }

  async backupOrto(clinicaId: number, dbConfig: DatabaseConfig): Promise<interfaces.Orto[]> {
    const query = `
      SELECT 
        PACIENTES.NOME AS PACIENTES, 
        FUNCIONARIOS.NOME AS PROFISSIONAL, 
        DATA_TRATAMENTO_INICIO AS INICIO, 
        DATA_TRATAMENTO_FIM AS FIM, 
        DATA_CRIACAO AS CRIADO, 
        DATA_CANCELAMENTO AS CANCELADO, 
        DATA_FINALIZACAO AS FINALIZADO  
      FROM ORTO
      JOIN PACIENTES ON ORTO.ID_PACIENTE = PACIENTES.ID
      JOIN FUNCIONARIOS ON ORTO.ID_PROFISSIONAL = FUNCIONARIOS.ID
      WHERE PACIENTES.ID_CLINICA = ${clinicaId}
    `;

    return await this.databaseService.executeQueryWithConfig<interfaces.Orto>(dbConfig, query);
  }

  async backupRetornos(clinicaId: number, dbConfig: DatabaseConfig): Promise<interfaces.Retorno[]> {
    const query = `
      SELECT 
        CLINICAS.RAZAOSOCIAL, 
        PACIENTES.NOME AS PACIENTES, 
        RETORNOS.OBSERVACAO, 
        DATA_RETORNO AS DATA, 
        IS_RETORNO AS STATUS 
      FROM RETORNOS
      JOIN PACIENTES ON RETORNOS.ID_PACIENTE = PACIENTES.ID
      JOIN CLINICAS ON PACIENTES.ID_CLINICA = CLINICAS.ID
      WHERE PACIENTES.ID_CLINICA = ${clinicaId}
    `;

    return await this.databaseService.executeQueryWithConfig<interfaces.Retorno>(dbConfig, query);
  }

  async backupContasPagas(
    clinicaId: number,
    dbConfig: DatabaseConfig,
  ): Promise<interfaces.ContaPaga[]> {
    const query = `
      SELECT 
        CONTASPAGAR.ID, 
        FUNCIONARIOS.NOME AS FUNCIONARIOS, 
        FORNECEDORES.RAZAOSOCIAL AS FORNECEDOR, 
        CENTROCUSTO.DESCRICAO, 
        CONTASPAGAR.DATA_VENCIMENTO, 
        CONTASPAGARITENS.DATA AS DATAPAGAMENTO, 
        FORMASPAGAMENTO.DESCRICAO AS FORMAPAGAMENTO,
        CONTASPAGARITENS.VALOR
      FROM CONTASPAGAR
      INNER JOIN CONTASPAGARITENS ON CONTASPAGAR.ID = CONTASPAGARITENS.ID_CONTAS_PAGAR
      INNER JOIN FORMASPAGAMENTO ON CONTASPAGARITENS.ID_FORMA_PAGAMENTO = FORMASPAGAMENTO.ID
      LEFT JOIN CENTROCUSTO ON CONTASPAGAR.ID_CENTRO_CUSTO = CENTROCUSTO.ID
      LEFT JOIN FORNECEDORES ON CONTASPAGAR.ID_FORNECEDOR = FORNECEDORES.ID
      LEFT JOIN FUNCIONARIOS ON CONTASPAGAR.ID_FUNCIONARIO = FUNCIONARIOS.ID
      WHERE CONTASPAGAR.ID_CLINICA = ${clinicaId}
    `;

    return await this.databaseService.executeQueryWithConfig<interfaces.ContaPaga>(dbConfig, query);
  }

  async backupContasAPagar(
    clinicaId: number,
    dbConfig: DatabaseConfig,
  ): Promise<interfaces.ContaPagar[]> {
    const query = `
      SELECT 
        CONTASPAGAR.ID, 
        FUNCIONARIOS.NOME AS FUNCIONARIOS, 
        FORNECEDORES.RAZAOSOCIAL AS FORNECEDOR, 
        CENTROCUSTO.DESCRICAO, 
        CONTASPAGAR.DATA_VENCIMENTO,
        CONTASPAGAR.VALOR
      FROM CONTASPAGAR
      LEFT JOIN CENTROCUSTO ON CONTASPAGAR.ID_CENTRO_CUSTO = CENTROCUSTO.ID
      LEFT JOIN FORNECEDORES ON CONTASPAGAR.ID_FORNECEDOR = FORNECEDORES.ID
      LEFT JOIN FUNCIONARIOS ON CONTASPAGAR.ID_FUNCIONARIO = FUNCIONARIOS.ID
      WHERE CONTASPAGAR.ID_CLINICA = ${clinicaId}
        AND CONTASPAGAR.ID_STATUS = 2
    `;

    return await this.databaseService.executeQueryWithConfig<interfaces.ContaPagar>(
      dbConfig,
      query,
    );
  }
}
