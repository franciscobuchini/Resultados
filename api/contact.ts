import nodemailer from 'nodemailer';
import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * POST /api/contact
 * 
 * Envía un email de contacto/feedback usando Gmail SMTP.
 * 
 * Body:
 * - type: 'bug' | 'feedback' | 'feature'
 * - description: string (requerido)
 * - email: string (opcional)
 * 
 * Respuesta:
 * - { ok: true } si se envió exitosamente
 * - { ok: false, error: string } si hubo un error
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Solo aceptar POST
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }

  try {
    // Extraer datos del body
    const { type, description, email } = req.body;

    // Validar campos requeridos
    if (!description || !description.trim()) {
      return res.status(400).json({ 
        ok: false, 
        error: 'La descripción es requerida' 
      });
    }

    // Validar email si se proporciona
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ 
        ok: false, 
        error: 'El email no es válido' 
      });
    }

    // Obtener credenciales de variables de entorno
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const contactReceiver = process.env.CONTACT_RECEIVER || emailUser;

    if (!emailUser || !emailPass) {
      console.error('Variables de entorno EMAIL_USER o EMAIL_PASS no configuradas');
      return res.status(500).json({ 
        ok: false, 
        error: 'Error en la configuración del servidor' 
      });
    }

    if (!contactReceiver) {
      console.error('No hay destinatario configurado (EMAIL_USER o CONTACT_RECEIVER)');
      return res.status(500).json({ 
        ok: false, 
        error: 'Error en la configuración del servidor' 
      });
    }

    // Configurar transporte de Nodemailer con Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    // Preparar el subject
    const typeLabel = {
      bug: 'Bug/Error',
      feedback: 'Feedback',
      feature: 'Solicitud de Característica',
    }[type as string] || 'Mensaje';

    const subject = `Nuevo ${typeLabel} - ${email || 'Usuario anónimo'}`;

    // Preparar el HTML del email
    const htmlBody = `
      <h2>Nuevo ${typeLabel}</h2>
      <p><strong>Tipo:</strong> ${typeLabel}</p>
      ${email ? `<p><strong>Email de contacto:</strong> ${email}</p>` : ''}
      <hr />
      <h3>Mensaje:</h3>
      <p>${description.replace(/\n/g, '<br />')}</p>
      <hr />
      <small>Enviado desde: Resultados.ar</small>
    `;

    // Preparar el texto plano del email
    const textBody = `
Nuevo ${typeLabel}

Tipo: ${typeLabel}
${email ? `Email de contacto: ${email}` : ''}

---

Mensaje:
${description}

---

Enviado desde: Resultados.ar
    `.trim();

    // Enviar el email
    await transporter.sendMail({
      from: emailUser,
      to: contactReceiver,
      subject: subject,
      text: textBody,
      html: htmlBody,
      replyTo: email || undefined,
    });

    // Respuesta exitosa
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Error al enviar email:', error);
    return res.status(500).json({ 
      ok: false, 
      error: 'Error al enviar el email. Intenta más tarde.' 
    });
  }
}
