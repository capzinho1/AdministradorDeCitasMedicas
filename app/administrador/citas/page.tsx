'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRealtimeAppointments } from '@/lib/hooks/useRealtimeAppointments'
import DateSelector from '@/components/DateSelector'
import Pagination from '@/components/shared/Pagination'

interface AppointmentWithDetails {
  id: string
  patient_id: string
  doctor_id: string
  appointment_date: string
  appointment_time: string
  consultation_type: string
  reason: string | null
  status: string
  patient?: { first_name: string; last_name: string; rut: string }
  doctor?: { name: string; specialty: string }
}

export default function CitasAdminPage() {
  const [fecha, setFecha] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('all')
  const [filtroDoctor, setFiltroDoctor] = useState('all')
  const [doctores, setDoctores] = useState<any[]>([])
  const [mostrarTodas, setMostrarTodas] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(16)

  useEffect(() => {
    cargarDoctores()
  }, [])

  // Usar el hook de tiempo real para obtener citas
  const { appointments, loading } = useRealtimeAppointments({
    date: mostrarTodas ? undefined : fecha,
    doctorId: filtroDoctor !== 'all' ? filtroDoctor : undefined,
    status: filtroEstado !== 'all' ? filtroEstado : undefined,
    enabled: mostrarTodas || !!fecha
  })

  // Convertir appointments a AppointmentWithDetails
  const todasLasCitas = appointments as AppointmentWithDetails[]

  // Paginación
  const totalPages = Math.ceil(todasLasCitas.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const citas = todasLasCitas.slice(startIndex, endIndex)

  // Resetear a página 1 cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [fecha, filtroDoctor, filtroEstado, mostrarTodas])

  const cargarDoctores = async () => {
    const { data } = await supabase.from('doctors').select('id, name')
    if (data) setDoctores(data)
  }

  const cambiarEstado = async (citaId: string, nuevoEstado: string) => {
    await supabase
      .from('appointments')
      .update({ status: nuevoEstado })
      .eq('id', citaId)

    // No necesitamos recargar manualmente, el hook de tiempo real lo hará automáticamente
  }

  const getEstadoColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700 border-green-300'
      case 'confirmed': return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-300'
      default: return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const getEstadoTexto = (status: string) => {
    switch (status) {
      case 'completed': return 'Completada'
      case 'confirmed': return 'Confirmada'
      case 'pending': return 'Pendiente'
      case 'cancelled': return 'Cancelada'
      default: return status
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Gestión de Citas</h1>
        <p className="text-gray-600">Supervisa y gestiona todas las citas</p>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-gray-200 rounded p-4 mb-6">
        <h3 className="font-bold mb-3">Filtros</h3>
        
        {/* Opción para mostrar todas las citas */}
        <div className="mb-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={mostrarTodas}
              onChange={(e) => {
                setMostrarTodas(e.target.checked)
                if (e.target.checked) {
                  setFecha('')
                }
              }}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium">Mostrar todas las citas (sin filtrar por fecha)</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm mb-1">Fecha {mostrarTodas ? '(deshabilitado)' : '*'}</label>
            <DateSelector
              value={fecha}
              onChange={setFecha}
              label=""
              disabled={mostrarTodas}
            />
            {!mostrarTodas && !fecha && (
              <p className="text-xs text-red-600 mt-1">Seleccione una fecha o active "Mostrar todas"</p>
            )}
          </div>
          <div>
            <label className="block text-sm mb-1">Doctor</label>
            <select
              value={filtroDoctor}
              onChange={(e) => setFiltroDoctor(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 bg-white"
            >
              <option value="all">Todos los doctores</option>
              {doctores.map(doc => (
                <option key={doc.id} value={doc.id}>{doc.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Estado</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 bg-white"
            >
              <option value="all">Todos los estados</option>
              <option value="confirmed">Confirmada</option>
              <option value="completed">Completada</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>
        </div>
      </div>


      {/* Lista de citas */}
      {loading ? (
        <div className="bg-white border border-gray-200 rounded p-8 text-center">
          <p className="text-gray-600">Cargando citas...</p>
        </div>
      ) : citas.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded p-8 text-center">
          <p className="text-gray-600">
            {mostrarTodas 
              ? 'No hay citas que coincidan con los filtros seleccionados'
              : !fecha 
              ? 'Seleccione una fecha o active "Mostrar todas las citas"'
              : 'No hay citas para los filtros seleccionados'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {citas.map((cita) => (
            <div
              key={cita.id}
              className="bg-white border border-gray-200 rounded p-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base font-bold text-gray-800">
                      {cita.appointment_time}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(cita.appointment_date).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short'
                      })}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs border ${getEstadoColor(cita.status)}`}>
                      {getEstadoTexto(cita.status)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-gray-500 mb-0.5">Paciente</p>
                      <p className="font-medium text-gray-800 truncate">
                        {cita.patient?.first_name} {cita.patient?.last_name}
                      </p>
                      <p className="text-gray-500">{cita.patient?.rut}</p>
                    </div>
                    
                    <div>
                      <p className="text-gray-500 mb-0.5">Doctor</p>
                      <p className="font-medium text-gray-800 truncate">{cita.doctor?.name}</p>
                      <p className="text-gray-500 truncate">{cita.doctor?.specialty}</p>
                    </div>
                  </div>

                  <div className="mt-1 text-xs">
                    <span className="text-gray-600">Tipo: <span className="font-medium">{cita.consultation_type}</span></span>
                    {cita.reason && (
                      <span className="text-gray-500 ml-2">• <span className="italic">{cita.reason}</span></span>
                    )}
                  </div>
                </div>

                {/* Menú desplegable de estado */}
                <div className="flex-shrink-0">
                  <label className="block text-xs text-gray-600 mb-0.5">Estado</label>
                  <select
                    value={cita.status}
                    onChange={(e) => cambiarEstado(cita.id, e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-xs bg-white"
                  >
                    <option value="confirmed">Confirmada</option>
                    <option value="completed">Completada</option>
                    <option value="cancelled">Cancelada</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Paginación */}
      {!loading && todasLasCitas.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={todasLasCitas.length}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      )}
    </div>
  )
}
