'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Users, Calendar, Activity, TrendingUp, CheckCircle, Clock } from 'lucide-react'
import DateSelector from '@/components/DateSelector'

export default function AdministradorPage() {
  const [filterMode, setFilterMode] = useState<'day' | 'range'>('day')
  const [singleDate, setSingleDate] = useState(new Date().toISOString().split('T')[0])
  const [startDate, setStartDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() - 7)
    return date.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalAppointments: 0,
    completedAppointments: 0,
    pendingAppointments: 0,
    confirmedAppointments: 0,
    cancelledAppointments: 0
  })

  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadStats()
  }, [filterMode, singleDate, startDate, endDate])

  const loadStats = async () => {
    setLoading(true)
    try {
      // Total pacientes (siempre)
      const { count: patientsCount } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })

      // Determinar rango de fechas según el modo
      let dateFilter
      if (filterMode === 'day') {
        dateFilter = { start: singleDate, end: singleDate }
      } else {
        dateFilter = { start: startDate, end: endDate }
      }

      // Obtener citas del período
      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(first_name, last_name, rut),
          doctor:doctors(name, specialty)
        `)
        .gte('appointment_date', dateFilter.start)
        .lte('appointment_date', dateFilter.end)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: true })

      setAppointments(appointmentsData || [])

      const totalCount = appointmentsData?.length || 0
      const completedCount = appointmentsData?.filter(a => a.status === 'completed').length || 0
      const pendingCount = appointmentsData?.filter(a => a.status === 'pending').length || 0
      const confirmedCount = appointmentsData?.filter(a => a.status === 'confirmed').length || 0
      const cancelledCount = appointmentsData?.filter(a => a.status === 'cancelled').length || 0

      setStats({
        totalPatients: patientsCount || 0,
        totalAppointments: totalCount,
        completedAppointments: completedCount,
        pendingAppointments: pendingCount,
        confirmedAppointments: confirmedCount,
        cancelledAppointments: cancelledCount
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200'
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente'
      case 'confirmed': return 'Confirmada'
      case 'completed': return 'Completada'
      case 'cancelled': return 'Cancelada'
      default: return status
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5)
  }

  const statCards = [
    {
      title: 'Total Pacientes',
      value: stats.totalPatients,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      title: filterMode === 'day' ? 'Citas del Día' : 'Total Citas',
      value: stats.totalAppointments,
      icon: Calendar,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200'
    },
    {
      title: 'Completadas',
      value: stats.completedAppointments,
      icon: CheckCircle,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      title: 'Pendientes',
      value: stats.pendingAppointments,
      icon: Clock,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    {
      title: 'Confirmadas',
      value: stats.confirmedAppointments,
      icon: Activity,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      title: 'Canceladas',
      value: stats.cancelledAppointments,
      icon: TrendingUp,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    }
  ]

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard Administrativo</h1>
        <p className="text-gray-600">Visión general del sistema</p>
      </div>

      {/* Filtros de Fecha */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
        <h3 className="font-bold text-gray-800 mb-4">Filtrar Datos</h3>
        
        {/* Selector de Modo */}
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={() => setFilterMode('day')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filterMode === 'day'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Día Específico
          </button>
          <button
            onClick={() => setFilterMode('range')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filterMode === 'range'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Rango de Fechas
          </button>
        </div>

        {/* Inputs de Fecha */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filterMode === 'day' ? (
            <DateSelector
              value={singleDate}
              onChange={setSingleDate}
              label="Seleccionar Día:"
            />
          ) : (
            <>
              <DateSelector
                value={startDate}
                onChange={setStartDate}
                label="Fecha Inicio:"
              />
              <DateSelector
                value={endDate}
                onChange={setEndDate}
                label="Fecha Fin:"
              />
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.title} className={`${card.bgColor} border-2 ${card.borderColor} rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`bg-gradient-to-br ${card.color} w-10 h-10 rounded-lg flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800 mb-1">{card.value}</p>
              <h3 className="text-xs text-gray-600 font-medium">{card.title}</h3>
            </div>
          )
        })}
      </div>

      {/* Lista de Citas */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-gray-800">Citas del Período</h3>
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {appointments.length} citas
          </span>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Cargando datos...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No hay citas para el período seleccionado</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-gray-800">
                        {formatDate(appointment.appointment_date)} - {formatTime(appointment.appointment_time)}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(appointment.status)}`}>
                        {getStatusText(appointment.status)}
                      </span>
                    </div>
                    <p className="font-medium text-gray-800">
                      {appointment.patient?.first_name} {appointment.patient?.last_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      RUT: {appointment.patient?.rut}
                    </p>
                    <p className="text-sm text-gray-600">
                      Dr. {appointment.doctor?.name} - {appointment.doctor?.specialty}
                    </p>
                    <p className="text-sm text-gray-500">
                      {appointment.consultation_type}
                    </p>
                    {appointment.reason && (
                      <p className="text-xs text-gray-500 mt-1 italic">
                        {appointment.reason}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

