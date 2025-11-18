'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  itemsPerPage: number
  totalItems: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (items: number) => void
}

export default function Pagination({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  onItemsPerPageChange
}: PaginationProps) {
  if (totalPages <= 1 && totalItems <= 8) {
    // Si hay pocos items, solo mostrar el selector de items por página
    return (
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Mostrar:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value={8}>8</option>
            <option value={16}>16</option>
            <option value={32}>32</option>
          </select>
          <span className="text-sm text-gray-600">por página</span>
        </div>
        <span className="text-sm text-gray-600">
          Total: {totalItems} {totalItems === 1 ? 'item' : 'items'}
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
      {/* Selector de items por página */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Mostrar:</span>
        <select
          value={itemsPerPage}
          onChange={(e) => {
            onItemsPerPageChange(Number(e.target.value))
            onPageChange(1) // Resetear a página 1 cuando cambia items por página
          }}
          className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
        >
          <option value={8}>8</option>
          <option value={16}>16</option>
          <option value={32}>32</option>
        </select>
        <span className="text-sm text-gray-600">por página</span>
      </div>

      {/* Información de paginación */}
      <div className="text-sm text-gray-600">
        Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems}
      </div>

      {/* Controles de paginación */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Página anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <div className="flex gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
            // Mostrar primera, última, y páginas alrededor de la actual
            if (
              page === 1 ||
              page === totalPages ||
              (page >= currentPage - 2 && page <= currentPage + 2)
            ) {
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`px-3 py-1 text-sm border rounded ${
                    currentPage === page
                      ? 'bg-blue-600 text-white border-blue-600'
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
              return <span key={page} className="px-2 text-sm">...</span>
            }
            return null
          })}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Página siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

