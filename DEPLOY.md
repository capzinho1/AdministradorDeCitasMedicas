# Guía de Despliegue en Vercel

Esta guía te ayudará a desplegar tu aplicación en Vercel de forma segura sin exponer tus claves.

## ⚠️ IMPORTANTE: Seguridad

**NUNCA subas tu archivo `.env` o `.env.local` a GitHub.** 
El archivo `.gitignore` ya está configurado para protegerlos automáticamente.

## 📋 Pasos para Desplegar

### 1. Preparar el Repositorio

1. Asegúrate de que todos tus cambios estén guardados
2. Verifica que `.env` y `.env.local` estén en `.gitignore` (ya está configurado)
3. Haz commit de tus cambios:
   ```bash
   git add .
   git commit -m "Preparar para despliegue"
   ```

### 2. Subir a GitHub

```bash
# Si es tu primer push
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
git branch -M main
git push -u origin main

# Si ya tienes el repositorio configurado
git push
```

### 3. Configurar Variables de Entorno en Vercel

1. **Ve a tu proyecto en Vercel**: https://vercel.com/dashboard
2. **Selecciona tu proyecto** (o crea uno nuevo importando desde GitHub)
3. **Ve a Settings → Environment Variables**
4. **Agrega las siguientes variables:**

   ```
   NEXT_PUBLIC_SUPABASE_URL = tu_url_de_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY = tu_anon_key_de_supabase
   ```

5. **Selecciona los ambientes** donde aplicar:
   - ✅ Production
   - ✅ Preview
   - ✅ Development (opcional)

6. **Guarda los cambios**

### 4. Desplegar

1. Vercel detectará automáticamente tu push a GitHub
2. O puedes hacer un **nuevo deploy** manualmente desde el dashboard
3. Espera a que termine el build
4. ¡Tu aplicación estará en línea!

## 🔍 Verificar que Funciona

1. Ve a la URL que Vercel te proporciona
2. Prueba hacer login con las credenciales de prueba
3. Verifica que la conexión con Supabase funcione correctamente

## 📝 Variables Necesarias

Las variables de entorno que necesitas configurar son:

- `NEXT_PUBLIC_SUPABASE_URL`: URL de tu proyecto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Clave anónima pública de Supabase

**Nota:** Las variables que empiezan con `NEXT_PUBLIC_` son públicas y seguras para el cliente. 
La clave anónima de Supabase está diseñada para ser pública.

## 🆘 Solución de Problemas

### Error: "Missing environment variables"
- Verifica que hayas agregado las variables en Vercel
- Asegúrate de que los nombres sean exactos (case-sensitive)
- Reinicia el deployment después de agregar variables

### Error de conexión con Supabase
- Verifica que las URLs y keys sean correctas
- Asegúrate de que tu proyecto Supabase esté activo
- Revisa los logs de Vercel para más detalles

## 🔐 Seguridad Adicional

- ✅ Nunca compartas tus `.env` files
- ✅ Usa diferentes proyectos de Supabase para desarrollo y producción
- ✅ Revisa los permisos de Row Level Security (RLS) en Supabase

