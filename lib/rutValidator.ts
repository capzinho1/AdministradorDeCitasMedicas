/**
 * Validador de RUT Chileno
 * Valida el formato y dígito verificador del RUT
 */

export function cleanRut(rut: string): string {
  return rut.replace(/[^0-9kK]/g, '').toUpperCase()
}

export function formatRut(rut: string): string {
  const cleaned = cleanRut(rut)
  if (cleaned.length < 2) return cleaned
  
  const dv = cleaned.slice(-1)
  const number = cleaned.slice(0, -1)
  
  // Formatear con puntos
  const formatted = number.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  
  return `${formatted}-${dv}`
}

export function validateRut(rut: string): boolean {
  const cleaned = cleanRut(rut)
  
  if (cleaned.length < 2) return false
  
  const dv = cleaned.slice(-1)
  const number = cleaned.slice(0, -1)
  
  // Solo validar que el número sea numérico y el dv sea número o K
  if (!/^\d+$/.test(number)) return false
  if (!/^[0-9kK]$/.test(dv)) return false
  
  return true
}

function calculateDv(rut: string): string {
  let sum = 0
  let multiplier = 2
  
  for (let i = rut.length - 1; i >= 0; i--) {
    sum += parseInt(rut[i]) * multiplier
    multiplier = multiplier === 7 ? 2 : multiplier + 1
  }
  
  const remainder = sum % 11
  const dv = 11 - remainder
  
  if (dv === 11) return '0'
  if (dv === 10) return 'K'
  return dv.toString()
}

export function getRutError(rut: string): string | null {
  if (!rut || rut.trim() === '') {
    return 'El RUT es obligatorio'
  }
  
  const cleaned = cleanRut(rut)
  
  if (cleaned.length < 8) {
    return 'El RUT debe tener al menos 7 dígitos más el verificador'
  }
  
  if (cleaned.length > 9) {
    return 'El RUT es demasiado largo'
  }
  
  const dv = cleaned.slice(-1)
  const number = cleaned.slice(0, -1)
  
  if (!/^\d+$/.test(number)) {
    return 'El RUT debe contener solo números'
  }
  
  if (!/^[0-9kK]$/.test(dv)) {
    return 'El dígito verificador debe ser un número del 0-9 o K'
  }
  
  return null
}

