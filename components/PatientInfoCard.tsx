'use client'

import { Patient } from '@/lib/supabase'
import { calculateAge, formatAge, getAgeCategory } from '@/lib/ageCalculator'
import { Printer } from 'lucide-react'

interface PatientInfoCardProps {
  patient: Patient
  onPrint?: () => void
}

export default function PatientInfoCard({ patient, onPrint }: PatientInfoCardProps) {
  const age = patient.date_of_birth ? calculateAge(patient.date_of_birth) : null
  const ageCategory = patient.date_of_birth ? getAgeCategory(patient.date_of_birth) : null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800">
            {patient.first_name} {patient.last_name}
          </h3>
          {age !== null && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold text-blue-600">{age} años</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                {ageCategory}
              </span>
            </div>
          )}
        </div>
        {onPrint && (
          <button
            onClick={onPrint}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
          >
            <Printer className="w-4 h-4" />
            Imprimir Ficha
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-gray-600 text-xs">RUT</p>
          <p className="font-medium text-gray-800">{patient.rut}</p>
        </div>
        {patient.date_of_birth && (
          <div>
            <p className="text-gray-600 text-xs">Fecha de Nacimiento</p>
            <p className="font-medium text-gray-800">{formatDate(patient.date_of_birth)}</p>
          </div>
        )}
        <div>
          <p className="text-gray-600 text-xs">Teléfono</p>
          <p className="font-medium text-gray-800">{patient.phone}</p>
        </div>
        <div>
          <p className="text-gray-600 text-xs">Email</p>
          <p className="font-medium text-gray-800">{patient.email || 'N/A'}</p>
        </div>
      </div>
    </div>
  )
}


