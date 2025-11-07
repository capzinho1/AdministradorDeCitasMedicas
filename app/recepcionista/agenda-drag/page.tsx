'use client'

import CitasConDragDrop from '@/components/CitasConDragDrop'

export default function AgendaDragPage() {
  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
          Reorganizar Agenda
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Arrastra las citas para cambiar horarios
        </p>
      </div>

      <div className="bg-white rounded p-4 shadow">
        <CitasConDragDrop />
      </div>
    </div>
  )
}

