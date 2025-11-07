import { supabase, Doctor, Receptionist, Administrator } from './supabase'

export type UserRole = 'doctor' | 'receptionist' | 'administrator'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  phone?: string
}

// Login unificado para todos los roles
export async function login(email: string, password: string): Promise<{ user: AuthUser | null; role: UserRole | null }> {
  // Intentar login como Doctor
  const { data: doctor } = await supabase
    .from('doctors')
    .select('*')
    .eq('email', email)
    .eq('password', password)
    .single()

  if (doctor) {
    const user: AuthUser = {
      id: doctor.id,
      name: doctor.name,
      email: doctor.email!,
      role: 'doctor',
      phone: doctor.phone
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentUser', JSON.stringify(user))
    }
    return { user, role: 'doctor' }
  }

  // Intentar login como Recepcionista
  const { data: receptionist } = await supabase
    .from('receptionists')
    .select('*')
    .eq('email', email)
    .eq('password', password)
    .single()

  if (receptionist) {
    const user: AuthUser = {
      id: receptionist.id,
      name: receptionist.name,
      email: receptionist.email,
      role: 'receptionist',
      phone: receptionist.phone
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentUser', JSON.stringify(user))
    }
    return { user, role: 'receptionist' }
  }

  // Intentar login como Administrador
  const { data: admin } = await supabase
    .from('administrators')
    .select('*')
    .eq('email', email)
    .eq('password', password)
    .single()

  if (admin) {
    const user: AuthUser = {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: 'administrator',
      phone: admin.phone
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentUser', JSON.stringify(user))
    }
    return { user, role: 'administrator' }
  }

  return { user: null, role: null }
}

export function getCurrentUser(): AuthUser | null {
  if (typeof window === 'undefined') return null
  
  const userData = localStorage.getItem('currentUser')
  if (!userData) return null
  
  return JSON.parse(userData)
}

export function getCurrentDoctor(): Doctor | null {
  const user = getCurrentUser()
  if (!user || user.role !== 'doctor') return null
  return user as any
}

export function signOut() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('currentUser')
    localStorage.removeItem('currentDoctor') // Por compatibilidad
  }
}

