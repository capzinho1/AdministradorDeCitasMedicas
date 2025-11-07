'use client'

import BuscarCitasPaciente from '@/components/BuscarCitasPaciente'

export default function CancelarCitasPage() {
  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Cancelar Citas</h1>
        <p className="text-sm sm:text-base text-gray-600">
          Busca pacientes por RUT y gestiona sus citas
        </p>
      </div>

      <div className="bg-white rounded p-4 shadow">
        <BuscarCitasPaciente />
      </div>
    </div>
  )
}


