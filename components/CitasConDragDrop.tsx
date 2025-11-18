'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRealtimeAppointments } from '@/lib/hooks/useRealtimeAppointments'
import DateSelector from './DateSelector'
import { ArrowUp, ArrowDown } from 'lucide-react'

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
  doctor?: { name: string; specialty: string; id: string }
}

interface Doctor {
  id: string
  name: string
  specialty: string
}

const HORARIOS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
]

export default function CitasConDragDrop() {
  const [doctores, setDoctores] = useState<Doctor[]>([])
  const [doctorSeleccionado, setDoctorSeleccionado] = useState<string>('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [draggedCita, setDraggedCita] = useState<string | null>(null)
  const [disponibilidad, setDisponibilidad] = useState<Map<string, boolean>>(new Map())
  const [cargandoDisponibilidad, setCargandoDisponibilidad] = useState(false)
  const [tieneConfiguracion, setTieneConfiguracion] = useState<boolean | null>(null) // null = no verificado, true/false = verificado

  // Usar el hook de tiempo real para obtener citas
  const { appointments, loading, refetch } = useRealtimeAppointments({
    date: fecha,
    doctorId: doctorSeleccionado,
    enabled: !!doctorSeleccionado && !!fecha
  })

  // Convertir appointments a AppointmentWithDetails
  const citas = appointments as AppointmentWithDetails[]

  useEffect(() => {
    cargarDoctores()
  }, [])

  useEffect(() => {
    if (doctores.length > 0 && !doctorSeleccionado) {
      setDoctorSeleccionado(doctores[0].id)
    }
  }, [doctores, doctorSeleccionado])

  // Cargar disponibilidad cuando cambia el doctor o la fecha
  useEffect(() => {
    if (doctorSeleccionado && fecha) {
      cargarDisponibilidad()
    }
  }, [doctorSeleccionado, fecha])

  // Suscripción en tiempo real para cambios en disponibilidad del doctor
  useEffect(() => {
    if (!doctorSeleccionado) return

    const channel = supabase
      .channel('doctor-availability-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Escuchar INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'doctor_availability',
          filter: `doctor_id=eq.${doctorSeleccionado}`,
        },
        (payload) => {
          console.log('Cambio detectado en disponibilidad del doctor:', payload.eventType)
          // Recargar disponibilidad cuando hay cambios
          if (doctorSeleccionado && fecha) {
            cargarDisponibilidad()
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Suscripción a cambios de disponibilidad activada')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorSeleccionado, fecha])

  const cargarDoctores = async () => {
    const { data } = await supabase
      .from('doctors')
      .select('id, name, specialty')
      .order('name')

    if (data) {
      setDoctores(data)
      if (data.length > 0 && !doctorSeleccionado) {
        setDoctorSeleccionado(data[0].id)
      }
    }
  }

  const cargarDisponibilidad = async () => {
    if (!doctorSeleccionado || !fecha) return

    setCargandoDisponibilidad(true)
    
    // Primero verificar si el doctor tiene alguna configuración de disponibilidad
    // Buscar cualquier registro, incluyendo el marcador especial (day_of_week = 0)
    const { data: configuracionGeneral } = await supabase
      .from('doctor_availability')
      .select('id, day_of_week, is_available')
      .eq('doctor_id', doctorSeleccionado)

    // Si hay un registro con day_of_week = 0 y is_available = false, significa que configuró pero está vacío
    const tieneConfiguracionVacia = configuracionGeneral?.some(
      item => item.day_of_week === 0 && item.is_available === false
    )
    
    // Si tiene configuración vacía, no mostrar horarios
    if (tieneConfiguracionVacia) {
      setTieneConfiguracion(true)
      setDisponibilidad(new Map())
      setCargandoDisponibilidad(false)
      return
    }

    // Si tiene otros registros de disponibilidad, significa que sí configuró
    const tieneConfig = (configuracionGeneral && configuracionGeneral.length > 0)
    setTieneConfiguracion(tieneConfig)
    
    // Obtener el día de la semana (0=Domingo, 1=Lunes, ..., 6=Sábado)
    const fechaObj = new Date(fecha + 'T00:00:00') // Agregar hora para evitar problemas de zona horaria
    const diaSemanaJS = fechaObj.getDay() // 0=Domingo, 1=Lunes, ..., 6=Sábado
    
    // Convertir a formato de base de datos: 1=Lunes, 2=Martes, ..., 6=Sábado
    // En DisponibilidadDoctor se guarda: 1=Lunes, 2=Martes, ..., 6=Sábado (sin domingo)
    // JavaScript getDay(): 0=Domingo, 1=Lunes, ..., 6=Sábado
    // Base de datos: 1=Lunes, 2=Martes, ..., 6=Sábado
    let diaSemanaDB: number
    if (diaSemanaJS === 0) {
      // Domingo - no hay disponibilidad configurada
      setDisponibilidad(new Map())
      setCargandoDisponibilidad(false)
      return
    } else {
      // Lunes=1, Martes=2, ..., Sábado=6
      diaSemanaDB = diaSemanaJS
    }

    // Consultar disponibilidad del doctor para ese día específico
    const { data } = await supabase
      .from('doctor_availability')
      .select('*')
      .eq('doctor_id', doctorSeleccionado)
      .eq('day_of_week', diaSemanaDB)
      .eq('is_available', true)

    const mapa = new Map<string, boolean>()
    if (data) {
      data.forEach((item) => {
        // El time_slot viene como "HH:MM:SS" o "HH:MM", extraer solo HH:MM
        const hora = item.time_slot.substring(0, 5)
        mapa.set(hora, true)
      })
    }

    setDisponibilidad(mapa)
    setCargandoDisponibilidad(false)
  }

  // Verificar si un horario está disponible según la configuración del doctor
  const estaDisponible = (horario: string): boolean => {
    // Si el doctor nunca configuró disponibilidad, mostrar todos los horarios (comportamiento por defecto)
    if (tieneConfiguracion === false || tieneConfiguracion === null) {
      return true
    }
    
    // Si el doctor tiene configuración pero no hay horarios disponibles para este día, no mostrar nada
    if (tieneConfiguracion === true && disponibilidad.size === 0) {
      return false
    }
    
    // Si hay horarios configurados, verificar si este horario específico está disponible
    return disponibilidad.has(horario)
  }

  const cambiarEstado = async (citaId: string, nuevoEstado: string) => {
    const { error } = await supabase
      .from('appointments')
      .update({ status: nuevoEstado })
      .eq('id', citaId)
    
    if (!error) {
      // El hook de tiempo real actualizará automáticamente
      // Pero forzamos una actualización inmediata para mejor UX
      refetch()
    }
  }

  const cambiarHorario = async (citaId: string, nuevoHorario: string) => {
    // Verificar que el horario esté disponible según la configuración del doctor
    if (!estaDisponible(nuevoHorario)) {
      alert('Este horario no está disponible según la configuración del doctor')
      return
    }

    const citaExistente = citas.find(c => {
      const citaHora = c.appointment_time.substring(0, 5)
      return citaHora === nuevoHorario && c.id !== citaId
    })
    
    if (citaExistente) {
      alert('Ya hay una cita agendada en este horario para este doctor')
      return
    }

    // Agregar :00 para formato completo de tiempo
    const horarioCompleto = nuevoHorario + ':00'
    
    const { error } = await supabase
      .from('appointments')
      .update({ appointment_time: horarioCompleto })
      .eq('id', citaId)
    
    if (!error) {
      // El hook de tiempo real actualizará automáticamente
      // Pero forzamos una actualización inmediata para mejor UX
      refetch()
    }
  }

  const handleDragStart = (e: React.DragEvent, citaId: string) => {
    setDraggedCita(citaId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, nuevoHorario: string) => {
    e.preventDefault()
    if (draggedCita) {
      cambiarHorario(draggedCita, nuevoHorario)
      setDraggedCita(null)
    }
  }


  const getCitaPorHorario = (horario: string) => {
    return citas.find(c => {
      // Comparar solo HH:MM (sin segundos)
      const citaHora = c.appointment_time.substring(0, 5)
      return citaHora === horario
    })
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

  const moverCitaArriba = (citaId: string, horarioActual: string) => {
    const indiceActual = HORARIOS.indexOf(horarioActual)
    if (indiceActual > 0) {
      const nuevoHorario = HORARIOS[indiceActual - 1]
      // Verificar que el nuevo horario esté libre y disponible
      const citaEnNuevoHorario = getCitaPorHorario(nuevoHorario)
      if (!citaEnNuevoHorario && estaDisponible(nuevoHorario)) {
        cambiarHorario(citaId, nuevoHorario)
      } else if (!estaDisponible(nuevoHorario)) {
        alert('El horario anterior no está disponible según la configuración del doctor')
      } else {
        alert('El horario anterior ya está ocupado')
      }
    }
  }

  const moverCitaAbajo = (citaId: string, horarioActual: string) => {
    const indiceActual = HORARIOS.indexOf(horarioActual)
    if (indiceActual < HORARIOS.length - 1) {
      const nuevoHorario = HORARIOS[indiceActual + 1]
      // Verificar que el nuevo horario esté libre y disponible
      const citaEnNuevoHorario = getCitaPorHorario(nuevoHorario)
      if (!citaEnNuevoHorario && estaDisponible(nuevoHorario)) {
        cambiarHorario(citaId, nuevoHorario)
      } else if (!estaDisponible(nuevoHorario)) {
        alert('El horario siguiente no está disponible según la configuración del doctor')
      } else {
        alert('El horario siguiente ya está ocupado')
      }
    }
  }

  const doctorActual = doctores.find(d => d.id === doctorSeleccionado)

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <DateSelector
          value={fecha}
          onChange={setFecha}
          label="Fecha:"
        />
        <div>
          <label className="block text-sm font-medium mb-1">Doctor:</label>
          <select
            value={doctorSeleccionado}
            onChange={(e) => setDoctorSeleccionado(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white"
          >
            {doctores.map(doctor => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name} - {doctor.specialty}
              </option>
            ))}
          </select>
        </div>
      </div>

      {doctorActual && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-800">{doctorActual.name}</h3>
              <p className="text-sm text-gray-600">{doctorActual.specialty}</p>
              <p className="text-sm text-blue-700 mt-1">
                {citas.length} citas programadas
              </p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Cargando citas...</p>
        </div>
      ) : (
        <div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {HORARIOS.map((horario) => {
            const cita = getCitaPorHorario(horario)
            const disponible = estaDisponible(horario)
            
            // Si no está disponible según la configuración del doctor, no mostrar el horario
            if (!disponible && !cita) {
              return null
            }
            
            return (
              <div
                key={horario}
                className={`border-2 border-dashed rounded p-2 min-h-[100px] transition-all duration-200 ${
                  !disponible && !cita
                    ? 'border-gray-200 bg-gray-100 opacity-50'
                    : draggedCita && !cita 
                    ? 'border-blue-500 bg-blue-50 scale-[1.02]' 
                    : 'border-gray-300 bg-white'
                }`}
                onDragOver={disponible ? handleDragOver : undefined}
                onDrop={disponible ? (e) => handleDrop(e, horario) : undefined}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className={`font-bold text-sm ${!disponible ? 'text-gray-400' : 'text-gray-800'}`}>
                    {horario}
                  </span>
                  {!cita && disponible && (
                    <span className="text-xs text-green-600 font-medium">Disponible</span>
                  )}
                  {!cita && !disponible && (
                    <span className="text-xs text-red-500 font-medium">No disponible</span>
                  )}
                  {cita && (
                    <span className="text-xs text-blue-600 font-medium">Ocupado</span>
                  )}
                </div>

                {cita && (
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, cita.id)}
                    className={`p-2 rounded border cursor-move hover:shadow-lg transition-all duration-200 ${
                      draggedCita === cita.id ? 'opacity-60 scale-[0.98]' : ''
                    } ${getEstadoColor(cita.status)}`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${getEstadoColor(cita.status)}`}>
                            {getEstadoTexto(cita.status)}
                          </span>
                        </div>
                        {/* Botones de movimiento */}
                        <div className="flex gap-1">
                          <button
                            onClick={() => moverCitaArriba(cita.id, horario)}
                            disabled={HORARIOS.indexOf(horario) === 0}
                            className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            title="Mover a horario anterior"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => moverCitaAbajo(cita.id, horario)}
                            disabled={HORARIOS.indexOf(horario) === HORARIOS.length - 1}
                            className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            title="Mover a horario siguiente"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="font-bold text-gray-800 text-xs">
                        {cita.patient?.first_name} {cita.patient?.last_name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {cita.patient?.rut}
                      </p>
                      <p className="text-xs text-gray-500">{cita.consultation_type}</p>
                      
                      <select
                        value={cita.status}
                        onChange={(e) => cambiarEstado(cita.id, e.target.value)}
                        className="w-full border border-gray-300 rounded px-1 py-1 text-xs bg-white cursor-pointer hover:border-blue-500 mt-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="pending">Pendiente</option>
                        <option value="confirmed">Confirmada</option>
                        <option value="completed">Completada</option>
                        <option value="cancelled">Cancelada</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-800">{citas.length}</p>
              <p className="text-xs text-gray-600">Total Citas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">
                {citas.filter(c => c.status === 'pending').length}
              </p>
              <p className="text-xs text-gray-600">Pendientes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {citas.filter(c => c.status === 'confirmed').length}
              </p>
              <p className="text-xs text-gray-600">Confirmadas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {citas.filter(c => c.status === 'completed').length}
              </p>
              <p className="text-xs text-gray-600">Completadas</p>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  )
}

