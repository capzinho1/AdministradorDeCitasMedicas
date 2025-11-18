'use client'

import { useState, useEffect } from 'react'
import { supabase, Appointment } from '@/lib/supabase'
import { useRealtimeAppointments } from '@/lib/hooks/useRealtimeAppointments'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import DateSelector from './DateSelector'
import Pagination from './shared/Pagination'

interface CitasDiariasProps {
  doctorId?: string // Si se proporciona, filtra por este doctor
}

export default function CitasDiarias({ doctorId }: CitasDiariasProps = {}) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(16)

  // Usar el hook de tiempo real para obtener citas
  const { appointments, loading } = useRealtimeAppointments({
    date: selectedDate,
    doctorId: doctorId,
    enabled: !!selectedDate
  })

  // Paginación
  const totalPages = Math.ceil(appointments.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedAppointments = appointments.slice(startIndex, endIndex)

  // Resetear a página 1 cuando cambia la fecha
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedDate])

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId)

      if (error) {
        console.error('Error updating appointment:', error)
        return
      }

      // No necesitamos recargar manualmente, el hook de tiempo real lo hará automáticamente
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente'
      case 'confirmed':
        return 'Confirmada'
      case 'completed':
        return 'Completada'
      case 'cancelled':
        return 'Cancelada'
      default:
        return status
    }
  }

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5)
  }

  return (
    <div>
      <DateSelector
        value={selectedDate}
        onChange={setSelectedDate}
        label="Fecha:"
        className="mb-3"
      />

      <div className="border-t pt-3">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-gray-800">Citas Programadas</h3>
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
            {appointments.length} citas
          </span>
        </div>
        
        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-6">
              <p className="text-gray-600 text-sm">Cargando...</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500 text-sm">No hay citas para esta fecha</p>
            </div>
          ) : (
            paginatedAppointments.map((appointment, index) => (
              <div 
                key={appointment.id} 
                className="bg-white border border-gray-300 rounded p-3"
              >
                <div className="flex justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-800">
                        {formatTime(appointment.appointment_time)}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded border ${getStatusColor(appointment.status)}`}>
                        {getStatusText(appointment.status)}
                      </span>
                    </div>
                    <p className="font-medium text-gray-800 text-sm">
                      {appointment.patient?.first_name} {appointment.patient?.last_name}
                    </p>
                    <p className="text-gray-600 text-xs">
                      Dr. {appointment.doctor?.name}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {appointment.consultation_type}
                    </p>
                    {appointment.reason && (
                      <p className="text-gray-600 text-xs mt-1 italic">
                        {appointment.reason}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-600 mb-1">Estado</label>
                    <select
                      value={appointment.status}
                      onChange={(e) => updateAppointmentStatus(appointment.id, e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="pending">Pendiente</option>
                      <option value="confirmed">Confirmada</option>
                      <option value="completed">Completada</option>
                      <option value="cancelled">Cancelada</option>
                    </select>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Paginación */}
      {!loading && appointments.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={appointments.length}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      )}
    </div>
  )
}

