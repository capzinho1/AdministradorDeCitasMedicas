'use client'

import DisponibilidadDoctor from '@/components/DisponibilidadDoctor'
import { useState, useEffect } from 'react'
import { getCurrentDoctor } from '@/lib/auth'

export default function DisponibilidadPage() {
  const [doctorId, setDoctorId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarDoctor()
  }, [])

  const cargarDoctor = () => {
    const doctor = getCurrentDoctor()
    if (doctor) {
      setDoctorId(doctor.id)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-800">Mi Disponibilidad</h1>
        <p className="text-gray-600 text-sm">Configura los días y horas en que puedes atender</p>
      </div>

      {doctorId && (
        <div className="bg-white rounded p-4 shadow">
          <DisponibilidadDoctor doctorId={doctorId} />
        </div>
      )}
    </div>
  )
}

