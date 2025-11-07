# Sistema de Gestión de Citas Médicas

Una aplicación web moderna para la gestión de citas médicas construida con Next.js 14, TypeScript, Tailwind CSS y Supabase.

## Características

- 👥 **Multi-Rol**: Vistas específicas para Recepcionista, Doctor y Administrador
- 🔍 **Búsqueda de Pacientes**: Buscar pacientes existentes por RUT
- 👤 **Registro de Pacientes**: Crear nuevos pacientes con validación
- 📅 **Gestión de Citas**: Programar, confirmar y gestionar citas médicas
- 📊 **Historial de Consultas**: Ver el historial médico de cada paciente
- 📈 **Estadísticas Diarias**: Dashboard con resumen de citas del día
- 🎨 **Interfaz Moderna**: Diseño responsive con Tailwind CSS
- 🧭 **Navegación por Sidebar**: Cada rol tiene su propio menú de navegación

## Tecnologías Utilizadas

- **Next.js 14** - Framework de React con App Router
- **TypeScript** - Tipado estático para JavaScript
- **Tailwind CSS** - Framework de CSS utilitario
- **Supabase** - Backend como servicio (BaaS)
- **Lucide React** - Iconos modernos
- **date-fns** - Manipulación de fechas

## Configuración del Proyecto

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar Variables de Entorno

Crear un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
```

**⚠️ Importante:** Las keys de Supabase son sensibles. Obtén tus propias keys desde tu proyecto en [Supabase](https://supabase.com).

### 3. Configurar Base de Datos

**📖 Ver guía completa:** `database/EJECUTAR_EN_SUPABASE.md`

**Resumen rápido:**
1. Ve a tu dashboard de Supabase → **SQL Editor**
2. Ejecuta todo el contenido de `database/base2.sql`
3. Incluye:
   - ✅ 7 tablas (patients, doctors, appointments, consultation_history, doctor_availability, receptionists, administrators)
   - ✅ 3 usuarios de prueba (uno por rol: doctor, recepcionista, administrador)
   - ✅ Datos de ejemplo y disponibilidad

El archivo `database/base2.sql` contiene:
- ✅ Todas las tablas (patients, doctors, appointments, consultation_history, doctor_availability)
- ✅ Índices para mejor rendimiento
- ✅ Políticas de seguridad (RLS)
- ✅ Datos de ejemplo (doctores, pacientes, citas)
- ✅ Login básico para doctores
- ✅ Doctor Nicolas Muñoz con credenciales
- ✅ Disponibilidad de ejemplo para Dr. Muñoz

**Pasos:**
1. Ve a tu proyecto en Supabase
2. SQL Editor > New Query
3. Copia y pega todo el contenido de `database/base2.sql`
4. Ejecutar (Run)
5. ¡Listo!

📄 **Ver instrucciones de login en:** `INSTRUCCIONES_LOGIN_SIMPLE.md`

### 4. Ejecutar la Aplicación

```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## Estructura del Proyecto

```
├── app/
│   ├── recepcionista/       # Vista de Recepcionista
│   │   ├── page.tsx         # Agenda de citas
│   │   ├── pacientes/       # Gestión de pacientes
│   │   ├── citas-dia/       # Citas del día
│   │   ├── reportes/        # Reportes
│   │   └── layout.tsx       # Layout con sidebar
│   ├── doctor/              # Vista de Doctor
│   │   ├── page.tsx         # Mi agenda
│   │   ├── disponibilidad/  # Configurar disponibilidad
│   │   ├── pacientes/       # Mis pacientes
│   │   ├── consultas/       # Consultas del día
│   │   ├── estadisticas/    # Estadísticas
│   │   └── layout.tsx       # Layout con sidebar
│   ├── administrador/       # Vista de Administrador
│   │   ├── page.tsx         # Dashboard
│   │   ├── personal/        # Gestión de personal
│   │   ├── pacientes/       # Gestión de pacientes
│   │   ├── citas/           # Gestión de citas
│   │   ├── reportes/        # Reportes avanzados
│   │   ├── configuracion/   # Configuración
│   │   └── layout.tsx       # Layout con sidebar
│   ├── globals.css          # Estilos globales
│   ├── layout.tsx           # Layout principal
│   └── page.tsx             # Selección de rol
├── components/
│   ├── shared/
│   │   └── Sidebar.tsx      # Componente de navegación lateral
│   ├── BusquedaPaciente.tsx # Búsqueda y registro de pacientes
│   ├── HistorialPaciente.tsx # Historial de consultas
│   ├── ReservaCita.tsx      # Formulario de citas
│   ├── CitasDiarias.tsx     # Lista de citas del día
│   ├── EstadisticasDiarias.tsx # Estadísticas diarias
│   └── DisponibilidadDoctor.tsx # Gestión de disponibilidad horaria
├── lib/
│   └── supabase.ts          # Configuración de Supabase
├── database/
│   └── schema.sql           # Esquema de base de datos
└── README.md
```

