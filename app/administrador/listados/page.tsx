'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRealtimeAppointments } from '@/lib/hooks/useRealtimeAppointments'
import { FileDown, Calendar, Users } from 'lucide-react'
import Pagination from '@/components/shared/Pagination'
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

interface Doctor {
  id: string
  name: string
}

export default function ListadosPage() {
  // Estados para citas
  const [citasFilterMode, setCitasFilterMode] = useState<'day' | 'range'>('day')
  const [citasFecha, setCitasFecha] = useState(new Date().toISOString().split('T')[0])
  const [citasFechaInicio, setCitasFechaInicio] = useState('')
  const [citasFechaFin, setCitasFechaFin] = useState('')
  const [citasFiltroEstado, setCitasFiltroEstado] = useState('all')
  const [citasFiltroDoctor, setCitasFiltroDoctor] = useState('all')
  const [citasFiltroTipo, setCitasFiltroTipo] = useState('all')
  const [doctores, setDoctores] = useState<Doctor[]>([])
  const [citasPage, setCitasPage] = useState(1)
  const [citasItemsPerPage, setCitasItemsPerPage] = useState(16)
  
  // Campos seleccionables para citas
  const [citasCampos, setCitasCampos] = useState({
    fecha: true,
    hora: true,
    paciente: true,
    rut: true,
    doctor: true,
    especialidad: true,
    tipoConsulta: true,
    motivo: false,
    estado: true
  })

  // Ordenamiento para citas
  const [citasOrdenarPor, setCitasOrdenarPor] = useState<string>('hora')
  const [citasOrdenDireccion, setCitasOrdenDireccion] = useState<'asc' | 'desc'>('asc')

  // Estados para pacientes
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [pacientesFiltrados, setPacientesFiltrados] = useState<Paciente[]>([])
  const [pacientesPage, setPacientesPage] = useState(1)
  const [pacientesItemsPerPage, setPacientesItemsPerPage] = useState(16)
  
  // Campos seleccionables para pacientes
  const [pacientesCampos, setPacientesCampos] = useState({
    rut: true,
    nombre: true,
    apellido: true,
    nombreCompleto: false,
    telefono: true,
    email: false,
    fechaRegistro: false
  })

  // Ordenamiento para pacientes
  const [pacientesOrdenarPor, setPacientesOrdenarPor] = useState<string>('apellido')
  const [pacientesOrdenDireccion, setPacientesOrdenDireccion] = useState<'asc' | 'desc'>('asc')

  // Tab activo
  const [tabActivo, setTabActivo] = useState<'citas' | 'pacientes'>('citas')

  const tiposConsulta = ['Primera consulta', 'Control', 'Urgencia', 'Revisión de exámenes', 'Consulta de seguimiento']

  useEffect(() => {
    cargarDoctores()
    cargarPacientes()
  }, [])

  useEffect(() => {
    setCitasPage(1)
  }, [citasFecha, citasFechaInicio, citasFechaFin, citasFiltroEstado, citasFiltroDoctor, citasFiltroTipo, citasItemsPerPage, citasFilterMode])

  useEffect(() => {
    filtrarPacientes()
  }, [pacientes, pacientesOrdenarPor, pacientesOrdenDireccion])

  const cargarDoctores = async () => {
    const { data } = await supabase.from('doctors').select('id, name').order('name')
    if (data) setDoctores(data)
  }

  const cargarPacientes = async () => {
    const { data } = await supabase
      .from('patients')
      .select('*')
      .order('last_name')

    if (data) {
      setPacientes(data)
      setPacientesFiltrados(data)
    }
  }

  const filtrarPacientes = () => {
    let filtrados = [...pacientes]

    // Ordenar pacientes
    filtrados.sort((a, b) => {
      let valorA: any
      let valorB: any

      switch (pacientesOrdenarPor) {
        case 'rut':
          // Extraer solo números del RUT para comparar
          valorA = parseInt(a.rut.replace(/[^0-9]/g, '')) || 0
          valorB = parseInt(b.rut.replace(/[^0-9]/g, '')) || 0
          break
        case 'nombre':
          valorA = a.first_name.toLowerCase()
          valorB = b.first_name.toLowerCase()
          break
        case 'apellido':
          valorA = a.last_name.toLowerCase()
          valorB = b.last_name.toLowerCase()
          break
        case 'telefono':
          valorA = a.phone || ''
          valorB = b.phone || ''
          break
        case 'email':
          valorA = (a.email || '').toLowerCase()
          valorB = (b.email || '').toLowerCase()
          break
        case 'fechaRegistro':
          valorA = new Date(a.created_at).getTime()
          valorB = new Date(b.created_at).getTime()
          break
        default:
          valorA = a.last_name.toLowerCase()
          valorB = b.last_name.toLowerCase()
      }

      if (valorA < valorB) return pacientesOrdenDireccion === 'asc' ? -1 : 1
      if (valorA > valorB) return pacientesOrdenDireccion === 'asc' ? 1 : -1
      return 0
    })

    setPacientesFiltrados(filtrados)
    setPacientesPage(1)
  }

  // Obtener citas filtradas y ordenadas
  const obtenerCitasFiltradas = (citasData: CitaCompleta[]) => {
    let citasFiltradas = citasData

    // Filtrar por doctor
    if (citasFiltroDoctor !== 'all') {
      const doctorSeleccionado = doctores.find(d => d.id === citasFiltroDoctor)
      if (doctorSeleccionado) {
        citasFiltradas = citasFiltradas.filter(c => {
          return c.doctor?.name === doctorSeleccionado.name
        })
      }
    }

    // Filtrar por tipo de consulta
    if (citasFiltroTipo !== 'all') {
      citasFiltradas = citasFiltradas.filter(c => c.consultation_type === citasFiltroTipo)
    }

    // Ordenar citas
    citasFiltradas.sort((a, b) => {
      let valorA: any
      let valorB: any

      switch (citasOrdenarPor) {
        case 'fecha':
          valorA = new Date(a.appointment_date).getTime()
          valorB = new Date(b.appointment_date).getTime()
          break
        case 'hora':
          valorA = a.appointment_time
          valorB = b.appointment_time
          break
        case 'paciente':
          valorA = `${a.patient?.first_name} ${a.patient?.last_name}`.toLowerCase()
          valorB = `${b.patient?.first_name} ${b.patient?.last_name}`.toLowerCase()
          break
        case 'rut':
          valorA = parseInt((a.patient?.rut || '').replace(/[^0-9]/g, '')) || 0
          valorB = parseInt((b.patient?.rut || '').replace(/[^0-9]/g, '')) || 0
          break
        case 'telefono':
          valorA = (a.patient?.phone || '').toLowerCase()
          valorB = (b.patient?.phone || '').toLowerCase()
          break
        case 'email':
          valorA = ((a.patient?.email || '')).toLowerCase()
          valorB = ((b.patient?.email || '')).toLowerCase()
          break
        case 'doctor':
          valorA = (a.doctor?.name || '').toLowerCase()
          valorB = (b.doctor?.name || '').toLowerCase()
          break
        case 'especialidad':
          valorA = (a.doctor?.specialty || '').toLowerCase()
          valorB = (b.doctor?.specialty || '').toLowerCase()
          break
        case 'tipoConsulta':
          valorA = (a.consultation_type || '').toLowerCase()
          valorB = (b.consultation_type || '').toLowerCase()
          break
        case 'estado':
          valorA = (a.status || '').toLowerCase()
          valorB = (b.status || '').toLowerCase()
          break
        default:
          valorA = a.appointment_time
          valorB = b.appointment_time
      }

      if (valorA < valorB) return citasOrdenDireccion === 'asc' ? -1 : 1
      if (valorA > valorB) return citasOrdenDireccion === 'asc' ? 1 : -1
      return 0
    })

    return citasFiltradas
  }

  // Estados para cargar citas en rango
  const [citasRango, setCitasRango] = useState<CitaCompleta[]>([])
  const [citasRangoLoading, setCitasRangoLoading] = useState(false)

  // Usar el hook de tiempo real para obtener citas (solo para fecha única)
  const { appointments, loading: citasLoadingHook } = useRealtimeAppointments({
    date: citasFilterMode === 'day' ? citasFecha : undefined,
    doctorId: citasFilterMode === 'day' && citasFiltroDoctor !== 'all' ? citasFiltroDoctor : undefined,
    status: citasFiltroEstado !== 'all' ? citasFiltroEstado : undefined,
    enabled: citasFilterMode === 'day' && !!citasFecha
  })

  // Cargar citas para rango de fechas
  useEffect(() => {
    if (citasFilterMode === 'range' && citasFechaInicio && citasFechaFin) {
      cargarCitasRango()
    } else {
      setCitasRango([])
    }
  }, [citasFilterMode, citasFechaInicio, citasFechaFin, citasFiltroEstado, citasFiltroDoctor])

  const cargarCitasRango = async () => {
    setCitasRangoLoading(true)
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(first_name, last_name, rut, phone, email),
          doctor:doctors(name, specialty)
        `)
        .gte('appointment_date', citasFechaInicio)
        .lte('appointment_date', citasFechaFin)

      if (citasFiltroEstado !== 'all') {
        query = query.eq('status', citasFiltroEstado)
      }

      if (citasFiltroDoctor !== 'all') {
        query = query.eq('doctor_id', citasFiltroDoctor)
      }

      const { data } = await query.order('appointment_date', { ascending: true }).order('appointment_time', { ascending: true })

      if (data) {
        setCitasRango(data as CitaCompleta[])
      }
    } catch (error) {
      console.error('Error cargando citas:', error)
    } finally {
      setCitasRangoLoading(false)
    }
  }

  // Determinar rango de fechas para citas
  const getCitasDateRange = () => {
    if (citasFilterMode === 'day') {
      return { inicio: citasFecha, fin: citasFecha }
    }
    return { inicio: citasFechaInicio, fin: citasFechaFin }
  }

  // Obtener citas según el modo
  const citas = citasFilterMode === 'day' 
    ? (appointments as CitaCompleta[])
    : citasRango
  
  const citasLoading = citasFilterMode === 'day' 
    ? citasLoadingHook 
    : citasRangoLoading

  const citasFiltradas = obtenerCitasFiltradas(citas)

  const exportarCitasExcel = () => {
    const camposSeleccionados = Object.entries(citasCampos).filter(([_, selected]) => selected).map(([key]) => key)
    
    if (camposSeleccionados.length === 0) {
      alert('Por favor seleccione al menos un campo para exportar')
      return
    }

    const datosExcel = citasFiltradas.map(cita => {
      const registro: any = {}
      
      if (citasCampos.fecha) registro['Fecha'] = cita.appointment_date
      if (citasCampos.hora) registro['Hora'] = cita.appointment_time.substring(0, 5)
      if (citasCampos.paciente) registro['Paciente'] = `${cita.patient?.first_name} ${cita.patient?.last_name}`
      if (citasCampos.rut) registro['RUT'] = cita.patient?.rut || 'N/A'
      if (citasCampos.doctor) registro['Doctor'] = cita.doctor?.name || 'N/A'
      if (citasCampos.especialidad) registro['Especialidad'] = cita.doctor?.specialty || 'N/A'
      if (citasCampos.tipoConsulta) registro['Tipo Consulta'] = cita.consultation_type
      if (citasCampos.motivo) registro['Motivo'] = cita.reason || 'N/A'
      if (citasCampos.estado) registro['Estado'] = getEstadoTexto(cita.status)
      
      return registro
    })

    if (datosExcel.length === 0) {
      alert('No hay citas para exportar con los filtros seleccionados')
      return
    }

    const ws = XLSX.utils.json_to_sheet(datosExcel)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Citas')

    // Ajustar ancho de columnas automáticamente
    const colWidths = Object.keys(datosExcel[0] || {}).map(() => ({ wch: 15 }))
    ws['!cols'] = colWidths

    const { inicio, fin } = getCitasDateRange()
    const nombreArchivo = citasFilterMode === 'day' 
      ? `Citas_${inicio}.xlsx`
      : `Citas_${inicio}_${fin}.xlsx`
    
    XLSX.writeFile(wb, nombreArchivo)
  }

  const exportarPacientesExcel = () => {
    const camposSeleccionados = Object.entries(pacientesCampos).filter(([_, selected]) => selected).map(([key]) => key)
    
    if (camposSeleccionados.length === 0) {
      alert('Por favor seleccione al menos un campo para exportar')
      return
    }

    const datosExcel = pacientesFiltrados.map(paciente => {
      const registro: any = {}
      
      if (pacientesCampos.rut) registro['RUT'] = paciente.rut
      if (pacientesCampos.nombre) registro['Nombre'] = paciente.first_name
      if (pacientesCampos.apellido) registro['Apellido'] = paciente.last_name
      if (pacientesCampos.nombreCompleto) registro['Nombre Completo'] = `${paciente.first_name} ${paciente.last_name}`
      if (pacientesCampos.telefono) registro['Teléfono'] = paciente.phone
      if (pacientesCampos.email) registro['Email'] = paciente.email || 'N/A'
      if (pacientesCampos.fechaRegistro) registro['Fecha Registro'] = new Date(paciente.created_at).toLocaleDateString('es-CL')
      
      return registro
    })

    if (datosExcel.length === 0) {
      alert('No hay pacientes para exportar con los filtros seleccionados')
      return
    }

    const ws = XLSX.utils.json_to_sheet(datosExcel)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Pacientes')

    // Ajustar ancho de columnas automáticamente
    const colWidths = Object.keys(datosExcel[0] || {}).map(() => ({ wch: 15 }))
    ws['!cols'] = colWidths

    const fechaHoy = new Date().toLocaleDateString('es-CL').replace(/\//g, '-')
    XLSX.writeFile(wb, `Pacientes_${fechaHoy}.xlsx`)
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
    const startIndex = (citasPage - 1) * citasItemsPerPage
    const endIndex = startIndex + citasItemsPerPage
    return citasFiltradas.slice(startIndex, endIndex)
  }

  const citasTotalPages = Math.ceil(citasFiltradas.length / citasItemsPerPage)
  const paginatedCitas = getPaginatedCitas()

  // Funciones de paginación para pacientes
  const getPaginatedPacientes = () => {
    const startIndex = (pacientesPage - 1) * pacientesItemsPerPage
    const endIndex = startIndex + pacientesItemsPerPage
    return pacientesFiltrados.slice(startIndex, endIndex)
  }

  const pacientesTotalPages = Math.ceil(pacientesFiltrados.length / pacientesItemsPerPage)
  const paginatedPacientes = getPaginatedPacientes()

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Listados y Exportación</h1>
        <p className="text-gray-600 text-sm">Genera reportes y exporta datos personalizados a Excel</p>
      </div>

      {/* Selector de Tabs */}
      <div className="mb-4 flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setTabActivo('citas')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            tabActivo === 'citas'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Calendar className="w-4 h-4 inline mr-2" />
          Exportar Citas
        </button>
        <button
          onClick={() => setTabActivo('pacientes')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            tabActivo === 'pacientes'
              ? 'border-b-2 border-green-600 text-green-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Exportar Pacientes
        </button>
      </div>

      {/* Sección Citas */}
      {tabActivo === 'citas' && (
      <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg shadow p-4 border border-blue-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-bold text-gray-800">Exportar Citas ({citasFiltradas.length})</h2>
          </div>
        </div>

        {/* Filtros de Citas */}
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <div className="mb-3">
            <label className="block text-sm font-medium mb-2">Modo de Filtro:</label>
            <div className="flex gap-2">
              <button
                onClick={() => setCitasFilterMode('day')}
                className={`px-3 py-1 rounded text-sm border ${
                  citasFilterMode === 'day'
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Fecha Única
              </button>
              <button
                onClick={() => setCitasFilterMode('range')}
                className={`px-3 py-1 rounded text-sm border ${
                  citasFilterMode === 'range'
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Rango de Fechas
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {citasFilterMode === 'day' ? (
              <DateSelector
                value={citasFecha}
                onChange={setCitasFecha}
                label="Fecha"
              />
            ) : (
              <>
                <DateSelector
                  value={citasFechaInicio}
                  onChange={setCitasFechaInicio}
                  label="Fecha Inicio"
                />
                <DateSelector
                  value={citasFechaFin}
                  onChange={setCitasFechaFin}
                  label="Fecha Fin"
                />
              </>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-1">Estado:</label>
              <select
                value={citasFiltroEstado}
                onChange={(e) => setCitasFiltroEstado(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 bg-white"
              >
                <option value="all">Todos</option>
                <option value="pending">Pendiente</option>
                <option value="confirmed">Confirmada</option>
                <option value="completed">Completada</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Doctor:</label>
              <select
                value={citasFiltroDoctor}
                onChange={(e) => setCitasFiltroDoctor(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 bg-white"
              >
                <option value="all">Todos</option>
                {doctores.map(doc => (
                  <option key={doc.id} value={doc.id}>{doc.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tipo Consulta:</label>
              <select
                value={citasFiltroTipo}
                onChange={(e) => setCitasFiltroTipo(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 bg-white"
              >
                <option value="all">Todos</option>
                {tiposConsulta.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Selección de Campos para Citas - Menú Fijo */}
        <div className="mb-4 border border-gray-200 rounded p-4 bg-gray-50">
          <h3 className="font-medium text-sm mb-3">Seleccionar Campos a Exportar</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries({
              fecha: 'Fecha',
              hora: 'Hora',
              paciente: 'Paciente',
              rut: 'RUT',
              doctor: 'Doctor',
              especialidad: 'Especialidad',
              tipoConsulta: 'Tipo Consulta',
              motivo: 'Motivo',
              estado: 'Estado'
            }).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={citasCampos[key as keyof typeof citasCampos]}
                  onChange={(e) => setCitasCampos({
                    ...citasCampos,
                    [key]: e.target.checked
                  })}
                  className="w-4 h-4"
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Ordenamiento para Citas */}
        <div className="mb-4 flex items-center gap-2">
          <label className="text-sm text-gray-600">Ordenar por:</label>
          <select
            value={`${citasOrdenarPor}-${citasOrdenDireccion}`}
            onChange={(e) => {
              const [campo, direccion] = e.target.value.split('-')
              setCitasOrdenarPor(campo)
              setCitasOrdenDireccion(direccion as 'asc' | 'desc')
            }}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white"
          >
            <option value="hora-asc">Hora: Menor a Mayor</option>
            <option value="hora-desc">Hora: Mayor a Menor</option>
            <option value="fecha-asc">Fecha: Antigua a Reciente</option>
            <option value="fecha-desc">Fecha: Reciente a Antigua</option>
            <option value="paciente-asc">Paciente: A-Z</option>
            <option value="paciente-desc">Paciente: Z-A</option>
            <option value="rut-asc">RUT: Menor a Mayor</option>
            <option value="rut-desc">RUT: Mayor a Menor</option>
            <option value="telefono-asc">Teléfono: A-Z</option>
            <option value="telefono-desc">Teléfono: Z-A</option>
            <option value="email-asc">Email: A-Z</option>
            <option value="email-desc">Email: Z-A</option>
            <option value="doctor-asc">Doctor: A-Z</option>
            <option value="doctor-desc">Doctor: Z-A</option>
          </select>
        </div>

        {/* Botón Exportar y Vista Previa */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">
            <strong>{citasFiltradas.length}</strong> citas encontradas con los filtros seleccionados
          </div>
          <button
            onClick={exportarCitasExcel}
            disabled={citasFiltradas.length === 0}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileDown className="w-4 h-4" />
            Exportar a Excel
          </button>
        </div>

        {/* Tabla de Citas */}
        {citasLoading ? (
          <p className="text-center py-6 text-gray-600">Cargando...</p>
        ) : citasFiltradas.length === 0 ? (
          <p className="text-center py-6 text-gray-500">No hay citas para los filtros seleccionados</p>
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
            {citasFiltradas.length > 0 && (
              <Pagination
                currentPage={citasPage}
                totalPages={citasTotalPages}
                itemsPerPage={citasItemsPerPage}
                totalItems={citasFiltradas.length}
                onPageChange={setCitasPage}
                onItemsPerPageChange={setCitasItemsPerPage}
              />
            )}
          </>
        )}
      </div>
      )}

      {/* Sección Pacientes */}
      {tabActivo === 'pacientes' && (
      <div className="bg-gradient-to-br from-green-50 to-white rounded-lg shadow p-4 border border-green-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-bold text-gray-800">Exportar Pacientes ({pacientesFiltrados.length})</h2>
          </div>
        </div>


        {/* Selección de Campos para Pacientes - Menú Fijo */}
        <div className="mb-4 border border-gray-200 rounded p-4 bg-gray-50">
          <h3 className="font-medium text-sm mb-3">Seleccionar Campos a Exportar</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries({
              rut: 'RUT',
              nombre: 'Nombre',
              apellido: 'Apellido',
              nombreCompleto: 'Nombre Completo',
              telefono: 'Teléfono',
              email: 'Email',
              fechaRegistro: 'Fecha Registro'
            }).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pacientesCampos[key as keyof typeof pacientesCampos]}
                  onChange={(e) => setPacientesCampos({
                    ...pacientesCampos,
                    [key]: e.target.checked
                  })}
                  className="w-4 h-4"
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Ordenamiento para Pacientes */}
        <div className="mb-4 flex items-center gap-2">
          <label className="text-sm text-gray-600">Ordenar por:</label>
          <select
            value={`${pacientesOrdenarPor}-${pacientesOrdenDireccion}`}
            onChange={(e) => {
              const [campo, direccion] = e.target.value.split('-')
              setPacientesOrdenarPor(campo)
              setPacientesOrdenDireccion(direccion as 'asc' | 'desc')
            }}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white"
          >
            <option value="apellido-asc">Apellido: A-Z</option>
            <option value="apellido-desc">Apellido: Z-A</option>
            <option value="rut-asc">RUT: Menor a Mayor</option>
            <option value="rut-desc">RUT: Mayor a Menor</option>
            <option value="nombre-asc">Nombre: A-Z</option>
            <option value="nombre-desc">Nombre: Z-A</option>
            <option value="email-asc">Email: A-Z</option>
            <option value="email-desc">Email: Z-A</option>
            <option value="fechaRegistro-asc">Fecha: Antigua a Reciente</option>
            <option value="fechaRegistro-desc">Fecha: Reciente a Antigua</option>
          </select>
        </div>

        {/* Botón Exportar y Vista Previa */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">
            <strong>{pacientesFiltrados.length}</strong> pacientes encontrados con los filtros seleccionados
          </div>
          <button
            onClick={exportarPacientesExcel}
            disabled={pacientesFiltrados.length === 0}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileDown className="w-4 h-4" />
            Exportar a Excel
          </button>
        </div>

        {/* Tabla de Pacientes */}
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
        {pacientesFiltrados.length > 0 && (
          <Pagination
            currentPage={pacientesPage}
            totalPages={pacientesTotalPages}
            itemsPerPage={pacientesItemsPerPage}
            totalItems={pacientesFiltrados.length}
            onPageChange={setPacientesPage}
            onItemsPerPageChange={setPacientesItemsPerPage}
          />
        )}
      </div>
      )}
    </div>
  )
}
