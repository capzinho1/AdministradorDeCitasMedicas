'use client'

import { useState } from 'react'
import { Patient } from '@/lib/supabase'
import BusquedaPaciente from '@/components/BusquedaPaciente'
import ReservaCita from '@/components/ReservaCita'

export default function RecepcionistaPage() {
  const [paciente, setPaciente] = useState<Patient | undefined>()
  const [step, setStep] = useState(1)
  const [completed, setCompleted] = useState<number[]>([])

  const seleccionarPaciente = (patient: Patient) => {
    setPaciente(patient)
    if (!completed.includes(1)) {
      setCompleted([...completed, 1])
    }
    setStep(2)
    setTimeout(() => {
      document.getElementById('step-2')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 300)
  }

  const citaCreada = () => {
    if (!completed.includes(2)) {
      setCompleted([...completed, 2])
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Citas</h1>
        <p className="text-gray-600">Agenda y administra las citas médicas</p>
      </div>

      <div id="step-1" className="mb-5">
        <div className="bg-white rounded p-4 shadow">
          <h3 className="text-lg font-bold mb-1">1. Buscar Paciente</h3>
          <p className="text-sm text-gray-600 mb-3">Busca por RUT o registra uno nuevo</p>
          <BusquedaPaciente onPatientSelect={seleccionarPaciente} selectedPatient={paciente} />
        </div>
      </div>

      <div id="step-2" className="mb-5">
        <div className="bg-white rounded p-4 shadow">
          <h3 className="text-lg font-bold mb-1">2. Agendar Cita</h3>
          <p className="text-sm text-gray-600 mb-3">Selecciona doctor, fecha y hora</p>
          {!paciente ? (
            <div className="bg-yellow-100 border border-yellow-300 rounded p-3 text-center">
              <p className="text-sm text-yellow-800">Seleccione un paciente primero</p>
            </div>
          ) : (
            <ReservaCita selectedPatient={paciente} onAppointmentCreated={citaCreada} />
          )}
        </div>
      </div>

      {completed.includes(2) && (
        <div className="bg-green-100 border-2 border-green-400 rounded p-3 text-center mb-5">
          <p className="text-green-700 font-medium">✓ Cita agendada exitosamente</p>
          <p className="text-green-600 text-sm mt-1">Puedes ver todas las citas en "Citas del Día" del menú</p>
        </div>
      )}
    </div>
  )
}