## Credenciales de Prueba

### 🔐 Login Unificado (Un usuario por rol)
- **URL:** `/login`

**👨‍⚕️ DOCTOR:**
- Email: `admin@admin.com`
- Password: `admin123`
- Usuario: Dr. Nicolas Muñoz (Cardiología)

**👩‍💼 RECEPCIONISTA:**
- Email: `recepcion@clinica.com`
- Password: `recepcion123`
- Usuario: María López

**⚙️ ADMINISTRADOR:**
- Email: `admin@clinica.com`
- Password: `admin123`
- Usuario: Juan Pérez

💡 **En la página de login verás 3 tarjetas clickeables (una por rol)**

### 🔒 Sistema de Roles

- ✅ Cada rol tiene acceso SOLO a su propio panel
- ✅ Un Doctor NO puede acceder a `/recepcionista` ni `/administrador`
- ✅ Un Recepcionista NO puede acceder a `/doctor` ni `/administrador`
- ✅ Un Administrador NO puede acceder a `/doctor` ni `/recepcionista`
- ✅ Si intentan acceder a otro panel, son redirigidos a `/login`

📄 **Ver más en:** `CREDENCIALES.md` y `SISTEMA_DE_ROLES.md`

## Funcionalidades por Rol

### 👨‍💼 Recepcionista
- **Agenda de Citas**: Búsqueda de pacientes y reserva de citas
- **Gestión de Pacientes**: Registro y búsqueda de pacientes
- **Citas del Día**: Visualización de todas las citas programadas
- **Reportes**: Estadísticas diarias de la clínica

### 👨‍⚕️ Doctor (🔐 Requiere Login Básico)
- **🔐 Login Simple**: Email y contraseña directo desde la tabla doctors
- **Mi Agenda**: Vista de la agenda personal del doctor
- **Disponibilidad**: Configurar días y horas disponibles para atención
- **Mis Pacientes**: Búsqueda y consulta de historial médico
- **Consultas**: Gestión de consultas del día
- **Estadísticas**: Resumen de actividad diaria personalizado

### 🔧 Administrador
- **Dashboard**: Visión general del sistema con métricas clave
- **Gestión de Personal**: Administración de doctores y recepcionistas (próximamente)
- **Pacientes**: Gestión completa de pacientes
- **Citas**: Supervisión de todas las citas
- **Reportes**: Estadísticas avanzadas del sistema
- **Configuración**: Ajustes generales de la clínica (próximamente)

### Funcionalidades Compartidas
- Búsqueda de pacientes por RUT
- Registro de nuevos pacientes con validación
- Gestión de estados de citas (programada, confirmada, completada, cancelada)
- Historial de consultas por paciente
- Vista de citas diarias en tiempo real

## Base de Datos

El sistema utiliza las siguientes tablas principales:

- **patients**: Información de pacientes
- **doctors**: Médicos y especialidades (con login básico)
- **appointments**: Citas programadas
- **consultation_history**: Historial de consultas
- **doctor_availability**: Disponibilidad horaria de los doctores

## Desarrollo

### Scripts Disponibles

- `npm run dev` - Ejecutar en modo desarrollo
- `npm run build` - Construir para producción
- `npm run start` - Ejecutar en modo producción
- `npm run lint` - Ejecutar linter

### Contribuir

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT.

