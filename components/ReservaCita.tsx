'use client'

import { useState, useEffect } from 'react'
import { supabase, Patient, Doctor, Appointment } from '@/lib/supabase'
import DateSelector from './DateSelector'

interface AppointmentBookingProps {
  selectedPatient?: Patient
  onAppointmentCreated: () => void
}

export default function ReservaCita({ selectedPatient, onAppointmentCreated }: AppointmentBookingProps) {
  const [doctores, setDoctores] = useState<Doctor[]>([])
  const [form, setForm] = useState({
    doctor_id: '',
    appointment_date: '',
    appointment_time: '',
    consultation_type: '',
    reason: ''
  })
  const [guardando, setGuardando] = useState(false)
  const [horariosDisponibles, setHorariosDisponibles] = useState<string[]>([])
  const [verificando, setVerificando] = useState(false)

  const specialties = [
    'Medicina General',
    'Cardiología',
    'Dermatología',
    'Ginecología',
    'Pediatría'
  ]

  const consultationTypes = [
    'Primera consulta',
    'Control',
    'Urgencia',
    'Revisión de exámenes',
    'Consulta de seguimiento'
  ]

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '15:00', '15:30', '16:00', '16:30', '17:00'
  ]

  useEffect(() => {
    cargarDoctores()
  }, [])

  const cargarDoctores = async () => {
    const { data } = await supabase.from('doctors').select('*').order('name')
    setDoctores(data || [])
  }

  const checkAvailability = async (doctorId: string, date: string) => {
    if (!doctorId || !date) return

    setVerificando(true)

    // 1. Verificar si el doctor tiene configuración de disponibilidad
    const { data: configuracionGeneral } = await supabase
      .from('doctor_availability')
      .select('id, day_of_week, is_available')
      .eq('doctor_id', doctorId)

    // Si tiene configuración vacía (day_of_week = 0, is_available = false), no hay horarios disponibles
    const tieneConfiguracionVacia = configuracionGeneral?.some(
      item => item.day_of_week === 0 && item.is_available === false
    )

    if (tieneConfiguracionVacia) {
      setHorariosDisponibles([])
      setVerificando(false)
      return
    }

    // 2. Obtener el día de la semana
    const fechaObj = new Date(date + 'T00:00:00')
    const diaSemanaJS = fechaObj.getDay() // 0=Domingo, 1=Lunes, ..., 6=Sábado

    let horariosConfigurados: string[] = []

    // Si el doctor tiene configuración, consultar horarios disponibles para ese día
    const tieneConfig = (configuracionGeneral && configuracionGeneral.length > 0)
    
    if (tieneConfig && diaSemanaJS !== 0) {
      // Consultar disponibilidad del doctor para ese día específico
      const { data: disponibilidadData } = await supabase
        .from('doctor_availability')
        .select('time_slot')
        .eq('doctor_id', doctorId)
        .eq('day_of_week', diaSemanaJS)
        .eq('is_available', true)

      if (disponibilidadData) {
        // Extraer solo HH:MM de los time_slot
        horariosConfigurados = disponibilidadData.map(item => item.time_slot.substring(0, 5))
      }
    }

    // 3. Obtener citas ocupadas
    const { data: citasData } = await supabase
      .from('appointments')
      .select('appointment_time')
      .eq('doctor_id', doctorId)
      .eq('appointment_date', date)
      .in('status', ['pending', 'confirmed'])

    const bookedTimes = citasData?.map(apt => apt.appointment_time.substring(0, 5)) || []

    // 4. Filtrar horarios: deben estar configurados como disponibles Y no estar ocupados
    let horariosFinales: string[]

    if (tieneConfig && horariosConfigurados.length > 0) {
      // Si tiene configuración, solo mostrar los horarios configurados que no están ocupados
      horariosFinales = horariosConfigurados.filter(slot => !bookedTimes.includes(slot))
    } else if (tieneConfig && horariosConfigurados.length === 0) {
      // Si tiene configuración pero no hay horarios para ese día, no mostrar nada
      horariosFinales = []
    } else {
      // Si no tiene configuración, mostrar todos los horarios que no están ocupados (comportamiento por defecto)
      horariosFinales = timeSlots.filter(slot => !bookedTimes.includes(slot))
    }

    setHorariosDisponibles(horariosFinales)
    setVerificando(false)
  }

  const guardarCita = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedPatient) {
      alert('Seleccione un paciente primero')
      return
    }

    if (!form.doctor_id || !form.appointment_date || !form.appointment_time || !form.consultation_type) {
      alert('Complete todos los campos obligatorios')
      return
    }

    // Validar que el horario seleccionado esté en la lista de horarios disponibles
    if (!horariosDisponibles.includes(form.appointment_time)) {
      alert('El horario seleccionado no está disponible. Por favor, seleccione otro horario.')
      return
    }

    setGuardando(true)
    const { error } = await supabase
      .from('appointments')
      .insert([{
        patient_id: selectedPatient.id,
        doctor_id: form.doctor_id,
        appointment_date: form.appointment_date,
        appointment_time: form.appointment_time,
        consultation_type: form.consultation_type,
        reason: form.reason || null,
        status: 'pending'
      }])

    if (error) {
      alert('Error al crear la cita')
      setGuardando(false)
      return
    }

    alert('Cita creada exitosamente')
    setForm({
      doctor_id: '',
      appointment_date: '',
      appointment_time: '',
      consultation_type: '',
      reason: ''
    })
    onAppointmentCreated()
    setGuardando(false)
  }

  return (
    <div>
      <form onSubmit={guardarCita} className="space-y-3">
        {selectedPatient ? (
          <div className="bg-green-50 border-l-4 border-green-500 p-3 mb-3">
            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-gray-600">Paciente:</span>
                <span className="font-bold ml-1">{selectedPatient.first_name} {selectedPatient.last_name}</span>
              </div>
              <div>
                <span className="text-gray-600">RUT:</span>
                <span className="font-medium ml-1">{selectedPatient.rut}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-100 border border-yellow-300 rounded p-3 text-center mb-3">
            <p className="text-sm text-yellow-800">Seleccione un paciente primero</p>
          </div>
        )}

        {selectedPatient && (
          <div>
            <label className="block text-sm font-medium mb-1">Doctor *</label>
            <select 
              value={form.doctor_id}
              onChange={(e) => {
                setForm({...form, doctor_id: e.target.value})
                if (form.appointment_date) {
                  checkAvailability(e.target.value, form.appointment_date)
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            >
              <option value="">Seleccionar doctor</option>
              {doctores.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name} - {doctor.specialty}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {selectedPatient && (
          <div className="grid grid-cols-2 gap-3">
            <DateSelector
              value={form.appointment_date}
              onChange={(date) => {
                setForm({...form, appointment_date: date})
                if (form.doctor_id && date) {
                  checkAvailability(form.doctor_id, date)
                }
              }}
              label="Fecha *"
              minDate={new Date().toISOString().split('T')[0]}
            />
            <div>
              <label className="block text-sm font-medium mb-1">
                Hora * {verificando && <span className="text-xs text-gray-500">(verificando...)</span>}
              </label>
              <select 
                value={form.appointment_time}
                onChange={(e) => setForm({...form, appointment_time: e.target.value})}
                disabled={!form.doctor_id || !form.appointment_date || verificando}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">Seleccionar hora</option>
                {(horariosDisponibles.length > 0 ? horariosDisponibles : timeSlots).map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
              {form.doctor_id && form.appointment_date && horariosDisponibles.length === 0 && !verificando && (
                <p className="text-xs text-red-600 mt-1">Sin horarios disponibles</p>
              )}
              {form.doctor_id && form.appointment_date && horariosDisponibles.length > 0 && (
                <p className="text-xs text-green-600 mt-1">{horariosDisponibles.length} disponibles</p>
              )}
            </div>
          </div>
        )}

        {selectedPatient && (
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de Consulta *</label>
            <select 
              value={form.consultation_type}
              onChange={(e) => setForm({...form, consultation_type: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            >
              <option value="">Seleccionar tipo</option>
              {consultationTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        )}
        
        {selectedPatient && (
          <div>
            <label className="block text-sm font-medium mb-1">Motivo (opcional)</label>
            <textarea 
              rows={2} 
              value={form.reason}
              onChange={(e) => setForm({...form, reason: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 resize-none" 
              placeholder="Motivo de la consulta"
            />
          </div>
        )}
        
        {selectedPatient && (
          <button 
            type="submit"
            disabled={guardando || !selectedPatient}
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Confirmar Cita'}
          </button>
        )}
      </form>
    </div>
  )
}

