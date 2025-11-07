'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Doctor, Receptionist, Administrator } from '@/lib/supabase'
import { UserPlus, Trash2, User, ChevronLeft, ChevronRight } from 'lucide-react'

type PersonalType = 'doctor' | 'receptionist' | 'administrator'

export default function PersonalPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [receptionists, setReceptionists] = useState<Receptionist[]>([])
  const [administrators, setAdministrators] = useState<Administrator[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState<'all' | PersonalType>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState<PersonalType>('doctor')
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: 'doctor123',
    specialty: ''
  })

  useEffect(() => {
    cargarPersonal()
  }, [])

  useEffect(() => {
    setCurrentPage(1) // Resetear a página 1 cuando cambia el filtro
  }, [filtroTipo])

  const cargarPersonal = async () => {
    setLoading(true)
    
    const { data: doctorsData } = await supabase
      .from('doctors')
      .select('*')
      .order('name')
    
    const { data: receptionistsData } = await supabase
      .from('receptionists')
      .select('*')
      .order('name')
    
    const { data: adminsData } = await supabase
      .from('administrators')
      .select('*')
      .order('name')
    
    if (doctorsData) setDoctors(doctorsData)
    if (receptionistsData) setReceptionists(receptionistsData)
    if (adminsData) setAdministrators(adminsData)
    
    setLoading(false)
  }

  const abrirFormulario = (type: PersonalType) => {
    setFormType(type)
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: type === 'doctor' ? 'doctor123' : type === 'receptionist' ? 'recepcion123' : 'admin123',
      specialty: ''
    })
    setShowForm(true)
  }

  const guardarPersonal = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (formType === 'doctor') {
        await supabase.from('doctors').insert({
          name: formData.name,
          specialty: formData.specialty,
          email: formData.email,
          phone: formData.phone,
          password: formData.password
        })
      } else if (formType === 'receptionist') {
        await supabase.from('receptionists').insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password
        })
      } else {
        await supabase.from('administrators').insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password
        })
      }
      
      setShowForm(false)
      cargarPersonal()
    } catch (error) {
      console.error('Error al guardar:', error)
    }
  }

  const eliminarDoctor = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este doctor?')) return
    await supabase.from('doctors').delete().eq('id', id)
    cargarPersonal()
  }

  const eliminarRecepcionista = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este recepcionista?')) return
    await supabase.from('receptionists').delete().eq('id', id)
    cargarPersonal()
  }

  const eliminarAdministrador = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este administrador?')) return
    await supabase.from('administrators').delete().eq('id', id)
    cargarPersonal()
  }

  // Función para obtener todos los elementos según el filtro
  const getFilteredItems = () => {
    const allItems: Array<{id: string, name: string, email: string, phone?: string, specialty?: string, type: PersonalType}> = []
    
    if (filtroTipo === 'all' || filtroTipo === 'doctor') {
      doctors.forEach(d => allItems.push({...d, type: 'doctor'}))
    }
    if (filtroTipo === 'all' || filtroTipo === 'receptionist') {
      receptionists.forEach(r => allItems.push({...r, type: 'receptionist'}))
    }
    if (filtroTipo === 'all' || filtroTipo === 'administrator') {
      administrators.forEach(a => allItems.push({...a, type: 'administrator'}))
    }
    
    return allItems
  }

  // Función para obtener los elementos de la página actual
  const getPaginatedItems = () => {
    const filtered = getFilteredItems()
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filtered.slice(startIndex, endIndex)
  }

  const totalItems = getFilteredItems().length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const paginatedItems = getPaginatedItems()

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Cargando personal...</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="mb-3">
        <h1 className="text-xl font-bold text-gray-800 mb-1">Gestión de Personal</h1>
      </div>

      {/* Filtro y Botones en línea */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <div>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value as any)}
            className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
          >
            <option value="all">Todos</option>
            <option value="doctor">Solo Doctores</option>
            <option value="receptionist">Solo Recepcionistas</option>
            <option value="administrator">Solo Administradores</option>
          </select>
        </div>
        <button
          onClick={() => abrirFormulario('doctor')}
          className="flex items-center gap-1 bg-green-600 text-white px-2 py-1 text-sm rounded hover:bg-green-700"
        >
          <UserPlus className="w-3 h-3" />
          Doctor
        </button>
        <button
          onClick={() => abrirFormulario('receptionist')}
          className="flex items-center gap-1 bg-blue-600 text-white px-2 py-1 text-sm rounded hover:bg-blue-700"
        >
          <UserPlus className="w-3 h-3" />
          Recepcionista
        </button>
        <button
          onClick={() => abrirFormulario('administrator')}
          className="flex items-center gap-1 bg-purple-600 text-white px-2 py-1 text-sm rounded hover:bg-purple-700"
        >
          <UserPlus className="w-3 h-3" />
          Administrador
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">
              {formType === 'doctor' ? 'Nuevo Doctor' : 
               formType === 'receptionist' ? 'Nuevo Recepcionista' : 
               'Nuevo Administrador'}
            </h3>
            
            <form onSubmit={guardarPersonal} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre Completo</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>

              {formType === 'doctor' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Especialidad</label>
                  <input
                    type="text"
                    value={formData.specialty}
                    onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="+56912345678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Contraseña</label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 text-white py-2 rounded hover:bg-purple-700"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de Personal */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-sm font-bold text-gray-700">
            {filtroTipo === 'all' ? 'Todo el Personal' : 
             filtroTipo === 'doctor' ? 'Doctores' : 
             filtroTipo === 'receptionist' ? 'Recepcionistas' : 
             'Administradores'} ({totalItems})
          </h2>
        </div>
        <div className="grid gap-2">
          {paginatedItems.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded p-2 text-center text-gray-500 text-sm">
              No hay personal registrado
            </div>
          ) : (
            paginatedItems.map((item) => {
              const isDoctor = item.type === 'doctor'
              const isReceptionist = item.type === 'receptionist'
              const isAdmin = item.type === 'administrator'
              
              return (
                <div key={item.id} className="bg-white border border-gray-200 rounded p-2 flex items-center justify-between">
                  <div className="flex gap-2 items-center flex-1 min-w-0">
                    <div className={`p-1 rounded flex-shrink-0 ${
                      isDoctor ? 'bg-green-100' : 
                      isReceptionist ? 'bg-blue-100' : 
                      'bg-purple-100'
                    }`}>
                      <User className={`w-3 h-3 ${
                        isDoctor ? 'text-green-700' : 
                        isReceptionist ? 'text-blue-700' : 
                        'text-purple-700'
                      }`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm text-gray-800 truncate">{item.name}</h3>
                        {isDoctor && item.specialty && (
                          <span className="text-xs text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded whitespace-nowrap">{item.specialty}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
                        <span className="truncate">{item.email}</span>
                        {item.phone && <span className="whitespace-nowrap">{item.phone}</span>}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (isDoctor) eliminarDoctor(item.id)
                      else if (isReceptionist) eliminarRecepcionista(item.id)
                      else eliminarAdministrador(item.id)
                    }}
                    className="text-red-600 hover:text-red-800 p-1.5 flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* Controles de Paginación */}
        {totalPages > 1 && (
          <div className="mt-3 flex items-center justify-center gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            
            <div className="flex gap-0.5">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                // Mostrar solo algunas páginas alrededor de la actual
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 2 && page <= currentPage + 2)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-2 py-0.5 text-xs border rounded ${
                        currentPage === page
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  )
                } else if (
                  page === currentPage - 3 ||
                  page === currentPage + 3
                ) {
                  return <span key={page} className="px-1 text-xs">...</span>
                }
                return null
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Info de paginación */}
        {totalItems > 0 && (
          <div className="mt-1 text-center text-xs text-gray-500">
            {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems}
          </div>
        )}
      </div>
    </div>
  )
}
