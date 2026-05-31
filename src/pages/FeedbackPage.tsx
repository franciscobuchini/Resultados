import { useState } from 'react';
import { useThemeClasses } from '../functions/themeStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Label } from '../components/ui/Label';
import DataBox from '../components/ui/DataBox';
import PageBanner from '../layout/PageBanner';
import PageContent from '../layout/PageContent';
import { MessageCircle, AlertTriangle, CheckCircle2, Send } from 'lucide-react';

type FeedbackType = 'bug' | 'feedback' | 'feature';

export default function FeedbackPage() {
  const { bgApp, textMain, textMuted } = useThemeClasses();
  const [type, setType] = useState<FeedbackType>('feedback');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    // TODO: Implementar envío a Supabase o email
    console.log({ type, description, email });
    setSubmitted(true);
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
    <>
      <PageBanner
        title="Reportar errores & Feedback"
        tournament_banner_url="https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=400&fit=crop"
      />

      <PageContent>
        <div className="max-w-2xl mx-auto flex flex-col gap-6">
          <DataBox>
            <div className="p-6 sm:p-8 space-y-6">
              <form onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }} className="space-y-6">
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
                  label="Enviar"
                  icon={Send}
                  variant="outline"
                  size="md"
                  disabled={!description.trim()}
                  className="w-full justify-center"
                  type="submit"
                />
              </div>
            </form>
          </div>
        </DataBox>
      </div>
    </PageContent>
    </>
  );
}
