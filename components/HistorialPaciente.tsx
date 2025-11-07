'use client'

import { useState, useEffect } from 'react'
import { supabase, ConsultationHistory } from '@/lib/supabase'

interface PatientHistoryProps {
  patientId?: string
  doctorId?: string // Si se proporciona, filtra por este doctor
  showDoctorFilter?: boolean // Si es true, muestra el filtro para elegir ver solo del doctor actual
}

export default function HistorialPaciente({ patientId, doctorId, showDoctorFilter = false }: PatientHistoryProps) {
  const [history, setHistory] = useState<ConsultationHistory[]>([])
  const [loading, setLoading] = useState(false)
  const [filterByDoctor, setFilterByDoctor] = useState(false)

  useEffect(() => {
    if (patientId) {
      fetchPatientHistory()
    } else {
      setHistory([])
    }
  }, [patientId, filterByDoctor])

  const fetchPatientHistory = async () => {
    if (!patientId) return

    setLoading(true)
    try {
      let query = supabase
        .from('consultation_history')
        .select(`
          *,
          patient:patients(first_name, last_name),
          doctor:doctors(name, specialty)
        `)
        .eq('patient_id', patientId)

      // Si se activa el filtro y hay doctorId, filtrar por ese doctor
      if (filterByDoctor && doctorId) {
        query = query.eq('doctor_id', doctorId)
      }

      const { data, error } = await query
        .order('consultation_date', { ascending: false })
        .order('consultation_time', { ascending: false })

      if (error) {
        console.error('Error fetching patient history:', error)
        return
      }

      setHistory(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
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

  if (!patientId) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 text-sm">Selecciona un paciente para ver su historial</p>
      </div>
    )
  }

  return (
    <div>
      {showDoctorFilter && doctorId && (
        <div className="mb-3">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={filterByDoctor}
              onChange={(e) => setFilterByDoctor(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span>Solo mis consultas</span>
          </label>
        </div>
      )}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="text-center py-6">
            <p className="text-gray-500 text-sm">Cargando...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500 text-sm">Sin consultas registradas</p>
          </div>
        ) : (
          history.map((consultation) => (
            <div key={consultation.id} className="bg-gray-50 p-3 rounded border">
              <div className="flex justify-between">
                <div>
                  <p className="font-bold text-gray-800 text-sm">
                    {formatDate(consultation.consultation_date)} - {formatTime(consultation.consultation_time)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Dr. {consultation.doctor?.name}
                  </p>
                  {consultation.diagnosis && (
                    <p className="text-xs text-gray-600 mt-1">
                      <strong>Diagnóstico:</strong> {consultation.diagnosis}
                    </p>
                  )}
                  {consultation.notes && (
                    <p className="text-xs text-gray-500 mt-1">
                      {consultation.notes}
                    </p>
                  )}
                </div>
                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded h-fit">
                  OK
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

