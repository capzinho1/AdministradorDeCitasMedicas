'use client'

import EstadisticasDiarias from '@/components/EstadisticasDiarias'

export default function ReportesPage() {
  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-800">Reportes</h1>
        <p className="text-gray-600 text-sm">Estadísticas del día</p>
      </div>

      <div className="bg-white rounded p-4 shadow">
        <EstadisticasDiarias />
      </div>
    </div>
  )
}

