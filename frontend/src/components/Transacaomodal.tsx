import { X, CreditCard } from 'lucide-react'
import clsx from 'clsx'
import type { Transacao, TransacaoRequest, Categoria, TipoPagamento, TipoTransacao } from '../types'

const CATEGORIAS: Categoria[] = ['ALIMENTACAO', 'TRANSPORTE', 'MORADIA', 'LAZER', 'SAUDE', 'EDUCACAO', 'VESTUARIO', 'OUTROS']
const PAGAMENTOS: TipoPagamento[] = ['PIX', 'DEBITO', 'CARTAO_CREDITO', 'DINHEIRO', 'TRANSFERENCIA']

export const CAT_ICONS: Record<Categoria, string> = {
  ALIMENTACAO: '🍕', TRANSPORTE: '🚗', MORADIA: '🏠', LAZER: '🎮',
  SAUDE: '💊', EDUCACAO: '📚', VESTUARIO: '👕', OUTROS: '📦'
}
export const CAT_LABELS: Record<Categoria, string> = {
  ALIMENTACAO: 'Alimentação', TRANSPORTE: 'Transporte', MORADIA: 'Moradia', LAZER: 'Lazer',
  SAUDE: 'Saúde', EDUCACAO: 'Educação', VESTUARIO: 'Vestuário', OUTROS: 'Outros'
}
export const PAG_LABEL: Record<TipoPagamento, string> = {
  PIX: 'Pix', DEBITO: 'Débito', CARTAO_CREDITO: 'Cartão', DINHEIRO: 'Dinheiro', TRANSFERENCIA: 'Transferência'
}

interface Props {
  open: boolean
  editing: Transacao | null
  form: TransacaoRequest
  saving: boolean
  onChange: (form: TransacaoRequest) => void
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
}

export default function TransacaoModal({ open, editing, form, saving, onChange, onSubmit, onClose }: Props) {
  if (!open) return null

  const set = (partial: Partial<TransacaoRequest>) => onChange({ ...form, ...partial })

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const parsed = parseFloat(raw)
    set({ valor: isNaN(parsed) ? 0 : parsed })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg card animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-slate-100">
            {editing ? 'Editar transação' : 'Nova transação'}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Tipo toggle */}
          <div className="flex gap-2">
            {(['RECEITA', 'DESPESA'] as TipoTransacao[]).map(tp => (
              <button key={tp} type="button"
                onClick={() => set({ tipo: tp })}
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
            <input
              className="input"
              placeholder="Ex: Supermercado"
              value={form.descricao}
              onChange={e => set({ descricao: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="input"
                value={form.valor || ''}
                onChange={handleValorChange}
                required
              />
              {form.valor <= 0 && (
                <p className="text-xs text-red-400 mt-1">Informe um valor maior que zero</p>
              )}
            </div>
            <div>
              <label className="label">Data</label>
              <input
                type="date"
                className="input"
                value={form.data}
                onChange={e => set({ data: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Categoria</label>
              <select
                className="input"
                value={form.categoria}
                onChange={e => set({ categoria: e.target.value as Categoria })}
              >
                {CATEGORIAS.map(c => (
                  <option key={c} value={c}>{CAT_ICONS[c]} {CAT_LABELS[c]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Pagamento</label>
              <select
                className="input"
                value={form.tipoPagamento}
                onChange={e => set({ tipoPagamento: e.target.value as TipoPagamento })}
              >
                {PAGAMENTOS.map(p => (
                  <option key={p} value={p}>{PAG_LABEL[p]}</option>
                ))}
              </select>
            </div>
          </div>

          {form.tipoPagamento === 'CARTAO_CREDITO' && !editing && (
            <div>
              <label className="label">Parcelas (1 = à vista)</label>
              <input
                type="number"
                min="1"
                max="72"
                className="input"
                value={form.totalParcelas || 1}
                onChange={e => set({ totalParcelas: parseInt(e.target.value) })}
              />
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || form.valor <= 0}
              className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving
                ? <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}