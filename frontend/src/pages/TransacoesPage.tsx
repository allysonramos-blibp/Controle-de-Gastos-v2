import { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, Search, Pencil, Trash2, ChevronLeft, ChevronRight, CreditCard, ArrowUpDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { transacoesApi } from '../services/api'
import type { Transacao, TransacaoRequest, Categoria, TipoTransacao } from '../types'
import clsx from 'clsx'
import TransacaoModal, { CAT_ICONS, CAT_LABELS, PAG_LABEL } from '../components/Transacaomodal'
import ConfirmModal from '../components/Confirmmodal'

// ─── Constants ────────────────────────────────────────────────────────────────

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const CATEGORIAS_LIST = Object.keys(CAT_ICONS) as Categoria[]

const EMPTY_FORM: TransacaoRequest = {
  descricao: '',
  valor: 0,
  data: new Date().toISOString().split('T')[0],
  categoria: 'OUTROS',
  tipoPagamento: 'PIX',
  tipo: 'DESPESA',
  totalParcelas: undefined,
}

type SortField = 'data' | 'valor' | 'descricao' | 'categoria'
type SortDir = 'asc' | 'desc'

const PAGE_SIZE = 20

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TransacoesPage() {
  const now = new Date()

  // Navigation
  const [mes, setMes] = useState(now.getMonth() + 1)
  const [ano, setAno] = useState(now.getFullYear())

  // Data
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<'' | TipoTransacao>('')
  const [filtroCategoria, setFiltroCategoria] = useState<Categoria | ''>('')

  // Sorting
  const [sortField, setSortField] = useState<SortField>('data')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  // Pagination
  const [page, setPage] = useState(1)

  // Modals
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Transacao | null>(null)
  const [form, setForm] = useState<TransacaoRequest>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  // Confirm delete
  const [confirmId, setConfirmId] = useState<number | null>(null)

  // ─── Data loading ──────────────────────────────────────────────────────────

  const load = useCallback(() => {
    setLoading(true)
    transacoesApi.listarPorMes(mes, ano)
      .then(data => {
        setTransacoes(data)
        setPage(1)
      })
      .finally(() => setLoading(false))
  }, [mes, ano])

  useEffect(() => { load() }, [load])

  // ─── Month navigation ──────────────────────────────────────────────────────

  const navMes = useCallback((d: number) => {
    setMes(prev => {
      let m = prev + d
      let a = ano
      if (m > 12) { m = 1; setAno(a + 1) }
      else if (m < 1) { m = 12; setAno(a - 1) }
      return m
    })
  }, [ano])

  // ─── Sorting ───────────────────────────────────────────────────────────────

  const toggleSort = useCallback((field: SortField) => {
    setSortField(prev => {
      if (prev === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
      else { setSortDir('asc') }
      return field
    })
    setPage(1)
  }, [])

  // ─── Filtered + sorted + paginated ────────────────────────────────────────

  const filtered = useMemo(() => {
    return transacoes.filter(t => {
      const matchSearch = t.descricao.toLowerCase().includes(search.toLowerCase())
      const matchTipo = !filtroTipo || t.tipo === filtroTipo
      const matchCat = !filtroCategoria || t.categoria === filtroCategoria
      return matchSearch && matchTipo && matchCat
    })
  }, [transacoes, search, filtroTipo, filtroCategoria])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0
      if (sortField === 'data') cmp = a.data.localeCompare(b.data)
      else if (sortField === 'valor') cmp = a.valor - b.valor
      else if (sortField === 'descricao') cmp = a.descricao.localeCompare(b.descricao)
      else if (sortField === 'categoria') cmp = a.categoria.localeCompare(b.categoria)
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortField, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const totalReceitas = filtered.filter(t => t.tipo === 'RECEITA').reduce((s, t) => s + t.valor, 0)
  const totalDespesas = filtered.filter(t => t.tipo === 'DESPESA').reduce((s, t) => s + t.valor, 0)

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const openNew = useCallback(() => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setModal(true)
  }, [])

  const openEdit = useCallback((t: Transacao) => {
    setEditing(t)
    setForm({
      descricao: t.descricao,
      valor: t.valor,
      data: t.data,
      categoria: t.categoria,
      tipoPagamento: t.tipoPagamento,
      tipo: t.tipo,
    })
    setModal(true)
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    if (confirmId == null) return
    const id = confirmId
    setConfirmId(null)
    await toast.promise(
      transacoesApi.deletar(id).then(load),
      { loading: 'Excluindo...', success: 'Transação excluída!', error: 'Erro ao excluir' }
    )
  }, [confirmId, load])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.valor || form.valor <= 0) return
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
  }, [editing, form, load])

  // ─── Sort header helper ────────────────────────────────────────────────────

  const SortBtn = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => toggleSort(field)}
      className={clsx(
        'flex items-center gap-1 text-xs font-medium transition-colors',
        sortField === field ? 'text-green-400' : 'text-slate-500 hover:text-slate-300'
      )}
    >
      {label}
      <ArrowUpDown size={11} className={sortField === field ? 'opacity-100' : 'opacity-40'} />
      {sortField === field && (
        <span className="text-[10px]">{sortDir === 'asc' ? '↑' : '↓'}</span>
      )}
    </button>
  )

  // ─── Empty state ───────────────────────────────────────────────────────────

  const hasActiveFilters = search || filtroTipo || filtroCategoria
  const isEmpty = filtered.length === 0

  // ─── Render ────────────────────────────────────────────────────────────────

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

      {/* Filters row 1: mes nav + search + tipo */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Mês nav */}
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
            placeholder="Buscar descrição..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>

        {/* Tipo filter */}
        <div className="flex gap-1">
          {(['', 'RECEITA', 'DESPESA'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setFiltroTipo(t); setPage(1) }}
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

      {/* Filters row 2: categoria chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => { setFiltroCategoria(''); setPage(1) }}
          className={clsx(
            'px-3 py-1.5 rounded-xl text-xs font-medium transition-all border',
            filtroCategoria === ''
              ? 'bg-slate-700 text-slate-200 border-slate-600'
              : 'bg-slate-800 text-slate-500 border-slate-700 hover:text-slate-300'
          )}
        >
          Todas categorias
        </button>
        {CATEGORIAS_LIST.map(cat => (
          <button
            key={cat}
            onClick={() => { setFiltroCategoria(cat); setPage(1) }}
            className={clsx(
              'px-3 py-1.5 rounded-xl text-xs font-medium transition-all border flex items-center gap-1.5',
              filtroCategoria === cat
                ? 'bg-slate-700 text-slate-200 border-slate-600'
                : 'bg-slate-800 text-slate-500 border-slate-700 hover:text-slate-300'
            )}
          >
            <span>{CAT_ICONS[cat]}</span>
            {CAT_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Summary cards */}
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

      {/* Sort bar */}
      {!isEmpty && (
        <div className="flex items-center gap-4 px-1">
          <span className="text-xs text-slate-600">Ordenar por:</span>
          <SortBtn field="data" label="Data" />
          <SortBtn field="valor" label="Valor" />
          <SortBtn field="descricao" label="Descrição" />
          <SortBtn field="categoria" label="Categoria" />
        </div>
      )}

      {/* List */}
      <div className="card !p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-slate-500">
            <span className="inline-block w-5 h-5 border-2 border-slate-700 border-t-green-500 rounded-full animate-spin" />
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-600 gap-3">
            {hasActiveFilters ? (
              <>
                <p className="text-sm">Nenhuma transação encontrada para os filtros aplicados.</p>
                <button
                  onClick={() => { setSearch(''); setFiltroTipo(''); setFiltroCategoria('') }}
                  className="text-xs text-green-400 hover:text-green-300 transition-colors underline underline-offset-2"
                >
                  Limpar filtros
                </button>
              </>
            ) : (
              <>
                <p className="text-sm">Nenhuma transação em {MESES[mes - 1]} {ano}.</p>
                <button onClick={openNew} className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5">
                  <Plus size={13} /> Adicionar transação
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {paginated.map(t => (
              <div key={t.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-800/40 transition-colors group">
                <div className="text-xl w-8 text-center select-none flex-shrink-0">{CAT_ICONS[t.categoria]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{t.descricao}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-slate-500">
                      {new Date(t.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </span>
                    <span className="text-xs text-slate-600">•</span>
                    <span className="text-xs text-slate-500">{CAT_LABELS[t.categoria]}</span>
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
                <span className={clsx('font-mono font-semibold text-sm flex-shrink-0', t.tipo === 'RECEITA' ? 'text-green-400' : 'text-red-400')}>
                  {t.tipo === 'RECEITA' ? '+' : '-'}{fmt(t.valor)}
                </span>
                {/* Sempre visível no mobile via flex-shrink, hover no desktop */}
                <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(t)}
                    className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-500 hover:text-slate-200 transition-colors"
                    aria-label="Editar"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => setConfirmId(t.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
                    aria-label="Excluir"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-slate-500">
            Página {page} de {totalPages} · {filtered.length} registros
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = page <= 3 ? i + 1 : page + i - 2
              if (p < 1 || p > totalPages) return null
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={clsx(
                    'w-8 h-8 rounded-lg text-xs font-medium transition-colors border',
                    p === page
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : 'bg-slate-800 text-slate-500 border-slate-700 hover:text-slate-300'
                  )}
                >
                  {p}
                </button>
              )
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Transaction modal */}
      <TransacaoModal
        open={modal}
        editing={editing}
        form={form}
        saving={saving}
        onChange={setForm}
        onSubmit={handleSubmit}
        onClose={() => setModal(false)}
      />

      {/* Confirm delete modal */}
      <ConfirmModal
        open={confirmId !== null}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  )
}