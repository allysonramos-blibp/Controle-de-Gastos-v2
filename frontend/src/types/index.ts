export type TipoTransacao = 'RECEITA' | 'DESPESA'
export type TipoPagamento = 'PIX' | 'DEBITO' | 'CARTAO_CREDITO' | 'DINHEIRO' | 'TRANSFERENCIA'
export type Categoria = 'ALIMENTACAO' | 'TRANSPORTE' | 'MORADIA' | 'LAZER' | 'SAUDE' | 'EDUCACAO' | 'VESTUARIO' | 'OUTROS'
export type StatusFatura = 'ABERTA' | 'PAGA'

export interface Transacao {
  id: number
  descricao: string
  valor: number
  data: string
  categoria: Categoria
  tipoPagamento: TipoPagamento
  tipo: TipoTransacao
  parcelaAtual?: number
  totalParcelas?: number
}

export interface TransacaoRequest {
  descricao: string
  valor: number
  data: string
  categoria: Categoria
  tipoPagamento: TipoPagamento
  tipo: TipoTransacao
  totalParcelas?: number
}

export interface Fatura {
  id: number
  mes: number
  ano: number
  total: number
  status: StatusFatura
  transacoes: Transacao[]
}

export interface DashboardData {
  totalReceitas: number
  totalDespesas: number
  saldo: number
  gastosPorCategoria: Record<string, number>
  resumoMensal: { mes: string; receitas: number; despesas: number }[]
}

export interface AuthResponse {
  token: string
  nome: string
  email: string
}

export interface User {
  nome: string
  email: string
}
