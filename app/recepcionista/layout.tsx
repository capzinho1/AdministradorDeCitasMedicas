'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar, { SidebarItem } from '@/components/shared/Sidebar'
import { Calendar, LogOut, Move, XCircle, Menu, X } from 'lucide-react'
import { getCurrentUser, signOut } from '@/lib/auth'
import type { AuthUser } from '@/lib/auth'

const recepcionistaItems: SidebarItem[] = [
  {
    label: 'Agenda de Citas',
    icon: Calendar,
    path: '/recepcionista'
  },
  {
    label: 'Reorganizar Agenda',
    icon: Move,
    path: '/recepcionista/agenda-drag'
  },
  {
    label: 'Cancelar Citas',
    icon: XCircle,
    path: '/recepcionista/cancelar-citas'
  }
]

export default function RecepcionistaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuthentication()
  }, [])

  const checkAuthentication = () => {
    const currentUser = getCurrentUser()
    
    // Solo permite acceso a usuarios con rol 'receptionist'
    if (!currentUser || currentUser.role !== 'receptionist') {
      router.push('/login')
      return
    }

    setUser(currentUser)
    setLoading(false)
  }

  const handleLogout = () => {
    signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Verificando acceso...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Hamburger Button - Mobile Only */}
      <button
        onClick={() => setMenuOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 bg-blue-600 text-white p-3 rounded-lg shadow-lg"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Overlay */}
      {menuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <div className="w-64 bg-gradient-to-b from-blue-600 to-blue-700 text-white min-h-screen p-6 shadow-xl hidden md:block">
        {/* Header con info del usuario */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Recepcionista</h2>
          {user && (
            <div className="text-sm opacity-90">
              <p className="font-medium">{user.name}</p>
            </div>
          )}
          <div className="h-1 w-16 bg-white rounded mt-2"></div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-2">
          {recepcionistaItems.map((item) => {
            const Icon = item.icon
            
            return (
              <a
                key={item.path}
                href={item.path}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/20 transition-all"
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </a>
            )
          })}
        </nav>

        {/* Logout Button */}
        <div className="mt-12 pt-6 border-t border-white/20">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/20 transition-all w-full text-left"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`md:hidden fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-blue-600 to-blue-700 text-white p-6 shadow-xl z-50 transform transition-transform duration-300 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={() => setMenuOpen(false)}
          className="absolute top-4 right-4 text-white"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header con info del usuario */}
        <div className="mb-8 mt-8">
          <h2 className="text-2xl font-bold mb-2">Recepcionista</h2>
          {user && (
            <div className="text-sm opacity-90">
              <p className="font-medium">{user.name}</p>
            </div>
          )}
          <div className="h-1 w-16 bg-white rounded mt-2"></div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-2">
          {recepcionistaItems.map((item) => {
            const Icon = item.icon
            
            return (
              <a
                key={item.path}
                href={item.path}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/20 transition-all"
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </a>
            )
          })}
        </nav>

        {/* Logout Button */}
        <div className="mt-12 pt-6 border-t border-white/20">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/20 transition-all w-full text-left"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      <main className="flex-1 overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}
