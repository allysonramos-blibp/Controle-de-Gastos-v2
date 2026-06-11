import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, CreditCard, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { faturasApi } from '../services/api'
import type { Fatura } from '../types'
import clsx from 'clsx'

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const MESES_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

export default function FaturasPage() {
  const now = new Date()
  const [mes, setMes] = useState(now.getMonth() + 1)
  const [ano, setAno] = useState(now.getFullYear())
  const [fatura, setFatura] = useState<Fatura | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [allFaturas, setAllFaturas] = useState<Fatura[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [f, all] = await Promise.all([
        faturasApi.buscar(mes, ano),
        faturasApi.listar(),
      ])
      setFatura(f)
      setAllFaturas(all)
    } catch {
      toast.error('Erro ao carregar faturas')
    } finally {
      setLoading(false)
    }
  }, [mes, ano])

  useEffect(() => { load() }, [load])

  const navMes = (d: number) => {
    let m = mes + d, a = ano
    if (m > 12) { m = 1; a++ }
    if (m < 1) { m = 12; a-- }
    setMes(m); setAno(a)
  }

  const handlePagar = async () => {
    if (!fatura) return
    if (!confirm(`Confirmar pagamento de ${fmt(fatura.total)} da fatura de ${MESES[mes - 1]}/${ano}?`)) return
    setPaying(true)
    try {
      await faturasApi.pagar(fatura.id)
      toast.success('Fatura paga com sucesso!')
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao pagar fatura')
    } finally {
      setPaying(false)
    }
  }

  const openFaturas = allFaturas.filter(f => f.status === 'ABERTA' && f.total > 0)
  const totalAberto = openFaturas.reduce((s, f) => s + f.total, 0)

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Faturas do Cartão</h1>
        <p className="text-slate-500 text-sm mt-0.5">Gerencie suas faturas de crédito</p>
      </div>

      {/* Alert de faturas abertas */}
      {openFaturas.length > 0 && (
        <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
          <AlertTriangle size={18} className="text-yellow-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-300">
              {openFaturas.length} fatura{openFaturas.length > 1 ? 's' : ''} em aberto
            </p>
            <p className="text-xs text-yellow-500/80 mt-0.5">
              Total a pagar: <span className="font-mono font-semibold">{fmt(totalAberto)}</span>
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fatura principal */}
        <div className="lg:col-span-2 space-y-4">
          {/* Nav */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-2 py-1.5">
              <button onClick={() => navMes(-1)} className="p-1 hover:text-green-400 text-slate-500 transition-colors">
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-medium text-slate-200 w-32 text-center">
                {MESES[mes - 1]} {ano}
              </span>
              <button onClick={() => navMes(1)} className="p-1 hover:text-green-400 text-slate-500 transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>

            {fatura && fatura.status === 'ABERTA' && fatura.total > 0 && (
              <button
                onClick={handlePagar}
                disabled={paying}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black font-semibold
                           px-4 py-2 rounded-xl text-sm transition-all disabled:opacity-50"
              >
                {paying
                  ? <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  : <CheckCircle2 size={15} />
                }
                Pagar fatura
              </button>
            )}
          </div>

          {/* Card da fatura */}
          {loading ? (
            <div className="card flex items-center justify-center h-48">
              <span className="w-6 h-6 border-2 border-slate-700 border-t-green-500 rounded-full animate-spin" />
            </div>
          ) : fatura ? (
            <div className="card space-y-5">
              {/* Status e total */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard size={16} className="text-slate-400" />
                    <span className="text-sm text-slate-400">Fatura de {MESES[mes - 1]}/{ano}</span>
                  </div>
                  <p className="text-3xl font-bold font-mono text-slate-100">{fmt(fatura.total)}</p>
                </div>
                <div className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border',
                  fatura.status === 'PAGA'
                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                    : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                )}>
                  {fatura.status === 'PAGA'
                    ? <><CheckCircle2 size={12} /> Paga</>
                    : <><Clock size={12} /> Aberta</>
                  }
                </div>
              </div>

              {/* Progress bar */}
              {fatura.status === 'ABERTA' && fatura.total > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-1.5">Utilização do limite estimado (R$ 5.000)</p>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all duration-700"
                      style={{ width: `${Math.min((fatura.total / 5000) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-600 mt-1 font-mono">
                    {((fatura.total / 5000) * 100).toFixed(1)}% utilizado
                  </p>
                </div>
              )}

              {/* Divider */}
              <div className="border-t border-slate-800" />

              {/* Transações */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Lançamentos ({fatura.transacoes.length})
                </p>

                {fatura.transacoes.length === 0 ? (
                  <div className="text-center py-8 text-slate-600 text-sm">
                    Nenhum lançamento neste período
                  </div>
                ) : (
                  <div className="space-y-0 divide-y divide-slate-800/60">
                    {fatura.transacoes.map(t => (
                      <div key={t.id} className="flex items-center justify-between py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-200 truncate">{t.descricao}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {new Date(t.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                            {t.totalParcelas && t.totalParcelas > 1 && (
                              <span className="ml-2 text-blue-400">
                                {t.parcelaAtual}/{t.totalParcelas}x
                              </span>
                            )}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-red-400 font-mono ml-4">
                          {fmt(t.valor)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {fatura.transacoes.length > 0 && (
                  <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-700">
                    <span className="text-sm font-semibold text-slate-300">Total</span>
                    <span className="text-lg font-bold font-mono text-slate-100">{fmt(fatura.total)}</span>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Histórico */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-400">Histórico de faturas</h3>
          {allFaturas.length === 0 ? (
            <div className="card text-center text-slate-600 text-sm py-8">
              Nenhuma fatura registrada
            </div>
          ) : (
            <div className="space-y-2">
              {allFaturas.map(f => (
                <button
                  key={f.id}
                  onClick={() => { setMes(f.mes); setAno(f.ano) }}
                  className={clsx(
                    'w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-left',
                    f.mes === mes && f.ano === ano
                      ? 'bg-slate-800 border-slate-600'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                  )}
                >
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      {MESES_SHORT[f.mes - 1]} {f.ano}
                    </p>
                    <p className="text-xs font-mono text-slate-500 mt-0.5">{fmt(f.total)}</p>
                  </div>
                  <div className={clsx(
                    'flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
                    f.status === 'PAGA'
                      ? 'text-green-400 bg-green-500/10'
                      : 'text-yellow-400 bg-yellow-500/10'
                  )}>
                    {f.status === 'PAGA'
                      ? <><CheckCircle2 size={10} /> Paga</>
                      : <><Clock size={10} /> Aberta</>
                    }
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
