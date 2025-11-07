-- =====================================================
-- SISTEMA DE GESTIÓN DE CITAS MÉDICAS - SETUP COMPLETO V3
-- =====================================================
-- Este script incluye TODO lo necesario para el sistema
-- Ejecuta este archivo en Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. LIMPIEZA (Opcional - solo si quieres empezar de cero)
-- =====================================================
-- Descomenta estas líneas si quieres eliminar todo y empezar de nuevo:

-- DROP TABLE IF EXISTS patient_notes CASCADE;
-- DROP TABLE IF EXISTS consultation_history CASCADE;
-- DROP TABLE IF EXISTS appointments CASCADE;
-- DROP TABLE IF EXISTS doctor_availability CASCADE;
-- DROP TABLE IF EXISTS patients CASCADE;
-- DROP TABLE IF EXISTS doctors CASCADE;
-- DROP TABLE IF EXISTS receptionists CASCADE;
-- DROP TABLE IF EXISTS administrators CASCADE;

-- =====================================================
-- 2. CREACIÓN DE TABLAS PRINCIPALES
-- =====================================================

-- Tabla de pacientes
CREATE TABLE IF NOT EXISTS patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rut VARCHAR(20) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(100),
  date_of_birth DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de doctores (con campos de login)
CREATE TABLE IF NOT EXISTS doctors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  specialty VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE,
  phone VARCHAR(20),
  password VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de recepcionistas
CREATE TABLE IF NOT EXISTS receptionists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20),
  password VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de administradores
CREATE TABLE IF NOT EXISTS administrators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20),
  password VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de citas
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  consultation_type VARCHAR(50) NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de historial de consultas
CREATE TABLE IF NOT EXISTS consultation_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  consultation_date DATE NOT NULL,
  consultation_time TIME NOT NULL,
  diagnosis TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de disponibilidad de doctores
CREATE TABLE IF NOT EXISTS doctor_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  time_slot TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(doctor_id, day_of_week, time_slot)
);

