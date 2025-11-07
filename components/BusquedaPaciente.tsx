'use client'

import { useState } from 'react'
import { Search, UserPlus } from 'lucide-react'
import { supabase, Patient } from '@/lib/supabase'
import { formatRut, validateRut, getRutError } from '@/lib/rutValidator'
import DateSelector from './DateSelector'

interface PatientSearchProps {
  onPatientSelect: (patient: Patient) => void
  selectedPatient?: Patient
}

export default function BusquedaPaciente({ onPatientSelect, selectedPatient }: PatientSearchProps) {
  const [rut, setRut] = useState('')
  const [rutError, setRutError] = useState<string | null>(null)
  const [resultado, setResultado] = useState<Patient | null>(null)
  const [buscando, setBuscando] = useState(false)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [nuevoPaciente, setNuevoPaciente] = useState({
    rut: '',
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    date_of_birth: ''
  })
  const [creando, setCreando] = useState(false)

  const handleRutChange = (value: string) => {
    const formatted = formatRut(value)
    setRut(formatted)
    if (value.trim()) {
      const error = getRutError(formatted)
      setRutError(error)
    } else {
      setRutError(null)
    }
  }

  const handleNewRutChange = (value: string) => {
    const formatted = formatRut(value)
    setNuevoPaciente({ ...nuevoPaciente, rut: formatted })
  }

  const buscar = async () => {
    if (!rut.trim()) return

    const error = getRutError(rut)
    if (error) {
      setRutError(error)
      return
    }

    setBuscando(true)
    const { data, error: dbError } = await supabase
      .from('patients')
      .select('*')
      .eq('rut', rut.trim())
      .single()

    if (data) {
      setResultado(data)
      onPatientSelect(data)
      setMostrarForm(false)
    } else {
      setResultado(null)
      setMostrarForm(true)
      setNuevoPaciente({ ...nuevoPaciente, rut: rut.trim() })
    }
    setBuscando(false)
  }

  const crearPaciente = async () => {
    if (!nuevoPaciente.rut || !nuevoPaciente.first_name || !nuevoPaciente.last_name || !nuevoPaciente.phone) {
      alert('Complete todos los campos obligatorios')
      return
    }

    const error = getRutError(nuevoPaciente.rut)
    if (error) {
      alert(error)
      return
    }

    setCreando(true)
    const { data, error: dbError } = await supabase
      .from('patients')
      .insert([nuevoPaciente])
      .select()
      .single()

    if (dbError) {
      alert('Error al crear el paciente: ' + dbError.message)
      setCreando(false)
      return
    }

    setResultado(data)
    onPatientSelect(data)
    setMostrarForm(false)
    setNuevoPaciente({ rut: '', first_name: '', last_name: '', phone: '', email: '', date_of_birth: '' })
    setRut('')
    setRutError(null)
    setCreando(false)
  }

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">RUT del Paciente</label>
          <input 
            type="text" 
            value={rut}
            onChange={(e) => handleRutChange(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && buscar()}
            className={`w-full px-3 py-2 border rounded focus:outline-none ${
              rutError ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
            }`}
            placeholder="12.345.678-9"
          />
          {rutError && (
            <p className="text-red-600 text-xs mt-1">{rutError}</p>
          )}
        </div>
        <button 
          onClick={buscar}
          disabled={buscando || !rut.trim()}
          className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 self-end disabled:opacity-50"
        >
          {buscando ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      {resultado && (
        <div className="bg-green-50 border-l-4 border-green-500 p-3 mb-3">
          <h4 className="font-bold text-green-800 mb-2">Paciente Encontrado</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600">Nombre:</span>
              <p className="font-medium">{resultado.first_name} {resultado.last_name}</p>
            </div>
            <div>
              <span className="text-gray-600">RUT:</span>
              <p className="font-medium">{resultado.rut}</p>
            </div>
            <div>
              <span className="text-gray-600">Teléfono:</span>
              <p className="font-medium">{resultado.phone}</p>
            </div>
            <div>
              <span className="text-gray-600">Email:</span>
              <p className="font-medium">{resultado.email || 'N/A'}</p>
            </div>
          </div>
        </div>
      )}

      {mostrarForm && !resultado && (
        <div className="bg-blue-50 border border-blue-300 rounded p-3">
          <h4 className="font-bold text-blue-900 mb-2">Nuevo Paciente</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre *</label>
              <input type="text" value={nuevoPaciente.first_name} onChange={(e) => setNuevoPaciente({...nuevoPaciente, first_name: e.target.value})} className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Apellido *</label>
              <input type="text" value={nuevoPaciente.last_name} onChange={(e) => setNuevoPaciente({...nuevoPaciente, last_name: e.target.value})} className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">RUT *</label>
              <input type="text" value={nuevoPaciente.rut} onChange={(e) => handleNewRutChange(e.target.value)} className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500" placeholder="12.345.678-9" />
            </div>
            <div>
              <DateSelector
                value={nuevoPaciente.date_of_birth}
                onChange={(date) => setNuevoPaciente({...nuevoPaciente, date_of_birth: date})}
                label="Fecha de Nacimiento"
                maxDate={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Teléfono *</label>
              <input type="tel" value={nuevoPaciente.phone} onChange={(e) => setNuevoPaciente({...nuevoPaciente, phone: e.target.value})} className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500" placeholder="+56912345678" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="email" value={nuevoPaciente.email} onChange={(e) => setNuevoPaciente({...nuevoPaciente, email: e.target.value})} className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <button onClick={crearPaciente} disabled={creando} className="mt-3 w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50">
            {creando ? 'Registrando...' : 'Registrar'}
          </button>
        </div>
      )}
    </div>
  )
}
