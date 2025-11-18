'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { TrendingUp, Users, Calendar, Activity } from 'lucide-react'
import DateSelector from '@/components/DateSelector'

interface Estadisticas {
  totalCitas: number
  citasCompletadas: number
  citasPendientes: number
  citasCanceladas: number
  citasConfirmadas: number
  totalPacientes: number
  totalDoctores: number
  citasPorDoctor: { name: string; count: number; specialty: string }[]
  citasPorEstado: { status: string; count: number }[]
  citasPorEspecialidad: { specialty: string; count: number }[]
  citasPorDiaSemana: { dia: string; count: number }[]
  citasPorHora: { hora: string; count: number }[]
  promedioCitasPorDoctor: number
  tasaOcupacion: number
}

export default function ReportesAdminPage() {
  const [stats, setStats] = useState<Estadisticas>({
    totalCitas: 0,
    citasCompletadas: 0,
    citasPendientes: 0,
    citasCanceladas: 0,
    citasConfirmadas: 0,
    totalPacientes: 0,
    totalDoctores: 0,
    citasPorDoctor: [],
    citasPorEstado: [],
    citasPorEspecialidad: [],
    citasPorDiaSemana: [],
    citasPorHora: [],
    promedioCitasPorDoctor: 0,
    tasaOcupacion: 0
  })
  const [loading, setLoading] = useState(true)
  const [filterMode, setFilterMode] = useState<'day' | 'range'>('day')
  const [singleDate, setSingleDate] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [filtroDoctor, setFiltroDoctor] = useState('all')
  const [filtroEstado, setFiltroEstado] = useState('all')
  const [doctores, setDoctores] = useState<any[]>([])

  useEffect(() => {
    const hoy = new Date().toISOString().split('T')[0]
    setSingleDate(hoy)
    cargarDoctores()
    cargarEstadisticas(hoy, hoy)
  }, [])

  const cargarDoctores = async () => {
    const { data } = await supabase.from('doctors').select('id, name')
    if (data) setDoctores(data)
  }

  const cargarEstadisticas = async (inicio: string, fin: string) => {
    setLoading(true)

    let query = supabase
      .from('appointments')
      .select('*, doctor:doctors(name, id, specialty)')
      .gte('appointment_date', inicio)
      .lte('appointment_date', fin)

    if (filtroDoctor !== 'all') {
      query = query.eq('doctor_id', filtroDoctor)
    }

    if (filtroEstado !== 'all') {
      query = query.eq('status', filtroEstado)
    }

    const { data: citas } = await query

    const { data: pacientes } = await supabase
      .from('patients')
      .select('id')

    const { data: doctores } = await supabase
      .from('doctors')
      .select('id')

    const totalCitas = citas?.length || 0
    const completadas = citas?.filter(c => c.status === 'completed').length || 0
    const pendientes = citas?.filter(c => c.status === 'pending').length || 0
    const canceladas = citas?.filter(c => c.status === 'cancelled').length || 0
    const confirmadas = citas?.filter(c => c.status === 'confirmed').length || 0

    const citasPorDoctor = citas?.reduce((acc: any[], cita: any) => {
      const doctorName = cita.doctor?.name || 'Sin doctor'
      const specialty = cita.doctor?.specialty || 'N/A'
      const existing = acc.find(d => d.name === doctorName)
      if (existing) {
        existing.count++
      } else {
        acc.push({ name: doctorName, count: 1, specialty })
      }
      return acc
    }, []) || []

    citasPorDoctor.sort((a, b) => b.count - a.count)

    // Agrupar por especialidad
    const citasPorEspecialidad = citas?.reduce((acc: any[], cita: any) => {
      const specialty = cita.doctor?.specialty || 'Sin especialidad'
      const existing = acc.find(e => e.specialty === specialty)
      if (existing) {
        existing.count++
      } else {
        acc.push({ specialty, count: 1 })
      }
      return acc
    }, []) || []

    citasPorEspecialidad.sort((a, b) => b.count - a.count)

    // Citas por día de la semana
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    const citasPorDiaSemana = citas?.reduce((acc: any[], cita: any) => {
      const fecha = new Date(cita.appointment_date)
      const diaSemana = diasSemana[fecha.getDay()]
      const existing = acc.find(d => d.dia === diaSemana)
      if (existing) {
        existing.count++
      } else {
        acc.push({ dia: diaSemana, count: 1 })
      }
      return acc
    }, []) || []

    // Ordenar por día de la semana
    const ordenDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
    citasPorDiaSemana.sort((a, b) => ordenDias.indexOf(a.dia) - ordenDias.indexOf(b.dia))

    // Citas por hora del día
    const citasPorHora = citas?.reduce((acc: any[], cita: any) => {
      const hora = cita.appointment_time.substring(0, 5) // HH:MM
      const horaRedondeada = `${hora.substring(0, 2)}:00` // Redondear a la hora
      const existing = acc.find(h => h.hora === horaRedondeada)
      if (existing) {
        existing.count++
      } else {
        acc.push({ hora: horaRedondeada, count: 1 })
      }
      return acc
    }, []) || []

    citasPorHora.sort((a, b) => a.hora.localeCompare(b.hora))

    // Calcular KPIs
    const totalDoctores = doctores?.length || 0
    const promedioCitasPorDoctor = totalDoctores > 0 ? (totalCitas / totalDoctores) : 0
    const citasProgramadas = completadas + confirmadas + pendientes
    const tasaOcupacion = totalCitas > 0 ? ((citasProgramadas / totalCitas) * 100) : 0

    const citasPorEstado = [
      { status: 'Completadas', count: completadas },
      { status: 'Confirmadas', count: confirmadas },
      { status: 'Pendientes', count: pendientes },
      { status: 'Canceladas', count: canceladas }
    ]

    setStats({
      totalCitas,
      citasCompletadas: completadas,
      citasPendientes: pendientes,
      citasCanceladas: canceladas,
      citasConfirmadas: confirmadas,
      totalPacientes: pacientes?.length || 0,
      totalDoctores: doctores?.length || 0,
      citasPorDoctor,
      citasPorEstado,
      citasPorEspecialidad,
      citasPorDiaSemana,
      citasPorHora,
      promedioCitasPorDoctor: Math.round(promedioCitasPorDoctor * 10) / 10,
      tasaOcupacion: Math.round(tasaOcupacion * 10) / 10
    })

    setLoading(false)
  }

  const buscarPorFecha = () => {
    if (filterMode === 'day') {
      if (singleDate) {
        cargarEstadisticas(singleDate, singleDate)
      }
    } else {
      if (fechaInicio && fechaFin) {
        cargarEstadisticas(fechaInicio, fechaFin)
      }
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Cargando reportes...</p>
      </div>
    )
  }

  const maxCitas = Math.max(...stats.citasPorDoctor.map(d => d.count), 1)
  const maxEstado = Math.max(...stats.citasPorEstado.map(e => e.count), 1)
  
  // Calcular porcentajes para gráfico de dona
  const totalEspecialidades = stats.citasPorEspecialidad.reduce((sum, e) => sum + e.count, 0)
  const coloresEspecialidad = [
    'rgb(59, 130, 246)',   // blue
    'rgb(34, 197, 94)',    // green
    'rgb(249, 115, 22)',   // orange
    'rgb(168, 85, 247)',   // purple
    'rgb(236, 72, 153)',   // pink
    'rgb(234, 179, 8)',    // yellow
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Reportes y Estadísticas</h1>
        <p className="text-gray-600">Análisis del sistema</p>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-gray-200 rounded p-4 mb-6">
        <h3 className="font-bold mb-3">Filtros</h3>
        
        {/* Selector de modo de filtro */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Modo de Filtro:</label>
          <div className="flex gap-3">
            <button
              onClick={() => setFilterMode('day')}
              className={`px-4 py-2 rounded border transition-colors ${
                filterMode === 'day'
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Día Específico
            </button>
            <button
              onClick={() => setFilterMode('range')}
              className={`px-4 py-2 rounded border transition-colors ${
                filterMode === 'range'
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Rango de Fechas
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {filterMode === 'day' ? (
            <DateSelector
              value={singleDate}
              onChange={setSingleDate}
              label="Seleccionar Día:"
            />
          ) : (
            <>
              <DateSelector
                value={fechaInicio}
                onChange={setFechaInicio}
                label="Fecha Inicio:"
              />
              <DateSelector
                value={fechaFin}
                onChange={setFechaFin}
                label="Fecha Fin:"
              />
            </>
          )}
          <div>
            <label className="block text-sm mb-1">Doctor</label>
            <select
              value={filtroDoctor}
              onChange={(e) => setFiltroDoctor(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 bg-white"
            >
              <option value="all">Todos</option>
              {doctores.map(doc => (
                <option key={doc.id} value={doc.id}>{doc.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Estado</label>
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
              onClick={buscarPorFecha}
              className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              Buscar
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards - KPIs Principales */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-3">Indicadores Clave de Rendimiento (KPIs)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 mb-1">Tasa de Ocupación</p>
                <p className="text-3xl font-bold text-blue-900">{stats.tasaOcupacion}%</p>
                <p className="text-xs text-blue-600 mt-1">Citas programadas vs total</p>
              </div>
              <Activity className="w-12 h-12 text-blue-400" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 mb-1">Tasa de Completadas</p>
                <p className="text-3xl font-bold text-green-900">
                  {stats.totalCitas > 0 ? Math.round((stats.citasCompletadas / stats.totalCitas) * 100) : 0}%
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {stats.citasCompletadas} de {stats.totalCitas} citas
                </p>
              </div>
              <Calendar className="w-12 h-12 text-green-400" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700 mb-1">Tasa de Cancelación</p>
                <p className="text-3xl font-bold text-red-900">
                  {stats.totalCitas > 0 ? Math.round((stats.citasCanceladas / stats.totalCitas) * 100) : 0}%
                </p>
                <p className="text-xs text-red-600 mt-1">
                  {stats.citasCanceladas} canceladas
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-red-400 rotate-180" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 mb-1">Promedio por Doctor</p>
                <p className="text-3xl font-bold text-purple-900">{stats.promedioCitasPorDoctor}</p>
                <p className="text-xs text-purple-600 mt-1">Citas por médico</p>
              </div>
              <Users className="w-12 h-12 text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Gráfico de barras horizontales - Actividad por Médico */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <h3 className="font-bold text-lg mb-4 text-gray-800">Productividad por Médico</h3>
          <p className="text-xs text-gray-500 mb-4">Citas atendidas por profesional</p>
          <div className="space-y-4">
            {stats.citasPorDoctor.slice(0, 8).map((doctor, index) => {
              const porcentaje = (doctor.count / maxCitas) * 100
              const colores = [
                'bg-gradient-to-r from-blue-500 to-blue-600',
                'bg-gradient-to-r from-green-500 to-green-600',
                'bg-gradient-to-r from-purple-500 to-purple-600',
                'bg-gradient-to-r from-orange-500 to-orange-600',
                'bg-gradient-to-r from-pink-500 to-pink-600',
                'bg-gradient-to-r from-indigo-500 to-indigo-600',
                'bg-gradient-to-r from-teal-500 to-teal-600',
                'bg-gradient-to-r from-yellow-500 to-yellow-600',
              ]
              return (
                <div key={index}>
                  <div className="flex justify-between mb-1">
                    <div>
                      <span className="text-sm font-semibold text-gray-800">{doctor.name}</span>
                      <span className="text-xs text-gray-500 ml-2">{doctor.specialty}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                      {doctor.count} citas
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                    <div
                      className={`${colores[index % colores.length]} h-8 flex items-center justify-end pr-3 transition-all duration-500`}
                      style={{ width: `${porcentaje}%` }}
                    >
                      {porcentaje > 15 && (
                        <span className="text-xs text-white font-bold">
                          {Math.round(porcentaje)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Gráfico de dona - Citas por Especialidad */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <h3 className="font-bold text-lg mb-4 text-gray-800">Distribución por Especialidad</h3>
          <p className="text-xs text-gray-500 mb-4">Distribución porcentual</p>
          
          {stats.citasPorEspecialidad.length > 0 ? (
            <>
              {/* Gráfico de dona visual */}
              <div className="flex justify-center mb-6">
                <div className="relative w-48 h-48">
                  <svg viewBox="0 0 100 100" className="transform -rotate-90">
                    {stats.citasPorEspecialidad.map((esp, index) => {
                      const porcentaje = (esp.count / totalEspecialidades) * 100
                      const offset = stats.citasPorEspecialidad
                        .slice(0, index)
                        .reduce((sum, e) => sum + (e.count / totalEspecialidades) * 100, 0)
                      
                      return (
                        <circle
                          key={index}
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke={coloresEspecialidad[index % coloresEspecialidad.length]}
                          strokeWidth="20"
                          strokeDasharray={`${porcentaje * 2.513} ${251.3 - porcentaje * 2.513}`}
                          strokeDashoffset={-offset * 2.513}
                          className="transition-all duration-500"
                        />
                      )
                    })}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-800">{stats.citasPorEspecialidad.length}</p>
                      <p className="text-xs text-gray-500">Especialidades</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Leyenda */}
              <div className="space-y-2">
                {stats.citasPorEspecialidad.map((esp, index) => {
                  const porcentaje = (esp.count / totalEspecialidades) * 100
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: coloresEspecialidad[index % coloresEspecialidad.length] }}
                        />
                        <span className="text-xs text-gray-700">{esp.specialty}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-gray-800">{esp.count}</span>
                        <span className="text-xs text-gray-500 ml-1">({Math.round(porcentaje)}%)</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <p className="text-center text-gray-500 py-8">No hay datos para mostrar</p>
          )}
        </div>
      </div>

      {/* Gráficos adicionales de KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Citas por Día de la Semana */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <h3 className="font-bold text-lg mb-4 text-gray-800">Citas por Día de la Semana</h3>
          <p className="text-xs text-gray-500 mb-4">Distribución semanal de demanda</p>
          <div className="space-y-3">
            {stats.citasPorDiaSemana.map((dia, index) => {
              const maxDia = Math.max(...stats.citasPorDiaSemana.map(d => d.count), 1)
              const porcentaje = (dia.count / maxDia) * 100
              return (
                <div key={index}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-800">{dia.dia}</span>
                    <span className="text-sm font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                      {dia.count} citas
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-6 flex items-center justify-end pr-2 transition-all duration-500"
                      style={{ width: `${porcentaje}%` }}
                    >
                      {porcentaje > 20 && (
                        <span className="text-xs text-white font-bold">
                          {Math.round(porcentaje)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Citas por Hora del Día */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <h3 className="font-bold text-lg mb-4 text-gray-800">Horarios de Mayor Demanda</h3>
          <p className="text-xs text-gray-500 mb-4">Distribución horaria de citas</p>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {stats.citasPorHora.slice(0, 12).map((hora, index) => {
              const maxHora = Math.max(...stats.citasPorHora.map(h => h.count), 1)
              const porcentaje = (hora.count / maxHora) * 100
              return (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-gray-700 w-16">{hora.hora}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-teal-500 to-teal-600 h-5 transition-all duration-500"
                      style={{ width: `${porcentaje}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-800 w-12 text-right">{hora.count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Resumen de Estados */}
      <div className="bg-white border border-gray-200 rounded p-4 mt-6">
        <h3 className="font-bold text-lg mb-3">Resumen de Estados</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-green-600">{stats.citasCompletadas}</p>
            <p className="text-sm text-gray-600">Completadas</p>
            <p className="text-xs text-gray-500">
              {stats.totalCitas > 0 ? Math.round((stats.citasCompletadas / stats.totalCitas) * 100) : 0}%
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">{stats.citasConfirmadas}</p>
            <p className="text-sm text-gray-600">Confirmadas</p>
            <p className="text-xs text-gray-500">
              {stats.totalCitas > 0 ? Math.round((stats.citasConfirmadas / stats.totalCitas) * 100) : 0}%
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-600">{stats.citasPendientes}</p>
            <p className="text-sm text-gray-600">Pendientes</p>
            <p className="text-xs text-gray-500">
              {stats.totalCitas > 0 ? Math.round((stats.citasPendientes / stats.totalCitas) * 100) : 0}%
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">{stats.citasCanceladas}</p>
            <p className="text-sm text-gray-600">Canceladas</p>
            <p className="text-xs text-gray-500">
              {stats.totalCitas > 0 ? Math.round((stats.citasCanceladas / stats.totalCitas) * 100) : 0}%
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
