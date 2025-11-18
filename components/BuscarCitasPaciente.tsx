'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Calendar, Trash2 } from 'lucide-react'

interface Cita {
  id: string
  appointment_date: string
  appointment_time: string
  consultation_type: string
  reason: string | null
  status: string
  doctor?: { name: string; specialty: string }
}

export default function BuscarCitasPaciente() {
  const [rut, setRut] = useState('')
  const [citas, setCitas] = useState<Cita[]>([])
  const [pacienteNombre, setPacienteNombre] = useState('')
  const [loading, setLoading] = useState(false)
  const [busquedaRealizada, setBusquedaRealizada] = useState(false)

  const buscarCitas = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rut.trim()) return

    setLoading(true)
    setBusquedaRealizada(true)

    // Buscar paciente
    const { data: paciente } = await supabase
      .from('patients')
      .select('id, first_name, last_name')
      .eq('rut', rut.trim())
      .single()

    if (!paciente) {
      setCitas([])
      setPacienteNombre('')
      setLoading(false)
      return
    }

    setPacienteNombre(`${paciente.first_name} ${paciente.last_name}`)

    // Buscar citas del paciente
    const { data } = await supabase
      .from('appointments')
      .select(`
        *,
        doctor:doctors(name, specialty)
      `)
      .eq('patient_id', paciente.id)
      .order('appointment_date', { ascending: false })
      .order('appointment_time', { ascending: false })

    if (data) {
      setCitas(data as Cita[])
    }

    setLoading(false)
  }

  const cancelarCita = async (citaId: string) => {
    const confirmacion = window.confirm(
      '¿Está seguro de que desea cancelar esta cita?\n\n' +
      'El horario quedará automáticamente libre para otros pacientes.'
    )

    if (!confirmacion) return

    await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', citaId)

    // Mostrar alerta de confirmación
    alert('Cita cancelada exitosamente.\nEl horario está ahora disponible.')

    // Recargar citas
    buscarCitas({ preventDefault: () => {} } as React.FormEvent)
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

  return (
    <div>
      <form onSubmit={buscarCitas} className="mb-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type="text"
              value={rut}
              onChange={(e) => setRut(e.target.value)}
              placeholder="Ingrese RUT del paciente (ej: 12.345.678-9)"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Buscar
          </button>
        </div>
      </form>

      {loading && (
        <div className="text-center py-6">
          <p className="text-gray-600">Buscando citas...</p>
        </div>
      )}

      {busquedaRealizada && !loading && (
        <>
          {!pacienteNombre ? (
            <div className="bg-yellow-100 border border-yellow-300 rounded p-4 text-center">
              <p className="text-yellow-800">No se encontró paciente con ese RUT</p>
            </div>
          ) : (
            <>
              <div className="mb-4 p-3 bg-blue-50 border border-blue-300 rounded">
                <p className="font-bold text-gray-800">Paciente: {pacienteNombre}</p>
                <p className="text-sm text-gray-600">RUT: {rut}</p>
                <p className="text-sm text-gray-600">Total de citas: {citas.length}</p>
              </div>

              {citas.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded p-6 text-center">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Este paciente no tiene citas registradas</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {citas.map((cita) => (
                    <div
                      key={cita.id}
                      className={`border rounded p-3 ${getEstadoColor(cita.status)}`}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-gray-800">
                              {cita.appointment_date} - {cita.appointment_time}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded border ${getEstadoColor(cita.status)}`}>
                              {getEstadoTexto(cita.status)}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-800">
                            Dr. {cita.doctor?.name}
                          </p>
                          <p className="text-xs text-gray-600">{cita.doctor?.specialty}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            Tipo: {cita.consultation_type}
                          </p>
                          {cita.reason && (
                            <p className="text-xs text-gray-600 italic">
                              Motivo: {cita.reason}
                            </p>
                          )}
                        </div>

                        {cita.status !== 'cancelled' && cita.status !== 'completed' && (
                          <button
                            onClick={() => cancelarCita(cita.id)}
                            className="flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
                          >
                            <Trash2 className="w-3 h-3" />
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}


