'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Appointment } from '@/lib/supabase'
import DateSelector from '@/components/DateSelector'

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
  const [citas, setCitas] = useState<AppointmentWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [fecha, setFecha] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('all')
  const [filtroDoctor, setFiltroDoctor] = useState('all')
  const [doctores, setDoctores] = useState<any[]>([])

  useEffect(() => {
    const hoy = new Date().toISOString().split('T')[0]
    setFecha(hoy)
    cargarDoctores()
  }, [])

  useEffect(() => {
    if (fecha) {
      cargarCitas(fecha)
    }
  }, [fecha, filtroEstado, filtroDoctor])

  const cargarDoctores = async () => {
    const { data } = await supabase.from('doctors').select('id, name')
    if (data) setDoctores(data)
  }

  const cargarCitas = async (fechaBuscar: string) => {
    setLoading(true)

    let query = supabase
      .from('appointments')
      .select(`
        *,
        patient:patients(first_name, last_name, rut),
        doctor:doctors(name, specialty, id)
      `)
      .eq('appointment_date', fechaBuscar)

    if (filtroEstado !== 'all') {
      query = query.eq('status', filtroEstado)
    }

    if (filtroDoctor !== 'all') {
      query = query.eq('doctor_id', filtroDoctor)
    }

    const { data } = await query.order('appointment_time')

    if (data) {
      setCitas(data as AppointmentWithDetails[])
    }

    setLoading(false)
  }

  const cambiarEstado = async (citaId: string, nuevoEstado: string) => {
    await supabase
      .from('appointments')
      .update({ status: nuevoEstado })
      .eq('id', citaId)

    cargarCitas(fecha)
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

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Cargando citas...</p>
      </div>
    )
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <DateSelector
            value={fecha}
            onChange={setFecha}
            label="Fecha"
          />
          <div>
            <label className="block text-sm mb-1">Doctor</label>
            <select
              value={filtroDoctor}
              onChange={(e) => setFiltroDoctor(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 bg-white"
            >
              <option value="all">Todos</option>
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
              <option value="all">Todos</option>
              <option value="pending">Pendiente</option>
              <option value="confirmed">Confirmada</option>
              <option value="completed">Completada</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>
        </div>
        <div className="mt-3 text-gray-600">
          Total: <strong>{citas.length}</strong> citas
        </div>
      </div>

      {/* Leyenda de estados */}
      <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-6">
        <div className="flex gap-4 text-sm">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 bg-yellow-500 rounded"></span>
            Pendiente
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 bg-blue-500 rounded"></span>
            Confirmada
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded"></span>
            Completada
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded"></span>
            Cancelada
          </span>
        </div>
      </div>

      {/* Lista de citas */}
      {citas.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded p-8 text-center">
          <p className="text-gray-600">No hay citas para esta fecha</p>
        </div>
      ) : (
        <div className="space-y-3">
          {citas.map((cita) => (
            <div
              key={cita.id}
              className="bg-white border border-gray-200 rounded p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg font-bold text-gray-800">
                      {cita.appointment_time}
                    </span>
                    <span className={`px-3 py-1 rounded text-sm border ${getEstadoColor(cita.status)}`}>
                      {getEstadoTexto(cita.status)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Paciente</p>
                      <p className="font-medium text-gray-800">
                        {cita.patient?.first_name} {cita.patient?.last_name}
                      </p>
                      <p className="text-sm text-gray-500">{cita.patient?.rut}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">Doctor</p>
                      <p className="font-medium text-gray-800">{cita.doctor?.name}</p>
                      <p className="text-sm text-gray-500">{cita.doctor?.specialty}</p>
                    </div>
                  </div>

                  <div className="mt-2">
                    <p className="text-sm text-gray-600">Tipo: <span className="font-medium">{cita.consultation_type}</span></p>
                    {cita.reason && (
                      <p className="text-sm text-gray-600">Motivo: <span className="font-medium">{cita.reason}</span></p>
                    )}
                  </div>
                </div>

                {/* Menú desplegable de estado */}
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Cambiar Estado</label>
                  <select
                    value={cita.status}
                    onChange={(e) => cambiarEstado(cita.id, e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 text-sm bg-white"
                  >
                    <option value="pending">Pendiente</option>
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
    </div>
  )
}
