'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import DateSelector from './DateSelector'

interface DailyStats {
  total: number
  confirmed: number
  pending: number
  completed: number
  cancelled: number
}

interface EstadisticasDiariasProps {
  doctorId?: string // Si se proporciona, filtra por este doctor
}

export default function EstadisticasDiarias({ doctorId }: EstadisticasDiariasProps = {}) {
  const [stats, setStats] = useState<DailyStats>({
    total: 0,
    confirmed: 0,
    pending: 0,
    completed: 0,
    cancelled: 0
  })
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchDailyStats()
  }, [selectedDate, doctorId])

  const fetchDailyStats = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('appointments')
        .select('status')
        .eq('appointment_date', selectedDate)

      // Si hay doctorId, filtrar solo las citas de ese doctor
      if (doctorId) {
        query = query.eq('doctor_id', doctorId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching stats:', error)
        return
      }

      const statsData = {
        total: data?.length || 0,
        confirmed: data?.filter(apt => apt.status === 'confirmed').length || 0,
        pending: data?.filter(apt => apt.status === 'pending').length || 0,
        completed: data?.filter(apt => apt.status === 'completed').length || 0,
        cancelled: data?.filter(apt => apt.status === 'cancelled').length || 0
      }

      setStats(statsData)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <DateSelector
        value={selectedDate}
        onChange={setSelectedDate}
        label="Fecha:"
        className="mb-4"
      />
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="text-center bg-blue-50 p-3 rounded border">
          <div className="text-2xl font-bold text-blue-800">
            {loading ? '...' : stats.total}
          </div>
          <p className="text-xs text-gray-600 mt-1">Total</p>
        </div>
        <div className="text-center bg-green-50 p-3 rounded border">
          <div className="text-2xl font-bold text-green-800">
            {loading ? '...' : stats.confirmed}
          </div>
          <p className="text-xs text-gray-600 mt-1">Confirmadas</p>
        </div>
        <div className="text-center bg-yellow-50 p-3 rounded border">
          <div className="text-2xl font-bold text-yellow-800">
            {loading ? '...' : stats.pending}
          </div>
          <p className="text-xs text-gray-600 mt-1">Pendientes</p>
        </div>
        <div className="text-center bg-blue-50 p-3 rounded border">
          <div className="text-2xl font-bold text-blue-700">
            {loading ? '...' : stats.completed}
          </div>
          <p className="text-xs text-gray-600 mt-1">Completadas</p>
        </div>
        <div className="text-center bg-red-50 p-3 rounded border">
          <div className="text-2xl font-bold text-red-800">
            {loading ? '...' : stats.cancelled}
          </div>
          <p className="text-xs text-gray-600 mt-1">Canceladas</p>
        </div>
      </div>
    </div>
  )
}

