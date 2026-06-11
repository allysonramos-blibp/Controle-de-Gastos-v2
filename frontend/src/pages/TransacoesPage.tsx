import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Pencil, Trash2, ChevronLeft, ChevronRight, X, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'
import { transacoesApi } from '../services/api'
import type { Transacao, TransacaoRequest, Categoria, TipoPagamento, TipoTransacao } from '../types'
import clsx from 'clsx'

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const CATEGORIAS: Categoria[] = ['ALIMENTACAO', 'TRANSPORTE', 'MORADIA', 'LAZER', 'SAUDE', 'EDUCACAO', 'VESTUARIO', 'OUTROS']
const PAGAMENTOS: TipoPagamento[] = ['PIX', 'DEBITO', 'CARTAO_CREDITO', 'DINHEIRO', 'TRANSFERENCIA']

const CAT_ICONS: Record<Categoria, string> = {
  ALIMENTACAO: '🍕', TRANSPORTE: '🚗', MORADIA: '🏠', LAZER: '🎮',
  SAUDE: '💊', EDUCACAO: '📚', VESTUARIO: '👕', OUTROS: '📦'
}
const PAG_LABEL: Record<TipoPagamento, string> = {
  PIX: 'Pix', DEBITO: 'Débito', CARTAO_CREDITO: 'Cartão', DINHEIRO: 'Dinheiro', TRANSFERENCIA: 'Transferência'
}

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

const EMPTY_FORM: TransacaoRequest = {
  descricao: '', valor: 0, data: new Date().toISOString().split('T')[0],
  categoria: 'OUTROS', tipoPagamento: 'PIX', tipo: 'DESPESA', totalParcelas: undefined
}