-- Tabla de notas de pacientes
CREATE TABLE IF NOT EXISTS patient_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. ÍNDICES PARA MEJOR RENDIMIENTO
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_patients_rut ON patients(rut);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consultation_history_patient ON consultation_history(patient_id);
CREATE INDEX IF NOT EXISTS idx_doctor_availability_doctor ON doctor_availability(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_availability_day ON doctor_availability(day_of_week);
CREATE INDEX IF NOT EXISTS idx_patient_notes_patient ON patient_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_notes_doctor ON patient_notes(doctor_id);

-- =====================================================
-- 4. ELIMINAR POLÍTICAS ANTIGUAS (SI EXISTEN)
-- =====================================================

DROP POLICY IF EXISTS "Allow all operations on patients" ON patients;
DROP POLICY IF EXISTS "Allow all operations on doctors" ON doctors;
DROP POLICY IF EXISTS "Allow all operations on appointments" ON appointments;
DROP POLICY IF EXISTS "Allow all operations on consultation_history" ON consultation_history;
DROP POLICY IF EXISTS "Allow all operations on doctor_availability" ON doctor_availability;
DROP POLICY IF EXISTS "Allow all operations on receptionists" ON receptionists;
DROP POLICY IF EXISTS "Allow all operations on administrators" ON administrators;
DROP POLICY IF EXISTS "Allow all operations on patient_notes" ON patient_notes;
DROP POLICY IF EXISTS "Enable all access for patients" ON patients;
DROP POLICY IF EXISTS "Enable all access for doctors" ON doctors;
DROP POLICY IF EXISTS "Enable all access for appointments" ON appointments;
DROP POLICY IF EXISTS "Enable all access for consultation_history" ON consultation_history;
DROP POLICY IF EXISTS "Enable all access for doctor_availability" ON doctor_availability;
DROP POLICY IF EXISTS "Enable all access for receptionists" ON receptionists;
DROP POLICY IF EXISTS "Enable all access for administrators" ON administrators;
DROP POLICY IF EXISTS "Enable all access for patient_notes" ON patient_notes;

-- =====================================================
-- 5. HABILITAR ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE receptionists ENABLE ROW LEVEL SECURITY;
ALTER TABLE administrators ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_notes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. CREAR POLÍTICAS DE ACCESO PÚBLICO (DESARROLLO)
-- =====================================================

-- Políticas para patients
CREATE POLICY "Enable all access for patients"
  ON patients
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas para doctors
CREATE POLICY "Enable all access for doctors"
  ON doctors
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas para appointments
CREATE POLICY "Enable all access for appointments"
  ON appointments
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas para consultation_history
CREATE POLICY "Enable all access for consultation_history"
  ON consultation_history
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas para doctor_availability
CREATE POLICY "Enable all access for doctor_availability"
  ON doctor_availability
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas para receptionists
CREATE POLICY "Enable all access for receptionists"
  ON receptionists
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas para administrators
CREATE POLICY "Enable all access for administrators"
  ON administrators
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas para patient_notes
CREATE POLICY "Enable all access for patient_notes"
  ON patient_notes
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 7. DATOS DE EJEMPLO - USUARIOS POR ROL
-- =====================================================

-- DOCTORES
INSERT INTO doctors (name, specialty, email, phone, password) VALUES
('Dr. Nicolas Muñoz', 'Cardiología', 'admin@admin.com', '+56922465252', 'admin123'),
('Dr. Carlos García', 'Medicina General', 'carlos@clinica.com', '+56911111111', 'doctor123'),
('Dr. Miguel Rodríguez', 'Cardiología', 'miguel@clinica.com', '+56922222222', 'doctor123'),
('Dra. Ana Martínez', 'Dermatología', 'ana@clinica.com', '+56933333333', 'doctor123'),
('Dr. Roberto López', 'Ginecología', 'roberto@clinica.com', '+56944444444', 'doctor123'),
('Dra. Carmen Silva', 'Pediatría', 'carmen@clinica.com', '+56955555555', 'doctor123')
ON CONFLICT (email) DO NOTHING;

-- RECEPCIONISTAS
INSERT INTO receptionists (name, email, phone, password) VALUES
('María López', 'recepcion@clinica.com', '+56911112222', 'recepcion123')
ON CONFLICT (email) DO NOTHING;

-- ADMINISTRADORES
INSERT INTO administrators (name, email, phone, password) VALUES
('Juan Pérez', 'admin@clinica.com', '+56933334444', 'admin123')
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- 8. DATOS DE EJEMPLO - PACIENTES
-- =====================================================

INSERT INTO patients (rut, first_name, last_name, phone, email, date_of_birth) VALUES
('12.345.678-9', 'Juan', 'Pérez', '+56 9 1234 5678', 'juan@email.com', '1985-03-15'),
('98.765.432-1', 'María', 'González', '+56 9 8765 4321', 'maria@email.com', '1990-07-22'),
('11.222.333-4', 'Carlos', 'López', '+56 9 1122 3344', 'carlos@email.com', '1978-11-30'),
('55.666.777-8', 'Ana', 'Silva', '+56 9 5566 7788', 'ana@email.com', '1995-05-18')
ON CONFLICT (rut) DO NOTHING;

-- =====================================================
-- 9. DATOS DE EJEMPLO - CITAS
-- =====================================================

INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, consultation_type, reason, status) VALUES
(
  (SELECT id FROM patients WHERE rut = '12.345.678-9'), 
  (SELECT id FROM doctors WHERE name = 'Dr. Carlos García'), 
  CURRENT_DATE, 
  '10:30', 
  'Control', 
  'Control rutinario', 
  'pending'
),
(
  (SELECT id FROM patients WHERE rut = '98.765.432-1'), 
  (SELECT id FROM doctors WHERE name = 'Dr. Miguel Rodríguez'), 
  CURRENT_DATE, 
  '11:00', 
  'Primera consulta', 
  'Dolor en el pecho', 
  'confirmed'
),
(
  (SELECT id FROM patients WHERE rut = '11.222.333-4'), 
  (SELECT id FROM doctors WHERE name = 'Dra. Ana Martínez'), 
  CURRENT_DATE, 
  '14:30', 
  'Revisión de exámenes', 
  'Revisión de biopsia', 
  'cancelled'
),
(
  (SELECT id FROM patients WHERE rut = '55.666.777-8'), 
  (SELECT id FROM doctors WHERE name = 'Dr. Roberto López'), 
  CURRENT_DATE, 
  '15:00', 
  'Control', 
  'Control ginecológico', 
  'confirmed'
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 10. DATOS DE EJEMPLO - HISTORIAL DE CONSULTAS
-- =====================================================

INSERT INTO consultation_history (patient_id, doctor_id, consultation_date, consultation_time, diagnosis, notes) VALUES
(
  (SELECT id FROM patients WHERE rut = '12.345.678-9'), 
  (SELECT id FROM doctors WHERE name = 'Dr. Carlos García'), 
  CURRENT_DATE - INTERVAL '5 days', 
  '10:30', 
  'Control rutinario', 
  'Presión arterial normal, peso estable'
),
(
  (SELECT id FROM patients WHERE rut = '12.345.678-9'), 
  (SELECT id FROM doctors WHERE name = 'Dr. Carlos García'), 
  CURRENT_DATE - INTERVAL '19 days', 
  '14:00', 
  'Cefalea tensional', 
  'Recetado analgésicos, reposo'
),
(
  (SELECT id FROM patients WHERE rut = '12.345.678-9'), 
  (SELECT id FROM doctors WHERE name = 'Dr. Carlos García'), 
  CURRENT_DATE - INTERVAL '30 days', 
  '09:15', 
  'Primera consulta', 
  'Evaluación general, estado de salud bueno'
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 11. DISPONIBILIDAD DE EJEMPLO PARA DR. NICOLAS MUÑOZ
-- =====================================================
-- Disponibilidad: Lunes a Viernes, 8:00 - 17:00

INSERT INTO doctor_availability (doctor_id, day_of_week, time_slot, is_available)
SELECT 
  (SELECT id FROM doctors WHERE email = 'admin@admin.com'),
  day,
  time_slot::time,
  true
FROM generate_series(1, 5) as day
CROSS JOIN (VALUES 
  ('08:00'), ('08:30'), ('09:00'), ('09:30'), 
  ('10:00'), ('10:30'), ('11:00'), ('11:30'), 
  ('15:00'), ('15:30'), ('16:00'), ('16:30'), ('17:00')
) as slots(time_slot)
ON CONFLICT (doctor_id, day_of_week, time_slot) DO NOTHING;

-- =====================================================
-- 12. VERIFICACIÓN FINAL
-- =====================================================

-- Verificar tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;

-- =====================================================
-- ✅ FIN DEL SCRIPT - BASE DE DATOS LISTA PARA USAR
-- =====================================================

/*
📋 RESUMEN DE LO CREADO:

✅ 8 TABLAS:
   - patients (con fecha de nacimiento)
   - doctors
   - receptionists
   - administrators
   - appointments
   - consultation_history
   - doctor_availability
   - patient_notes

✅ ÍNDICES PARA RENDIMIENTO

✅ POLÍTICAS RLS CONFIGURADAS:
   - Acceso completo para desarrollo
   - Compatible con anon key

✅ DATOS DE PRUEBA:
   - 6 doctores (1 principal + 5 adicionales)
   - 1 recepcionista
   - 1 administrador
   - 4 pacientes (con fechas de nacimiento)
   - 4 citas de ejemplo
   - 3 consultas históricas
   - Disponibilidad horaria para Dr. Muñoz

🔐 CREDENCIALES DE LOGIN:

   DOCTOR:
   - Email: admin@admin.com
   - Password: admin123
   - Usuario: Dr. Nicolas Muñoz (Cardiología)

   RECEPCIONISTA:
   - Email: recepcion@clinica.com
   - Password: recepcion123
   - Usuario: María López

   ADMINISTRADOR:
   - Email: admin@clinica.com
   - Password: admin123
   - Usuario: Juan Pérez

🚀 PRÓXIMOS PASOS:

1. Este script ya se ejecutó en Supabase
2. Reinicia tu app: npm run dev
3. Accede a: http://localhost:3000/login
4. ¡Todo debería funcionar sin errores 406!

⚠️ NOTA DE SEGURIDAD:
   Este setup es para DESARROLLO solamente.
   Las políticas RLS son muy permisivas.
   NO usar en producción.
*/


