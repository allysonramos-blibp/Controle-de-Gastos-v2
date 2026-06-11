import React, { createContext, useContext, useState, useCallback } from 'react'
import type { User } from '../types'

interface AuthContextType {
  user: User | null
  token: string | null
  login: (token: string, nome: string, email: string) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const nome = localStorage.getItem('nome')
    const email = localStorage.getItem('email')
    return nome && email ? { nome, email } : null
  })
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))

  const login = useCallback((token: string, nome: string, email: string) => {
    localStorage.setItem('token', token)
    localStorage.setItem('nome', nome)
    localStorage.setItem('email', email)
    setToken(token)
    setUser({ nome, email })
  }, [])

  const logout = useCallback(() => {
    localStorage.clear()
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
