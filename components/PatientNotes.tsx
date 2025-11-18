'use client'

import { useState, useEffect } from 'react'
import { supabase, PatientNote } from '@/lib/supabase'
import { Save, Plus, Trash2 } from 'lucide-react'

interface PatientNotesProps {
  patientId: string
  doctorId: string
}

export default function PatientNotes({ patientId, doctorId }: PatientNotesProps) {
  const [notes, setNotes] = useState<PatientNote[]>([])
  const [newNote, setNewNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotes()
  }, [patientId])

  const loadNotes = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('patient_notes')
      .select('*, doctor:doctors(name, specialty)')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })

    if (data) {
      setNotes(data as PatientNote[])
    }
    setLoading(false)
  }

  const handleNoteChange = (value: string) => {
    setNewNote(value)
  }

  const saveNote = async (noteText: string) => {
    if (!noteText.trim()) return

    setSaving(true)
    const { data, error } = await supabase
      .from('patient_notes')
      .insert([{
        patient_id: patientId,
        doctor_id: doctorId,
        note: noteText.trim()
      }])
      .select('*, doctor:doctors(name, specialty)')
      .single()

    if (!error && data) {
      setNotes([data as PatientNote, ...notes])
      setNewNote('')
    }
    setSaving(false)
  }

  const deleteNote = async (noteId: string) => {
    if (!confirm('¿Eliminar esta nota?')) return

    const { error } = await supabase
      .from('patient_notes')
      .delete()
      .eq('id', noteId)

    if (!error) {
      setNotes(notes.filter(n => n.id !== noteId))
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="font-bold text-gray-800 mb-3">Notas Clínicas</h3>

      {/* Nueva Nota */}
      <div className="mb-4">
        <div className="relative">
          <textarea
            value={newNote}
            onChange={(e) => handleNoteChange(e.target.value)}
            placeholder="Escribir nota clínica..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
            rows={3}
          />
          {saving && (
            <div className="absolute top-2 right-2">
              <Save className="w-4 h-4 text-blue-500 animate-pulse" />
            </div>
          )}
        </div>
        <div className="flex justify-end items-center mt-2">
          {newNote.trim() && (
            <button
              onClick={() => saveNote(newNote)}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Guardar Nota'}
            </button>
          )}
        </div>
      </div>

      {/* Lista de Notas */}
      {loading ? (
        <p className="text-center py-4 text-gray-500 text-sm">Cargando notas...</p>
      ) : notes.length === 0 ? (
        <p className="text-center py-4 text-gray-500 text-sm">No hay notas registradas</p>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {notes.map((note) => (
            <div key={note.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-xs font-medium text-gray-700">
                    {note.doctor?.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDateTime(note.created_at)}
                  </p>
                </div>
                <button
                  onClick={() => deleteNote(note.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.note}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


