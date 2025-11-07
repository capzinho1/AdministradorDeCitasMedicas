'use client'

import { useState, useEffect } from 'react'
import { Patient } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'
import BusquedaPaciente from '@/components/BusquedaPaciente'
import PatientInfoCard from '@/components/PatientInfoCard'
import PatientNotes from '@/components/PatientNotes'
import HistorialPaciente from '@/components/HistorialPaciente'
import CitasDiarias from '@/components/CitasDiarias'
import EstadisticasDiarias from '@/components/EstadisticasDiarias'

export default function DoctorPage() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | undefined>()
  const [doctorId, setDoctorId] = useState<string | null>(null)

  useEffect(() => {
    const user = getCurrentUser()
    if (user && user.role === 'doctor') {
      setDoctorId(user.id)
    }
  }, [])

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient)
  }

  const handlePrint = () => {
    if (!selectedPatient) return
    
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const age = selectedPatient.date_of_birth 
      ? new Date().getFullYear() - new Date(selectedPatient.date_of_birth).getFullYear()
      : 'N/A'

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ficha Paciente - ${selectedPatient.first_name} ${selectedPatient.last_name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            h1 { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
            .info-item { margin-bottom: 10px; }
            .label { font-weight: bold; color: #4b5563; }
            .value { color: #111827; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <h1>Ficha Resumida del Paciente</h1>
          <div class="info-grid">
            <div class="info-item">
              <div class="label">Nombre Completo:</div>
              <div class="value">${selectedPatient.first_name} ${selectedPatient.last_name}</div>
            </div>
            <div class="info-item">
              <div class="label">RUT:</div>
              <div class="value">${selectedPatient.rut}</div>
            </div>
            <div class="info-item">
              <div class="label">Edad:</div>
              <div class="value">${age} años</div>
            </div>
            <div class="info-item">
              <div class="label">Fecha de Nacimiento:</div>
              <div class="value">${selectedPatient.date_of_birth 
                ? new Date(selectedPatient.date_of_birth).toLocaleDateString('es-ES')
                : 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="label">Teléfono:</div>
              <div class="value">${selectedPatient.phone}</div>
            </div>
            <div class="info-item">
              <div class="label">Email:</div>
              <div class="value">${selectedPatient.email || 'N/A'}</div>
            </div>
          </div>
          <div class="footer">
            <p>Documento generado el ${new Date().toLocaleString('es-ES')}</p>
            <p>Sistema de Gestión Clínica</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Mi Agenda</h1>
        <p className="text-gray-600">Consulta tus pacientes y agenda del día</p>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Panel Izquierdo: Búsqueda y Historial */}
        <div className="space-y-6">
          <BusquedaPaciente 
            onPatientSelect={handlePatientSelect}
            selectedPatient={selectedPatient}
          />
          
          {selectedPatient && (
            <>
              <PatientInfoCard 
                patient={selectedPatient}
                onPrint={handlePrint}
              />
              
              {doctorId && (
                <PatientNotes 
                  patientId={selectedPatient.id}
                  doctorId={doctorId}
                />
              )}
            </>
          )}

          <HistorialPaciente 
            patientId={selectedPatient?.id} 
            doctorId={doctorId || undefined}
            showDoctorFilter={true}
          />
        </div>

        {/* Panel Derecho: Citas del Día */}
        <div className="space-y-6">
          {doctorId && <CitasDiarias doctorId={doctorId} />}
        </div>
      </div>

      {/* Estadísticas Diarias */}
      <div className="mt-6">
        {doctorId && <EstadisticasDiarias doctorId={doctorId} />}
      </div>
    </div>
  )
}

