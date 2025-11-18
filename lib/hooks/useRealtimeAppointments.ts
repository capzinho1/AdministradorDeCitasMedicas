import { useEffect, useState, useRef } from 'react'
import { supabase, Appointment } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

interface UseRealtimeAppointmentsOptions {
  date?: string
  doctorId?: string
  status?: string
  enabled?: boolean
}

export function useRealtimeAppointments(options: UseRealtimeAppointmentsOptions = {}) {
  const { date, doctorId, status, enabled = true } = options
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const channelRef = useRef<RealtimeChannel | null>(null)

  const fetchAppointments = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(first_name, last_name, rut),
          doctor:doctors(name, specialty)
        `)

      if (date) {
        query = query.eq('appointment_date', date)
      }

      if (doctorId) {
        query = query.eq('doctor_id', doctorId)
      }

      if (status && status !== 'all') {
        query = query.eq('status', status)
      }

      const { data, error } = await query.order('appointment_time', { ascending: true })

      if (error) {
        console.error('Error fetching appointments:', error)
        return
      }

      setAppointments(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }

    // Cargar datos iniciales
    fetchAppointments()

    // Configurar suscripción en tiempo real
    const channelName = `appointments-${date || 'all'}-${doctorId || 'all'}-${status || 'all'}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*', // Escuchar INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'appointments',
        },
        (payload) => {
          console.log('Cambio detectado en appointments:', payload.eventType)
          
          // Recargar los datos cuando hay cambios
          // Esto asegura que siempre tengamos los datos más actualizados
          fetchAppointments()
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Suscripción a cambios en tiempo real activada')
        }
      })

    channelRef.current = channel

    // Limpiar suscripción al desmontar o cambiar dependencias
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, doctorId, status, enabled])

  return {
    appointments,
    loading,
    refetch: fetchAppointments,
  }
}

