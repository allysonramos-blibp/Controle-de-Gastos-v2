import { useState, useEffect, useCallback, useRef } from 'react'
import {
  TrendingUp, TrendingDown, Wallet, ChevronLeft, ChevronRight,
  Target, PiggyBank, ShieldCheck, Printer, ArrowUpRight, ArrowDownRight,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { dashboardApi, transacoesApi } from '../services/api'
import type { DashboardData, Transacao, Categoria } from '../types'
import clsx from 'clsx'

// ─── Constants ────────────────────────────────────────────────────────────────

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const MESES_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

const CAT_LABELS: Record<string, string> = {
  ALIMENTACAO: 'Alimentação', TRANSPORTE: 'Transporte', MORADIA: 'Moradia',
  LAZER: 'Lazer', SAUDE: 'Saúde', EDUCACAO: 'Educação',
  VESTUARIO: 'Vestuário', OUTROS: 'Outros',
}
const CAT_ICONS: Record<string, string> = {
  ALIMENTACAO: '🍕', TRANSPORTE: '🚗', MORADIA: '🏠', LAZER: '🎮',
  SAUDE: '💊', EDUCACAO: '📚', VESTUARIO: '👕', OUTROS: '📦',
}
const CATEGORIA_COLORS: Record<string, string> = {
  ALIMENTACAO: '#22c55e', TRANSPORTE: '#3b82f6', MORADIA: '#a855f7',
  LAZER: '#f59e0b', SAUDE: '#ec4899', EDUCACAO: '#06b6d4',
  VESTUARIO: '#f97316', OUTROS: '#64748b',
}
const PAG_LABEL: Record<string, string> = {
  PIX: 'Pix', DEBITO: 'Débito', CARTAO_CREDITO: 'Cartão', DINHEIRO: 'Dinheiro', TRANSFERENCIA: 'Transferência',
}

const META_DESPESAS_DEFAULT = 2000

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}
function fmtShort(v: number) {
  if (Math.abs(v) >= 1000) return `R$${(v / 1000).toFixed(1)}k`
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

type StatCardProps = {
  label: string
  value: number
  icon: React.ElementType
  iconClass: string
  valueClass: string
  sub?: string
}
function StatCard({ label, value, icon: Icon, iconClass, valueClass, sub }: StatCardProps) {
  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm text-slate-500">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconClass}`}>
          <Icon size={16} />
        </div>
      </div>
      <p className={`stat-value ${valueClass}`}>{fmt(value)}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  )
}

type CustomTooltipProps = { active?: boolean; payload?: any[]; label?: string }
function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: '8px 12px', fontSize: 12 }}>
      {label && <p style={{ color: '#94a3b8', marginBottom: 6 }}>{label}</p>}
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color, margin: '2px 0' }}>
          {p.name}: <strong>{fmt(p.value)}</strong>
        </p>
      ))}
    </div>
  )
}

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0,1,2].map(i => <div key={i} className="card h-24 bg-slate-800/50" />)}
      </div>
      <div className="card h-16 bg-slate-800/50" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card h-60 bg-slate-800/50" />
        <div className="card h-60 bg-slate-800/50" />
      </div>
      <div className="card h-64 bg-slate-800/50" />
    </div>
  )
}

// ─── Transações Table ─────────────────────────────────────────────────────────

type TransacoesTableProps = { transacoes: Transacao[]; totalDespesas: number }

