'use client'

import { useState, useEffect } from 'react'
import { supabase, DoctorAvailability } from '@/lib/supabase'

interface DisponibilidadDoctorProps {
  doctorId: string
}

export default function DisponibilidadDoctor({ doctorId }: DisponibilidadDoctorProps) {
  const [disponibilidad, setDisponibilidad] = useState<Map<string, boolean>>(new Map())
  const [guardando, setGuardando] = useState(false)
  const [cargando, setCargando] = useState(true)

  const dias = [
    { num: 1, nombre: 'Lunes' },
    { num: 2, nombre: 'Martes' },
    { num: 3, nombre: 'Miércoles' },
    { num: 4, nombre: 'Jueves' },
    { num: 5, nombre: 'Viernes' },
    { num: 6, nombre: 'Sábado' }
  ]

  const horarios = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '15:00', '15:30', '16:00', '16:30', '17:00'
  ]

  useEffect(() => {
    cargarDisponibilidad()
  }, [doctorId])

  const cargarDisponibilidad = async () => {
    setCargando(true)
    const { data } = await supabase
      .from('doctor_availability')
      .select('*')
      .eq('doctor_id', doctorId)

    const mapa = new Map<string, boolean>()
    if (data) {
      data.forEach((item: DoctorAvailability) => {
        // Ignorar el registro especial (day_of_week = 0) que indica "configurado pero vacío"
        if (item.day_of_week === 0 && item.is_available === false) {
          return
        }
        const key = `${item.day_of_week}-${item.time_slot}`
        mapa.set(key, item.is_available)
      })
    }
    setDisponibilidad(mapa)
    setCargando(false)
  }

  const toggleDisponibilidad = (dia: number, hora: string) => {
    const key = `${dia}-${hora}:00`
    const nuevo = new Map(disponibilidad)
    nuevo.set(key, !disponibilidad.get(key))
    setDisponibilidad(nuevo)
  }

  const estaDisponible = (dia: number, hora: string) => {
    const key = `${dia}-${hora}:00`
    return disponibilidad.get(key) || false
  }

  const guardarDisponibilidad = async () => {
    setGuardando(true)

    // Eliminar disponibilidad existente
    await supabase
      .from('doctor_availability')
      .delete()
      .eq('doctor_id', doctorId)

    // Insertar nueva disponibilidad
    const registros = []
    for (const dia of dias) {
      for (const hora of horarios) {
        const key = `${dia.num}-${hora}:00`
        const disponible = disponibilidad.get(key)
        
        if (disponible) {
          registros.push({
            doctor_id: doctorId,
            day_of_week: dia.num,
            time_slot: `${hora}:00`,
            is_available: true
          })
        }
      }
    }

    // Si no hay registros (disponibilidad vacía), insertar un registro especial
    // que indique que el doctor configuró su disponibilidad pero no tiene horarios
    if (registros.length === 0) {
      // Insertar un registro con day_of_week = 0 (no usado) para indicar "configurado pero vacío"
      registros.push({
        doctor_id: doctorId,
        day_of_week: 0, // 0 no se usa normalmente, lo usamos como marcador
        time_slot: '00:00:00',
        is_available: false // false indica que está configurado pero vacío
      })
    }

    const { error } = await supabase
      .from('doctor_availability')
      .insert(registros)

    if (error) {
      alert('Error al guardar la disponibilidad')
      console.error(error)
      setGuardando(false)
    } else {
      alert('Disponibilidad guardada correctamente. La página se recargará en 1 segundo...')
      // Recargar la disponibilidad para mostrar los cambios
      await cargarDisponibilidad()
      setGuardando(false)
      
      // Recargar la página después de un breve delay para que otros usuarios vean los cambios
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }
  }

  const seleccionarTodoElDia = (dia: number) => {
    const nuevo = new Map(disponibilidad)
    horarios.forEach(hora => {
      const key = `${dia}-${hora}:00`
      nuevo.set(key, true)
    })
    setDisponibilidad(nuevo)
  }

  const limpiarDia = (dia: number) => {
    const nuevo = new Map(disponibilidad)
    horarios.forEach(hora => {
      const key = `${dia}-${hora}:00`
      nuevo.set(key, false)
    })
    setDisponibilidad(nuevo)
  }

  if (cargando) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Cargando disponibilidad...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold mb-1">Configura tu Disponibilidad</h2>
        <p className="text-sm text-gray-600">
          Marca las horas en las que puedes atender pacientes
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left text-sm font-bold">Horario</th>
              {dias.map(dia => (
                <th key={dia.num} className="border p-2 text-center text-sm">
                  <div className="font-bold">{dia.nombre}</div>
                  <div className="flex gap-1 justify-center mt-1">
                    <button
                      type="button"
                      onClick={() => seleccionarTodoElDia(dia.num)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Todo
                    </button>
                    <span className="text-gray-400">|</span>
                    <button
                      type="button"
                      onClick={() => limpiarDia(dia.num)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Nada
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {horarios.map(hora => (
              <tr key={hora}>
                <td className="border p-2 text-sm font-medium bg-gray-50">
                  {hora}
                </td>
                {dias.map(dia => {
                  const disponible = estaDisponible(dia.num, hora)
                  return (
                    <td key={`${dia.num}-${hora}`} className="border p-1">
                      <button
                        type="button"
                        onClick={() => toggleDisponibilidad(dia.num, hora)}
                        className={`w-full h-8 rounded transition-colors ${
                          disponible
                            ? 'bg-green-500 hover:bg-green-600 text-white'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                        }`}
                      >
                        {disponible ? 'Sí' : 'No'}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={guardarDisponibilidad}
          disabled={guardando}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {guardando ? 'Guardando...' : 'Guardar Disponibilidad'}
        </button>
      </div>
    </div>
  )
}


