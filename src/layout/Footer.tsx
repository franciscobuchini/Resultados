import { useThemeClasses } from '../functions/themeStore';
import { Mail, Coffee } from 'lucide-react';
import { Button } from '../components/ui/Button';

const XIcon = ({ size = 13, className = '' }: { size?: number; className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    width={size} 
    height={size} 
    fill="currentColor" 
    className={className}
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export default function Footer() {
  const { bgApp, border, textMuted } = useThemeClasses();

  return (
    <footer className={`${bgApp} border-t ${border} py-3 px-4 mt-auto flex items-center justify-center text-xs ${textMuted}`}>
      {/* Información de contacto */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        <Button
          icon={Mail}
          label="resultados.ar0@gmail.com"
          variant="ghost"
          size="sm"
          href="mailto:resultados.ar0@gmail.com"
          title="Enviar correo a resultados.ar0@gmail.com"
        />
        
        <Button
          icon={XIcon}
          label="@resultados_ar"
          variant="ghost"
          size="sm"
          href="https://x.com/resultados_ar"
          target="_blank"
          rel="noopener noreferrer"
          title="Ir a X @resultados_ar"
        />

        <Button
          icon={Coffee}
          label="Cafecito"
          hideLabelOnMobile={true}
          size="sm"
          onClick={() => window.open('https://cafecito.app/resultados', '_blank')}
        />
      </div>
    </footer>
  );
}