function TransacoesTable({ transacoes, totalDespesas }: TransacoesTableProps) {
  const [aba, setAba] = useState<'DESPESA' | 'RECEITA'>('DESPESA')
  const [filtroCategoria, setFiltroCategoria] = useState<Categoria | ''>('')

  const filtered = transacoes.filter(t => {
    const matchTipo = t.tipo === aba
    const matchCat = !filtroCategoria || t.categoria === filtroCategoria
    return matchTipo && matchCat
  })

  const categoriasDaAba = [...new Set(transacoes.filter(t => t.tipo === aba).map(t => t.categoria))]

  return (
    <div className="card !p-0 overflow-hidden">
      {/* Aba header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-800">
        <div className="flex gap-1">
          {(['DESPESA', 'RECEITA'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setAba(t); setFiltroCategoria('') }}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                aba === t
                  ? t === 'DESPESA'
                    ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                    : 'bg-green-500/15 text-green-400 border border-green-500/30'
                  : 'text-slate-500 hover:text-slate-300'
              )}
            >
              {t === 'DESPESA' ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
              {t === 'DESPESA' ? 'Despesas' : 'Receitas'}
            </button>
          ))}
        </div>

        {/* Filtro categoria */}
        <select
          className="input !py-1 !text-xs w-auto"
          value={filtroCategoria}
          onChange={e => setFiltroCategoria(e.target.value as Categoria | '')}
        >
          <option value="">Todas as categorias</option>
          {categoriasDaAba.map(c => (
            <option key={c} value={c}>{CAT_ICONS[c]} {CAT_LABELS[c]}</option>
          ))}
        </select>
      </div>

      {/* Tabela */}
      {filtered.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-slate-600 text-sm">
          Nenhum registro encontrado
        </div>
      ) : (
        <div className="divide-y divide-slate-800/60">
          {/* Header */}
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-5 py-2 text-xs text-slate-600 font-medium">
            <span>Descrição</span>
            <span className="text-center">Categoria</span>
            <span className="text-center">Pagamento</span>
            <span className="text-right">Valor</span>
          </div>
          {filtered.map(t => (
            <div key={t.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-5 py-3 items-center hover:bg-slate-800/30 transition-colors">
              <div>
                <p className="text-sm text-slate-200 truncate">{t.descricao}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {new Date(t.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                </p>
              </div>
              <span className="text-xs text-slate-400 flex items-center gap-1 whitespace-nowrap">
                {CAT_ICONS[t.categoria]} {CAT_LABELS[t.categoria]}
              </span>
              <span className="text-xs text-slate-500 whitespace-nowrap">{PAG_LABEL[t.tipoPagamento] ?? t.tipoPagamento}</span>
              <span className={clsx('font-mono text-sm font-semibold text-right', t.tipo === 'RECEITA' ? 'text-green-400' : 'text-red-400')}>
                {t.tipo === 'RECEITA' ? '+' : '-'}{fmt(t.valor)}
              </span>
            </div>
          ))}
          {/* Total row */}
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-5 py-3 bg-slate-800/30">
            <span className="text-xs text-slate-500 font-medium">{filtered.length} registros</span>
            <span /><span />
            <span className={clsx('font-mono text-sm font-bold text-right', aba === 'RECEITA' ? 'text-green-400' : 'text-red-400')}>
              {fmt(filtered.reduce((s, t) => s + t.valor, 0))}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Painel Saldo Inteligente ─────────────────────────────────────────────────

type SaldoPainelProps = { saldo: number }

function SaldoPainel({ saldo }: SaldoPainelProps) {
  const [metaEconomia, setMetaEconomia] = useState(500)
  const [reservaAtual, setReservaAtual] = useState(0)
  const [reservaMeta, setReservaMeta] = useState(6) // meses de reserva

  const disponivel = Math.max(0, saldo - metaEconomia)
  const mesesParaReserva = reservaMeta > 0 && metaEconomia > 0
    ? Math.ceil((reservaMeta * metaEconomia - reservaAtual) / metaEconomia)
    : 0
  const percReserva = reservaMeta > 0
    ? Math.min((reservaAtual / (reservaMeta * metaEconomia)) * 100, 100)
    : 0

  return (
    <div className="card space-y-5">
      <div className="flex items-center gap-2">
        <PiggyBank size={16} className="text-green-400" />
        <h3 className="text-sm font-semibold text-slate-300">O que fazer com o saldo?</h3>
        <span className="ml-auto font-mono text-sm font-bold text-green-400">{fmt(saldo)}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Meta de economia mensal */}
        <div className="bg-slate-800/50 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Target size={13} className="text-yellow-400" />
            <p className="text-xs font-medium text-slate-300">Meta de economia</p>
          </div>
          <div>
            <label className="text-xs text-slate-500">Guardar por mês</label>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-500">R$</span>
              <input
                type="number"
                min={0}
                step={50}
                className="input !py-1 !text-sm w-full"
                value={metaEconomia}
                onChange={e => setMetaEconomia(Number(e.target.value))}
              />
            </div>
          </div>
          <div className={clsx('rounded-lg p-2.5 text-center', saldo >= metaEconomia ? 'bg-green-500/10' : 'bg-red-500/10')}>
            <p className="text-xs text-slate-500 mb-0.5">Disponível após guardar</p>
            <p className={clsx('font-mono text-sm font-bold', saldo >= metaEconomia ? 'text-green-400' : 'text-red-400')}>
              {fmt(disponivel)}
            </p>
          </div>
        </div>

        {/* Reserva de emergência */}
        <div className="bg-slate-800/50 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={13} className="text-blue-400" />
            <p className="text-xs font-medium text-slate-300">Reserva de emergência</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-500">Já guardei (R$)</label>
              <input
                type="number"
                min={0}
                step={100}
                className="input !py-1 !text-xs w-full mt-1"
                value={reservaAtual}
                onChange={e => setReservaAtual(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">Meta (meses)</label>
              <input
                type="number"
                min={1}
                max={24}
                className="input !py-1 !text-xs w-full mt-1"
                value={reservaMeta}
                onChange={e => setReservaMeta(Number(e.target.value))}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>{percReserva.toFixed(0)}% completo</span>
              <span>{fmt(reservaAtual)} / {fmt(reservaMeta * metaEconomia)}</span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${percReserva}%` }} />
            </div>
            {mesesParaReserva > 0 && (
              <p className="text-xs text-slate-500 mt-1.5">~{mesesParaReserva} meses para completar</p>
            )}
          </div>
        </div>

        {/* Sugestão de alocação */}
        <div className="bg-slate-800/50 rounded-xl p-4 space-y-2.5">
          <div className="flex items-center gap-2">
            <TrendingUp size={13} className="text-purple-400" />
            <p className="text-xs font-medium text-slate-300">Sugestão 50/30/20</p>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Método clássico aplicado ao seu saldo de <span className="text-slate-300 font-medium">{fmt(saldo)}</span>:
          </p>
          {[
            { label: 'Necessidades', pct: 50, color: 'bg-blue-500', textColor: 'text-blue-400' },
            { label: 'Lazer', pct: 30, color: 'bg-purple-500', textColor: 'text-purple-400' },
            { label: 'Investimentos', pct: 20, color: 'bg-green-500', textColor: 'text-green-400' },
          ].map(({ label, pct, color, textColor }) => (
            <div key={label} className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${color}`} />
              <span className="text-xs text-slate-400 flex-1">{label} ({pct}%)</span>
              <span className={`text-xs font-mono font-semibold ${textColor}`}>{fmt(saldo * pct / 100)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── PDF Print ────────────────────────────────────────────────────────────────

function gerarPDF(
  mes: number, ano: number,
  data: DashboardData,
  transacoes: Transacao[],
  pieData: { name: string; value: number; color: string }[],
) {
  const nomeMes = MESES[mes - 1]
  const receitas = transacoes.filter(t => t.tipo === 'RECEITA').sort((a, b) => a.data.localeCompare(b.data))
  const despesas = transacoes.filter(t => t.tipo === 'DESPESA').sort((a, b) => a.data.localeCompare(b.data))

  const rowStyle = 'border-bottom:1px solid #e2e8f0;padding:8px 12px;font-size:12px;'
  const thStyle = 'background:#f8fafc;padding:8px 12px;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.04em;border-bottom:2px solid #e2e8f0;'

  const tabelaTransacoes = (lista: Transacao[], tipo: 'RECEITA' | 'DESPESA') => {
    const cor = tipo === 'RECEITA' ? '#16a34a' : '#dc2626'
    const total = lista.reduce((s, t) => s + t.valor, 0)
    return `
      <table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
        <thead>
          <tr>
            <th style="${thStyle}text-align:left;">Data</th>
            <th style="${thStyle}text-align:left;">Descrição</th>
            <th style="${thStyle}text-align:left;">Categoria</th>
            <th style="${thStyle}text-align:left;">Pagamento</th>
            <th style="${thStyle}text-align:right;">Valor</th>
          </tr>
        </thead>
        <tbody>
          ${lista.map(t => `
            <tr>
              <td style="${rowStyle}color:#64748b;">${new Date(t.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
              <td style="${rowStyle}font-weight:500;">${t.descricao}</td>
              <td style="${rowStyle}color:#64748b;">${CAT_ICONS[t.categoria] ?? ''} ${CAT_LABELS[t.categoria] ?? t.categoria}</td>
              <td style="${rowStyle}color:#64748b;">${PAG_LABEL[t.tipoPagamento] ?? t.tipoPagamento}</td>
              <td style="${rowStyle}text-align:right;font-weight:600;color:${cor};font-family:monospace;">${fmt(t.valor)}</td>
            </tr>
          `).join('')}
          <tr style="background:#f8fafc;">
            <td colspan="4" style="padding:10px 12px;font-size:12px;font-weight:700;color:#0f172a;">Total</td>
            <td style="padding:10px 12px;font-size:13px;font-weight:700;color:${cor};text-align:right;font-family:monospace;">${fmt(total)}</td>
          </tr>
        </tbody>
      </table>`
  }

  const catRows = pieData.map(e => {
    const pct = data.totalDespesas > 0 ? ((e.value / data.totalDespesas) * 100).toFixed(1) : '0'
    return `<tr>
      <td style="${rowStyle}"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${e.color};margin-right:6px;vertical-align:middle;"></span>${e.name}</td>
      <td style="${rowStyle}text-align:right;font-family:monospace;">${fmt(e.value)}</td>
      <td style="${rowStyle}text-align:right;color:#64748b;">${pct}%</td>
    </tr>`
  }).join('')

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Relatório Financeiro — ${nomeMes} ${ano}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a; background: #fff; }
  .page { padding: 40px 48px; max-width: 900px; margin: 0 auto; }
  .page-break { page-break-before: always; padding-top: 40px; }
  h1 { font-size: 24px; font-weight: 700; color: #0f172a; }
  h2 { font-size: 15px; font-weight: 700; color: #0f172a; margin: 28px 0 12px; }
  h3 { font-size: 13px; font-weight: 600; color: #475569; margin: 20px 0 8px; }
  .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
  .header { border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
  .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 20px 0; }
  .stat-box { border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; }
  .stat-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 6px; }
  .stat-value { font-size: 22px; font-weight: 700; font-family: monospace; }
  .green { color: #16a34a; } .red { color: #dc2626; } .blue { color: #1d4ed8; }
  .cat-table { width: 100%; border-collapse: collapse; }
  @media print {
    .page-break { page-break-before: always; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <h1>Relatório Financeiro</h1>
      <p class="subtitle">${nomeMes} de ${ano} · gerado em ${new Date().toLocaleDateString('pt-BR')}</p>
    </div>
    <p style="font-size:13px;color:#64748b;">Controle de Gastos</p>
  </div>

  <h2>Resumo do mês</h2>
  <div class="stats">
    <div class="stat-box">
      <div class="stat-label">Receitas</div>
      <div class="stat-value green">${fmt(data.totalReceitas)}</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Despesas</div>
      <div class="stat-value red">${fmt(data.totalDespesas)}</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Saldo</div>
      <div class="stat-value ${data.saldo >= 0 ? 'blue' : 'red'}">${fmt(data.saldo)}</div>
    </div>
  </div>

  <h2>Gastos por categoria</h2>
  <table class="cat-table">
    <thead>
      <tr>
        <th style="${thStyle}text-align:left;">Categoria</th>
        <th style="${thStyle}text-align:right;">Valor</th>
        <th style="${thStyle}text-align:right;">% do total</th>
      </tr>
    </thead>
    <tbody>${catRows}</tbody>
  </table>

  <!-- Página 2: extrato -->
  <div class="page-break">
    <div class="header">
      <div>
        <h1>Extrato — ${nomeMes} ${ano}</h1>
        <p class="subtitle">Listagem completa de transações</p>
      </div>
    </div>

    <h3>Receitas (${receitas.length})</h3>
    ${receitas.length > 0 ? tabelaTransacoes(receitas, 'RECEITA') : '<p style="font-size:12px;color:#94a3b8;padding:12px 0;">Sem receitas neste período.</p>'}

    <h3 style="margin-top:28px;">Despesas (${despesas.length})</h3>
    ${despesas.length > 0 ? tabelaTransacoes(despesas, 'DESPESA') : '<p style="font-size:12px;color:#94a3b8;padding:12px 0;">Sem despesas neste período.</p>'}
  </div>
</div>
</body>
</html>`

  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 400)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const now = new Date()
  const [mes, setMes] = useState(now.getMonth() + 1)
  const [ano, setAno] = useState(now.getFullYear())
  const [data, setData] = useState<DashboardData | null>(null)
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchData = useCallback(() => {
    setLoading(true)
    setError(false)
    Promise.all([
      dashboardApi.get(mes, ano),
      transacoesApi.listarPorMes(mes, ano),
    ])
      .then(([dash, trans]) => { setData(dash); setTransacoes(trans) })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [mes, ano])

  useEffect(() => { fetchData() }, [fetchData])

  const navMes = useCallback((d: number) => {
    setMes(prev => {
      const m = prev + d
      if (m > 12) { setAno(a => a + 1); return 1 }
      if (m < 1) { setAno(a => a - 1); return 12 }
      return m
    })
  }, [])

  const pieData = data
    ? Object.entries(data.gastosPorCategoria)
        .filter(([, v]) => v > 0)
        .sort(([, a], [, b]) => b - a)
        .map(([k, v]) => ({ name: CAT_LABELS[k] ?? k, value: v, color: CATEGORIA_COLORS[k] ?? '#64748b' }))
    : []

  const percMeta = data ? Math.min((data.totalDespesas / META_DESPESAS_DEFAULT) * 100, 100) : 0
  const metaColor = percMeta >= 90 ? 'bg-red-500' : percMeta >= 70 ? 'bg-yellow-500' : 'bg-green-500'
  const metaStatus = percMeta >= 90 ? '⚠️ Limite quase atingido' : percMeta >= 70 ? 'Atenção com os gastos' : 'Dentro do limite'

  const saldoVsMesAnterior = data?.saldo != null && (data as any).saldoMesAnterior != null
    ? data.saldo - (data as any).saldoMesAnterior
    : null

  return (
    <div className="space-y-6 animate-slide-up">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Resumo financeiro do período</p>
        </div>
        <div className="flex items-center gap-2">
          {/* PDF */}
          {data && (
            <button
              onClick={() => gerarPDF(mes, ano, data, transacoes, pieData)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-all"
            >
              <Printer size={13} /> Imprimir PDF
            </button>
          )}
          {/* Mês nav */}
          <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-xl px-2 py-1.5">
            <button onClick={() => navMes(-1)} className="p-1 hover:text-green-400 text-slate-500 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium text-slate-200 w-24 text-center">
              {MESES_SHORT[mes - 1]} {ano}
            </span>
            <button onClick={() => navMes(1)} className="p-1 hover:text-green-400 text-slate-500 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {loading ? <Skeleton /> : error ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-500">
          <p className="text-sm">Não foi possível carregar os dados.</p>
          <button onClick={fetchData} className="text-xs text-green-400 hover:text-green-300 underline underline-offset-2 transition-colors">
            Tentar novamente
          </button>
        </div>
      ) : data ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Receitas" value={data.totalReceitas} icon={TrendingUp}
              iconClass="bg-green-500/10 border border-green-500/20 text-green-400" valueClass="text-green-400" />
            <StatCard label="Despesas" value={data.totalDespesas} icon={TrendingDown}
              iconClass="bg-red-500/10 border border-red-500/20 text-red-400" valueClass="text-red-400" />
            <StatCard label="Saldo" value={data.saldo} icon={Wallet}
              iconClass="bg-blue-500/10 border border-blue-500/20 text-blue-400"
              valueClass={data.saldo >= 0 ? 'text-slate-100' : 'text-red-400'}
              sub={saldoVsMesAnterior != null
                ? saldoVsMesAnterior >= 0
                  ? `▲ ${fmt(saldoVsMesAnterior)} vs mês anterior`
                  : `▼ ${fmt(Math.abs(saldoVsMesAnterior))} vs mês anterior`
                : undefined}
            />
          </div>

          {/* Meta de gastos */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target size={14} className="text-slate-500" />
                <p className="text-sm font-medium text-slate-300">Meta de gastos mensais</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">{metaStatus}</span>
                <p className="text-xs text-slate-500 font-mono">{fmt(data.totalDespesas)} / {fmt(META_DESPESAS_DEFAULT)}</p>
              </div>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${metaColor}`} style={{ width: `${percMeta}%` }} />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {percMeta.toFixed(1)}% utilizado · faltam {fmt(Math.max(0, META_DESPESAS_DEFAULT - data.totalDespesas))}
            </p>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Últimos 6 meses</h3>
              {data.resumoMensal?.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.resumoMensal} barGap={4}>
                    <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="receitas" name="Receitas" fill="#22c55e" radius={[4,4,0,0]} maxBarSize={28} />
                    <Bar dataKey="despesas" name="Despesas" fill="#ef4444" radius={[4,4,0,0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-48 text-slate-600 text-sm">Sem dados para exibir</div>
              )}
            </div>

            <div className="card">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Gastos por categoria</h3>
              {pieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                        {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-2 space-y-1.5">
                    {pieData.map(e => {
                      const pct = data.totalDespesas > 0 ? ((e.value / data.totalDespesas) * 100).toFixed(1) : '0.0'
                      return (
                        <div key={e.name} className="flex items-center gap-2 text-xs">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: e.color }} />
                          <span className="text-slate-400 flex-1">{e.name}</span>
                          <span className="text-slate-500 font-mono">{pct}%</span>
                          <span className="text-slate-300 font-mono">{fmt(e.value)}</span>
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-48 text-slate-600 text-sm">Sem despesas neste período</div>
              )}
            </div>
          </div>

          {/* Tabela de transações */}
          <TransacoesTable transacoes={transacoes} totalDespesas={data.totalDespesas} />

          {/* Painel saldo inteligente */}
          {data.saldo > 0 && <SaldoPainel saldo={data.saldo} />}
        </>
      ) : null}
    </div>
  )
}