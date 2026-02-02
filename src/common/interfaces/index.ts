export interface Paciente {
  NOME: string;
  CPF: string;
  RG: string;
  CEP: string;
  DATADENASCIMENTO: Date;
  EMAIL: string;
  STATUS: string;
  UF: string;
  CIDADE: string;
  LOGRADOURO: string;
  BAIRRO: string;
  NUMERO: string;
  TEL1: string;
  TEL2: string;
  CEL: string;
  DATACRIACAO: Date;
  SEXO: string;
  COMPLEMENTO: string;
  NUMEROFICHA: string;
  FOTO: string;
  OBSERVACAO: string;
  NOME_RESPONSAVEL: string;
  CPF_RESPONSAVEL: string;
}

export interface PacienteOrigem {
  NOME: string;
  DESCRICAO: string;
}

export interface ImagemPaciente {
  CLINICA: string;
  NOME: string;
  FOTO: string;
}

export interface Agendamento {
  PACIENTES: string;
  PROFISSIONAL: string;
  DATAAGENDAMENTO: Date;
  TEMPO: string;
  OBSERVACAO: string;
  ESPECIALIDADE: string;
  PROCEDIMENTO: string;
}

export interface AtendimentoRealizadoOrto {
  DESCRICAO: string;
  VALOR_TOTAL: number;
  PACIENTE: string;
  PROFISSIONAL: string;
  DATA: Date;
  OBSERVACAO: string;
}

export interface AtendimentoRealizado {
  DESCRICAO: string;
  PACIENTE: string;
  PROFISSIONAL: string;
  DATA: Date;
  OBSERVACAO: string;
}

export interface ContaRecebida {
  VALOR: number;
  DATA: Date;
  FORMAPAGAMENTO: string;
  QTD: number;
  ESPECIALIDADE: string;
  PACIENTE: string;
}

export interface LancamentoFuturo {
  NOME: string;
  VALOR: number;
  PARCELA: number;
  DESCRICAO: string;
  DATA_LANCAMENTOS: Date;
  DATA_BAIXA: Date;
}

export interface ContaRecebidaLancamentoFuturo {
  NOME: string;
  ID_LANCAMENTO_FUTURO: number;
  ID_CONTAS_RECEBER_PACIENTE: number;
  VALOR: number;
  VALOR_PARCELADO: number;
  DATA_PAGAMENTO: Date;
  DATA_PARCELA: Date;
  DATA_BAIXA: Date;
  BAIXA: boolean;
  PARCELA: number;
}

export interface ProcedimentoOrcamento {
  PACIENTES: string;
  VALOR: number;
  TABELA: string;
  ESPECIALIDADE: string;
  PROCEDIMENTO: string;
  DENTE: string;
  FACE: string;
  ARCADA: string;
  FACE_DISTAL: string;
  FACE_LINGUAL: string;
  FACE_MESIAL: string;
  FACE_OCLUSAL: string;
  FACE_VESTIBULAR: string;
  STATUS: string;
}

export interface ProcedimentoContaAvulsaEOrto {
  PACIENTES: string;
  VALOR_TOTAL: number;
  TABELA: string;
  ESPECIALIDADE: string;
  PROCEDIMENTOS: string;
  DENTE: string;
  FACE: string;
  ARCADA: string;
  FACE_DISTAL: string;
  FACE_LINGUAL: string;
  FACE_MESIAL: string;
  FACE_OCLUSAL: string;
  FACE_VESTIBULAR: string;
  STATUS: string;
}

export interface Orcamento {
  NOME: string;
  VALOR_TOTAL: number;
  CRIADO: Date;
  CONTRATACAO: Date;
  PROFISSIONAL: string;
}

export interface Orto {
  PACIENTES: string;
  PROFISSIONAL: string;
  INICIO: Date;
  FIM: Date;
  CRIADO: Date;
  CANCELADO: Date;
  FINALIZADO: Date;
}

export interface Retorno {
  RAZAOSOCIAL: string;
  PACIENTES: string;
  OBSERVACAO: string;
  DATA: Date;
  STATUS: boolean;
}

export interface ContaPaga {
  ID: number;
  FUNCIONARIOS: string;
  FORNECEDOR: string;
  DESCRICAO: string;
  DATA_VENCIMENTO: Date;
  DATAPAGAMENTO: Date;
  FORMAPAGAMENTO: string;
  VALOR: number;
}

export interface ContaPagar {
  ID: number;
  FUNCIONARIOS: string;
  FORNECEDOR: string;
  DESCRICAO: string;
  DATA_VENCIMENTO: Date;
  VALOR: number;
}
