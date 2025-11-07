'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { FileDown, Calendar, Users, ChevronLeft, ChevronRight } from 'lucide-react'
import * as XLSX from 'xlsx'
import DateSelector from '@/components/DateSelector'

interface CitaCompleta {
  id: string
  appointment_date: string
  appointment_time: string
  consultation_type: string
  reason: string | null
  status: string
  patient?: { first_name: string; last_name: string; rut: string; phone: string; email?: string }
  doctor?: { name: string; specialty: string }
}

interface Paciente {
  id: string
  rut: string
  first_name: string
  last_name: string
  phone: string
  email: string | null
  created_at: string
}

export default function ListadosPage() {
  const [citas, setCitas] = useState<CitaCompleta[]>([])
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [filtroEstado, setFiltroEstado] = useState('all')
  const [citasPage, setCitasPage] = useState(1)
  const [pacientesPage, setPacientesPage] = useState(1)
  const itemsPerPage = 5

  useEffect(() => {
    cargarCitas()
    cargarPacientes()
  }, [fecha, filtroEstado])

  useEffect(() => {
    setCitasPage(1) // Resetear página cuando cambia el filtro
  }, [fecha, filtroEstado])

  const cargarCitas = async () => {
    setLoading(true)
    
    let query = supabase
      .from('appointments')
      .select(`
        *,
        patient:patients(first_name, last_name, rut, phone, email),
        doctor:doctors(name, specialty)
      `)
      .eq('appointment_date', fecha)
      .order('appointment_time')

    if (filtroEstado !== 'all') {
      query = query.eq('status', filtroEstado)
    }

    const { data } = await query

    if (data) {
      setCitas(data as CitaCompleta[])
    }
    setLoading(false)
  }

  const cargarPacientes = async () => {
    const { data } = await supabase
      .from('patients')
      .select('*')
      .order('last_name')

    if (data) {
      setPacientes(data)
    }
  }

  const exportarCitasExcel = () => {
    const datosExcel = citas.map(cita => ({
      'Fecha': cita.appointment_date,
      'Hora': cita.appointment_time.substring(0, 5),
      'Paciente': `${cita.patient?.first_name} ${cita.patient?.last_name}`,
      'RUT': cita.patient?.rut,
      'Teléfono': cita.patient?.phone,
      'Email': cita.patient?.email || 'N/A',
      'Doctor': cita.doctor?.name,
      'Especialidad': cita.doctor?.specialty,
      'Tipo Consulta': cita.consultation_type,
      'Motivo': cita.reason || 'N/A',
      'Estado': getEstadoTexto(cita.status)
    }))

    const ws = XLSX.utils.json_to_sheet(datosExcel)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Citas')

    // Ajustar ancho de columnas
    const colWidths = [
      { wch: 12 }, // Fecha
      { wch: 8 },  // Hora
      { wch: 25 }, // Paciente
      { wch: 15 }, // RUT
      { wch: 15 }, // Teléfono
      { wch: 25 }, // Email
      { wch: 25 }, // Doctor
      { wch: 20 }, // Especialidad
      { wch: 20 }, // Tipo Consulta
      { wch: 30 }, // Motivo
      { wch: 12 }  // Estado
    ]
    ws['!cols'] = colWidths

    XLSX.writeFile(wb, `Citas_${fecha}.xlsx`)
  }

  const exportarPacientesExcel = () => {
    const datosExcel = pacientes.map(paciente => ({
      'RUT': paciente.rut,
      'Nombre': paciente.first_name,
      'Apellido': paciente.last_name,
      'Teléfono': paciente.phone,
      'Email': paciente.email || 'N/A',
      'Fecha Registro': new Date(paciente.created_at).toLocaleDateString('es-CL')
    }))

    const ws = XLSX.utils.json_to_sheet(datosExcel)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Pacientes')

    // Ajustar ancho de columnas
    const colWidths = [
      { wch: 15 }, // RUT
      { wch: 20 }, // Nombre
      { wch: 20 }, // Apellido
      { wch: 15 }, // Teléfono
      { wch: 30 }, // Email
      { wch: 15 }  // Fecha Registro
    ]
    ws['!cols'] = colWidths

    XLSX.writeFile(wb, `Pacientes_${new Date().toLocaleDateString('es-CL').replace(/\//g, '-')}.xlsx`)
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

  // Funciones de paginación para citas
  const getPaginatedCitas = () => {
    const startIndex = (citasPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return citas.slice(startIndex, endIndex)
  }

  const citasTotalPages = Math.ceil(citas.length / itemsPerPage)
  const paginatedCitas = getPaginatedCitas()

  // Funciones de paginación para pacientes
  const getPaginatedPacientes = () => {
    const startIndex = (pacientesPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return pacientes.slice(startIndex, endIndex)
  }

  const pacientesTotalPages = Math.ceil(pacientes.length / itemsPerPage)
  const paginatedPacientes = getPaginatedPacientes()

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Listados y Exportación</h1>
        <p className="text-gray-600 text-sm">Genera reportes y exporta datos a Excel</p>
      </div>

      {/* Sección Citas del Día */}
      <div className="bg-white rounded-lg shadow p-4 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-bold text-gray-800">Citas del Día ({citas.length})</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Fecha:</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Estado:</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 bg-white"
            >
              <option value="all">Todos</option>
              <option value="pending">Pendiente</option>
              <option value="confirmed">Confirmada</option>
              <option value="completed">Completada</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={exportarCitasExcel}
              disabled={citas.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileDown className="w-4 h-4" />
              Exportar a Excel
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-center py-6 text-gray-600">Cargando...</p>
        ) : citas.length === 0 ? (
          <p className="text-center py-6 text-gray-500">No hay citas para esta fecha</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Hora</th>
                    <th className="px-3 py-2 text-left">Paciente</th>
                    <th className="px-3 py-2 text-left">Doctor</th>
                    <th className="px-3 py-2 text-left">Tipo</th>
                    <th className="px-3 py-2 text-left">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCitas.map(cita => (
                    <tr key={cita.id} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2">{cita.appointment_time.substring(0, 5)}</td>
                      <td className="px-3 py-2">
                        <p className="font-medium">{cita.patient?.first_name} {cita.patient?.last_name}</p>
                        <p className="text-xs text-gray-500">{cita.patient?.rut}</p>
                      </td>
                      <td className="px-3 py-2">
                        <p className="font-medium">{cita.doctor?.name}</p>
                        <p className="text-xs text-gray-500">{cita.doctor?.specialty}</p>
                      </td>
                      <td className="px-3 py-2">{cita.consultation_type}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-1 rounded text-xs border ${getEstadoColor(cita.status)}`}>
                          {getEstadoTexto(cita.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación Citas */}
            <div className="mt-4">
              {citasTotalPages > 1 ? (
                <>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setCitasPage(prev => Math.max(1, prev - 1))}
                      disabled={citasPage === 1}
                      className="p-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <div className="flex gap-1">
                      {Array.from({ length: citasTotalPages }, (_, i) => i + 1).map(page => {
                        if (
                          page === 1 ||
                          page === citasTotalPages ||
                          (page >= citasPage - 2 && page <= citasPage + 2)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => setCitasPage(page)}
                              className={`px-3 py-1 border rounded text-sm ${
                                citasPage === page
                                  ? 'bg-purple-600 text-white border-purple-600'
                                  : 'border-gray-300 hover:bg-gray-100'
                              }`}
                            >
                              {page}
                            </button>
                          )
                        } else if (
                          page === citasPage - 3 ||
                          page === citasPage + 3
                        ) {
                          return <span key={page} className="px-2">...</span>
                        }
                        return null
                      })}
                    </div>

                    <button
                      onClick={() => setCitasPage(prev => Math.min(citasTotalPages, prev + 1))}
                      disabled={citasPage === citasTotalPages}
                      className="p-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : null}
              {citas.length > 0 && (
                <div className="mt-2 text-center text-sm text-gray-600">
                  Mostrando {((citasPage - 1) * itemsPerPage) + 1} - {Math.min(citasPage * itemsPerPage, citas.length)} de {citas.length}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Sección Lista de Pacientes */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-bold text-gray-800">Lista de Pacientes ({pacientes.length})</h2>
          </div>
          <button
            onClick={exportarPacientesExcel}
            disabled={pacientes.length === 0}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileDown className="w-4 h-4" />
            Exportar a Excel
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">RUT</th>
                <th className="px-3 py-2 text-left">Nombre Completo</th>
                <th className="px-3 py-2 text-left">Teléfono</th>
                <th className="px-3 py-2 text-left">Email</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPacientes.map(paciente => (
                <tr key={paciente.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2">{paciente.rut}</td>
                  <td className="px-3 py-2 font-medium">
                    {paciente.first_name} {paciente.last_name}
                  </td>
                  <td className="px-3 py-2">{paciente.phone}</td>
                  <td className="px-3 py-2">{paciente.email || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación Pacientes */}
        <div className="mt-4">
          {pacientesTotalPages > 1 ? (
            <>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setPacientesPage(prev => Math.max(1, prev - 1))}
                  disabled={pacientesPage === 1}
                  className="p-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <div className="flex gap-1">
                  {Array.from({ length: pacientesTotalPages }, (_, i) => i + 1).map(page => {
                    if (
                      page === 1 ||
                      page === pacientesTotalPages ||
                      (page >= pacientesPage - 2 && page <= pacientesPage + 2)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setPacientesPage(page)}
                          className={`px-3 py-1 border rounded text-sm ${
                            pacientesPage === page
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    } else if (
                      page === pacientesPage - 3 ||
                      page === pacientesPage + 3
                    ) {
                      return <span key={page} className="px-2">...</span>
                    }
                    return null
                  })}
                </div>

                <button
                  onClick={() => setPacientesPage(prev => Math.min(pacientesTotalPages, prev + 1))}
                  disabled={pacientesPage === pacientesTotalPages}
                  className="p-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : null}
          {pacientes.length > 0 && (
            <div className="mt-2 text-center text-sm text-gray-600">
              Mostrando {((pacientesPage - 1) * itemsPerPage) + 1} - {Math.min(pacientesPage * itemsPerPage, pacientes.length)} de {pacientes.length}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

