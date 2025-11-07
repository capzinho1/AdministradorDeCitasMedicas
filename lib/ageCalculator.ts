/**
 * Utilidades para calcular edad a partir de fecha de nacimiento
 */

export function calculateAge(dateOfBirth: string): number {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age
}

export function formatAge(dateOfBirth: string): string {
  const age = calculateAge(dateOfBirth)
  return `${age} años`
}

export function getAgeCategory(dateOfBirth: string): string {
  const age = calculateAge(dateOfBirth)
  
  if (age < 2) return 'Infante'
  if (age < 12) return 'Niño'
  if (age < 18) return 'Adolescente'
  if (age < 65) return 'Adulto'
  return 'Adulto Mayor'
}


