# Configuración de Envío de Emails - Nodemailer + Gmail

## Variables de Entorno Necesarias

Agrega estas variables a tu archivo `.env.local`:

```
EMAIL_USER=resultados.ar0@gmail.com
EMAIL_PASS=tu-contraseña-de-aplicación
CONTACT_RECEIVER=resultados.ar0@gmail.com
```

### Explicación de cada variable:

- **EMAIL_USER**: Tu email de Gmail que usarás para enviar los correos
- **EMAIL_PASS**: Contraseña de aplicación de Google (NO tu contraseña de Gmail normal)
- **CONTACT_RECEIVER** (opcional): Email donde se recibirán los mensajes de contacto. Si no se define, se usará `EMAIL_USER`

## Cómo Obtener la Contraseña de Aplicación de Google

1. Ve a [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Selecciona **Mail** y **Windows/Mac/Linux** (o tu dispositivo)
3. Google generará una contraseña de 16 caracteres
4. Copia esa contraseña y úsala como `EMAIL_PASS`

> **IMPORTANTE**: No uses tu contraseña de Gmail normal. Google requiere una contraseña de aplicación específica.

## Requisitos Previos

1. **Cuenta de Gmail** con 2FA habilitado
2. **Nodemailer** ya está instalado en el proyecto

## Endpoint de API

### POST `/api/contact`

Envía un email de contacto/feedback.

**Body:**
```json
{
  "type": "bug" | "feedback" | "feature",
  "description": "string (requerido)",
  "email": "string (opcional - email del remitente)"
}
```

**Respuesta exitosa:**
```json
{ "ok": true }
```

**Respuesta con error:**
```json
{
  "ok": false,
  "error": "Descripción del error"
}
```

## Frontend - Función de Envío

El `FeedbackPage.tsx` ya está configurado para:

1. Capturar datos del formulario (`type`, `description`, `email`)
2. Enviar mediante `fetch` al endpoint `/api/contact`
3. Mostrar estado de carga
4. Mostrar errores si ocurren
5. Redirigir a página de éxito si funciona

## Cuerpo del Email Generado

El email que recibirás tendrá:

```
Asunto: Nuevo [Bug/Feedback/Feature] - usuario@email.com

---

Tipo: [Bug/Feedback/Feature]
Email de contacto: usuario@email.com

---

Mensaje:
[Contenido del mensaje del usuario]
```

## Testing Local

Para probar localmente:

1. Configura las variables de entorno en `.env.local`
2. Ejecuta `pnpm dev`
3. Ve a `http://localhost:5173/feedback`
4. Llena el formulario y envía

## Troubleshooting

### "Error en la configuración del servidor"
- Verifica que `EMAIL_USER` y `EMAIL_PASS` estén correctamente en `.env.local`
- Reinicia el servidor dev (`pnpm dev`)

### "Error al enviar el email"
- Verifica que la contraseña de aplicación sea la correcta (16 caracteres)
- Comprueba que 2FA esté habilitado en tu cuenta de Gmail
- Verifica que el usuario de Gmail tenga permiso para usar contraseñas de aplicación

### Email recibido pero con remitente incorrecto
- Gmail enviará el email como `EMAIL_USER`
- Si quieres que se vea diferente, ajusta el campo `from` en `api/contact.ts`

## Seguridad

- Las credenciales están protegidas en variables de entorno (nunca se exponen al cliente)
- Solo aceptamos solicitudes POST al endpoint
- Validamos los campos requeridos y el formato del email
- Los errores detallados se logean en consola del servidor, pero no se envían al cliente

## Despliegue en Vercel

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega las tres variables de entorno:
   - `EMAIL_USER`
   - `EMAIL_PASS`
   - `CONTACT_RECEIVER` (opcional)
4. Redeploy el proyecto

¡Listo! El sistema estará funcionando.
