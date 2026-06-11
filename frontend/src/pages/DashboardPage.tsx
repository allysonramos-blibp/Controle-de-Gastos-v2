import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Wallet, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { dashboardApi } from '../services/api'
import type { DashboardData } from '../types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const CATEGORIA_COLORS: Record<string, string> = {
  ALIMENTACAO: '#22c55e', TRANSPORTE: '#3b82f6', MORADIA: '#a855f7',
  LAZER: '#f59e0b', SAUDE: '#ec4899', EDUCACAO: '#06b6d4',
  VESTUARIO: '#f97316', OUTROS: '#64748b',
}

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function StatCard({ label, value, icon: Icon, color, sub }: any) {
  return (
    <div className="card group">
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm text-slate-500">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={16} />
        </div>
      </div>
      <p className={`stat-value ${sub}`}>{fmt(value)}</p>
    </div>
  )
}

export default function DashboardPage() {
  const now = new Date()
  const [mes, setMes] = useState(now.getMonth() + 1)
  const [ano, setAno] = useState(now.getFullYear())
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    dashboardApi.get(mes, ano)
      .then(setData)
      .finally(() => setLoading(false))
  }, [mes, ano])

  const navMes = (d: number) => {
    let m = mes + d, a = ano
    if (m > 12) { m = 1; a++ }
    if (m < 1) { m = 12; a-- }
    setMes(m); setAno(a)
  }

  const pieData = data ? Object.entries(data.gastosPorCategoria)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: k, value: v, color: CATEGORIA_COLORS[k] || '#64748b' }))
    : []

  const metaDespesas = 2000
  const percMeta = data ? Math.min((data.totalDespesas / metaDespesas) * 100, 100) : 0

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Resumo financeiro do período</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-2 py-1.5">
          <button onClick={() => navMes(-1)} className="p-1 hover:text-green-400 text-slate-500 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-medium text-slate-200 w-24 text-center">
            {MESES[mes - 1]} {ano}
          </span>
          <button onClick={() => navMes(1)} className="p-1 hover:text-green-400 text-slate-500 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-500">
          <span className="inline-block w-6 h-6 border-2 border-slate-700 border-t-green-500 rounded-full animate-spin" />
        </div>
      ) : data ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Receitas" value={data.totalReceitas} icon={TrendingUp}
              color="bg-green-500/10 border border-green-500/20 text-green-400" sub="text-green-400" />
            <StatCard label="Despesas" value={data.totalDespesas} icon={TrendingDown}
              color="bg-red-500/10 border border-red-500/20 text-red-400" sub="text-red-400" />
            <StatCard label="Saldo" value={data.saldo} icon={Wallet}
              color="bg-blue-500/10 border border-blue-500/20 text-blue-400"
              sub={data.saldo >= 0 ? 'text-slate-100' : 'text-red-400'} />
          </div>

          {/* Meta */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-300">Meta de gastos mensais</p>
              <p className="text-xs text-slate-500 font-mono">{fmt(data.totalDespesas)} / {fmt(metaDespesas)}</p>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${percMeta >= 90 ? 'bg-red-500' : percMeta >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${percMeta}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">{percMeta.toFixed(1)}% utilizado</p>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Bar */}
            <div className="card">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Últimos 6 meses</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.resumoMensal} barGap={4}>
                  <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, fontSize: 12 }}
                    formatter={(v: any) => fmt(v)}
                  />
                  <Bar dataKey="receitas" name="Receitas" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="despesas" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie */}
            <div className="card">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Gastos por categoria</h3>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="45%" innerRadius={55} outerRadius={80}
                      dataKey="value" paddingAngle={3}>
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, fontSize: 12 }}
                      formatter={(v: any) => fmt(v)}
                    />
                    <Legend
                      formatter={v => <span style={{ fontSize: 11, color: '#94a3b8' }}>{v}</span>}
                      iconSize={8} iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-48 text-slate-600 text-sm">
                  Sem despesas neste período
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
