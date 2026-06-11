import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Eye, EyeOff, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [tab, setTab] = useState<'login' | 'cadastro'>('login')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({ nome: '', email: '', senha: '' })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = tab === 'login'
        ? await authApi.login(form.email, form.senha)
        : await authApi.cadastrar(form.nome, form.email, form.senha)

      login(data.token, data.nome, data.email)
      toast.success(`Bem-vindo, ${data.nome}!`)
      navigate('/')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao processar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-500/20 border border-green-500/30 mb-4">
            <TrendingUp size={24} className="text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Controle Financeiro</h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie seu dinheiro com inteligência</p>
        </div>

        <div className="card">
          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-slate-800/60 p-1 rounded-xl">
            {(['login', 'cadastro'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                  tab === t
                    ? 'bg-slate-700 text-slate-100 shadow-sm'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {t === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'cadastro' && (
              <div>
                <label className="label">Nome completo</label>
                <input
                  name="nome" className="input" placeholder="Seu nome"
                  value={form.nome} onChange={handleChange} required
                />
              </div>
            )}

            <div>
              <label className="label">E-mail</label>
              <input
                name="email" type="email" className="input" placeholder="seu@email.com"
                value={form.email} onChange={handleChange} required
              />
            </div>

            <div>
              <label className="label">Senha</label>
              <div className="relative">
                <input
                  name="senha" type={showPass ? 'text' : 'password'}
                  className="input pr-11" placeholder={tab === 'cadastro' ? 'Mín. 6 caracteres' : '••••••••'}
                  value={form.senha} onChange={handleChange} required
                  minLength={tab === 'cadastro' ? 6 : 1}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  {tab === 'login' ? 'Acessar' : 'Criar conta'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
