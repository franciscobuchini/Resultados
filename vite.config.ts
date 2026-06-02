import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import nodemailer from 'nodemailer'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'api-contact-mock',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url === '/api/contact' && req.method === 'POST') {
              let body = '';
              req.on('data', chunk => {
                body += chunk.toString();
              });
              req.on('end', async () => {
                try {
                  const data = JSON.parse(body);
                  const { type, description, email } = data;
                  
                  if (!description || !description.trim()) {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ ok: false, error: 'La descripción es requerida' }));
                    return;
                  }
                  
                  const emailUser = env.EMAIL_USER;
                  const emailPass = env.EMAIL_PASS;
                  const contactReceiver = env.CONTACT_RECEIVER || emailUser;

                  if (!emailUser || !emailPass) {
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ ok: false, error: 'Credenciales de email no configuradas en .env.local' }));
                    return;
                  }

                  const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                      user: emailUser,
                      pass: emailPass,
                    },
                  });

                  const typeLabel = {
                    bug: 'Bug/Error',
                    feedback: 'Feedback',
                    feature: 'Solicitud de Característica',
                  }[type as string] || 'Mensaje';

                  await transporter.sendMail({
                    from: emailUser,
                    to: contactReceiver,
                    subject: `[Dev] Nuevo ${typeLabel} - ${email || 'Anónimo'}`,
                    text: `Tipo: ${typeLabel}\nEmail: ${email || 'No provisto'}\n\nMensaje:\n${description}`,
                  });

                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ ok: true }));
                } catch (error) {
                  console.error('Error in mock api/contact:', error);
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }));
                }
              });
            } else {
              next();
            }
          });
        }
      }
    ],
  }
})