export default function TransacoesPage() {
  const now = new Date()
  const [mes, setMes] = useState(now.getMonth() + 1)
  const [ano, setAno] = useState(now.getFullYear())
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Transacao | null>(null)
  const [form, setForm] = useState<TransacaoRequest>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [filtroTipo, setFiltroTipo] = useState<'' | TipoTransacao>('')

  const load = useCallback(() => {
    setLoading(true)
    transacoesApi.listarPorMes(mes, ano)
      .then(setTransacoes)
      .finally(() => setLoading(false))
  }, [mes, ano])

  useEffect(() => { load() }, [load])

  const navMes = (d: number) => {
    let m = mes + d, a = ano
    if (m > 12) { m = 1; a++ }
    if (m < 1) { m = 12; a-- }
    setMes(m); setAno(a)
  }

  const openNew = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setModal(true)
  }

  const openEdit = (t: Transacao) => {
    setEditing(t)
    setForm({
      descricao: t.descricao, valor: t.valor, data: t.data,
      categoria: t.categoria, tipoPagamento: t.tipoPagamento, tipo: t.tipo,
    })
    setModal(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir esta transação?')) return
    await toast.promise(
      transacoesApi.deletar(id).then(load),
      { loading: 'Excluindo...', success: 'Excluído!', error: 'Erro ao excluir' }
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        await transacoesApi.atualizar(editing.id, form)
        toast.success('Transação atualizada!')
      } else {
        const saved = await transacoesApi.salvar(form)
        toast.success(saved.length > 1 ? `${saved.length} parcelas criadas!` : 'Transação salva!')
      }
      setModal(false)
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const filtered = transacoes.filter(t => {
    const matchSearch = t.descricao.toLowerCase().includes(search.toLowerCase())
    const matchTipo = !filtroTipo || t.tipo === filtroTipo
    return matchSearch && matchTipo
  })

  const totalReceitas = filtered.filter(t => t.tipo === 'RECEITA').reduce((s, t) => s + t.valor, 0)
  const totalDespesas = filtered.filter(t => t.tipo === 'DESPESA').reduce((s, t) => s + t.valor, 0)

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Transações</h1>
          <p className="text-slate-500 text-sm mt-0.5">{filtered.length} registros encontrados</p>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Nova
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Mes nav */}
        <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-xl px-2 py-1.5">
          <button onClick={() => navMes(-1)} className="p-1 hover:text-green-400 text-slate-500 transition-colors">
            <ChevronLeft size={15} />
          </button>
          <span className="text-sm font-medium text-slate-200 w-20 text-center">
            {MESES[mes - 1]} {ano}
          </span>
          <button onClick={() => navMes(1)} className="p-1 hover:text-green-400 text-slate-500 transition-colors">
            <ChevronRight size={15} />
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="input pl-9 py-2 text-sm"
            placeholder="Buscar..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Tipo filter */}
        <div className="flex gap-1">
          {(['', 'RECEITA', 'DESPESA'] as const).map(t => (
            <button
              key={t}
              onClick={() => setFiltroTipo(t)}
              className={clsx(
                'px-3 py-2 rounded-xl text-xs font-medium transition-all',
                filtroTipo === t
                  ? t === 'RECEITA' ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : t === 'DESPESA' ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-slate-700 text-slate-200 border border-slate-600'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 hover:text-slate-300'
              )}
            >
              {t === '' ? 'Todos' : t === 'RECEITA' ? 'Receitas' : 'Despesas'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="card !p-4">
          <p className="text-xs text-slate-500 mb-1">Receitas filtradas</p>
          <p className="text-lg font-bold text-green-400 font-mono">{fmt(totalReceitas)}</p>
        </div>
        <div className="card !p-4">
          <p className="text-xs text-slate-500 mb-1">Despesas filtradas</p>
          <p className="text-lg font-bold text-red-400 font-mono">{fmt(totalDespesas)}</p>
        </div>
        <div className="card !p-4 col-span-2 sm:col-span-1">
          <p className="text-xs text-slate-500 mb-1">Saldo filtrado</p>
          <p className={clsx('text-lg font-bold font-mono', totalReceitas - totalDespesas >= 0 ? 'text-slate-100' : 'text-red-400')}>
            {fmt(totalReceitas - totalDespesas)}
          </p>
        </div>
      </div>

      {/* List */}
      <div className="card !p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-slate-500">
            <span className="inline-block w-5 h-5 border-2 border-slate-700 border-t-green-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-600">
            <p className="text-sm">Nenhuma transação encontrada</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filtered.map(t => (
              <div key={t.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-800/40 transition-colors group">
                <div className="text-xl w-8 text-center select-none">{CAT_ICONS[t.categoria]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{t.descricao}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500">
                      {new Date(t.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </span>
                    <span className="text-xs text-slate-600">•</span>
                    <span className="text-xs text-slate-500">{PAG_LABEL[t.tipoPagamento]}</span>
                    {t.tipoPagamento === 'CARTAO_CREDITO' && t.totalParcelas && t.totalParcelas > 1 && (
                      <>
                        <span className="text-xs text-slate-600">•</span>
                        <span className="text-xs text-blue-400 flex items-center gap-1">
                          <CreditCard size={10} />
                          {t.parcelaAtual}/{t.totalParcelas}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <span className={clsx('font-mono font-semibold text-sm', t.tipo === 'RECEITA' ? 'text-green-400' : 'text-red-400')}>
                  {t.tipo === 'RECEITA' ? '+' : '-'}{fmt(t.valor)}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(t)}
                    className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-500 hover:text-slate-200 transition-colors">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => handleDelete(t.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModal(false)} />
          <div className="relative w-full max-w-lg card animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-slate-100">
                {editing ? 'Editar transação' : 'Nova transação'}
              </h2>
              <button onClick={() => setModal(false)} className="text-slate-500 hover:text-slate-300 transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tipo toggle */}
              <div className="flex gap-2">
                {(['RECEITA', 'DESPESA'] as TipoTransacao[]).map(tp => (
                  <button key={tp} type="button"
                    onClick={() => setForm(p => ({ ...p, tipo: tp }))}
                    className={clsx(
                      'flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border',
                      form.tipo === tp
                        ? tp === 'RECEITA'
                          ? 'bg-green-500/15 text-green-400 border-green-500/30'
                          : 'bg-red-500/15 text-red-400 border-red-500/30'
                        : 'bg-slate-800 text-slate-500 border-slate-700 hover:text-slate-300'
                    )}>
                    {tp === 'RECEITA' ? '↑ Receita' : '↓ Despesa'}
                  </button>
                ))}
              </div>

              <div>
                <label className="label">Descrição</label>
                <input className="input" placeholder="Ex: Supermercado"
                  value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Valor (R$)</label>
                  <input type="number" step="0.01" min="0.01" className="input"
                    value={form.valor || ''} onChange={e => setForm(p => ({ ...p, valor: parseFloat(e.target.value) }))} required />
                </div>
                <div>
                  <label className="label">Data</label>
                  <input type="date" className="input"
                    value={form.data} onChange={e => setForm(p => ({ ...p, data: e.target.value }))} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Categoria</label>
                  <select className="input" value={form.categoria}
                    onChange={e => setForm(p => ({ ...p, categoria: e.target.value as Categoria }))}>
                    {CATEGORIAS.map(c => (
                      <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Pagamento</label>
                  <select className="input" value={form.tipoPagamento}
                    onChange={e => setForm(p => ({ ...p, tipoPagamento: e.target.value as TipoPagamento }))}>
                    {PAGAMENTOS.map(p => (
                      <option key={p} value={p}>{PAG_LABEL[p]}</option>
                    ))}
                  </select>
                </div>
              </div>

              {form.tipoPagamento === 'CARTAO_CREDITO' && !editing && (
                <div>
                  <label className="label">Parcelas (1 = à vista)</label>
                  <input type="number" min="1" max="72" className="input"
                    value={form.totalParcelas || 1}
                    onChange={e => setForm(p => ({ ...p, totalParcelas: parseInt(e.target.value) }))} />
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setModal(false)} className="btn-ghost flex-1">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving ? <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
