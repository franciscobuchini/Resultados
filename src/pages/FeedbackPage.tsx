import { useState } from 'react';
import { useThemeClasses } from '../functions/themeStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Label } from '../components/ui/Label';
import DataBox from '../components/ui/DataBox';
import PageContent from '../layout/PageContent';
import { MessageCircle, AlertTriangle, CheckCircle2, Send, AlertCircle } from 'lucide-react';

type FeedbackType = 'bug' | 'feedback' | 'feature';

export default function FeedbackPage() {
  const { bgApp, textMain, textMuted } = useThemeClasses();
  const [type, setType] = useState<FeedbackType>('feedback');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          description,
          email: email || null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Error al enviar el mensaje');
      }

      setSubmitted(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al enviar el mensaje';
      setError(errorMessage);
      console.error('Error:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className={`${bgApp} min-h-screen flex items-center justify-center p-4`}>
        <DataBox className="max-w-md w-full">
          <div className="p-8 text-center">
            <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
            <h2 className={`text-xl font-semibold ${textMain} mb-2`}>
              ¡Gracias por tu feedback!
            </h2>
            <p className={`text-sm ${textMuted} mb-6`}>
              Recibimos tu mensaje. Lo revisaremos pronto.
            </p>
            <Button
              label="Volver al inicio"
              variant="outline"
              size="md"
              onClick={() => (window.location.href = '/')}
            />
          </div>
        </DataBox>
      </div>
    );
  }

  return (
    <PageContent>
        <div className="w-full mx-auto flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center gap-3 pb-4">
            <MessageCircle size={24} className="text-blue-500" />
            <h1 className={`text-2xl font-semibold ${textMain}`}>
              Reportar errores & Feedback
            </h1>
          </div>

          <DataBox>
            <div className="p-6 sm:p-8 space-y-6">
              {/* Error message */}
              {error && (
                <div className="flex gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
              {/* Tipo de feedback */}
              <div className="flex flex-col gap-4">
                <Label content="Tipo de mensaje" />
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    label="Error/Bug"
                    icon={AlertTriangle}
                    size="md"
                    variant={type === 'bug' ? 'outline' : 'ghost'}
                    className="flex-col !h-auto !px-4 !py-4 justify-start"
                    onClick={() => setType('bug')}
                  />

                  <Button
                    label="Feedback"
                    icon={MessageCircle}
                    size="md"
                    variant={type === 'feedback' ? 'outline' : 'ghost'}
                    className="flex-col !h-auto !px-4 !py-4 justify-start"
                    onClick={() => setType('feedback')}
                  />
                </div>
              </div>

              {/* Descripción */}
              <div className="flex flex-col gap-4">
                <Label content="Descripción" />
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe el error o tu feedback..."
                  rows={5}
                  required
                  containerClassName="p-4 rounded-2xl"
                />
              </div>

              {/* Email opcional */}
              <div className="flex flex-col gap-4">
                <Label content="Email (opcional)" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  containerClassName="p-4 rounded-2xl"
                />
                <p className={`text-xs ${textMuted}`}>
                  Solo si queres que te contactemos para seguir el tema
                </p>
              </div>

              {/* Submit */}
              <div className="flex gap-4 pt-8 border-t border-white/5">
                <Button
                  label={loading ? 'Enviando...' : 'Enviar'}
                  icon={Send}
                  variant="outline"
                  size="md"
                  disabled={!description.trim() || loading}
                  className="w-full justify-center"
                  type="submit"
                />
              </div>
            </form>
          </div>
        </DataBox>
      </div>
    </PageContent>
  );
}
