'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar, { SidebarItem } from '@/components/shared/Sidebar'
import { Calendar, Clock, LogOut, Menu, X } from 'lucide-react'
import { getCurrentDoctor, signOut } from '@/lib/auth'
import { Doctor } from '@/lib/supabase'

const doctorItems: SidebarItem[] = [
  {
    label: 'Mi Agenda',
    icon: Calendar,
    path: '/doctor'
  },
  {
    label: 'Disponibilidad',
    icon: Clock,
    path: '/doctor/disponibilidad'
  }
]

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuthentication()
  }, [])

  const checkAuthentication = () => {
    const currentDoctor = getCurrentDoctor()
    
    if (!currentDoctor) {
      router.push('/login')
      return
    }

    setDoctor(currentDoctor)
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
        className="md:hidden fixed top-4 left-4 z-40 bg-green-600 text-white p-3 rounded-lg shadow-lg"
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
      <div className="w-64 bg-gradient-to-b from-green-600 to-green-700 text-white min-h-screen p-6 shadow-xl hidden md:block">
        {/* Header con info del doctor */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Doctor</h2>
          {doctor && (
            <div className="text-sm opacity-90">
              <p className="font-medium">{doctor.name}</p>
              <p className="text-xs">{doctor.specialty}</p>
            </div>
          )}
          <div className="h-1 w-16 bg-white rounded mt-2"></div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-2">
          {doctorItems.map((item) => {
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
        className={`md:hidden fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-green-600 to-green-700 text-white p-6 shadow-xl z-50 transform transition-transform duration-300 ${
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

        {/* Header con info del doctor */}
        <div className="mb-8 mt-8">
          <h2 className="text-2xl font-bold mb-2">Doctor</h2>
          {doctor && (
            <div className="text-sm opacity-90">
              <p className="font-medium">{doctor.name}</p>
              <p className="text-xs">{doctor.specialty}</p>
            </div>
          )}
          <div className="h-1 w-16 bg-white rounded mt-2"></div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-2">
          {doctorItems.map((item) => {
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

