'use client'

interface DateSelectorProps {
  value: string // Formato: YYYY-MM-DD
  onChange: (date: string) => void
  label?: string
  className?: string
  maxDate?: string // Formato: YYYY-MM-DD
  minDate?: string // Formato: YYYY-MM-DD
}

export default function DateSelector({ 
  value, 
  onChange, 
  label, 
  className = '',
  maxDate,
  minDate
}: DateSelectorProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <input
        type="date"
        value={value || ''}
        onChange={handleChange}
        min={minDate}
        max={maxDate}
        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white text-sm"
      />
    </div>
  )
}


