'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Verificar si ya hay un usuario logueado
    const user = getCurrentUser()
    
    if (user) {
      // Si hay usuario, redirigir a su panel según rol
      if (user.role === 'doctor') {
        router.push('/doctor')
      } else if (user.role === 'receptionist') {
        router.push('/recepcionista')
      } else if (user.role === 'administrator') {
        router.push('/administrador')
      }
    } else {
      // Si no hay usuario, redirigir al login
      router.push('/login')
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirigiendo...</p>
      </div>
    </div>
  )
}
