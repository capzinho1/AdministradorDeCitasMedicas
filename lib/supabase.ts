import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Patient {
  id: string
  rut: string
  first_name: string
  last_name: string
  phone: string
  email?: string
  date_of_birth?: string
  created_at: string
  updated_at: string
}

export interface Doctor {
  id: string
  name: string
  specialty: string
  email?: string
  phone?: string
  password?: string
  created_at: string
}

export interface Appointment {
  id: string
  patient_id: string
  doctor_id: string
  appointment_date: string
  appointment_time: string
  consultation_type: string
  reason?: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
  patient?: Patient
  doctor?: Doctor
}

export interface ConsultationHistory {
  id: string
  patient_id: string
  doctor_id: string
  consultation_date: string
  consultation_time: string
  diagnosis?: string
  notes?: string
  created_at: string
  patient?: Patient
  doctor?: Doctor
}

export interface DoctorAvailability {
  id: string
  doctor_id: string
  day_of_week: number // 0=Domingo, 1=Lunes, ..., 6=Sábado
  time_slot: string
  is_available: boolean
  created_at: string
  updated_at: string
}

export interface Receptionist {
  id: string
  name: string
  email: string
  phone?: string
  password?: string
  created_at: string
}

export interface Administrator {
  id: string
  name: string
  email: string
  phone?: string
  password?: string
  created_at: string
}

export interface PatientNote {
  id: string
  patient_id: string
  doctor_id: string
  note: string
  created_at: string
  updated_at: string
  doctor?: Doctor
}

