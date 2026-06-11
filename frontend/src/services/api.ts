import axios from 'axios'
import type { AuthResponse, DashboardData, Fatura, Transacao, TransacaoRequest } from '../types'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.clear()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const authApi = {
  login: (email: string, senha: string) =>
    api.post<AuthResponse>('/auth/login', { email, senha }).then(r => r.data),
  cadastrar: (nome: string, email: string, senha: string) =>
    api.post<AuthResponse>('/auth/cadastrar', { nome, email, senha }).then(r => r.data),
}

export const transacoesApi = {
  listar: () => api.get<Transacao[]>('/transacoes').then(r => r.data),
  listarPorMes: (mes: number, ano: number) =>
    api.get<Transacao[]>(`/transacoes/filtro?mes=${mes}&ano=${ano}`).then(r => r.data),
  salvar: (req: TransacaoRequest) =>
    api.post<Transacao[]>('/transacoes', req).then(r => r.data),
  atualizar: (id: number, req: TransacaoRequest) =>
    api.put<Transacao>(`/transacoes/${id}`, req).then(r => r.data),
  deletar: (id: number) => api.delete(`/transacoes/${id}`),
}

export const faturasApi = {
  listar: () => api.get<Fatura[]>('/faturas').then(r => r.data),
  buscar: (mes: number, ano: number) =>
    api.get<Fatura>(`/faturas/buscar?mes=${mes}&ano=${ano}`).then(r => r.data),
  pagar: (id: number) => api.post(`/faturas/${id}/pagar`),
}

export const dashboardApi = {
  get: (mes: number, ano: number) =>
    api.get<DashboardData>(`/dashboard?mes=${mes}&ano=${ano}`).then(r => r.data),
}

export default api
