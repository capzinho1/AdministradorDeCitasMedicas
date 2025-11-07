-- =====================================================
-- SISTEMA DE GESTIÓN DE CITAS MÉDICAS - SETUP BÁSICO
-- =====================================================

-- =====================================================
-- 1. CREACIÓN DE TABLAS PRINCIPALES
-- =====================================================

-- Tabla de pacientes
CREATE TABLE IF NOT EXISTS patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rut VARCHAR(20) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de doctores
CREATE TABLE IF NOT EXISTS doctors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  specialty VARCHAR(100) NOT NULL,
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

-- =====================================================
-- 2. ÍNDICES BÁSICOS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_patients_rut ON patients(rut);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);

-- =====================================================
-- 3. POLÍTICAS DE SEGURIDAD
-- =====================================================

-- Habilitar RLS
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_history ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Allow all operations on patients" ON patients;
DROP POLICY IF EXISTS "Allow all operations on doctors" ON doctors;
DROP POLICY IF EXISTS "Allow all operations on appointments" ON appointments;
DROP POLICY IF EXISTS "Allow all operations on consultation_history" ON consultation_history;

-- Políticas para permitir acceso público
CREATE POLICY "Allow all operations on patients" ON patients FOR ALL USING (true);
CREATE POLICY "Allow all operations on doctors" ON doctors FOR ALL USING (true);
CREATE POLICY "Allow all operations on appointments" ON appointments FOR ALL USING (true);
CREATE POLICY "Allow all operations on consultation_history" ON consultation_history FOR ALL USING (true);

-- =====================================================
-- 4. DATOS DE EJEMPLO
-- =====================================================

-- Insertar doctores
INSERT INTO doctors (name, specialty) VALUES
('Dr. Carlos García', 'Medicina General'),
('Dr. Miguel Rodríguez', 'Cardiología'),
('Dra. Ana Martínez', 'Dermatología'),
('Dr. Roberto López', 'Ginecología'),
('Dra. Carmen Silva', 'Pediatría')
ON CONFLICT DO NOTHING;

-- Insertar pacientes
INSERT INTO patients (rut, first_name, last_name, phone, email) VALUES
('12.345.678-9', 'Juan', 'Pérez', '+56 9 1234 5678', 'juan@email.com'),
('98.765.432-1', 'María', 'González', '+56 9 8765 4321', 'maria@email.com'),
('11.222.333-4', 'Carlos', 'López', '+56 9 1122 3344', 'carlos@email.com'),
('55.666.777-8', 'Ana', 'Silva', '+56 9 5566 7788', 'ana@email.com')
ON CONFLICT (rut) DO NOTHING;

-- Insertar citas de ejemplo
INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, consultation_type, reason, status) VALUES
((SELECT id FROM patients WHERE rut = '12.345.678-9'), (SELECT id FROM doctors WHERE name = 'Dr. Carlos García'), '2024-12-20', '10:30', 'Control', 'Control rutinario', 'pending'),
((SELECT id FROM patients WHERE rut = '98.765.432-1'), (SELECT id FROM doctors WHERE name = 'Dr. Miguel Rodríguez'), '2024-12-20', '11:00', 'Primera consulta', 'Dolor en el pecho', 'confirmed'),
((SELECT id FROM patients WHERE rut = '11.222.333-4'), (SELECT id FROM doctors WHERE name = 'Dra. Ana Martínez'), '2024-12-20', '14:30', 'Revisión de exámenes', 'Revisión de biopsia', 'cancelled'),
((SELECT id FROM patients WHERE rut = '55.666.777-8'), (SELECT id FROM doctors WHERE name = 'Dr. Roberto López'), '2024-12-20', '15:00', 'Control', 'Control ginecológico', 'confirmed')
ON CONFLICT DO NOTHING;

-- Insertar historial de consultas
INSERT INTO consultation_history (patient_id, doctor_id, consultation_date, consultation_time, diagnosis, notes) VALUES
((SELECT id FROM patients WHERE rut = '12.345.678-9'), (SELECT id FROM doctors WHERE name = 'Dr. Carlos García'), '2024-12-15', '10:30', 'Control rutinario', 'Presión arterial normal'),
((SELECT id FROM patients WHERE rut = '12.345.678-9'), (SELECT id FROM doctors WHERE name = 'Dr. Carlos García'), '2024-12-01', '14:00', 'Cefalea tensional', 'Recetado analgésicos'),
((SELECT id FROM patients WHERE rut = '12.345.678-9'), (SELECT id FROM doctors WHERE name = 'Dr. Carlos García'), '2024-11-20', '09:15', 'Primera consulta', 'Evaluación general')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 5. VERIFICACIÓN
-- =====================================================

-- Verificar que las tablas se crearon correctamente
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('patients', 'doctors', 'appointments', 'consultation_history');
    
    IF table_count = 4 THEN
        RAISE NOTICE '✅ Todas las tablas se crearon correctamente';
    ELSE
        RAISE NOTICE '❌ Error: Solo se crearon % de 4 tablas esperadas', table_count;
    END IF;
END $$;

-- Verificar datos insertados
DO $$
DECLARE
    patient_count INTEGER;
    doctor_count INTEGER;
    appointment_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO patient_count FROM patients;
    SELECT COUNT(*) INTO doctor_count FROM doctors;
    SELECT COUNT(*) INTO appointment_count FROM appointments;
    
    RAISE NOTICE '📊 Datos insertados:';
    RAISE NOTICE '   - Pacientes: %', patient_count;
    RAISE NOTICE '   - Doctores: %', doctor_count;
    RAISE NOTICE '   - Citas: %', appointment_count;
END $$;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================