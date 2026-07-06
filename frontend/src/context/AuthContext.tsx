import { createContext, useContext, useState, type ReactNode } from 'react'

const MOCK_USER = { id: 'USR-A7X3K9', name: 'Ahmed Abdullah', role: 'Admin', ip: '10.88.142.37', dept: 'Risk & Compliance Division' }

interface AuthContextValue {
  user: typeof MOCK_USER
  auditorMode: boolean
  setAuditorMode: (mode: boolean) => void
  isLoggedOut: boolean
  setIsLoggedOut: (v: boolean) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auditorMode, setAuditorMode] = useState(false)
  const [isLoggedOut, setIsLoggedOut] = useState(false)

  return (
    <AuthContext.Provider value={{ user: MOCK_USER, auditorMode, setAuditorMode, isLoggedOut, setIsLoggedOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
